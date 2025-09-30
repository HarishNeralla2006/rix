
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { generateSoftwareProjectAssets, generateHardwareProjectAssets } from '../services/geminiService';
import type { Project, ProjectType, SoftwareProjectDetails, HardwareProjectDetails } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import Input from './common/Input';
import LoadingSpinner from './common/LoadingSpinner';
import SoftwareIcon from './icons/SoftwareIcon';
import HardwareIcon from './icons/HardwareIcon';
import ErrorIcon from './icons/ErrorIcon';

// A foolproof function to extract a string message from any error type.
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
        return "An un-serializable, unexpected error occurred.";
    }
};

// Helper function to convert a base64 data URL to a Blob
const base64ToBlob = (base64: string, mimeType: string = 'image/png'): Blob => {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
};

const BucketMissingHelpCard: React.FC = () => (
    <Card className="text-left border-2 border-primary/50 w-full mb-6">
        <h2 className="text-2xl font-bold text-primary mb-3">Action Required: Create Storage Bucket</h2>
        <p className="text-gray-300 mb-4">
            Project creation failed because the required Supabase Storage bucket is missing. You need to create a bucket named <code>project-assets</code> to store generated images.
        </p>
        
        <h3 className="font-semibold text-lg text-white mt-4 mb-2">Step 1: Create the Bucket</h3>
        <ol className="list-decimal list-inside text-gray-400 space-y-1 mb-4">
            <li>Navigate to the <strong>Storage</strong> section in your Supabase dashboard.</li>
            <li>Click the <strong>"New bucket"</strong> button.</li>
            <li>Enter <code>project-assets</code> as the bucket name.</li>
            <li>Toggle the switch to make it a <strong>Public</strong> bucket.</li>
            <li>Click <strong>"Save"</strong>.</li>
        </ol>

        <h3 className="font-semibold text-lg text-white mt-4 mb-2">Step 2: Add/Update Security Policies</h3>
        <p className="text-gray-400 mb-4">
            After creating the bucket, run the following idempotent SQL script in your Supabase SQL Editor. This script is safe to run multiple times and will ensure the correct policies are in place for users to manage their own project assets.
        </p>
        <div className="space-y-4">
            <pre className="bg-gray-900 p-4 rounded-lg text-sm text-green-300 overflow-x-auto">
                <code>
{`-- This script is idempotent and can be run multiple times safely.

-- 1. Policy for viewing files in a user's own folder
DROP POLICY IF EXISTS "Enable read access for own assets" ON storage.objects;
CREATE POLICY "Enable read access for own assets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'project-assets' AND auth.uid() = (storage.foldername(name))[1]::uuid);

-- 2. Policy for uploading files to a user's own folder
DROP POLICY IF EXISTS "Enable insert for own assets" ON storage.objects;
CREATE POLICY "Enable insert for own assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-assets' AND auth.uid() = (storage.foldername(name))[1]::uuid);

-- 3. Policy for updating files in a user's own folder
DROP POLICY IF EXISTS "Enable update for own assets" ON storage.objects;
CREATE POLICY "Enable update for own assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'project-assets' AND auth.uid() = (storage.foldername(name))[1]::uuid);

-- 4. Policy for deleting files in a user's own folder
DROP POLICY IF EXISTS "Enable delete for own assets" ON storage.objects;
CREATE POLICY "Enable delete for own assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-assets' AND auth.uid() = (storage.foldername(name))[1]::uuid);`}
                </code>
            </pre>
        </div>
         <a href="https://supabase.com/docs/guides/storage" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mt-4 inline-block">
            Learn more about Supabase Storage
        </a>
    </Card>
);

interface CreateProjectWizardProps {
  onProjectCreated: (project: Project) => void;
}

