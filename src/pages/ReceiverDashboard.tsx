import { useEffect, useState } from 'react';
import { Navigation, ListingCard } from '../components/Shared';
import { mockDb } from '../services/mockDb';
import { useAuth } from '../context/AuthContext';
import type { Listing } from '../types';

export default function ReceiverDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'available' | 'pending' | 'in_delivery'>('available');
  const [availableListings, setAvailableListings] = useState<Listing[]>([]);
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [inDeliveryListings, setInDeliveryListings] = useState<Listing[]>([]);

  const fetchData = () => {
    if (!user) return;
    const allListings = mockDb.getListings();
    
    setAvailableListings(allListings.filter(l => l.status === 'active').sort((a, b) => b.servings - a.servings));
    setPendingListings(allListings.filter(l => l.status === 'pending_receiver').reverse());
    setInDeliveryListings(allListings.filter(l => l.status === 'in_delivery' && l.acceptedByReceiverId === user.id).reverse());
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleAccept = async (listingId: string) => {
    if (!user) return;
    await mockDb.updateListingStatus(listingId, {
      status: 'in_delivery',
      acceptedByReceiverId: user.id,
      acceptedAt: new Date().toISOString()
    });
    fetchData();
  };

  const handleDecline = async (listingId: string) => {
    await mockDb.updateListingStatus(listingId, {
      status: 'active',
      claimedByVolunteerId: undefined, // Using undefined to mock removal
    });
    fetchData();
  };

  const handleReceived = async (listingId: string) => {
    await mockDb.updateListingStatus(listingId, {
      status: 'completed',
    });
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-28 flex flex-col">
      <Navigation title="Receiver Dashboard 🏢" />

      <div className="bg-[var(--color-background)]/90 backdrop-blur border-b border-white/5 sticky top-[75px] z-20">
        <div className="max-w-6xl mx-auto px-6 flex gap-8">
          <button 
            className={`py-4 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'available' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('available')}
          >
            Available Food 🍱
          </button>
          <button 
            className={`py-4 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'pending' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Requests 📬
            {pendingListings.length > 0 && (
              <span className="ml-2 bg-[var(--color-primary)] text-white rounded-full px-2 py-0.5 text-xs shadow-md">
                {pendingListings.length}
              </span>
            )}
          </button>
          <button 
            className={`py-4 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'in_delivery' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('in_delivery')}
          >
            In Delivery 🚚
          </button>
        </div>
      </div>

      <main className="flex-grow max-w-6xl mx-auto w-full p-6">
        {activeTab === 'available' && (
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
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingListings.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-400">
                No pending requests. Check back later! 🙌
              </div>
            ) : (
              pendingListings.map(listing => (
                <ListingCard 
                  key={listing.id} 
                  listing={listing}
                  actionElement={
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleDecline(listing.id)}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white transition-colors duration-200 py-2 rounded-[1rem] font-semibold text-sm active:scale-95"
                      >
                        Decline ❌
                      </button>
                      <button 
                        onClick={() => handleAccept(listing.id)}
                        className="flex-1 bg-[var(--color-primary)] hover:opacity-90 text-white transition-colors duration-200 py-2 rounded-[1rem] font-semibold text-sm active:scale-95 shadow-[0_4px_14px_0_oklch(0.68_0.22_30_/_39%)]"
                      >
                        Accept 💖
                      </button>
                    </div>
                  }
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'in_delivery' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inDeliveryListings.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-400">
                No incoming deliveries at the moment 🏚️
              </div>
            ) : (
              inDeliveryListings.map(listing => (
                <ListingCard 
                  key={listing.id} 
                  listing={listing}
                  actionElement={
                    <button 
                      onClick={() => handleReceived(listing.id)}
                      className="w-full bg-[#43A047] text-white hover:opacity-90 transition-colors duration-200 py-3 rounded-[1rem] font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 shadow-md"
                    >
                      <span className="text-lg leading-none">✓</span> Mark as Received 🎉
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
