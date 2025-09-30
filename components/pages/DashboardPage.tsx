import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Project } from '../../types';
import CreateProjectWizard from '../CreateProjectWizard';
import ProjectDetails from '../ProjectDetails';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import Card from '../common/Card';
import SoftwareIcon from '../icons/SoftwareIcon';
import HardwareIcon from '../icons/HardwareIcon';
import DeleteIcon from '../icons/DeleteIcon';

const RLS_POLICY_DOCS_LINK = 'https://supabase.com/docs/guides/auth/row-level-security';

// A foolproof function to extract a string message from any error type, using JSON.stringify as a fallback.
const getErrorMessage = (error: unknown): string => {
    if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string') {
        return (error as { message: string }).message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    try {
        return `An unexpected error occurred. Details: ${JSON.stringify(error, null, 2)}`;
    } catch {
        return "An un-serializable, unexpected error occurred. Please check the developer console.";
    }
};

const TableMissingHelpCard: React.FC = () => (
    <Card className="text-left border-2 border-primary/50 max-w-3xl">
        <h2 className="text-2xl font-bold text-primary mb-3">Action Required: Create Database Table</h2>
        <p className="text-gray-300 mb-4">
            The application can't start because the required <code>projects</code> table is missing from your database.
        </p>
        <p className="text-gray-400 mb-4">
            Please run the following idempotent SQL script in your Supabase SQL Editor. This will create the table and set up the necessary security policies, and is safe to run multiple times.
        </p>
        <div className="space-y-4">
            <pre className="bg-gray-900 p-4 rounded-lg text-sm text-green-300 overflow-x-auto">
                <code>
{`-- This script is idempotent and can be run multiple times safely.

-- 1. Create the projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.projects (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    description text NOT NULL,
    "type" text NOT NULL,
    resources jsonb NULL,
    CONSTRAINT projects_pkey PRIMARY KEY (id),
    CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Enable Row Level Security (RLS) on the table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 3. Create/update a policy for users to read their own projects
DROP POLICY IF EXISTS "Enable read access for own projects" ON public.projects;
CREATE POLICY "Enable read access for own projects"
ON public.projects FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Create/update a policy for users to create their own projects
DROP POLICY IF EXISTS "Enable insert for own projects" ON public.projects;
CREATE POLICY "Enable insert for own projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. Create/update a policy for users to delete their own projects
DROP POLICY IF EXISTS "Enable delete for own projects" ON public.projects;
CREATE POLICY "Enable delete for own projects"
ON public.projects FOR DELETE
TO authenticated
USING (auth.uid() = user_id);`}
                </code>
            </pre>
        </div>
         <a href="https://supabase.com/docs/guides/database/tables#creating-tables" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mt-4 inline-block">
            Learn more about creating tables in Supabase
        </a>
    </Card>
);

const RlsHelpCard: React.FC = () => (
    <Card className="text-left border-2 border-primary/50 max-w-3xl">
        <h2 className="text-2xl font-bold text-primary mb-3">Action Required: Enable Database Access</h2>
        <p className="text-gray-300 mb-4">
            Your projects can't be loaded because of Supabase's Row Level Security (RLS). To protect your data, you must explicitly grant access.
        </p>
        <p className="text-gray-400 mb-4">
            Please run the following idempotent SQL commands in your Supabase SQL Editor. This script is safe to run multiple times and will ensure the correct policies are enabled.
        </p>
        <div className="space-y-4">
            <pre className="bg-gray-900 p-4 rounded-lg text-sm text-green-300 overflow-x-auto">
                <code>
{`-- This script is idempotent and can be run multiple times safely.

-- 1. Enable read access for users to see their own projects
DROP POLICY IF EXISTS "Enable read access for own projects" ON public.projects;
CREATE POLICY "Enable read access for own projects"
ON public.projects FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Enable users to insert their own projects
DROP POLICY IF EXISTS "Enable insert for own projects" ON public.projects;
CREATE POLICY "Enable insert for own projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);`}
                </code>
            </pre>
        </div>
         <a href={RLS_POLICY_DOCS_LINK} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mt-4 inline-block">
            Learn more about Row Level Security
        </a>
    </Card>
);

const GenericErrorCard: React.FC<{ message: string; onRetry: () => void; }> = ({ message, onRetry }) => (
    <Card className="text-left border-2 border-error/50 max-w-3xl">
        <h2 className="text-2xl font-bold text-error mb-3">An Error Occurred</h2>
        <p className="text-gray-300 mb-4">
            We couldn't load your projects. Please see the error details below.
        </p>
        <pre className="bg-gray-900 p-4 rounded-lg text-sm text-red-300 overflow-x-auto whitespace-pre-wrap">
            <code>{message}</code>
        </pre>
        <Button onClick={onRetry} className="mt-4 bg-error hover:bg-red-500 focus:ring-error">
            Try Again
        </Button>
    </Card>
);

interface DashboardPageProps {
    onNavigate: (view: 'settings') => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [isRlsError, setIsRlsError] = useState(false);
  const [isTableMissingError, setIsTableMissingError] = useState(false);
  const [genericError, setGenericError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setIsRlsError(false);
    setIsTableMissingError(false);
    setGenericError(null);
    
    try {
      const { data, error: dbError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (dbError) { throw dbError; }

      setProjects(data || []);

    } catch (err: unknown) {
        console.error("Database/Fetch error:", err); 

        const dbError = err as any; 
        const messageForMatching = String(dbError?.message || '').toLowerCase();

        const isTableMissing = 
            String(dbError?.code) === '42P01' || 
            messageForMatching.includes("relation \"projects\" does not exist") ||
            messageForMatching.includes("could not find the table 'public.projects' in the schema cache");

        const isRls = messageForMatching.includes('violates row-level security policy');

        if (isTableMissing) {
          setIsTableMissingError(true);
        } else if (isRls) {
          setIsRlsError(true);
        } else {
          setGenericError(getErrorMessage(err));
        }
        setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
        fetchProjects();
    } else {
        setIsLoading(false);
    }
  }, [user, fetchProjects]);

