import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApiKey } from '../../contexts/ApiKeyContext';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';

interface SettingsPageProps {
    onNavigate: (view: 'dashboard') => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
    const { user } = useAuth();
    const { hasApiKey, setApiKey, clearApiKey } = useApiKey();
    const [newKey, setNewKey] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);

    const handleUpdateKey = () => {
        if (newKey.trim()) {
            setApiKey(newKey.trim());
            setNewKey('');
        }
    };

    const handleRemoveKey = () => {
        clearApiKey();
        setShowConfirm(false);
        // The user will be redirected to the setup page automatically by App.tsx logic
    };

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
                 <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white">API Key Management</h3>
                    {hasApiKey ? (
                        <div>
                            <p className="text-green-400 font-medium">Gemini API key is configured.</p>
                             <p className="text-xs text-gray-500 mt-1">
                                Your API key is stored in your browser and not on our servers.
                            </p>
                        </div>
                    ) : (
                         <p className="text-yellow-400 font-medium">Gemini API key is not configured. Project generation is disabled.</p>
                    )}
                    
                    <div>
                        <Input
                            id="apiKey"
                            label={hasApiKey ? "Update your Gemini API Key" : "Add your Gemini API Key"}
                            type="password"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                            placeholder="Enter new API key"
                        />
                         <Button onClick={handleUpdateKey} disabled={!newKey.trim()} className="mt-3">
                            {hasApiKey ? "Update Key" : "Save Key"}
                        </Button>
                    </div>

                    {hasApiKey && (
                        <div className="pt-6 border-t border-gray-800">
                             <h4 className="text-lg font-semibold text-error">Danger Zone</h4>
                             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 gap-2">
                                <p className="text-gray-400">Remove your API key from this browser.</p>
                                <Button variant="secondary" onClick={() => setShowConfirm(true)} className="bg-error hover:bg-red-500 focus:ring-error text-white self-start sm:self-center">
                                    Remove Key
                                </Button>
                             </div>
                        </div>
                    )}
                 </div>
            </Card>
            
            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-sm w-full">
                        <h3 className="text-xl font-bold text-white mb-4">Are you sure?</h3>
                        <p className="text-gray-400 mb-6">
                            Removing your API key will disable project generation until you add a new one.
                        </p>
                        <div className="flex justify-end gap-4">
                            <Button variant="secondary" onClick={() => setShowConfirm(false)}>Cancel</Button>
                            <Button onClick={handleRemoveKey} className="bg-error hover:bg-red-500 focus:ring-error">
                                Yes, Remove
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
            
            <div className="flex justify-end mt-8">
                 <Button onClick={() => onNavigate('dashboard')} variant="secondary">
                    Back to Dashboard
                </Button>
            </div>
        </div>
    );
};

export default SettingsPage;

