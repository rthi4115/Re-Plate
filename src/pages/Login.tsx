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
          <div className="w-16 h-16 rounded-[14px] bg-gradient-to-br from-[#43A047] to-[#2D7A3A] flex items-center justify-center mb-4 shadow-lg">
            <Leaf className="text-white w-8 h-8" />
          </div>
          <h1 className="text-[28px] font-bold text-primary mb-2">RePlate</h1>
          <p className="text-[#9E9E9E] text-sm text-center">Connecting surplus food with those in need</p>
        </div>

        {/* Card */}
        <div className="card p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm text-center">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
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
                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            <button 
              type="submit" 
              className="btn-primary mt-2"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        {/* Bottom Tags */}
        <div className="flex justify-center gap-3">
          <span className="bg-white/80 border border-[#C8D6C8] text-primary text-xs font-semibold px-4 py-1.5 rounded-full shadow-sm">
            🌿 Reduce Food Waste
          </span>
          <span className="bg-white/80 border border-[#C8D6C8] text-primary text-xs font-semibold px-4 py-1.5 rounded-full shadow-sm">
            🧡 Support Communities
          </span>
        </div>
      </div>
    </div>
  );
}

