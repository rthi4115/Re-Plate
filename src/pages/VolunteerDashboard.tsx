import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, ListingCard } from '../components/Shared';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useDonations } from '../context/DonationContext';
import { toast } from '../components/Toast';
import type { Listing, ListingStatus } from '../types';
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { donations, pickupDonation } = useDonations();
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'claims'>('map');
  const [availableListings, setAvailableListings] = useState<Listing[]>([]);
  const [myClaims, setMyClaims] = useState<Listing[]>([]);
  
  // Volunteer Location Flow
  const [locationState, setLocationState] = useState<{lat?: number, lng?: number, text: string}>({ text: '' });
  const [locationDenied, setLocationDenied] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);

  const dummyDonors = [
    { id: 'dummy-1', food: "Rice", location: "Tambaram", phone: "9876543210" },
    { id: 'dummy-2', food: "Chapati", location: "Guindy", phone: "9123456780" }
  ];

  const fetchData = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('donations').select('*');
    if (data && !error) {
      const allListings = data.map((d: any) => ({
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
        acceptedByReceiverId: d.accepted_by_receiver_id
      }));
      setAvailableListings(allListings.filter((l: any) => l.status === 'pending_receiver').reverse());
      setMyClaims(allListings.filter((l: any) => l.claimedByVolunteerId === user.id && l.status === 'in_delivery').reverse());
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto Location Detection
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationState({ 
            lat: position.coords.latitude, 
            lng: position.coords.longitude, 
            text: `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}` 
          });
          setLocationDenied(false);
        },
        () => {
          setLocationDenied(true);
        }
      );
    } else {
      setLocationDenied(true);
    }
    
    // Realtime UI Refresh
    const channel = supabase.channel('volunteer-refresh')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => {
         fetchData();
      }).subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleAcceptPickup = async (listingId: string) => {
    if (!user) return;
    if (accepting) return; // prevent double-tap
    setAccepting(listingId);
    try {
      // Race-condition safe: only accept if still pending_receiver
      const { error } = await supabase.from('donations').update({
        status: 'in_delivery',
        claimed_by_volunteer_id: user.id
      })
        .eq('id', listingId)
        .eq('status', 'pending_receiver'); // only if not already taken

      if (error) {
        toast('Failed to accept pickup — please try again.', 'error');
      } else {
        toast('🚚 Pickup accepted! Head to the location.', 'success');
        fetchData();
      }
    } finally {
      setAccepting(null);
    }
  };

  const handleMarkDelivered = async (listingId: string) => {
    const { error } = await supabase.from('donations').update({
      status: 'completed'
    }).eq('id', listingId);
    if (!error) {
      toast('✅ Marked as delivered! Great job!', 'success');
    } else {
      toast('Failed to mark delivered.', 'error');
    }
  };


  const mockCoordinates = [
    { lat: 51.505, lng: -0.09 },
    { lat: 51.51, lng: -0.1 },
    { lat: 51.515, lng: -0.08 },
    { lat: 51.52, lng: -0.11 },
  ];

  // Location-based filter for pending pickups (simple text match, case-insensitive)
  const filteredListings = locationState.text.trim()
    ? availableListings.filter(l =>
        l.pickupLocation?.toLowerCase().includes(locationState.text.trim().toLowerCase())
      )
    : availableListings;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-32">
      <Navigation title="Volunteer Hub" />

      <main className="max-w-[480px] mx-auto px-5 py-2">
        {/* Chips Navigation */}
        <div className="flex gap-3 overflow-x-auto hide-scrollbar mb-6 pb-2">
           <div onClick={() => setActiveTab('map')} className={`filter-chip shrink-0 shadow-sm ${activeTab === 'map' ? 'active' : ''}`}><span className="text-xs">🗺️</span> Map</div>
           <div onClick={() => setActiveTab('list')} className={`filter-chip shrink-0 shadow-sm ${activeTab === 'list' ? 'active' : ''}`}><span className="text-xs">📋</span> Available</div>
           <div onClick={() => setActiveTab('claims')} className={`filter-chip shrink-0 shadow-sm ${activeTab === 'claims' ? 'active' : ''}`}><span className="text-xs">🤝</span> My Claims</div>
        </div>

        {/* Location Flow UI */}
        {(activeTab === 'list' || activeTab === 'map') && (
           <div className="mb-6 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
             <div className="flex items-center gap-2 mb-3">
               <span className="text-[var(--color-primary)]">📍</span> 
               <h4 className="text-sm font-bold text-[var(--color-text-main)]">Your Current Location</h4>
             </div>
             
             {locationDenied ? (
               <div className="animate-in fade-in">
                 <p className="text-xs text-red-500 font-medium mb-2">Please enter your location manually</p>
                 <input 
                   type="text" 
                   value={locationState.text}
                   onChange={(e) => setLocationState({ ...locationState, text: e.target.value })}
                   placeholder="e.g. Tambaram" 
                   className="input-field h-10 text-sm"
                 />
               </div>
             ) : (
               <div className="bg-[var(--color-bg)] p-3 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] font-medium">
                 {locationState.text || 'Detecting location...'}
               </div>
             )}
           </div>
        )}

        {/* Listings Header */}
        <div className="flex items-center justify-between mb-6">
           <h3 className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.15em]">
              {activeTab === 'map' ? 'Live Map' : activeTab === 'list' ? 'Available Rescue' : 'Your Deliveries'}
           </h3>
           <span className="text-[11px] font-bold text-[var(--color-primary)]">
             {activeTab === 'map' ? `${filteredListings.length} spots` : activeTab === 'list' ? `${filteredListings.length} found` : `${myClaims.length} active`}
           </span>
        </div>

        {activeTab === 'map' && (
          <div className="card shadow-sm h-[500px] overflow-hidden border">
            <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url={theme === 'dark' 
                  ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                attribution='&copy; OpenStreetMap'
              />
              {filteredListings.map((listing, index) => {
                const coord = mockCoordinates[index % mockCoordinates.length];
                return (
                  <Marker key={listing.id} position={[coord.lat, coord.lng]}>
                    <Popup className="rounded-xl border-none shadow-lg">
                      <div className="font-bold mb-1 text-[#111827]">{listing.foodType}</div>
                      <div className="text-sm mb-2 text-gray-600">{listing.quantity} • {listing.servings} Servings</div>
                      <button 
                        onClick={() => handleAcceptPickup(listing.id)}
                        disabled={accepting === listing.id}
                        className="btn-primary py-1.5 h-auto text-xs disabled:opacity-60"
                      >
                        {accepting === listing.id ? 'Accepting...' : 'Accept Pickup'}
                      </button>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="space-y-6">
            
            {/* Context Demo Section */}
             {donations.length > 0 && (
              <div className="mb-6 space-y-4">
                <h3 className="text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-[0.15em] flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse"></span> Live Demo Rescues</h3>
                {donations.map(donation => (
                  <div key={donation.id} className="card p-4 border border-[var(--color-border)] shadow-sm bg-[var(--color-surface)]">
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-[var(--color-text-main)]">{donation.food}</h4>
                       <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${donation.status === 'Available' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                         {donation.status === 'Available' ? '🟢 Available' : '🔴 Picked'}
                       </span>
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] mb-1">📦 {donation.quantity}</div>
                    <div className="text-xs text-[var(--color-text-muted)] mb-3">📍 {donation.location}</div>
                    
                    <button 
                      className={`w-full py-2 text-sm shadow-sm font-bold rounded-xl transition-all ${donation.status === 'Available' ? 'bg-[var(--color-primary)] text-white hover:opacity-90' : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed'}`}
                      disabled={donation.status === 'Picked'}
                      onClick={() => pickupDonation(donation.id, user?.name || 'A Volunteer')}
                    >
                      {donation.status === 'Available' ? 'Pickup' : `Picked by ${donation.pickedBy}`}
                    </button>
                  </div>
                ))}
                <hr className="border-[var(--color-border)]" />
              </div>
            )}

            {/* Dummy Nearby Donors List */}
            <div>
              <h3 className="text-[12px] font-bold text-[var(--color-text-main)] uppercase tracking-wider mb-3 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse"></span> Nearby (Simulated)</h3>
              <div className="space-y-3">
                {dummyDonors
                  .filter(d => !locationState.text || locationState.text.toLowerCase().includes(d.location.toLowerCase()) || d.location.toLowerCase().includes(locationState.text.toLowerCase()))
                  .map(donor => (
                  <div key={donor.id} className="card p-4 border border-[var(--color-border)] shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-[var(--color-text-main)]">{donor.food}</h4>
                       <span className="text-[10px] bg-[var(--color-bg)] px-2 py-1 rounded-full font-bold text-[var(--color-text-muted)]">Nearby</span>
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] mb-1">📍 {donor.location}</div>
                    <div className="text-xs text-[var(--color-text-muted)] mb-3">📞 {donor.phone}</div>
                    <button className="btn-primary w-full py-2 text-sm shadow-sm" onClick={() => alert('Picked up dummy order!')}>Pickup</button>
                  </div>
                ))}
                {dummyDonors.filter(d => !locationState.text || locationState.text.toLowerCase().includes(d.location.toLowerCase()) || d.location.toLowerCase().includes(locationState.text.toLowerCase())).length === 0 && (
                  <div className="text-xs text-[var(--color-text-muted)] p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] text-center">No nearby donors match your location search.</div>
                )}
              </div>
            </div>

            <hr className="border-[var(--color-border)]" />
            
            {/* Actual Database Listings */}
            <div>
              <h3 className="text-[12px] font-bold text-[var(--color-text-main)] uppercase tracking-wider mb-3">Pending Pickups</h3>
              {locationState.text.trim() && (
                <p className="text-[11px] text-[var(--color-text-muted)] mb-3 ml-1">
                  Showing {filteredListings.length} of {availableListings.length} tasks near "{locationState.text}"
                </p>
              )}
              <div className="space-y-4">
                {filteredListings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center mt-6 opacity-80">
                    <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-3xl shadow-lg mb-4">
                      📦
                    </div>
                    <p className="text-[var(--color-text-muted)] font-medium text-sm">
                      {locationState.text.trim() ? `No pickups near "${locationState.text}".` : 'No food is ready for pickup right now.'}
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
                          className="btn-primary py-2.5 h-auto text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {accepting === listing.id ? 'Accepting…' : 'Accept Pickup'}
                        </button>
                      }
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'claims' && (
          <div className="space-y-4">
            {myClaims.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-12 opacity-80">
                <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-3xl shadow-lg mb-4">
                  🛵
                </div>
                <p className="text-[var(--color-text-muted)] font-medium text-sm">You haven't claimed any deliveries.</p>
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
      </main>
    </div>
  );
}

