import React, { useState } from 'react';
import { useApiKey } from '../../contexts/ApiKeyContext';
import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';

const ApiKeySetupPage: React.FC = () => {
    const [key, setKey] = useState('');
    const { setApiKey } = useApiKey();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (key.trim()) {
            setApiKey(key.trim());
        }
    };

    return (
        <div className="max-w-xl mx-auto">
            <h2 className="text-4xl font-bold mb-4 text-center">Set Up API Key</h2>
            <p className="text-gray-400 mb-8 text-center">
                To generate project assets, Rix needs access to the Google Gemini API.
            </p>
            <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Input
                            id="apiKey"
                            label="Your Gemini API Key"
                            type="password"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            required
                            placeholder="Enter your API key here"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Your API key is stored securely in your browser's local storage and is never sent to our servers.
                        </p>
                    </div>

                    <Button type="submit" className="w-full" disabled={!key.trim()}>
                        Save and Continue
                    </Button>
                </form>
                <div className="text-center mt-6">
                    <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-primary hover:underline"
                    >
                        Get your Gemini API Key from Google AI Studio
                    </a>
                </div>
            </Card>
        </div>
    );
};

export default ApiKeySetupPage;
