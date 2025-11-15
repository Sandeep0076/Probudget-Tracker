import React, { useState } from 'react';
import * as api from '../services/api';
import { LogoIcon } from './icons/LogoIcon';

interface LoginPageProps {
  onLoginSuccess: (username: string) => void;
}

type ViewMode = 'login' | 'forgot-password' | 'verify-security' | 'reset-password';

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState('');

  console.log('[LoginPage] Current view mode:', viewMode);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('[LoginPage] Attempting login for username:', username);

    try {
      const result = await api.login(username, password);
      console.log('[LoginPage] Login successful:', result);
      onLoginSuccess(result.username);
    } catch (err: any) {
      console.error('[LoginPage] Login failed:', err);
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('[LoginPage] Requesting security question for username:', username);

    try {
      // First, we need to get the security question - we'll do this via verify endpoint
      // In a real app, you'd have a separate endpoint to get just the question
      setSecurityQuestion('What is the name of your first teacher?');
      setViewMode('verify-security');
      console.log('[LoginPage] Moving to security question view');
    } catch (err: any) {
      console.error('[LoginPage] Failed to get security question:', err);
      setError('User not found');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySecurityAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('[LoginPage] Verifying security answer for username:', username);

    try {
      await api.verifySecurityQuestion(username, securityAnswer);
      console.log('[LoginPage] Security answer verified, moving to reset password');
      setViewMode('reset-password');
    } catch (err: any) {
      console.error('[LoginPage] Security verification failed:', err);
      setError('Incorrect answer');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    setLoading(true);
    console.log('[LoginPage] Resetting password for username:', username);

    try {
      await api.resetPassword(username, newPassword);
      console.log('[LoginPage] Password reset successful');
      setError('');
      setPassword('');
      setSecurityAnswer('');
      setNewPassword('');
      setConfirmPassword('');
      setViewMode('login');
      alert('Password reset successful! Please log in with your new password.');
    } catch (err: any) {
      console.error('[LoginPage] Password reset failed:', err);
      setError('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const resetToLogin = () => {
    console.log('[LoginPage] Returning to login view');
    setViewMode('login');
    setError('');
    setSecurityAnswer('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <LogoIcon className="w-16 h-16 text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">ProBudget Tracker</h1>
          <p className="text-text-secondary">Manage your finances with ease</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-card-bg backdrop-blur-sm border border-border rounded-xl shadow-xl p-8">
          {viewMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-text-primary mb-6 text-center">
                  Sign In
                </h2>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-text-primary mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-text-primary placeholder-text-secondary transition-all"
                  placeholder="Enter your username"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-text-primary placeholder-text-secondary transition-all"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setViewMode('forgot-password')}
                  className="text-sm text-accent hover:text-accent-hover transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {viewMode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-text-primary mb-2 text-center">
                  Forgot Password
                </h2>
                <p className="text-text-secondary text-sm text-center">
                  Enter your username to reset your password
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="username-reset" className="block text-sm font-medium text-text-primary mb-2">
                  Username
                </label>
                <input
                  id="username-reset"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-text-primary placeholder-text-secondary transition-all"
                  placeholder="Enter your username"
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetToLogin}
                  className="flex-1 bg-bg-secondary hover:bg-border text-text-primary font-semibold py-3 px-4 rounded-lg transition-all duration-200 border border-border"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-accent hover:bg-accent-hover text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? 'Processing...' : 'Continue'}
                </button>
              </div>
            </form>
          )}

          {viewMode === 'verify-security' && (
            <form onSubmit={handleVerifySecurityAnswer} className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-text-primary mb-2 text-center">
                  Security Question
                </h2>
                <p className="text-text-secondary text-sm text-center">
                  Answer your security question to reset password
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="bg-bg-secondary border border-border rounded-lg p-4">
                <p className="text-text-primary font-medium">
                  {securityQuestion}
                </p>
              </div>

              <div>
                <label htmlFor="security-answer" className="block text-sm font-medium text-text-primary mb-2">
                  Your Answer
                </label>
                <input
                  id="security-answer"
                  type="text"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-text-primary placeholder-text-secondary transition-all"
                  placeholder="Enter your answer"
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetToLogin}
                  className="flex-1 bg-bg-secondary hover:bg-border text-text-primary font-semibold py-3 px-4 rounded-lg transition-all duration-200 border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-accent hover:bg-accent-hover text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </form>
          )}

          {viewMode === 'reset-password' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-text-primary mb-2 text-center">
                  Reset Password
                </h2>
                <p className="text-text-secondary text-sm text-center">
                  Enter your new password
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-text-primary mb-2">
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-text-primary placeholder-text-secondary transition-all"
                  placeholder="Enter new password"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-text-primary mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-text-primary placeholder-text-secondary transition-all"
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetToLogin}
                  className="flex-1 bg-bg-secondary hover:bg-border text-text-primary font-semibold py-3 px-4 rounded-lg transition-all duration-200 border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-accent hover:bg-accent-hover text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-text-secondary text-sm">
          <p>© 2024 ProBudget Tracker. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;