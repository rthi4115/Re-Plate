import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, Clock, MapPin } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import type { Listing } from '../types';

export const Navigation = ({ title, rightElement }: { title: string, rightElement?: ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Top Header */}
      <div className="px-6 py-5 flex items-center justify-between z-10 sticky top-0 bg-[var(--color-background)]/80 backdrop-blur-md border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary)] to-orange-400">{title}</h1>
          <p className="text-gray-400 text-sm hidden sm:block mt-1">
            Welcome back, {user?.name.split(' ')[0]}! 👋✨
          </p>
        </div>
      </div>

      {/* Floating Bottom Nav */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-sm nav-glass rounded-[2rem] px-3 py-3 flex items-center shadow-2xl">
         <div className="flex-1 flex justify-center">
            {rightElement}
         </div>
         <div className="w-[1px] h-8 bg-white/10 mx-2"></div>
         <div className="flex-1 flex justify-center">
          <button 
            onClick={handleLogout}
            className="nav-item flex items-center gap-2 text-gray-300 hover:text-white transition-colors bg-white/5 hover:bg-red-500/40 px-5 py-3 rounded-[1.5rem] text-sm font-semibold w-full justify-center"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
         </div>
      </div>
    </>
  );
};

export const ListingCard = ({ 
  listing, 
  actionElement 
}: { 
  listing: Listing, 
  actionElement?: ReactNode 
}) => {
  const isHighImpact = listing.servings >= 20;

  return (
    <div className="card p-5 flex flex-col h-full hover:-translate-y-1 transition-transform duration-300">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-lg text-white">{listing.foodType} 🍲</h3>
        {isHighImpact ? (
          <span className="high-impact-badge">
            High Impact ({listing.servings}+) 🔥
          </span>
        ) : listing.status === 'completed' ? (
          <span className="bg-white/10 text-white rounded-md text-xs font-semibold px-2 py-1">
            Completed ✅
          </span>
        ) : (
          <span className="bg-[#43A047]/20 text-[#43A047] border border-[#43A047]/30 rounded-md text-xs font-semibold px-2 py-1 capitalize">
            {listing.status.replace('_', ' ')}
          </span>
        )}
      </div>

      <div className="space-y-3 mb-5 flex-grow">
        <div className="flex items-center text-sm text-gray-300">
          <Users size={16} className="text-[var(--color-primary)] mr-3" />
          <span><span className="font-semibold text-gray-100">{listing.quantity}</span> ({listing.servings} servings 🍽️)</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-300">
          <Clock size={16} className="text-[var(--color-primary)] mr-3" />
          <span>Fresh for {listing.freshnessHours} hours ⏳</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-300">
          <MapPin size={16} className="text-[var(--color-primary)] mr-3" />
          <span className="truncate">{listing.pickupLocation} 📍</span>
        </div>
      </div>

      {listing.description && (
        <div className="bg-white/5 italic text-gray-400 text-sm p-3 rounded-lg border-l-4 border-[var(--color-primary)] mb-4">
          "{listing.description}"
        </div>
      )}

      {actionElement && (
        <div className="mt-auto pt-4 border-t border-white/5">
          {actionElement}
        </div>
      )}
    </div>
  );
};
