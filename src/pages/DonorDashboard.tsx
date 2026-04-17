import { useEffect, useState } from 'react';
import { Navigation, ListingCard } from '../components/Shared';
import { PostFoodModal } from '../components/PostFoodModal';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useDonations } from '../context/DonationContext';
import { toast } from '../components/Toast';
import { DonorRatingBadge } from '../components/ReviewModal';
import type { Listing, ListingStatus, DonorRating } from '../types';

// Status-notification banner for the donor
interface StatusNotif {
  id: string;
  foodType: string;
  status: ListingStatus;
}

export default function DonorDashboard() {
  const { user } = useAuth();
  const { donations } = useDonations();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notifs, setNotifs] = useState<StatusNotif[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [myRating, setMyRating] = useState<DonorRating | null>(null);

  const fetchListings = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('donor_id', user.id)
      .order('created_at', { ascending: false });

    if (data && !error) {
      const mapped: Listing[] = data.map((d: any) => ({
        id: d.id,
        donorId: d.donor_id,
        foodType: d.food_type,
        quantity: d.quantity,
        servings: d.servings,
        freshnessHours: d.freshness_hours,
        pickupLocation: d.location || d.pickup_location,
        description: d.description,
        status: d.status as ListingStatus,
        createdAt: d.created_at,
      }));
      setListings(mapped);

      // Build notification list for non-available statuses
      const newNotifs = mapped
        .filter(l =>
          ['pending_receiver', 'in_delivery', 'completed'].includes(l.status)
        )
        .map(l => ({ id: l.id, foodType: l.foodType, status: l.status }));
      setNotifs(newNotifs);
    }
  };

  const fetchReviews = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('donor_id', user.id)
      .order('created_at', { ascending: false });
    if (data && data.length > 0) {
      const total = data.reduce((sum: number, r: any) => sum + r.rating, 0);
      setMyRating({
        avg: Math.round((total / data.length) * 10) / 10,
        count: data.length,
        recents: data.slice(0, 3).map((r: any) => ({ rating: r.rating, feedback: r.feedback || '' })),
      });
    } else {
      setMyRating({ avg: 0, count: 0, recents: [] });
    }
  };

  useEffect(() => {
    fetchListings();
    fetchReviews();
    const channel = supabase
      .channel('donations-live-donor')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'donations' },
        (payload: any) => {
          fetchListings();
          const newStatus = payload.new?.status;
          const donorId   = payload.new?.donor_id;
          if (user && donorId === user.id) {
            if (newStatus === 'pending_receiver') toast('📬 Your food has been claimed by a receiver!', 'info');
            else if (newStatus === 'in_delivery') toast('🚚 Your food is picked up — on the way!', 'info');
            else if (newStatus === 'completed') toast('🎉 Your food was delivered successfully!', 'success');
          }
        }
      )
      .subscribe();

    // Listen for new reviews about this donor
    const reviewChannel = supabase
      .channel('reviews-live-donor')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews' }, () => {
        fetchReviews();
        toast('⭐ You received a new review!', 'success');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(reviewChannel);
    };
  }, [user]);

  const activeCount = listings.filter(
    l => l.status === 'available' || l.status === 'active' || l.status === 'pending_receiver' || l.status === 'in_delivery'
  ).length;
  const completedCount = listings.filter(l => l.status === 'completed').length;

  const visibleNotifs = notifs.filter(n => !dismissedIds.has(n.id));

  const notifMessage = (s: ListingStatus) => {
    if (s === 'pending_receiver') return { emoji: '📬', text: 'Your food has been requested by a receiver — waiting for a volunteer.' };
    if (s === 'in_delivery')     return { emoji: '🚴', text: 'Your food is picked by a volunteer and is on the way!' };
    if (s === 'completed')       return { emoji: '🎉', text: 'Your food has been delivered successfully!' };
    return null;
  };

  const notifColor = (s: ListingStatus) => {
    if (s === 'pending_receiver') return 'border-blue-500/30 bg-blue-500/8';
    if (s === 'in_delivery')     return 'border-yellow-500/30 bg-yellow-500/8';
    if (s === 'completed')       return 'border-[#22C55E]/30 bg-[rgba(34,197,94,0.08)]';
    return '';
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-32">
      <Navigation title="Donor Dashboard" />

      <main className="max-w-[480px] mx-auto px-5 py-2">
        {/* Status Notifications */}
        {visibleNotifs.length > 0 && (
          <div className="mb-5 space-y-2">
            {visibleNotifs.map(n => {
              const msg = notifMessage(n.status);
              if (!msg) return null;
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-3 rounded-2xl border ${notifColor(n.status)}`}
                >
                  <span className="text-xl shrink-0">{msg.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[var(--color-text-main)] truncate">{n.foodType}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{msg.text}</p>
                  </div>
                  <button
                    onClick={() => setDismissedIds(prev => new Set([...prev, n.id]))}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] text-lg leading-none shrink-0"
                  >×</button>
                </div>
              );
            })}
          </div>
        )}

        {/* Banner */}
        <div className="w-full bg-gradient-to-r from-[rgba(34,197,94,0.15)] to-[rgba(34,197,94,0.05)] border border-[rgba(34,197,94,0.2)] rounded-3xl p-5 flex items-center justify-between mb-6 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl shadow-sm">🍱</div>
              <div>
                <h2 className="text-[var(--color-text-main)] font-bold text-lg mb-0.5 tracking-tight">Your food saves lives!</h2>
                <p className="text-[var(--color-text-muted)] text-[12px]">{completedCount} meals delivered so far</p>
              </div>
           </div>
           <div className="text-[var(--color-primary)] text-xl pr-2">✨</div>
        </div>

        {/* 3 Stat Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[var(--color-surface)] border-t-2 border-t-[#22C55E] rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm">
             <span className="text-[#22C55E] mb-2 text-lg">📦</span>
             <span className="text-2xl font-bold text-[var(--color-text-main)] mb-1">{listings.length}</span>
             <span className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Posted</span>
          </div>
          <div className="bg-[var(--color-surface)] border-t-2 border-t-[#F5A623] rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm">
             <span className="text-[#F5A623] mb-2 text-lg">📈</span>
             <span className="text-2xl font-bold text-[var(--color-text-main)] mb-1">{activeCount}</span>
             <span className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Claimed</span>
          </div>
          <div className="bg-[var(--color-surface)] border-t-2 border-t-[#22C55E] rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm">
             <span className="text-[#22C55E] mb-2 text-lg">✅</span>
             <span className="text-2xl font-bold text-[var(--color-text-main)] mb-1">{completedCount}</span>
             <span className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Collected</span>
          </div>
        </div>

        {/* ⭐ Donor Rating Summary Card */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Your Donor Rating</h4>
            {myRating && myRating.count > 0 && (
              <span className="text-[11px] font-bold text-[var(--color-primary)] bg-[rgba(34,197,94,0.1)] px-2.5 py-1 rounded-full">
                {myRating.count} {myRating.count === 1 ? 'review' : 'reviews'}
              </span>
            )}
          </div>
          <DonorRatingBadge rating={myRating ?? undefined} />
        </div>

        {/* Listings Header */}
        <div className="flex items-center justify-between mb-6">
           <h3 className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.15em]">Your Listings</h3>
           <button
             onClick={() => setIsModalOpen(true)}
             className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-primary)] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] px-3 py-1.5 rounded-full hover:bg-[rgba(34,197,94,0.2)] transition-all duration-200 active:scale-95"
           >
             <span className="text-sm leading-none">+</span> Post Food
           </button>
        </div>

        {/* Context Demo Section (realtime context donations) */}
        {donations.filter(d => d.donorId === 'all' || d.donorId === user?.id).length > 0 && (
          <div className="mb-6 space-y-4">
            <h3 className="text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-[0.15em] flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse"></span> Live Demo Rescues</h3>
            {donations.filter(d => d.donorId === 'all' || d.donorId === user?.id).map(donation => (
              <div key={donation.id} className="card p-4 border border-[var(--color-border)] shadow-sm bg-[var(--color-surface)]">
                {donation.status === 'Picked' && (
                  <div className="mb-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2">
                     <span className="animate-pulse">🔔</span>
                     <span className="text-xs font-bold text-green-500">A volunteer ({donation.pickedBy}) is coming to pick up your food!</span>
                  </div>
                )}
                <div className="flex justify-between items-start mb-2">
                   <h4 className="font-bold text-[var(--color-text-main)]">{donation.food}</h4>
                   <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${donation.status === 'Available' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                     {donation.status === 'Available' ? '🟢 Available' : '🔴 Picked'}
                   </span>
                </div>
                <div className="text-xs text-[var(--color-text-muted)] mb-1">📦 {donation.quantity}</div>
                <div className="text-xs text-[var(--color-text-muted)]">📍 {donation.location}</div>
              </div>
            ))}
            <hr className="border-[var(--color-border)] my-6" />
          </div>
        )}

        {/* Listings */}
        {listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-12 opacity-80 cursor-pointer hover:scale-105 transition-transform" onClick={() => setIsModalOpen(true)}>
            <div className="relative mb-4">
               <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-3xl shadow-lg relative z-10">
                 🍳
               </div>
               <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-lg z-20 shadow-md">
                 +
               </div>
            </div>
            <p className="text-[var(--color-text-muted)] font-medium text-sm">No food posted yet. Tap + to start!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </main>

      <PostFoodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchListings}
      />

      {/* Floating Action Button — always visible */}
      <button
        onClick={() => setIsModalOpen(true)}
        id="fab-post-food"
        aria-label="Post Food"
        className="fixed bottom-28 right-5 z-40 w-14 h-14 rounded-full bg-[var(--color-primary)] text-white text-3xl font-bold shadow-[0_8px_24px_rgba(34,197,94,0.45)] flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-200"
      >
        +
      </button>
    </div>
  );
}