  useEffect(() => {
    if (isLoading) return; 
    if (isTableMissingError || isRlsError || genericError) return; 

    if (projects.length === 0) {
      if (!showWizard) setShowWizard(true);
      if (selectedProject) setSelectedProject(null);
    } else {
      if (!selectedProject && !showWizard) {
        setSelectedProject(projects[0]);
      }
    }
  }, [projects, isLoading, showWizard, selectedProject, isTableMissingError, isRlsError, genericError]);

  const handleProjectCreated = (newProject: Project) => {
    setProjects(currentProjects => [newProject, ...currentProjects]);
    setSelectedProject(newProject);
    setShowWizard(false);
    setIsRlsError(false);
    setIsTableMissingError(false);
    setGenericError(null);
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setShowWizard(false);
  };

  const handleDeleteProject = async (projectId: string) => {
    const projectToDelete = projects.find(p => p.id === projectId);
    if (!projectToDelete || !user) return;

    if (window.confirm(`Are you sure you want to delete "${projectToDelete.name}"? This action cannot be undone.`)) {
        try {
            // 1. Delete files from storage
            const { data: files, error: listError } = await supabase.storage
                .from('project-assets')
                .list(`${user.id}/${projectId}`);

            if (listError) throw listError;
            
            if (files && files.length > 0) {
                const filePaths = files.map(file => `${user.id}/${projectId}/${file.name}`);
                const { error: removeError } = await supabase.storage
                    .from('project-assets')
                    .remove(filePaths);
                if (removeError) throw removeError;
            }

            // 2. Delete project from database
            const { error: deleteError } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectId);

            if (deleteError) throw deleteError;

            // 3. Update state
            const updatedProjects = projects.filter(p => p.id !== projectId);
            setProjects(updatedProjects);

            if (selectedProject?.id === projectId) {
                setSelectedProject(updatedProjects.length > 0 ? updatedProjects[0] : null);
                if (updatedProjects.length === 0) {
                    setShowWizard(true);
                }
            }

        } catch (err) {
            console.error("Failed to delete project:", err);
            alert(`Error deleting project: ${getErrorMessage(err)}`);
        }
    }
  };


  const renderSidebar = () => (
    <aside className="w-full md:w-1/4 lg:w-1/5 xl:w-1/6 flex-shrink-0">
      <div className="p-4 bg-secondary rounded-lg h-full">
        <h2 className="text-xl font-bold mb-4 text-white">Your Projects</h2>
        <Button onClick={() => { setShowWizard(true); setSelectedProject(null); }} className="w-full mb-4">
          + New Project
        </Button>
        <ul className="space-y-2">
            {projects.map(project => {
                const isSelected = selectedProject?.id === project.id;
                return (
                    <li
                        key={project.id}
                        onClick={() => handleSelectProject(project)}
                        className={`group flex items-center justify-between p-3 rounded-md transition-colors cursor-pointer ${
                            isSelected
                                ? 'bg-primary text-white'
                                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                        }`}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            {project.type === 'software' ? (
                                <SoftwareIcon className="w-5 h-5 flex-shrink-0" />
                            ) : (
                                <HardwareIcon className="w-5 h-5 flex-shrink-0" />
                            )}
                            <span className={`truncate ${isSelected ? 'font-semibold' : ''}`}>
                                {project.name}
                            </span>
                        </div>
                        <button
                            onClick={(e) => {
                                // Prevent the li's onClick from firing
                                e.stopPropagation();
                                handleDeleteProject(project.id);
                            }}
                            title={`Delete ${project.name}`}
                            aria-label={`Delete project ${project.name}`}
                            className={`ml-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 flex-shrink-0 ${
                                isSelected
                                ? 'text-white hover:bg-white/20'
                                : 'text-gray-500 hover:text-error'
                            }`}
                        >
                            <DeleteIcon className="w-5 h-5" />
                        </button>
                    </li>
                );
            })}
        </ul>
      </div>
    </aside>
  );

  const renderMainContent = () => {
    if (isLoading) {
      return <div className="flex-grow flex items-center justify-center"><LoadingSpinner /></div>;
    }
    
    if (isTableMissingError) {
        return <div className="flex-grow flex items-center justify-center"><TableMissingHelpCard /></div>;
    }
    if (isRlsError) {
        return <div className="flex-grow flex items-center justify-center"><RlsHelpCard /></div>;
    }
     if (genericError) {
        return <div className="flex-grow flex items-center justify-center"><GenericErrorCard message={genericError} onRetry={fetchProjects} /></div>;
    }
    
    if (showWizard) {
      return <CreateProjectWizard onProjectCreated={handleProjectCreated} />;
    }
    
    if (selectedProject) {
      return <ProjectDetails project={selectedProject} />;
    }

     return (
        <div className="flex-grow flex items-center justify-center">
            <Card className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to Rix!</h2>
                <p className="text-gray-400 mb-6">Create your first project to get started.</p>
                <Button onClick={() => setShowWizard(true)}>Create New Project</Button>
            </Card>
        </div>
      );
  };

  const hasSidebar = projects.length > 0 && !isTableMissingError && !isRlsError && !genericError;

  return (
    <div className="flex flex-col md:flex-row gap-8 h-full">
      {hasSidebar && renderSidebar()}
      <main className="flex-grow flex justify-center w-full">
        {renderMainContent()}
      </main>
    </div>
  );
};

export default DashboardPage;