import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, ListingCard } from '../components/Shared';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from '../components/Toast';
import type { Listing, ListingStatus } from '../types';
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'claims'>('list');
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [myClaims, setMyClaims] = useState<Listing[]>([]);

  // Location state — store both GPS coords and display text
  const [locText, setLocText] = useState('');
  const [locCoords, setLocCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);

  // ── Fetch donations from Supabase ──────────────────────────────
  const fetchData = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      const all: Listing[] = data.map((d: any) => ({
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

      // Volunteer sees ONLY pending_receiver donations
      setPendingListings(all.filter(l => l.status === 'pending_receiver'));
      // My active deliveries
      setMyClaims(all.filter(l => l.claimedByVolunteerId === user.id && l.status === 'in_delivery'));
    }
  };

  // ── Auto-detect GPS on mount ────────────────────────────────────
  const detectGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocText(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        setGpsLoading(false);
        toast('📍 Location detected automatically!', 'info');
      },
      () => {
        setGpsLoading(false);
        toast('GPS denied — please enter location manually.', 'info');
      },
      { timeout: 8000 }
    );
  };

  // ── Real-time Supabase subscription ────────────────────────────
  useEffect(() => {
    fetchData();
    detectGPS();

    const channel = supabase
      .channel('donations-live-volunteer')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'donations' },
        (payload: any) => {
          fetchData();
          const newStatus = payload.new?.status;
          const oldStatus = payload.old?.status;
          if (payload.eventType === 'INSERT') {
            toast('🆕 New donation posted by a donor!', 'info');
          } else if (payload.eventType === 'UPDATE') {
            if (oldStatus === 'available' && newStatus === 'pending_receiver') {
              toast('📬 Food claimed by receiver — ready for pickup!', 'info');
            } else if (newStatus === 'completed') {
              toast('🎉 A delivery was marked as completed!', 'success');
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // ── Location filter (text match, case-insensitive) ──────────────
  const filteredListings = locText.trim()
    ? pendingListings.filter(l =>
        l.pickupLocation?.toLowerCase().includes(locText.trim().toLowerCase())
      )
    : pendingListings;

  // ── Accept Pickup (race-condition safe) ─────────────────────────
  const handleAcceptPickup = async (listingId: string) => {
    if (!user || accepting) return;
    setAccepting(listingId);
    try {
      const { error } = await supabase
        .from('donations')
        .update({ status: 'in_delivery', claimed_by_volunteer_id: user.id })
        .eq('id', listingId)
        .eq('status', 'pending_receiver'); // only if not already taken

      if (error) {
        toast('Failed to accept pickup — already taken?', 'error');
      } else {
        toast('🚚 Pickup accepted! Head to the location.', 'success');
        fetchData();
      }
    } finally {
      setAccepting(null);
    }
  };

  // ── Mark Delivered ──────────────────────────────────────────────
  const handleMarkDelivered = async (listingId: string) => {
    const { error } = await supabase
      .from('donations')
      .update({ status: 'completed' })
      .eq('id', listingId);
    if (!error) {
      toast('✅ Delivered successfully! Thank you!', 'success');
    } else {
      toast('Failed to update — please try again.', 'error');
    }
  };

  // Mock map coords (until real geocoding is added)
  const mockCoords = [
    { lat: 51.505, lng: -0.09 }, { lat: 51.51, lng: -0.1 },
    { lat: 51.515, lng: -0.08 }, { lat: 51.52, lng: -0.11 },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-32">
      <Navigation title="Volunteer Hub" />

      <main className="max-w-[480px] mx-auto px-5 py-2">

        {/* Tab Navigation */}
        <div className="flex gap-3 overflow-x-auto hide-scrollbar mb-6 pb-2">
          <div onClick={() => setActiveTab('list')} className={`filter-chip shrink-0 shadow-sm ${activeTab === 'list' ? 'active' : ''}`}>
            <span className="text-xs">📋</span> Pending
            {pendingListings.length > 0 && (
              <span className="ml-1 bg-[var(--color-primary)] text-white w-4 h-4 flex items-center justify-center rounded-full text-[10px]">
                {pendingListings.length}
              </span>
            )}
          </div>
          <div onClick={() => setActiveTab('claims')} className={`filter-chip shrink-0 shadow-sm ${activeTab === 'claims' ? 'active' : ''}`}>
            <span className="text-xs">🚚</span> My Deliveries
            {myClaims.length > 0 && (
              <span className="ml-1 bg-yellow-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-[10px]">
                {myClaims.length}
              </span>
            )}
          </div>
          <div onClick={() => setActiveTab('map')} className={`filter-chip shrink-0 shadow-sm ${activeTab === 'map' ? 'active' : ''}`}>
            <span className="text-xs">🗺️</span> Map
          </div>
        </div>

        {/* Location Card — always visible on list/map tabs */}
        {(activeTab === 'list' || activeTab === 'map') && (
          <div className="mb-6 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-primary)]">📍</span>
                <h4 className="text-sm font-bold text-[var(--color-text-main)]">Your Location</h4>
              </div>
              <button
                onClick={detectGPS}
                disabled={gpsLoading}
                className="text-[10px] font-bold text-[var(--color-primary)] border border-[rgba(34,197,94,0.3)] px-2.5 py-1 rounded-full hover:bg-[rgba(34,197,94,0.1)] transition-all disabled:opacity-50"
              >
                {gpsLoading ? '⏳ Detecting…' : '🛰 Auto-detect'}
              </button>
            </div>

            {/* Manual input — always shown so user can override GPS or type area name */}
            <input
              type="text"
              value={locText}
              onChange={e => setLocText(e.target.value)}
              placeholder="e.g. Tambaram, Chennai"
              className="input-field h-10 text-sm"
            />
            {locText.trim() && (
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5 ml-1">
                Filtering pickups near: <strong>{locText}</strong>
                {' · '}{filteredListings.length} of {pendingListings.length} shown
              </p>
            )}
          </div>
        )}

        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.15em]">
            {activeTab === 'list' ? 'Pending Pickups' : activeTab === 'claims' ? 'My Active Deliveries' : 'Live Map'}
          </h3>
          <span className="text-[11px] font-bold text-[var(--color-primary)]">
            {activeTab === 'list'
              ? `${filteredListings.length} found`
              : activeTab === 'claims'
              ? `${myClaims.length} active`
              : `${filteredListings.length} spots`}
          </span>
        </div>

        {/* ── LIST TAB ── */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            {filteredListings.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-12 opacity-80">
                <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-3xl shadow-lg mb-4">
                  📦
                </div>
                <p className="text-[var(--color-text-muted)] font-medium text-sm text-center">
                  {locText.trim()
                    ? `No pending pickups near "${locText}". Try a broader location.`
                    : 'No food is ready for pickup right now. Check back soon!'}
                </p>
              </div>
            ) : (
              filteredListings.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  actionElement={
                    <button
                      onClick={() => handleAcceptPickup(listing.id)}
                      disabled={accepting === listing.id}
                      className="btn-primary w-full py-2.5 h-auto text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {accepting === listing.id ? 'Accepting…' : '🚚 Accept Pickup'}
                    </button>
                  }
                />
              ))
            )}
          </div>
        )}

        {/* ── MY DELIVERIES TAB ── */}
        {activeTab === 'claims' && (
          <div className="space-y-4">
            {myClaims.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-12 opacity-80">
                <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-3xl shadow-lg mb-4">
                  🛵
                </div>
                <p className="text-[var(--color-text-muted)] font-medium text-sm">
                  No active deliveries. Accept a pickup to start!
                </p>
              </div>
            ) : (
              myClaims.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  actionElement={
                    <button
                      onClick={() => handleMarkDelivered(listing.id)}
                      className="w-full bg-[#22C55E] text-white hover:opacity-90 transition-all duration-300 py-3 rounded-[9999px] font-bold text-sm flex items-center justify-center gap-2 active:scale-95 shadow-[0_4px_14px_rgba(34,197,94,0.3)]"
                    >
                      <span className="text-lg leading-none">✓</span> Mark as Delivered
                    </button>
                  }
                />
              ))
            )}
          </div>
        )}

        {/* ── MAP TAB ── */}
        {activeTab === 'map' && (
          <div className="card shadow-sm h-[500px] overflow-hidden border">
            <MapContainer
              center={locCoords ? [locCoords.lat, locCoords.lng] : [51.505, -0.09]}
              zoom={locCoords ? 14 : 13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url={theme === 'dark'
                  ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
                attribution='&copy; OpenStreetMap'
              />
              {filteredListings.map((listing, index) => {
                const coord = locCoords
                  ? { lat: locCoords.lat + (index * 0.003), lng: locCoords.lng + (index * 0.003) }
                  : mockCoords[index % mockCoords.length];
                return (
                  <Marker key={listing.id} position={[coord.lat, coord.lng]}>
                    <Popup className="rounded-xl border-none shadow-lg">
                      <div className="font-bold mb-1 text-[#111827]">{listing.foodType}</div>
                      <div className="text-xs mb-1 text-gray-500">📍 {listing.pickupLocation}</div>
                      <div className="text-sm mb-2 text-gray-600">{listing.quantity} · {listing.servings} servings</div>
                      <span className="text-[10px] bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full">
                        ⏳ Pending Pickup
                      </span>
                      <button
                        onClick={() => handleAcceptPickup(listing.id)}
                        disabled={accepting === listing.id}
                        className="btn-primary py-1.5 h-auto text-xs w-full mt-2 disabled:opacity-60"
                      >
                        {accepting === listing.id ? 'Accepting…' : 'Accept Pickup'}
                      </button>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        )}

      </main>
    </div>
  );
}
