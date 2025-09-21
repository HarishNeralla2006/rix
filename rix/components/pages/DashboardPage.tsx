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
            Please run the following SQL script in your Supabase SQL Editor. This will create the table and set up the necessary security policies for it to work correctly.
        </p>
        <div className="space-y-4">
            <pre className="bg-gray-900 p-4 rounded-lg text-sm text-green-300 overflow-x-auto">
                <code>
{`-- 1. Create the projects table
CREATE TABLE public.projects (
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

-- 3. Create a policy for users to read their own projects
CREATE POLICY "Enable read access for own projects"
ON public.projects FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Create a policy for users to create their own projects
CREATE POLICY "Enable insert for own projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);`}
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
            Please run the following SQL commands in your Supabase SQL Editor to allow users to read and create their own projects.
        </p>
        <div className="space-y-4">
            <pre className="bg-gray-900 p-4 rounded-lg text-sm text-green-300 overflow-x-auto">
                <code>
{`-- 1. Enable read access for users to see their own projects
CREATE POLICY "Enable read access for own projects"
ON public.projects FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Enable users to insert their own projects
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

  const renderSidebar = () => (
    <aside className="w-full md:w-1/4 lg:w-1/5 xl:w-1/6 flex-shrink-0">
      <div className="p-4 bg-secondary rounded-lg h-full">
        <h2 className="text-xl font-bold mb-4 text-white">Your Projects</h2>
        <Button onClick={() => { setShowWizard(true); setSelectedProject(null); }} className="w-full mb-4">
          + New Project
        </Button>
        <ul className="space-y-2">
          {projects.map(project => (
            <li key={project.id}>
              <button
                onClick={() => handleSelectProject(project)}
                className={`w-full text-left p-3 rounded-md transition-colors flex items-center gap-3 ${
                  selectedProject?.id === project.id
                    ? 'bg-primary text-white font-semibold'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                {project.type === 'software' ? <SoftwareIcon className="w-5 h-5" /> : <HardwareIcon className="w-5 h-5" />}
                <span className="truncate">{project.name}</span>
              </button>
            </li>
          ))}
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
