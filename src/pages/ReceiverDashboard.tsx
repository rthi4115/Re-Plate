import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Navigation, ListingCard } from '../components/Shared';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import type { Listing, ListingStatus } from '../types';

export default function ReceiverDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'available' | 'pending' | 'in_delivery'>('available');
  const [allAvailable, setAllAvailable] = useState<Listing[]>([]);
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [inDeliveryListings, setInDeliveryListings] = useState<Listing[]>([]);
  const [locationFilter, setLocationFilter] = useState('');
  const [claiming, setClaiming] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('donations').select('*');
    if (data && !error) {
      const mapped = data.map((d: any): Listing => ({
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
        claimedByVolunteerId: d.claimed_by_volunteer_id,
        acceptedByReceiverId: d.accepted_by_receiver_id,
      }));
      setAllAvailable(
        mapped
          .filter((l: Listing) => l.status === 'available')
          .sort((a: Listing, b: Listing) => b.servings - a.servings)
      );
      setPendingListings(
        mapped
          .filter((l: Listing) => l.status === 'pending_receiver' && l.acceptedByReceiverId === user.id)
          .reverse()
      );
      setInDeliveryListings(
        mapped
          .filter((l: Listing) => l.status === 'in_delivery' && l.acceptedByReceiverId === user.id)
          .reverse()
      );
    }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('receiver-refresh')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Location-based filter (simple text match, case-insensitive)
  const availableListings = locationFilter.trim()
    ? allAvailable.filter(l =>
        l.pickupLocation?.toLowerCase().includes(locationFilter.trim().toLowerCase())
      )
    : allAvailable;

  const handleClaimFood = async (listingId: string) => {
    if (!user) return;
    if (claiming) return; // prevent double-tap
    setClaiming(listingId);
    try {
      // Race-condition safe: only update if still 'available'
      const { error } = await supabase
        .from('donations')
        .update({
          status: 'pending_receiver',
          accepted_by_receiver_id: user.id,
        })
        .eq('id', listingId)
        .eq('status', 'available'); // only claim if not already taken

      if (error) {
        toast('Failed to claim — please try again.', 'error');
      } else {
        toast('🎉 Food claimed! Waiting for a volunteer to pick it up.', 'success');
        fetchData();
      }
    } finally {
      setClaiming(null);
    }
  };

  const handleReceived = async (listingId: string) => {
    const { error } = await supabase
      .from('donations')
      .update({ status: 'completed' })
      .eq('id', listingId);
    if (!error) toast('✅ Marked as received!', 'success');
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-32 flex flex-col">
      <Navigation title="Receiver Hub" />

      <main className="flex-grow max-w-[480px] mx-auto w-full px-5 py-2">
        {/* Chips Navigation */}
        <div className="flex gap-3 overflow-x-auto hide-scrollbar mb-6 pb-2">
           <div onClick={() => setActiveTab('available')} className={`filter-chip shrink-0 shadow-sm ${activeTab === 'available' ? 'active' : ''}`}><span className="text-xs">🍱</span> Available</div>
           <div onClick={() => setActiveTab('pending')} className={`filter-chip shrink-0 shadow-sm ${activeTab === 'pending' ? 'active' : ''}`}>
             <span className="text-xs">📬</span> Pending
             {pendingListings.length > 0 && <span className="ml-1 bg-[var(--color-primary)] text-[#0B0F19] w-4 h-4 flex items-center justify-center rounded-full text-[10px]">{pendingListings.length}</span>}
           </div>
           <div onClick={() => setActiveTab('in_delivery')} className={`filter-chip shrink-0 shadow-sm ${activeTab === 'in_delivery' ? 'active' : ''}`}><span className="text-xs">🚚</span> Delivering</div>
        </div>

        {/* Listings Header */}
        <div className="flex items-center justify-between mb-6">
           <h3 className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.15em]">
              {activeTab === 'available' ? 'Available Food' : activeTab === 'pending' ? 'Pending Acceptances' : 'Incoming Deliveries'}
           </h3>
           <span className="text-[11px] font-bold text-[var(--color-primary)]">
             {activeTab === 'available' ? `${availableListings.length} found` : activeTab === 'pending' ? `${pendingListings.length} pending` : `${inDeliveryListings.length} incoming`}
           </span>
        </div>

        {activeTab === 'available' && (
          <div className="space-y-4">
            {/* Location filter */}
            <div className="mb-4">
              <input
                type="text"
                value={locationFilter}
                onChange={e => setLocationFilter(e.target.value)}
                placeholder="📍 Filter by location (e.g. Tambaram)"
                className="input-field h-11 text-sm"
              />
              {locationFilter && (
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5 ml-1">
                  Showing {availableListings.length} of {allAvailable.length} donations near "{locationFilter}"
                </p>
              )}
            </div>

            {availableListings.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center mt-12 opacity-80">
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }} className="w-16 h-16 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-3xl shadow-lg mb-4">
                  🌾
                </motion.div>
                <p className="text-[var(--color-text-muted)] font-medium text-sm">
                  {locationFilter ? `No donations found near "${locationFilter}".` : 'No active listings available right now.'}
                </p>
              </motion.div>
            ) : (
              availableListings.map((listing, i) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  index={i}
                  actionElement={
                    <button
                      onClick={() => handleClaimFood(listing.id)}
                      disabled={claiming === listing.id}
                      className="btn-primary w-full py-2 h-auto text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {claiming === listing.id ? 'Claiming…' : 'Claim Food'}
                    </button>
                  }
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingListings.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center mt-12 opacity-80">
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }} className="w-16 h-16 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-3xl shadow-lg mb-4">
                  ⏳
                </motion.div>
                <p className="text-[var(--color-text-muted)] font-medium text-sm">You haven't claimed any items waiting for pickup.</p>
              </motion.div>
            ) : (
              pendingListings.map((listing, i) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  index={i}
                  actionElement={
                    <div className="w-full text-center py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full text-xs font-bold text-[var(--color-text-muted)]">
                       ⏳ Waiting for Volunteer Pickup
                    </div>
                  }
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'in_delivery' && (
          <div className="space-y-4">
            {inDeliveryListings.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center mt-12 opacity-80">
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }} className="w-16 h-16 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-3xl shadow-lg mb-4">
                  🏠
                </motion.div>
                <p className="text-[var(--color-text-muted)] font-medium text-sm">No incoming deliveries at the moment.</p>
              </motion.div>
            ) : (
              inDeliveryListings.map((listing, i) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  index={i}
                  actionElement={
                    <button
                      onClick={() => handleReceived(listing.id)}
                      className="w-full bg-[var(--color-primary)] text-[#0B0F19] hover:opacity-90 transition-all duration-300 py-3 rounded-[9999px] font-bold text-sm flex items-center justify-center gap-2 active:scale-95 shadow-[0_4px_14px_rgba(0, 140, 68,0.3)]"
                    >
                      <span className="text-lg leading-none">✓</span> Mark as Received
                    </button>
                  }
                />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