const CreateProjectWizard: React.FC<CreateProjectWizardProps> = ({ onProjectCreated }) => {
  const { user } = useAuth();
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('software');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBucketMissingError, setIsBucketMissingError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !projectDescription.trim() || !user) return;

    setIsLoading(true);
    setError(null);
    setIsBucketMissingError(false);

    try {
        let resources: SoftwareProjectDetails | HardwareProjectDetails | null = null;
        if (projectType === 'software') {
            resources = await generateSoftwareProjectAssets(projectDescription);
        } else {
            resources = await generateHardwareProjectAssets(projectDescription);
        }

        if (!resources) {
            throw new Error("Failed to generate project assets. The API returned no data.");
        }

        const projectId = crypto.randomUUID();

        const uploadImage = async (base64: string, path: string): Promise<string> => {
            if (!base64.startsWith('data:image')) return base64; // Already a URL
            const blob = base64ToBlob(base64);
            const { data, error: uploadError } = await supabase.storage.from('project-assets').upload(path, blob, {
                cacheControl: '3600',
                upsert: true,
            });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('project-assets').getPublicUrl(data.path);
            return publicUrl;
        };
        
        // Note: Assumes a 'project-assets' bucket exists in Supabase Storage.
        if (projectType === 'software') {
            const swResources = resources as SoftwareProjectDetails;
            const [uiMockupUrl, architectureDiagramUrl] = await Promise.all([
                uploadImage(swResources.uiMockups[0], `${user.id}/${projectId}/ui_mockup.png`),
                uploadImage(swResources.architectureDiagram, `${user.id}/${projectId}/architecture.png`)
            ]);
            swResources.uiMockups[0] = uiMockupUrl;
            swResources.architectureDiagram = architectureDiagramUrl;
        } else {
            const hwResources = resources as HardwareProjectDetails;
            const [schematicsUrl] = await Promise.all([
                uploadImage(hwResources.schematics[0], `${user.id}/${projectId}/schematics.png`)
            ]);
            hwResources.schematics[0] = schematicsUrl;
        }

        const { data: newProject, error: insertError } = await supabase
            .from('projects')
            .insert({
                id: projectId,
                user_id: user.id,
                name: projectName,
                description: projectDescription,
                type: projectType,
                resources,
            })
            .select()
            .single();

        if (insertError) throw insertError;

        if (newProject) onProjectCreated(newProject as Project);

    } catch (err) {
        console.error("Project creation failed:", err);
        const errorMessage = getErrorMessage(err);

        if (errorMessage.toLowerCase().includes('bucket not found')) {
            setIsBucketMissingError(true);
        } else {
            setError(`Project creation failed: ${errorMessage}`);
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Create a New Project</h2>
          <p className="text-gray-400 mt-2">Let's get started by providing some basic details.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {isBucketMissingError && <BucketMissingHelpCard />}
          {error && (
            <div className="bg-red-900/50 border border-error text-red-300 px-4 py-3 rounded-lg flex items-center gap-3" role="alert">
                <ErrorIcon className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
            </div>
          )}
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-300">Project Type</p>
            <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setProjectType('software')} className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all ${projectType === 'software' ? 'border-primary bg-primary/10' : 'border-gray-700 bg-gray-900 hover:border-gray-500'}`}>
                    <SoftwareIcon className={`w-8 h-8 mb-2 ${projectType === 'software' ? 'text-primary' : 'text-gray-400'}`} />
                    <span className="font-semibold">Software</span>
                </button>
                 <button type="button" onClick={() => setProjectType('hardware')} className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all ${projectType === 'hardware' ? 'border-primary bg-primary/10' : 'border-gray-700 bg-gray-900 hover:border-gray-500'}`}>
                    <HardwareIcon className={`w-8 h-8 mb-2 ${projectType === 'hardware' ? 'text-primary' : 'text-gray-400'}`} />
                    <span className="font-semibold">Hardware</span>
                </button>
            </div>
          </div>
          
          <Input
            id="projectName"
            label="Project Name"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
            placeholder="e.g., Smart Weather Station"
          />
          
           <div>
              <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-300 mb-1">
                Project Description
              </label>
              <textarea
                id="projectDescription"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                required
                rows={5}
                placeholder="Describe your project in a few sentences. What problem does it solve? Who is it for?"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              />
            </div>

          <div className="pt-4">
            <Button type="submit" className="w-full text-lg" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <LoadingSpinner className="w-5 h-5 mr-3" />
                  Generating Project...
                </span>
              ) : (
                'Create & Generate Assets'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateProjectWizard;