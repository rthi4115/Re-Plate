import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, UserPlus, Eye, EyeOff } from '../components/Icons';
import { mockDb } from '../services/mockDb';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });
  const [role, setRole] = useState<Role>('donor');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mockDb.getUserByEmail(formData.email)) {
        throw new Error('Email already exists');
      }

      const newUser = mockDb.createUser({
        ...formData,
        role
      });
      
      login(newUser);
      navigate(`/${role}`);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[480px]">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-[#FF6B35] to-[var(--color-primary)] flex items-center justify-center mb-3 shadow-lg shadow-[var(--color-primary)]/30">
            <UserPlus className="text-white w-7 h-7" />
          </div>
          <h1 className="text-[28px] font-bold text-white mb-1">Join RePlate 🎉</h1>
          <p className="text-gray-400 text-sm text-center">Create an account to start making an impact 🌍</p>
        </div>

        {/* Card */}
        <div className="card p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-[var(--color-primary)] rounded-full blur-[80px] opacity-40"></div>
          <div className="absolute bottom-[-50px] left-[-50px] w-32 h-32 bg-[#FF6B35] rounded-full blur-[80px] opacity-20"></div>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {error && (
              <div className="p-3 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-sm text-center">
                {error} ⚠️
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Full Name 👤</label>
                <input 
                  type="text" 
                  name="name"
                  required
                  className="input-field" 
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Phone 📱</label>
                <input 
                  type="tel" 
                  name="phone"
                  required
                  className="input-field" 
                  placeholder="(555) 000-0000"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email 📧</label>
              <input 
                type="email" 
                name="email"
                required
                className="input-field" 
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Address / Organization 📍</label>
              <input 
                type="text" 
                name="address"
                required
                className="input-field" 
                placeholder="123 Community St."
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            
            <div className="relative">
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Password 🔒</label>
              <input 
                type={showPassword ? 'text' : 'password'} 
                name="password"
                required
                className="input-field pr-10" 
                placeholder="Create a password" 
                value={formData.password}
                onChange={handleChange}
              />
              <button 
                type="button"
                className="absolute right-3 top-[28px] text-gray-400 hover:text-white transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Role Selection */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-gray-300 mb-2">I want to... 🤔</label>
              <div className="grid grid-cols-3 gap-2">
                {(['donor', 'volunteer', 'receiver'] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 px-1 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                      role === r 
                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-[0_2px_10px_oklch(0.68_0.22_30_/_40%)] transform scale-[1.02]' 
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {r === 'donor' && 'Donate 🥘'}
                    {r === 'volunteer' && 'Volunteer 🛵'}
                    {r === 'receiver' && 'Receive 💖'}
                  </button>
                ))}
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn-primary mt-6 !h-11"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account... ⏳' : 'Sign Up 🚀'}
            </button>
          </form>

          <p className="text-center mt-5 text-sm text-gray-400 relative z-10">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--color-primary)] font-semibold hover:underline">
              Login 🔑
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
