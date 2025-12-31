import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, ArrowRight, Mail, ShieldCheck, Loader2, User, UserPlus, LogIn } from 'lucide-react';

const Login: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError('');
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
    setPassword('');
    // Keep email if typed
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!isLoginMode && !name) {
        setError('Please enter your name.');
        return;
    }

    setIsLoading(true);
    
    try {
      let result;
      
      if (isLoginMode) {
        result = await login(email, password);
      } else {
        result = await register(email, password, name);
      }

      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || 'Authentication failed');
      }
    } catch (err) {
      setError('An unexpected network error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if it's the admin email to show special icon (visual only)
  const isAdminEmail = email.toLowerCase().trim() === 'admin@chelky.com';

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 z-0 opacity-20">
        <img 
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1920&auto=format&fit=crop" 
            alt="Background" 
            className="w-full h-full object-cover"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative z-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-slate-900">
            Chelky<span className="text-brand-gold">Threads</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {isLoginMode ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {!isLoginMode && (
            <div className="animate-fade-in-up">
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                <span className="absolute left-3 top-3.5 text-slate-400">
                    <User className="h-5 w-5" />
                </span>
                <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none transition-all"
                />
                </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-slate-400">
                <Mail className="h-5 w-5" />
              </span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                {isLoginMode ? 'Password' : 'Set Password'}
            </label>
            <div className="relative">
                <span className="absolute left-3 top-3.5 text-slate-400">
                <Lock className="h-5 w-5" />
                </span>
                <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isLoginMode ? "Enter password" : "Create a password"}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none transition-all"
                />
            </div>
            {isAdminEmail && isLoginMode && (
                <p className="text-xs text-brand-gold mt-1 flex items-center animate-fade-in-up">
                    <ShieldCheck className="h-3 w-3 mr-1"/> Admin Access Detected
                </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md border border-red-100 flex items-start">
               <div className="mt-0.5 mr-2">⚠️</div>
               {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-dark text-white font-bold py-4 rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                {isLoginMode ? (
                   <>Enter Store <ArrowRight className="ml-2 h-5 w-5" /></>
                ) : (
                   <>Create Account <UserPlus className="ml-2 h-5 w-5" /></>
                )}
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-sm text-slate-600 mb-4">
            {isLoginMode ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button 
            onClick={toggleMode}
            className="text-brand-gold font-bold hover:text-brand-accent transition-colors flex items-center justify-center w-full"
          >
             {isLoginMode ? (
                 <>Sign Up Now <ArrowRight className="ml-1 h-4 w-4" /></>
             ) : (
                 <>Back to Login <LogIn className="ml-1 h-4 w-4" /></>
             )}
          </button>
        </div>
        
        <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
                &copy; {new Date().getFullYear()} Chelky Threads.
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;