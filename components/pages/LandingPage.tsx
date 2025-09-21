import React from 'react';
import Button from '../common/Button';
import LogoIcon from '../icons/LogoIcon';

interface LandingPageProps {
    onNavigate: (view: 'signup') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="text-center py-24">
      <LogoIcon className="w-24 h-24 text-primary mx-auto mb-6" />
      <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
        Transform Ideas into Reality with Rix
      </h1>
      <p className="max-w-3xl mx-auto text-lg text-gray-400 mb-8">
        Your intelligent project assistant for software and hardware development. Automatically generate UI mockups, PRDs, technical blueprints, and step-by-step build guides in minutes.
      </p>
      <Button onClick={() => onNavigate('signup')} className="text-lg">
        Start Building for Free
      </Button>
    </div>
  );
};

export default LandingPage;
