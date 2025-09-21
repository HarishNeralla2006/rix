import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';

interface LoginPageProps {
  onNavigate: (view: 'signup') => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { logIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await logIn({ email, password });
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-4xl font-bold mb-4 text-center">Welcome Back</h2>
      <p className="text-gray-400 mb-8 text-center">
        Log in to access your projects.
      </p>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {error && <p className="text-error text-sm text-center">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </Button>
        </form>
      </Card>
      <p className="text-center text-gray-400 mt-6">
        Don't have an account?{' '}
        <a onClick={() => onNavigate('signup')} className="font-semibold text-primary hover:underline cursor-pointer">
          Sign Up
        </a>
      </p>
    </div>
  );
};

export default LoginPage;
