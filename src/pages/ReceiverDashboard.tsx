import { useEffect, useState } from 'react';
import { Navigation, ListingCard } from '../components/Shared';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import { TamilVoiceAssistant } from '../components/TamilVoiceAssistant';
import { ReviewModal, DonorRatingBadge } from '../components/ReviewModal';
import type { Listing, ListingStatus, DonorRating } from '../types';

export default function ReceiverDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'available' | 'pending' | 'in_delivery' | 'completed'>('available');

  // Listings per status
  const [allAvailable, setAllAvailable] = useState<Listing[]>([]);
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [inDeliveryListings, setInDeliveryListings] = useState<Listing[]>([]);
  const [completedListings, setCompletedListings] = useState<Listing[]>([]);

  // Ratings map: donor_id → DonorRating
  const [ratingsMap, setRatingsMap] = useState<Record<string, DonorRating>>({});

  // Which donation IDs this receiver has already reviewed
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  const [locationFilter, setLocationFilter] = useState('');
  const [claiming, setClaiming] = useState<string | null>(null);

  // ReviewModal state
  const [reviewTarget, setReviewTarget] = useState<Listing | null>(null);

  // ── Fetch donations + reviews ──────────────────────────────────
  const fetchData = async () => {
    if (!user) return;

    // Fetch all donations
    const { data: donData } = await supabase.from('donations').select('*');
    if (donData) {
      const mapped = donData.map((d: any): Listing => ({
        id: d.id,
        donorId: d.donor_id,
        foodType: d.food_type,
        quantity: d.quantity,
        servings: d.servings,
        freshnessHours: d.freshness_hours,
        pickupLocation: d.pickup_location || d.location || '',
        description: d.description,
        status: d.status as ListingStatus,
        createdAt: d.created_at,
        claimedByVolunteerId: d.claimed_by_volunteer_id,
        acceptedByReceiverId: d.accepted_by_receiver_id,
      }));

      setAllAvailable(mapped.filter(l => l.status === 'available').sort((a, b) => b.servings - a.servings));
      setPendingListings(mapped.filter(l => l.status === 'pending_receiver' && l.acceptedByReceiverId === user.id).reverse());
      setInDeliveryListings(mapped.filter(l => l.status === 'in_delivery' && l.acceptedByReceiverId === user.id).reverse());
      setCompletedListings(mapped.filter(l => l.status === 'completed' && l.acceptedByReceiverId === user.id).reverse());
    }

    // Fetch all reviews to build ratings map
    const { data: revData } = await supabase.from('reviews').select('*');
    if (revData) {
      const map: Record<string, DonorRating> = {};
      for (const r of revData) {
        const did = r.donor_id;
        if (!map[did]) map[did] = { avg: 0, count: 0, recents: [] };
        map[did].count += 1;
        map[did].avg += r.rating;
        if (map[did].recents.length < 3 && r.feedback) {
          map[did].recents.push({ rating: r.rating, feedback: r.feedback });
        }
      }
      // Finalise averages
      for (const did in map) {
        map[did].avg = Math.round((map[did].avg / map[did].count) * 10) / 10;
      }
      setRatingsMap(map);

      // Track which donation IDs this receiver has already reviewed
      const reviewed = new Set<string>(
        revData
          .filter((r: any) => r.receiver_id === user.id)
          .map((r: any) => r.donation_id as string)
      );
      setReviewedIds(reviewed);
    }
  };

  // ── Real-time subscription ─────────────────────────────────────
  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('donations-live-receiver')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, (payload: any) => {
        fetchData();
        const newStatus = payload.new?.status;
        const oldStatus = payload.old?.status;
        if (payload.eventType === 'INSERT') toast('🆕 New food available near you!', 'info');
        else if (payload.eventType === 'UPDATE') {
          if (newStatus === 'in_delivery' && oldStatus === 'pending_receiver') toast('🚚 A volunteer has started pickup!', 'info');
          else if (newStatus === 'completed') toast('🎉 Food delivered successfully!', 'success');
        }
      })
      .subscribe();

    // Also subscribe to reviews table for real-time rating updates
    const reviewChannel = supabase
      .channel('reviews-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(reviewChannel);
    };
  }, [user]);

  // ── Location filter ────────────────────────────────────────────
  const availableListings = locationFilter.trim()
    ? allAvailable.filter(l => l.pickupLocation?.toLowerCase().includes(locationFilter.trim().toLowerCase()))
    : allAvailable;

  // ── Claim Food (race-condition safe) ───────────────────────────
  const handleClaimFood = async (listingId: string) => {
    if (!user || claiming) return;
    setClaiming(listingId);
    try {
      const { error } = await supabase
        .from('donations')
        .update({ status: 'pending_receiver', accepted_by_receiver_id: user.id })
        .eq('id', listingId)
        .eq('status', 'available');
      if (error) toast('Failed to claim — please try again.', 'error');
      else toast('🎉 Food claimed! Waiting for a volunteer.', 'success');
    } finally {
      setClaiming(null);
    }
  };

  // ── Mark as Received → opens review modal ─────────────────────
  const handleReceived = async (listing: Listing) => {
    const { error } = await supabase
      .from('donations')
      .update({ status: 'completed' })
      .eq('id', listing.id);
    if (!error) {
      toast('✅ Marked as received!', 'success');
      fetchData();
      // Prompt review immediately
      setReviewTarget(listing);
    } else {
      toast('Failed to update status.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-32 flex flex-col">
      <Navigation title="Receiver Hub" />

      <main className="flex-grow max-w-[480px] mx-auto w-full px-5 py-2">

        {/* Tabs */}
        <div className="flex gap-3 overflow-x-auto hide-scrollbar mb-6 pb-2">
          <div onClick={() => setActiveTab('available')} className={`filter-chip shrink-0 shadow-sm ${activeTab === 'available' ? 'active' : ''}`}>
            <span className="text-xs">🍱</span> Available
          </div>
          <div onClick={() => setActiveTab('pending')} className={`filter-chip shrink-0 shadow-sm ${activeTab === 'pending' ? 'active' : ''}`}>
            <span className="text-xs">📬</span> Pending
            {pendingListings.length > 0 && (
              <span className="ml-1 bg-[var(--color-primary)] text-white w-4 h-4 flex items-center justify-center rounded-full text-[10px]">
                {pendingListings.length}
              </span>
            )}
          </div>
          <div onClick={() => setActiveTab('in_delivery')} className={`filter-chip shrink-0 shadow-sm ${activeTab === 'in_delivery' ? 'active' : ''}`}>
            <span className="text-xs">🚚</span> Delivering
          </div>
          <div onClick={() => setActiveTab('completed')} className={`filter-chip shrink-0 shadow-sm ${activeTab === 'completed' ? 'active' : ''}`}>
            <span className="text-xs">✅</span> Completed
            {completedListings.filter(l => !reviewedIds.has(l.id)).length > 0 && (
              <span className="ml-1 bg-yellow-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-[10px]">
                ⭐
              </span>
            )}
          </div>
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.15em]">
            {activeTab === 'available' ? 'Available Food' :
             activeTab === 'pending' ? 'Pending Acceptances' :
             activeTab === 'in_delivery' ? 'Incoming Deliveries' : 'Completed Deliveries'}
          </h3>
          <span className="text-[11px] font-bold text-[var(--color-primary)]">
            {activeTab === 'available' ? `${availableListings.length} found` :
             activeTab === 'pending' ? `${pendingListings.length} pending` :
             activeTab === 'in_delivery' ? `${inDeliveryListings.length} incoming` :
             `${completedListings.length} total`}
          </span>
        </div>

        {/* ── AVAILABLE TAB ── */}
        {activeTab === 'available' && (
          <div className="space-y-4">
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
              <div className="flex flex-col items-center justify-center mt-12 opacity-80">
                <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-3xl shadow-lg mb-4">🌾</div>
                <p className="text-[var(--color-text-muted)] font-medium text-sm">
                  {locationFilter ? `No donations near "${locationFilter}".` : 'No active listings right now.'}
                </p>
              </div>
            ) : (
              availableListings.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  ratingBadge={<DonorRatingBadge rating={ratingsMap[listing.donorId]} />}
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

        {/* ── PENDING TAB ── */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingListings.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-12 opacity-80">
                <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-3xl shadow-lg mb-4">⏳</div>
                <p className="text-[var(--color-text-muted)] font-medium text-sm">No items waiting for pickup.</p>
              </div>
            ) : (
              pendingListings.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
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

        {/* ── IN DELIVERY TAB ── */}
        {activeTab === 'in_delivery' && (
          <div className="space-y-4">
            {inDeliveryListings.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-12 opacity-80">
                <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-3xl shadow-lg mb-4">🏠</div>
                <p className="text-[var(--color-text-muted)] font-medium text-sm">No incoming deliveries yet.</p>
              </div>
            ) : (
              inDeliveryListings.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  actionElement={
                    <button
                      onClick={() => handleReceived(listing)}
                      className="w-full bg-[#22C55E] text-white hover:opacity-90 transition-all duration-300 py-3 rounded-[9999px] font-bold text-sm flex items-center justify-center gap-2 active:scale-95 shadow-[0_4px_14px_rgba(34,197,94,0.3)]"
                    >
                      <span className="text-lg leading-none">✓</span> Mark as Received
                    </button>
                  }
                />
              ))
            )}
          </div>
        )}

        {/* ── COMPLETED TAB ── */}
        {activeTab === 'completed' && (
          <div className="space-y-4">
            {completedListings.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-12 opacity-80">
                <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-3xl shadow-lg mb-4">🎉</div>
                <p className="text-[var(--color-text-muted)] font-medium text-sm">No completed deliveries yet.</p>
              </div>
            ) : (
              completedListings.map(listing => {
                const alreadyReviewed = reviewedIds.has(listing.id);
                return (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    ratingBadge={<DonorRatingBadge rating={ratingsMap[listing.donorId]} />}
                    actionElement={
                      alreadyReviewed ? (
                        <div className="w-full text-center py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-xs font-bold text-yellow-500">
                          ⭐ Review Submitted
                        </div>
                      ) : (
                        <button
                          onClick={() => setReviewTarget(listing)}
                          className="w-full py-2.5 h-auto text-sm font-bold rounded-[9999px] border border-yellow-500/40 text-yellow-500 bg-yellow-500/8 hover:bg-yellow-500/15 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          ⭐ Rate This Donor
                        </button>
                      )
                    }
                  />
                );
              })
            )}
          </div>
        )}
      </main>

      {/* Review Modal */}
      {reviewTarget && (
        <ReviewModal
          listing={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSuccess={fetchData}
        />
      )}

      {/* Tamil Voice Assistant */}
      <TamilVoiceAssistant />
    </div>
  );
}
