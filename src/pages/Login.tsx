import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf } from '../components/Icons';
import { supabase } from '../services/supabaseClient';
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        alert(authError.message);
        throw authError; // or ignore
      } else {
        // App.tsx auth context listener will redirect after profile fetch,
        // or we can force redirect here, but we don't know the role without a fetch
        // let's fetch the user role directly to redirect immediately
        if (data.user) {
          const { data: userProfile } = await supabase.from('users').select('role').eq('id', data.user.id).single();
          if (userProfile) {
             navigate(`/${userProfile.role}-dashboard`);
          } else {
             navigate('/');
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--color-bg)]">
      <div className="w-full max-w-[420px]">
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-[#4ADE80] to-[#22C55E] flex items-center justify-center mb-5 shadow-[0_8px_30px_rgba(34,197,94,0.3)]">
            <Leaf className="text-white w-10 h-10" />
          </div>
          <h1 className="text-[36px] font-bold text-[var(--color-text-main)] mb-2 tracking-tight">FoodBridge</h1>
          <p className="text-[#22C55E] text-[15px] font-medium flex items-center gap-1.5">
            <span className="text-xl">✨</span> Reduce waste. Feed communities.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 w-full relative z-10 flex flex-col">
          {error && (
            <div className="p-3 bg-green-900/40 text-green-300 border border-green-800/50 rounded-2xl text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-[var(--color-text-muted)] tracking-wider uppercase ml-4">Email</label>
            <input 
              type="email" 
              required
              className="input-field h-[60px]" 
              placeholder="you@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-[var(--color-text-muted)] tracking-wider uppercase ml-4">Password</label>
            <input 
              type="password"
              required
              className="input-field h-[60px] tracking-[0.2em] font-bold" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <div className="pt-6">
            <button 
              type="submit" 
              className="btn-primary flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </form>

        <p className="text-center mt-8 text-sm text-[var(--color-text-muted)] font-medium">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[var(--color-text-main)] font-bold hover:text-[var(--color-primary)] transition-colors">
            Register now
          </Link>
        </p>

        <div className="mt-8 flex justify-center">
           <Link to="/volunteer-login" className="text-xs text-[var(--color-text-muted)] hover:text-[#F5A623] hover:underline transition-colors py-2 px-4 rounded-full border border-transparent hover:border-[#F5A623]/30">
              Access Volunteer Login
           </Link>
        </div>
      </div>
    </div>
  );
}
