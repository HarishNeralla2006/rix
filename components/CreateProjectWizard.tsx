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

// A foolproof function to extract a string message from any error type, using JSON.stringify as a fallback.
const getErrorMessage = (error: unknown): string => {
    let message: string;
    
    // Extract the primary message string from the error
    if (error instanceof Error) {
        message = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string') {
        message = (error as { message: string }).message;
    } else if (typeof error === 'string') {
        message = error;
    } else {
         try {
            return `An unexpected error occurred. Details: ${JSON.stringify(error, null, 2)}`;
        } catch {
            return "An un-serializable, unexpected error occurred. Please check the developer console.";
        }
    }
    
    // Try to parse the message as JSON for specific API errors
    try {
        const parsed = JSON.parse(message);
        if (parsed?.error?.message) {
            const apiMessage = parsed.error.message as string;
             if (apiMessage.includes("Imagen API is only accessible to billed users")) {
                return "Image Generation Failed: The Imagen API requires a Google Cloud project with billing enabled. Please ensure your API key is associated with a billed account.\n\nYou can set up billing in your Google Cloud Console.";
            }
            if (apiMessage.includes("API key not valid")) {
                return "Authentication Error: The provided Gemini API key is not valid. Please check your key in Settings and try again.";
            }
            return `API Error: ${apiMessage}`;
        }
    } catch (e) {
        // Not a JSON error message. The original message is fine.
    }
    
    return message; // Return the original message if it's not a specific, parsable API error
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
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('software');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState('');

  const handleCreateProject = async () => {
    if (!name || !description || !user) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep(2); // Move to loading step

    try {
      setGenerationStatus('Generating project assets with AI...');
      let resources =
        projectType === 'software'
          ? await generateSoftwareProjectAssets(description)
          : await generateHardwareProjectAssets(description);

      if (!resources) {
        throw new Error('Failed to generate project assets from AI. The API may be busy or the key is invalid. Please try again.');
      }
      
      setGenerationStatus('Uploading project images...');

      const uploadImage = async (base64Data: string, assetName: string): Promise<string> => {
        if (!base64Data || !base64Data.startsWith('data:image')) {
             throw new Error(`AI failed to generate valid image data for ${assetName}. Please try again.`);
        }
        
        const blob = base64ToBlob(base64Data);
        const filePath = `${user.id}/${Date.now()}_${assetName}.png`;
        
        const { error: uploadError } = await supabase.storage
            .from('project_assets')
            .upload(filePath, blob);

        if (uploadError) {
            throw new Error(`Failed to upload ${assetName}: ${uploadError.message}. Please ensure the 'project_assets' storage bucket exists and has the correct RLS policies configured.`);
        }

        const { data: urlData } = supabase.storage
            .from('project_assets')
            .getPublicUrl(filePath);
        
        if (!urlData?.publicUrl) {
            throw new Error(`Could not retrieve public URL for uploaded asset: ${assetName}. The file may have uploaded, but its URL is inaccessible.`);
        }
        
        return urlData.publicUrl;
      };
      
      if (projectType === 'software') {
          const softwareResources = resources as SoftwareProjectDetails;
          const [uiMockupUrl, architectureDiagramUrl] = await Promise.all([
              uploadImage(softwareResources.uiMockups[0], 'ui_mockup'),
              uploadImage(softwareResources.architectureDiagram, 'architecture_diagram')
          ]);
          softwareResources.uiMockups[0] = uiMockupUrl;
          softwareResources.architectureDiagram = architectureDiagramUrl;
          resources = softwareResources;
      } else {
          const hardwareResources = resources as HardwareProjectDetails;
          hardwareResources.schematics[0] = await uploadImage(hardwareResources.schematics[0], 'schematic');
          resources = hardwareResources;
      }


      setGenerationStatus('Saving project to database...');
      const newProjectData = {
        user_id: user.id,
        name,
        description,
        type: projectType,
        resources,
      };

      const { data, error: insertError } = await supabase
        .from('projects')
        .insert([newProjectData])
        .select()
        .single();

      if (insertError) {
        console.error('Database error creating project:', insertError);
        const dbError = insertError as any;
        const messageForMatching = String(dbError?.message || '').toLowerCase();
        
        const isTableMissing = 
            String(dbError?.code) === '42P01' || 
            messageForMatching.includes("relation \"projects\" does not exist") ||
            messageForMatching.includes("could not find the table 'public.projects' in the schema cache");
                               
        const isRls = messageForMatching.includes('violates row-level security policy');

        let specificError = '';
        if (isTableMissing) {
            specificError = 'Database Error: The "projects" table does not exist. Please follow the instructions on the dashboard to create it.';
        } else if (isRls) {
             specificError = 'Database Error: The new project violates the database security policy. Please ensure you have configured the correct INSERT policy in Supabase.';
        }

        setError(specificError || getErrorMessage(insertError));
        setStep(1);
      } else {
        onProjectCreated(data as Project);
      }

    } catch (err: unknown) {
      console.error('Project creation failed:', err);
      setError(getErrorMessage(err));
      setStep(1);
    } finally {
      setIsLoading(false);
      setGenerationStatus('');
    }
  };
  
  const renderStepOne = () => (
    <Card>
      <h2 className="text-3xl font-bold mb-2 text-center text-white">Create a New Project</h2>
      <p className="text-gray-400 mb-8 text-center">Let's get started by providing some basic details.</p>
      
      {error && <p className="text-error bg-red-900/50 p-3 rounded-md text-center mb-6 whitespace-pre-wrap">{error}</p>}
      
      <div className="space-y-6">
        <Input
          id="projectName"
          label="Project Name"
          type="text"
          placeholder="e.g., AI-Powered Note Taker"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
            Project Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            placeholder="Describe your project in a few sentences. The more detail, the better the AI-generated assets will be."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Project Type
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setProjectType('software')}
              className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center gap-2 transition-colors ${projectType === 'software' ? 'border-primary bg-primary/20' : 'border-gray-700 hover:border-primary/50'}`}
            >
              <SoftwareIcon className="w-8 h-8 text-primary" />
              <span className="font-semibold text-white">Software</span>
            </button>
            <button
              onClick={() => setProjectType('hardware')}
              className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center gap-2 transition-colors ${projectType === 'hardware' ? 'border-primary bg-primary/20' : 'border-gray-700 hover:border-primary/50'}`}
            >
              <HardwareIcon className="w-8 h-8 text-primary" />
              <span className="font-semibold text-white">Hardware</span>
            </button>
          </div>
        </div>
        <Button onClick={handleCreateProject} className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Generate Project Assets'}
        </Button>
      </div>
    </Card>
  );

  const renderStepTwo = () => (
    <Card className="text-center">
        <h2 className="text-3xl font-bold mb-4 text-white">Building Your Project...</h2>
        <p className="text-gray-400 mb-8">Rix is using AI to generate your project assets. This may take a moment.</p>
        <div className="flex justify-center items-center my-10">
            <LoadingSpinner className="w-16 h-16" />
        </div>
        <p className="text-lg text-primary font-semibold animate-pulse">{generationStatus}</p>
    </Card>
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
        {step === 1 && renderStepOne()}
        {step === 2 && renderStepTwo()}
    </div>
  );
};

export default CreateProjectWizard;
