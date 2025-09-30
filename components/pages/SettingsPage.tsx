import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../common/Card';
import Button from '../common/Button';

interface SettingsPageProps {
    onNavigate: (view: 'dashboard') => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
    const { user } = useAuth();

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold mb-4 text-center">Settings</h2>
            <p className="text-gray-400 mb-8 text-center">
                Manage your account and application settings.
            </p>

            <Card className="mb-6">
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">Account Information</h3>
                    {user ? (
                        <div>
                            <p className="text-gray-400">You are logged in as:</p>
                            <p className="text-white font-medium mt-1">{user.email}</p>
                        </div>
                    ) : (
                        <p className="text-gray-400">Not logged in.</p>
                    )}
                </div>
            </Card>

            <Card>
                 <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">API Configuration</h3>
                    <p className="text-green-400 font-medium">Image generation is powered by Pollinations.ai.</p>
                    <p className="text-gray-400 text-sm">
                        No user-provided API key is required. The application uses the public Pollinations.ai service for image generation and provides mock data for text-based assets, ensuring a fast and free experience.
                    </p>
                 </div>
            </Card>
            
            <div className="flex justify-end mt-8">
                 <Button onClick={() => onNavigate('dashboard')} variant="secondary">
                    Back to Dashboard
                </Button>
            </div>
        </div>
    );
};

export default SettingsPage;
