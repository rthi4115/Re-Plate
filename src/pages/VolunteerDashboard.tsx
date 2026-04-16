import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, ListingCard } from '../components/Shared';
import { mockDb } from '../services/mockDb';
import { useAuth } from '../context/AuthContext';
import type { Listing } from '../types';

// Fix for leaflet default icon issue in React
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
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'claims'>('map');
  const [availableListings, setAvailableListings] = useState<Listing[]>([]);
  const [myClaims, setMyClaims] = useState<Listing[]>([]);

  const fetchData = () => {
    if (!user) return;
    const allListings = mockDb.getListings();
    
    setAvailableListings(allListings.filter(l => l.status === 'active').reverse());
    setMyClaims(allListings.filter(l => l.claimedByVolunteerId === user.id).reverse());
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleClaim = async (listingId: string) => {
    if (!user) return;
    await mockDb.updateListingStatus(listingId, {
      status: 'pending_receiver',
      claimedByVolunteerId: user.id,
      claimedAt: new Date().toISOString()
    });
    fetchData();
  };

  // Mock coordinates for demo
  const mockCoordinates = [
    { lat: 51.505, lng: -0.09 },
    { lat: 51.51, lng: -0.1 },
    { lat: 51.515, lng: -0.08 },
    { lat: 51.52, lng: -0.11 },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-28 flex flex-col">
      <Navigation title="Volunteer Dashboard 🦸" />

      <div className="bg-[var(--color-background)]/90 backdrop-blur border-b border-white/5 sticky top-[75px] z-20">
        <div className="max-w-6xl mx-auto px-6 flex gap-8">
          <button 
            className={`py-4 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'map' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('map')}
          >
            Map View 🗺️
          </button>
          <button 
            className={`py-4 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'list' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('list')}
          >
            Available List 📋
          </button>
          <button 
            className={`py-4 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'claims' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('claims')}
          >
            My Claims 🤝
          </button>
        </div>
      </div>

      <main className="flex-grow flex flex-col max-w-6xl mx-auto w-full p-6">
        {activeTab === 'map' && (
          <div className="card p-2 shadow-xl flex-grow min-h-[500px] border-none">
            <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '100%', width: '100%', borderRadius: '14px' }}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              {availableListings.map((listing, index) => {
                const coord = mockCoordinates[index % mockCoordinates.length];
                return (
                  <Marker key={listing.id} position={[coord.lat, coord.lng]}>
                    <Popup className="rounded-xl">
                      <div className="font-bold mb-1 text-gray-900">{listing.foodType} 🍱</div>
                      <div className="text-sm mb-2 text-gray-700">{listing.quantity} • {listing.servings} Servings</div>
                      <button 
                        onClick={() => handleClaim(listing.id)}
                        className="bg-[var(--color-primary)] text-white px-3 py-1.5 rounded-md text-xs font-bold w-full active:scale-95 transition-transform"
                      >
                        Claim Listing ✨
                      </button>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableListings.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-400">
                No active listings available right now 🌾
              </div>
            ) : (
              availableListings.map(listing => (
                <ListingCard 
                  key={listing.id} 
                  listing={listing} 
                  actionElement={
                    <button 
                      onClick={() => handleClaim(listing.id)}
                      className="btn-primary py-2 h-auto"
                    >
                      Claim & Deliver 🛵
                    </button>
                  }
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'claims' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myClaims.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-400">
                You haven't claimed any listings yet 🤷
              </div>
            ) : (
              myClaims.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
