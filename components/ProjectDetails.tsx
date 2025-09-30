
import React, { useState } from 'react';
import type { Project, SoftwareProjectDetails, HardwareProjectDetails } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CopyIcon from './icons/CopyIcon';

interface ProjectDetailsProps {
  project: Project;
}

const formatProjectForCopy = (project: Project): string => {
    let output = `Project Name: ${project.name}\n`;
    output += `Description: ${project.description}\n\n`;
    output += `====================================\n\n`;

    if (project.type === 'software' && project.resources) {
        const details = project.resources as SoftwareProjectDetails;
        output += `## Product Requirements Document (PRD)\n\n${details.prd}\n\n`;
        output += `## Recommended Tech Stack\n\n- ${details.techStack.join('\n- ')}\n\n`;
        output += `## UI Mockup URL\n\n${details.uiMockups[0]}\n\n`;
        output += `## System Architecture Diagram URL\n\n${details.architectureDiagram}\n\n`;
    } else if (project.type === 'hardware' && project.resources) {
        const details = project.resources as HardwareProjectDetails;
        output += `## Technical Blueprint\n\n${details.blueprint}\n\n`;
        output += `## Materials Required\n\n${details.materialsList}\n\n`;
        output += `## Build Guide\n\n${details.buildGuide}\n\n`;
        output += `## Schematics URL\n\n${details.schematics[0]}\n\n`;
    }

    return output;
};


const MarkdownContent: React.FC<{ content: string }> = ({ content }) => (
    <div className="prose prose-invert prose-lg max-w-none text-gray-300">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
);

const ImageDisplay: React.FC<{ src: string; alt: string }> = ({ src, alt }) => (
    <div className="mt-2">
        <img src={src} alt={alt} className="rounded-lg border border-gray-700 shadow-lg max-w-full h-auto bg-white" />
    </div>
);


const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project }) => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  if (!project) {
    return null;
  }
  
  const handleCopy = (textToCopy: string, itemName: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedItem(itemName);
        setTimeout(() => setCopiedItem(null), 2000); // Reset after 2 seconds
    }, (err) => {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy text. Please check the console for details.');
    });
  };
  
  const ResourceCard: React.FC<{ title: string; children: React.ReactNode; contentToCopy: string; className?: string; }> = ({ title, children, contentToCopy, className = '' }) => {
    const isCopied = copiedItem === title;

    return (
        <Card className={`flex flex-col bg-gray-900/50 ${className}`}>
            <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-3">
                <h3 className="text-lg font-bold text-primary">{title}</h3>
                <Button 
                    variant="secondary" 
                    className={`px-3 py-1 text-sm flex items-center ${isCopied ? 'bg-green-600 hover:bg-green-500' : ''}`}
                    onClick={() => handleCopy(contentToCopy, title)}
                >
                    <CopyIcon className="w-4 h-4 mr-2" />
                    {isCopied ? 'Copied!' : 'Copy'}
                </Button>
            </div>
            <div className="flex-grow overflow-auto" style={{ maxHeight: '400px' }}>
                {children}
            </div>
        </Card>
    );
  };
  
  const SoftwareDetails: React.FC<{ details: SoftwareProjectDetails }> = ({ details }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResourceCard 
            title="Product Requirements Document (PRD)" 
            contentToCopy={details.prd}
            className="lg:col-span-2"
        >
            <MarkdownContent content={details.prd} />
        </ResourceCard>
        <ResourceCard 
            title="Recommended Tech Stack" 
            contentToCopy={details.techStack.join(', ')}
        >
            <ul className="flex flex-wrap gap-3">
                {details.techStack.map(tech => (
                    <li key={tech} className="bg-gray-700 text-white font-semibold px-4 py-2 rounded-full text-sm">
                        {tech}
                    </li>
                ))}
            </ul>
        </ResourceCard>
        <ResourceCard 
            title="UI Mockup" 
            contentToCopy={details.uiMockups[0]}
        >
            <ImageDisplay src={details.uiMockups[0]} alt="UI Mockup" />
        </ResourceCard>
        <ResourceCard 
            title="System Architecture" 
            contentToCopy={details.architectureDiagram}
            className="lg:col-span-2"
        >
             <ImageDisplay src={details.architectureDiagram} alt="System Architecture Diagram" />
        </ResourceCard>
    </div>
  );

  const HardwareDetails: React.FC<{ details: HardwareProjectDetails }> = ({ details }) => (
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResourceCard 
            title="Technical Blueprint" 
            contentToCopy={details.blueprint}
            className="lg:col-span-2"
        >
            <MarkdownContent content={details.blueprint} />
        </ResourceCard>
        <ResourceCard 
            title="Materials Required" 
            contentToCopy={details.materialsList}
            className="lg:col-span-2"
        >
            <MarkdownContent content={details.materialsList} />
        </ResourceCard>
         <ResourceCard 
            title="Build Guide" 
            contentToCopy={details.buildGuide}
            className="lg:col-span-2"
        >
            <MarkdownContent content={details.buildGuide} />
        </ResourceCard>
        <ResourceCard 
            title="Schematics" 
            contentToCopy={details.schematics[0]}
            className="lg:col-span-2"
        >
            <ImageDisplay src={details.schematics[0]} alt="Schematic" />
        </ResourceCard>
    </div>
  );

  return (
    <div className="w-full">
        <Card className="mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-4xl font-extrabold text-white">{project.name}</h2>
                    <p className="text-gray-400 mt-2 text-lg">{project.description}</p>
                </div>
                <Button onClick={() => handleCopy(formatProjectForCopy(project), 'all')}>
                    {copiedItem === 'all' ? 'Copied All!' : 'Copy All Details'}
                </Button>
            </div>
        </Card>
        
        {project.type === 'software' && project.resources && <SoftwareDetails details={project.resources as SoftwareProjectDetails} />}
        {project.type === 'hardware' && project.resources && <HardwareDetails details={project.resources as HardwareProjectDetails} />}
        {!project.resources && <p className="text-center text-gray-500">Project details are not available.</p>}
    </div>
  );
};

export default ProjectDetails;