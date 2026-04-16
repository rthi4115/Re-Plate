import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function VolunteerLogin() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate login for the volunteer
    login({
      id: 'mock-volunteer-id',
      email: 'mock-volunteer@example.com',
      role: 'volunteer',
      name: name,
      phone: '',
      address: ''
    });

    navigate('/volunteer-dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--color-bg)]">
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-[#F5A623] to-[#D48806] flex items-center justify-center mb-5 shadow-[0_8px_30px_rgba(245,166,35,0.3)]">
            <span className="text-white text-3xl">🤝</span>
          </div>
          <h1 className="text-[32px] font-bold text-[var(--color-text-main)] mb-2 tracking-tight">Volunteer Portal</h1>
          <p className="text-[#F5A623] text-[15px] font-medium flex items-center gap-1.5">
            Help your community today.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 w-full relative z-10 flex flex-col">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-[var(--color-text-muted)] tracking-wider uppercase ml-4">Name</label>
            <input 
              type="text" 
              required
              className="input-field h-[60px]" 
              placeholder="Your full name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              className="btn-primary w-full bg-[#F5A623] hover:bg-[#D48806] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(245,166,35,0.3)]"
            >
              <span>Login</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
