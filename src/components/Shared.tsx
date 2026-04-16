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
    <div className="bg-white shadow-sm sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-primary">{title}</h1>
        <span className="text-gray-500 text-sm hidden sm:inline-block">
          Welcome back, {user?.name.split(' ')[0]}! ☀️
        </span>
      </div>
      <div className="flex items-center gap-4">
        {rightElement}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors bg-gray-100 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-semibold"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>
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
    <div className="card p-5 flex flex-col h-full border border-gray-100">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-lg text-gray-900">{listing.foodType}</h3>
        {isHighImpact ? (
          <span className="high-impact-badge">
            High Impact ({listing.servings}+ servings)
          </span>
        ) : listing.status === 'completed' ? (
          <span className="bg-[#E0E0E0] text-gray-800 rounded-md text-xs font-semibold px-2 py-1">
            Completed
          </span>
        ) : (
          <span className="bg-green-100 text-green-800 rounded-md text-xs font-semibold px-2 py-1 capitalize">
            {listing.status.replace('_', ' ')}
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4 flex-grow">
        <div className="flex items-center text-sm text-gray-600">
          <Users size={16} className="text-primary mr-2" />
          <span><span className="font-semibold text-gray-800">{listing.quantity}</span> ({listing.servings} servings)</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Clock size={16} className="text-primary mr-2" />
          <span>Fresh for {listing.freshnessHours} hours</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <MapPin size={16} className="text-primary mr-2" />
          <span className="truncate">{listing.pickupLocation}</span>
        </div>
      </div>

      {listing.description && (
        <div className="bg-gray-50 italic text-gray-600 text-sm p-3 rounded-lg border-l-4 border-primary mb-4">
          "{listing.description}"
        </div>
      )}

      {actionElement && (
        <div className="mt-auto pt-2 border-t border-gray-100">
          {actionElement}
        </div>
      )}
    </div>
  );
};

