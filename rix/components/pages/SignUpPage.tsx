import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';

interface SignUpPageProps {
  onNavigate: (view: 'login') => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage('');
    setLoading(true);
    const { error } = await signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      setMessage('Success! Please check your email to confirm your account.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-4xl font-bold mb-4 text-center">Create Your Account</h2>
      <p className="text-gray-400 mb-8 text-center">
        Start building your next project with Rix.
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
            autoComplete="new-password"
            placeholder='Must be at least 6 characters'
          />
          {error && <p className="text-error text-sm text-center">{error}</p>}
          {message && <p className="text-green-400 text-sm text-center">{message}</p>}
          <Button type="submit" className="w-full" disabled={loading || !!message}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>
      </Card>
      <p className="text-center text-gray-400 mt-6">
        Already have an account?{' '}
        <a onClick={() => onNavigate('login')} className="font-semibold text-primary hover:underline cursor-pointer">
          Log In
        </a>
      </p>
    </div>
  );
};

export default SignUpPage;
