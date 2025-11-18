import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { registerUser, loginUser } from '../services/storageService';
import { isSupabaseConfigured, saveSupabaseConfig } from '../services/supabaseClient';
import { User } from '../types';
import { Dumbbell, UserPlus, LogIn, Mail, Settings, Database } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Config Form State
  const [configUrl, setConfigUrl] = useState('');
  const [configKey, setConfigKey] = useState('');

  // Auth Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Check if configured on mount
    const configured = isSupabaseConfigured();
    if (!configured) {
      setShowConfig(true);
    }
    
    // Pre-fill from local storage if available
    const storedUrl = localStorage.getItem('sb_url');
    const storedKey = localStorage.getItem('sb_key');
    if (storedUrl) setConfigUrl(storedUrl);
    if (storedKey) setConfigKey(storedKey);
  }, []);

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configUrl || !configKey) {
      setError("Both URL and Key are required");
      return;
    }
    
    try {
      // Save and re-init client without reload
      saveSupabaseConfig(configUrl, configKey);
      setShowConfig(false);
      setError('');
    } catch (err) {
      setError("Failed to save configuration");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let user: User;
      if (isLogin) {
        user = await loginUser(email, password);
      } else {
        if (!name.trim()) throw new Error("Name is required");
        if (!username.trim()) throw new Error("Username is required");
        user = await registerUser(email, name, username, password);
      }
      onAuthSuccess(user);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  if (showConfig) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="bg-emerald-500/20 p-4 rounded-full">
                <Database className="w-12 h-12 text-emerald-500" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-center text-white mb-2">
              Connect Database
            </h2>
            <p className="text-center text-gray-400 mb-8 text-sm">
              To use FitTrack, please enter your Supabase credentials. You can find these in your Supabase Project Settings under <b>API</b>.
            </p>

            <form onSubmit={handleConfigSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Project URL</label>
                <input
                  type="text"
                  value={configUrl}
                  onChange={(e) => setConfigUrl(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm"
                  placeholder="https://xyz.supabase.co"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">API Key (public/anon)</label>
                <input
                  type="password"
                  value={configKey}
                  onChange={(e) => setConfigKey(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm"
                  placeholder="eyJh..."
                  required
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full py-3 text-lg mt-4 bg-emerald-600 hover:bg-emerald-700"
              >
                Connect Database
              </Button>

              {isSupabaseConfigured() && (
                 <button 
                   type="button"
                   onClick={() => setShowConfig(false)}
                   className="w-full text-gray-500 hover:text-gray-300 text-sm mt-2"
                 >
                   Cancel
                 </button>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden relative">
        
        <button 
          onClick={() => setShowConfig(true)}
          className="absolute top-4 right-4 text-gray-600 hover:text-indigo-400 transition-colors"
          title="Database Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-500/20 p-4 rounded-full">
              <Dumbbell className="w-12 h-12 text-indigo-500" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-center text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Join FitTrack AI'}
          </h2>
          <p className="text-center text-gray-400 mb-8">
            {isLogin ? 'Track your progress and crush your goals.' : 'Start your fitness journey today.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Jane Doe"
                  required={!isLogin}
                />
              </div>
            )}
            
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="fitness_fanatic"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="you@example.com"
                  required
                />
                <Mail className="w-5 h-5 text-gray-500 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              isLoading={isLoading}
              className="w-full py-3 text-lg mt-4"
            >
              {isLogin ? (
                <span className="flex items-center gap-2"><LogIn className="w-5 h-5" /> Sign In</span>
              ) : (
                <span className="flex items-center gap-2"><UserPlus className="w-5 h-5" /> Create Account</span>
              )}
            </Button>
          </form>
        </div>
        
        <div className="bg-gray-900/50 p-4 text-center border-t border-gray-700">
          <p className="text-sm text-gray-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};