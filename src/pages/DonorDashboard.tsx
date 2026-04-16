import { useEffect, useState } from 'react';
import { Plus } from '../components/Icons';
import { Navigation, ListingCard } from '../components/Shared';
import { PostFoodModal } from '../components/PostFoodModal';
import { mockDb } from '../services/mockDb';
import { useAuth } from '../context/AuthContext';
import type { Listing } from '../types';

export default function DonorDashboard() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchListings = () => {
    if (user) {
      const allListings = mockDb.getListings();
      setListings(allListings.filter(l => l.donorId === user.id).reverse());
    }
  };

  useEffect(() => {
    fetchListings();
  }, [user]);

  const activeCount = listings.filter(l => l.status === 'active' || l.status === 'pending_receiver' || l.status === 'in_delivery').length;
  const completedCount = listings.filter(l => l.status === 'completed').length;

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navigation 
        title="Donor Dashboard" 
        rightElement={
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-opacity-90 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center transition-colors"
          >
            <Plus size={16} className="mr-1" />
            <span className="hidden sm:inline">Post Food</span>
          </button>
        }
      />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#1565C0] text-white rounded-[14px] p-6 shadow-md relative overflow-hidden">
            <h3 className="text-blue-100 font-semibold mb-1">Total Listings</h3>
            <div className="text-4xl font-bold mb-1">{listings.length}</div>
            <p className="text-sm text-blue-200">All time donations</p>
            <div className="absolute -right-4 -bottom-4 opacity-10 text-8xl">📊</div>
          </div>
          
          <div className="bg-[#43A047] text-white rounded-[14px] p-6 shadow-md relative overflow-hidden">
            <h3 className="text-green-100 font-semibold mb-1">Active</h3>
            <div className="text-4xl font-bold mb-1">{activeCount}</div>
            <p className="text-sm text-green-200">Available or in transit</p>
            <div className="absolute -right-4 -bottom-4 opacity-10 text-8xl">🔥</div>
          </div>
          
          <div className="bg-[#7B1FA2] text-white rounded-[14px] p-6 shadow-md relative overflow-hidden">
            <h3 className="text-purple-100 font-semibold mb-1">Completed</h3>
            <div className="text-4xl font-bold mb-1">{completedCount}</div>
            <p className="text-sm text-purple-200">Successful donations</p>
            <div className="absolute -right-4 -bottom-4 opacity-10 text-8xl">✨</div>
          </div>
        </div>

        {/* Listings Section */}
        <h2 className="text-[18px] font-bold text-gray-900 mb-6 flex items-center">
          ↗ Your Listings
        </h2>

        {listings.length === 0 ? (
          <div className="bg-white rounded-[14px] p-12 text-center border overflow-hidden border-dashed border-gray-300">
            <div className="text-gray-400 mb-3 text-5xl">🍽️</div>
            <h3 className="text-lg font-bold text-gray-700 mb-1">No listings yet</h3>
            <p className="text-gray-500 text-sm mb-4">You haven't posted any surplus food yet.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-primary font-semibold text-sm hover:underline"
            >
              Post your first listing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </div>
  );
}

