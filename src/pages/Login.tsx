import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Eye, EyeOff } from '../components/Icons';
import { mockDb } from '../services/mockDb';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const user = await mockDb.loginUser(email);
      // We aren't checking password in mockDb for simplicity unless we add it
      login(user);
      navigate(`/${user.role}`);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-[#FF6B35] to-[var(--color-primary)] flex items-center justify-center mb-4 shadow-lg shadow-[var(--color-primary)]/30">
            <Leaf className="text-white w-8 h-8" />
          </div>
          <h1 className="text-[32px] font-bold text-white mb-2">RePlate ✨</h1>
          <p className="text-gray-400 text-sm text-center">Connecting surplus food with those in need 🍲</p>
        </div>

        {/* Card */}
        <div className="card p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-[var(--color-primary)] rounded-full blur-[80px] opacity-40"></div>
          <div className="absolute bottom-[-50px] left-[-50px] w-32 h-32 bg-[#FF6B35] rounded-full blur-[80px] opacity-20"></div>
          
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {error && (
              <div className="p-3 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-sm text-center">
                {error} ⚠️
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Email 📧</label>
              <input 
                type="email" 
                required
                className="input-field" 
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-300 mb-2">Password 🔒</label>
              <input 
                type={showPassword ? 'text' : 'password'} 
                required
                className="input-field pr-10" 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                className="absolute right-3 top-[34px] text-gray-400 hover:text-white transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            <button 
              type="submit" 
              className="btn-primary mt-4"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in... ⏳' : 'Login 🚀'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-400 relative z-10">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[var(--color-primary)] font-semibold hover:underline">
              Sign up 🌟
            </Link>
          </p>
        </div>

        {/* Bottom Tags */}
        <div className="flex justify-center gap-3">
          <span className="bg-white/5 border border-white/10 text-gray-300 text-xs font-semibold px-4 py-2 rounded-full shadow-sm backdrop-blur-md">
            🌿 Reduce Food Waste
          </span>
          <span className="bg-white/5 border border-white/10 text-gray-300 text-xs font-semibold px-4 py-2 rounded-full shadow-sm backdrop-blur-md">
            🧡 Support Communities
          </span>
        </div>
      </div>
    </div>
  );
}

