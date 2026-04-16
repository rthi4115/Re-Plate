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
    
    // Available: Active listings (they can just browse, no action available yet unless they wait for Volunteer)
    // Actually, maybe they can request them? For now, just browse.
    setAvailableListings(allListings.filter(l => l.status === 'active').sort((a, b) => b.servings - a.servings));
    
    // Pending: Volunteer claimed, waiting for Receiver to accept
    setPendingListings(allListings.filter(l => l.status === 'pending_receiver').reverse());

    // In Delivery: Accepted by THIS receiver
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
    // If declined, push back to active for another volunteer/receiver
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation title="Receiver Dashboard" />

      <div className="bg-white border-b sticky top-[73px] z-20">
        <div className="max-w-6xl mx-auto px-6 flex gap-8">
          <button 
            className={`py-4 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'available' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            onClick={() => setActiveTab('available')}
          >
            Available Food
          </button>
          <button 
            className={`py-4 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'pending' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Requests 
            {pendingListings.length > 0 && (
              <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                {pendingListings.length}
              </span>
            )}
          </button>
          <button 
            className={`py-4 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'in_delivery' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            onClick={() => setActiveTab('in_delivery')}
          >
            In Delivery
          </button>
        </div>
      </div>

      <main className="flex-grow max-w-6xl mx-auto w-full p-6">
        {activeTab === 'available' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableListings.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-500">
                No active listings available right now.
              </div>
            ) : (
              availableListings.map(listing => (
                <ListingCard 
                  key={listing.id} 
                  listing={listing} 
                  /* No actions here, just browsing. High Impact badge handles highlighting */
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingListings.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-500">
                No pending requests. Check back later!
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
                        className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200 py-2 rounded-lg font-semibold text-sm"
                      >
                        Decline
                      </button>
                      <button 
                        onClick={() => handleAccept(listing.id)}
                        className="flex-1 bg-primary text-white hover:bg-opacity-90 transition-colors duration-200 py-2 rounded-lg font-semibold text-sm"
                      >
                        Accept
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
              <div className="col-span-full py-12 text-center text-gray-500">
                No incoming deliveries at the moment.
              </div>
            ) : (
              inDeliveryListings.map(listing => (
                <ListingCard 
                  key={listing.id} 
                  listing={listing}
                  actionElement={
                    <button 
                      onClick={() => handleReceived(listing.id)}
                      className="w-full bg-[#43A047] text-white hover:opacity-90 transition-colors duration-200 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
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
