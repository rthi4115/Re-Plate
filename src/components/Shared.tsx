import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Users, Clock, MapPin } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { Listing } from '../types';

export const Navigation = ({ title, rightElement }: { title: string, rightElement?: ReactNode }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Safe fallback for user
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <>
      <div className="z-30 px-6 pt-8 pb-4 flex items-center justify-between">
        <div>
          <p className="text-[var(--color-text-muted)] text-sm font-semibold flex items-center gap-1.5 mb-0.5">
            Good Evening <span className="text-lg">👋</span>
          </p>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-[var(--color-text-main)] truncate max-w-[200px]">
            {user?.name?.split(' ')[0] || 'User'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Light / Dark theme pill */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[#22C55E] transition-all duration-300 text-[var(--color-text-main)] text-xs font-bold shadow-sm"
          >
            <span className="text-sm">{theme === 'light' ? '☀️' : '🌙'}</span>
            <span>{theme === 'light' ? 'Light' : 'Dark'}</span>
          </button>
          <div className="relative group cursor-pointer" onClick={handleLogout}>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4ADE80] to-[#22C55E] flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:scale-105 transition-transform">
              {initial}
            </div>
            <div className="absolute top-14 right-0 bg-[var(--color-surface)] border border-[var(--color-border)] py-2 px-4 rounded-xl shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity whitespace-nowrap z-50 flex items-center gap-2 text-sm text-green-500 font-bold">
               <LogOut size={16} /> Logout
            </div>
          </div>
        </div>
      </div>

      {/* Modern Pill Bottom Nav — 3 tabs: Home | Impact | Profile */}
      <BottomNav />
    </>
  );
};

/** Role-aware bottom navigation  */
const BottomNav = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Derive home & impact paths from role
  const role = user?.role ?? 'donor';
  const homePath   = `/${role}-dashboard`;
  const impactPath = role === 'volunteer' ? '/volunteer-impact' : '/impact';

  const tabs = [
    { id: 'home',    label: 'Home',    path: homePath,    emoji: '🏠' },
    { id: 'impact',  label: 'Impact',  path: impactPath,  emoji: '📊' },
    { id: 'profile', label: 'Profile', path: '/profile',  emoji: '👤' },
  ] as const;

  const activeId =
    location.pathname === homePath    ? 'home'    :
    location.pathname === impactPath  ? 'impact'  :
    location.pathname === '/profile'  ? 'profile' : 'home';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-[360px] h-[72px] bg-[#161B22] border border-[#30363D] rounded-full px-2 flex items-center justify-around shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
      {tabs.map(tab => {
        const active = activeId === tab.id;
        return (
          <button
            key={tab.id}
            id={`nav-${tab.id}`}
            onClick={() => navigate(tab.path)}
            className={`flex-1 flex flex-col items-center justify-center h-full rounded-full transition-all duration-300 ${active ? 'bg-[#21262D]' : 'hover:bg-[#21262D]/50'}`}
          >
            <span className={`text-xl mb-1 transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
              {tab.emoji}
            </span>
            <span className={`text-[10px] font-bold ${active ? 'text-[#22C55E]' : 'text-gray-500'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};


export const ListingCard = ({ 
  listing, 
  actionElement,
  ratingBadge,
}: { 
  listing: Listing, 
  actionElement?: ReactNode,
  ratingBadge?: ReactNode,
}) => {
  const isHighImpact = listing.servings >= 20;

  return (
    <div className="card p-5 flex flex-col h-full hover:-translate-y-1 transition-transform duration-300">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-lg text-[var(--color-text-main)]">{listing.foodType}</h3>
        {isHighImpact ? (
          <span className="high-impact-badge">
            High Impact
          </span>
        ) : listing.status === 'completed' ? (
          <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-xs font-semibold px-2 py-1">
            Completed
          </span>
        ) : (
          <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50 rounded-md text-xs font-semibold px-2 py-1 capitalize">
            {listing.status.replace('_', ' ')}
          </span>
        )}
      </div>

      <div className="space-y-3 mb-5 flex-grow">
        <div className="flex items-center text-sm text-[var(--color-text-muted)]">
          <Users size={16} className="text-[var(--color-primary)] mr-3 shrink-0" />
          <span><span className="font-semibold text-[var(--color-text-main)]">{listing.quantity}</span> ({listing.servings} servings)</span>
        </div>
        
        <div className="flex items-center text-sm text-[var(--color-text-muted)]">
          <Clock size={16} className="text-[var(--color-primary)] mr-3 shrink-0" />
          <span>Fresh for {listing.freshnessHours} hours</span>
        </div>
        
        <div className="flex items-center text-sm text-[var(--color-text-muted)]">
          <MapPin size={16} className="text-[var(--color-primary)] mr-3 shrink-0" />
          <span className="truncate">{listing.pickupLocation}</span>
        </div>
      </div>

      {listing.description && (
        <div className="bg-[var(--color-bg)] italic text-[var(--color-text-muted)] text-sm p-3 rounded-lg border-l-4 border-[var(--color-primary)] mb-4">
          "{listing.description}"
        </div>
      )}

      {/* Donor rating badge — shown when provided */}
      {ratingBadge && (
        <div className="mb-3 pt-3 border-t border-[var(--color-border)]">
          {ratingBadge}
        </div>
      )}

      {actionElement && (
        <div className="mt-auto pt-4 border-t border-[var(--color-border)]">
          {actionElement}
        </div>
      )}
    </div>
  );
};

