import { GoogleGenAI, Type } from '@google/genai';
import { getApiKey } from './apiKeyManager';
import type { HardwareProjectDetails, SoftwareProjectDetails } from '../types';

// Helper to create a configured AI client. Throws if the key is missing.
const getAiClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key is not set. Please add your key in the settings.");
  }
  return new GoogleGenAI({ apiKey });
};

const generateJson = async <T>(prompt: string, schema: any): Promise<T | null> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as T;
  } catch (error) {
    console.error("Error generating JSON content from Gemini:", error);
    // Re-throw to be handled by the caller, which can display a specific message
    throw error;
  }
};

const generateText = async (prompt: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating text content from Gemini:", error);
    throw error;
  }
};

const generateImage = async (prompt: string): Promise<string | null> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '16:9',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/png;base64,${base64ImageBytes}`;
    }
    return null;
  } catch (error) {
    console.error("Error generating image from Gemini:", error);
    throw error;
  }
};

export const generateSoftwareProjectAssets = async (description: string): Promise<SoftwareProjectDetails | null> => {
  const prdPrompt = `Based on the following project description, generate a detailed Product Requirements Document (PRD) in Markdown format. The PRD should include sections for Introduction, User Personas, Features, and Technical Requirements.\n\nProject Description: ${description}`;
  const techStackPrompt = `Based on the following project description, recommend a modern and appropriate technology stack. Provide the stack as a JSON object with a single key "stack" containing an array of strings. \n\nProject Description: ${description}`;
  const uiMockupPrompt = `Generate a UI mockup for a web application based on this description: ${description}. The style should be clean, modern, and professional. Focus on the main dashboard or landing page view.`;
  const architecturePrompt = `Create a high-level system architecture diagram for a project with this description: ${description}. The diagram should illustrate the main components (e.g., frontend, backend, database, external APIs) and their interactions.`;

  try {
    const [prd, techStackData, uiMockup, architectureDiagram] = await Promise.all([
      generateText(prdPrompt),
      generateJson<{ stack: string[] }>(techStackPrompt, {
        type: Type.OBJECT,
        properties: {
          stack: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["stack"]
      }),
      generateImage(uiMockupPrompt),
      generateImage(architecturePrompt)
    ]);

    if (!prd || !techStackData || !uiMockup || !architectureDiagram) {
      return null;
    }

    return {
      prd,
      techStack: techStackData.stack,
      uiMockups: [uiMockup],
      architectureDiagram
    };
  } catch (error) {
    console.error("Failed to generate software project assets:", error);
    throw error;
  }
};

export const generateHardwareProjectAssets = async (description: string): Promise<HardwareProjectDetails | null> => {
  const blueprintPrompt = `Based on the following hardware project description, generate a detailed technical blueprint in Markdown format. The blueprint should cover components, specifications, and design considerations.\n\nProject Description: ${description}`;
  const schematicsPrompt = `Generate a circuit schematic diagram for a hardware project with this description: ${description}.`;
  const buildGuidePrompt = `Create a detailed, step-by-step build guide in Markdown format for the following hardware project. Include a list of required tools and components.\n\nProject Description: ${description}`;

  try {
    const [blueprint, schematics, buildGuide] = await Promise.all([
      generateText(blueprintPrompt),
      generateImage(schematicsPrompt),
      generateText(buildGuidePrompt)
    ]);

    if (!blueprint || !schematics || !buildGuide) {
      return null;
    }

    return {
      blueprint,
      schematics: [schematics],
      buildGuide,
    };
  } catch (error) {
    console.error("Failed to generate hardware project assets:", error);
    throw error;
  }
};
