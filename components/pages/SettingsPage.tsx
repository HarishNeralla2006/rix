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
                Manage your application settings.
            </p>
            <Card>
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
                    <div className="pt-4 border-t border-gray-800">
                        <p className="text-gray-500 text-sm">More settings and profile management options will be available here in the future.</p>
                    </div>
                </div>
                <div className="flex justify-end mt-8">
                     <Button onClick={() => onNavigate('dashboard')} variant="secondary">
                        Back to Dashboard
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default SettingsPage;
