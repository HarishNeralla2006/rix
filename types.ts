
export type ProjectType = 'software' | 'hardware';

export interface SoftwareProjectDetails {
  prd: string; // Product Requirements Document
  techStack: string[];
  uiMockups: string[]; // URLs or base64 strings
  architectureDiagram: string; // URL or base64 string
}

export interface HardwareProjectDetails {
  blueprint: string; // Technical blueprint
  schematics: string[]; // URLs or base64 strings
  buildGuide: string; // Step-by-step guide
  materialsList: string; // List of required materials
}

export interface Project {
  id: string; 
  user_id: string;
  name: string;
  description: string;
  type: ProjectType;
  created_at: string; // ISO string
  resources: SoftwareProjectDetails | HardwareProjectDetails | null;
}