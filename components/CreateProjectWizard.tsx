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
import WarningIcon from './icons/WarningIcon';

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
  const [isBillingError, setIsBillingError] = useState(false);
  const [isQuotaError, setIsQuotaError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !projectDescription.trim() || !user) return;

    setIsLoading(true);
    setError(null);
    setIsBillingError(false);
    setIsQuotaError(false);

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
        const lowerCaseError = errorMessage.toLowerCase();

        // Check for more specific errors first to avoid false positives.
        if (lowerCaseError.includes('quota') || lowerCaseError.includes('rate limit') || lowerCaseError.includes('429')) {
            setIsQuotaError(true);
            setError("API Limit Reached: You've exceeded your request quota for the Gemini API.");
        } else if (lowerCaseError.includes('billing is not enabled') || lowerCaseError.includes('link a billing account')) {
            setIsBillingError(true);
            setError("Image Generation Failed: The Imagen API requires a Google Cloud project with billing enabled.");
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
          {error && (
            isBillingError ? (
              <div className="bg-red-900/50 border-l-4 border-error p-4" role="alert">
                <div className="flex">
                  <div className="py-1">
                     <ErrorIcon className="h-6 w-6 text-error mr-4" />
                  </div>
                  <div>
                    <p className="font-bold text-red-300">{error}</p>
                    <p className="text-sm text-red-300 mt-1">Please ensure your API key is associated with a billed Google Cloud account.</p>
                     <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 px-3 py-1 text-sm font-semibold bg-error text-white rounded-md hover:bg-red-500 transition-colors">
                        Go to Google Cloud Billing
                    </a>
                  </div>
                </div>
              </div>
            ) : isQuotaError ? (
              <div className="bg-yellow-900/50 border-l-4 border-yellow-500 p-4" role="alert">
                <div className="flex">
                  <div className="py-1">
                     <WarningIcon className="h-6 w-6 text-yellow-400 mr-4" />
                  </div>
                  <div>
                    <p className="font-bold text-yellow-300">{error}</p>
                    <p className="text-sm text-yellow-300 mt-1">Please check your usage limits or try again later.</p>
                     <a href="https://console.cloud.google.com/iam-admin/quotas" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 px-3 py-1 text-sm font-semibold bg-yellow-500 text-black rounded-md hover:bg-yellow-400 transition-colors">
                        Check Google Cloud Quotas
                    </a>
                  </div>
                </div>
              </div>
            ) : (
               <div className="bg-red-900/50 border border-error text-red-300 px-4 py-3 rounded-lg flex items-center gap-3" role="alert">
                  <ErrorIcon className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
            )
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
