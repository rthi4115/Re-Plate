import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, UserPlus, Eye, EyeOff } from '../components/Icons';
import { mockDb } from '../services/mockDb';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', address: ''
  });
  const [role, setRole] = useState<Role | null>(null);
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
    if (!role) {
      setError('Please select a role to continue.');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      const newUser = await mockDb.registerUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        role: role
      });
      login(newUser);
      navigate(`/${newUser.role}`);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-[600px]">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#43A047] to-[#2D7A3A] flex items-center justify-center mb-3 shadow-md">
            <Leaf className="text-white w-6 h-6" />
          </div>
          <h1 className="text-[28px] font-bold text-primary mb-1">Join RePlate</h1>
          <p className="text-[#9E9E9E] text-sm text-center">Help reduce food waste and support communities</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            {/* Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input required type="text" name="name" onChange={handleChange} className="input-field" placeholder="John Doe" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input required type="email" name="email" onChange={handleChange} className="input-field" placeholder="john@example.com" />
              </div>
              
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                <input required type={showPassword ? "text" : "password"} name="password" onChange={handleChange} className="input-field pr-10" placeholder="••••••••" />
                <button type="button" className="absolute right-3 top-[30px] text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                <input required type="tel" name="phone" onChange={handleChange} className="input-field" placeholder="+1 234 567 8900" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                <input required type="text" name="address" onChange={handleChange} className="input-field" placeholder="City, Area" />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">I am a...</label>
              <div className="space-y-3">
                {/* Donor Role */}
                <div 
                  onClick={() => setRole('donor')}
                  className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 flex items-start gap-3 
                    ${role === 'donor' ? 'bg-[#1565C0] border-[#1565C0] text-white shadow-md' : 'border-[#C8D6C8] hover:border-[#1565C0] bg-white text-gray-800'}`}
                >
                  <div className={`mt-0.5 ${role === 'donor' ? 'text-white' : 'text-primary'}`}>🌿</div>
                  <div>
                    <h3 className={`font-bold ${role === 'donor' ? 'text-white' : 'text-gray-900'}`}>Food Donor</h3>
                    <p className={`text-xs mt-1 ${role === 'donor' ? 'text-blue-100' : 'text-gray-500'}`}>Restaurant, Hotel, Event Organizer</p>
                  </div>
                </div>

                {/* Volunteer Role */}
                <div 
                  onClick={() => setRole('volunteer')}
                  className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 flex items-start gap-3 
                    ${role === 'volunteer' ? 'bg-[#1565C0] border-[#1565C0] text-white shadow-md' : 'border-[#C8D6C8] hover:border-[#1565C0] bg-white text-gray-800'}`}
                >
                  <div className={`mt-0.5 ${role === 'volunteer' ? 'text-white' : 'text-primary'}`}>🤍</div>
                  <div>
                    <h3 className={`font-bold ${role === 'volunteer' ? 'text-white' : 'text-gray-900'}`}>Volunteer</h3>
                    <p className={`text-xs mt-1 ${role === 'volunteer' ? 'text-blue-100' : 'text-gray-500'}`}>Help distribute food to those in need</p>
                  </div>
                </div>

                {/* Receiver Role */}
                <div 
                  onClick={() => setRole('receiver')}
                  className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 flex items-start gap-3 
                    ${role === 'receiver' ? 'bg-[#1565C0] border-[#1565C0] text-white shadow-md' : 'border-[#C8D6C8] hover:border-[#1565C0] bg-white text-gray-800'}`}
                >
                  <div className={`mt-0.5 ${role === 'receiver' ? 'text-white' : 'text-primary'}`}>🏢</div>
                  <div>
                    <h3 className={`font-bold ${role === 'receiver' ? 'text-white' : 'text-gray-900'}`}>Receiver</h3>
                    <p className={`text-xs mt-1 ${role === 'receiver' ? 'text-blue-100' : 'text-gray-500'}`}>Orphanage, Old Age Home, Shelter</p>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary mt-6">
              <UserPlus className="w-5 h-5 mr-2" />
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

