import { useState } from 'react';
import { X } from '../components/Icons';
import { mockDb } from '../services/mockDb';
import { useAuth } from '../context/AuthContext';

interface PostFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PostFoodModal = ({ isOpen, onClose, onSuccess }: PostFoodModalProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    foodType: '',
    quantity: '',
    servings: '',
    freshnessHours: '',
    pickupLocation: user?.address || '',
    description: ''
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      await mockDb.createListing({
        donorId: user.id,
        foodType: formData.foodType,
        quantity: formData.quantity,
        servings: parseInt(formData.servings, 10),
        freshnessHours: parseInt(formData.freshnessHours, 10),
        pickupLocation: formData.pickupLocation,
        description: formData.description
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[14px] shadow-xl w-full max-w-[500px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-[22px] font-bold text-primary">Post Surplus Food</h2>
            <p className="text-[#9E9E9E] text-[13px] mt-1">Share details about the food you want to donate</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Food Type</label>
              <input required name="foodType" onChange={handleChange} className="input-field" placeholder="e.g., Rice & Curry" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity</label>
              <input required name="quantity" onChange={handleChange} className="input-field" placeholder="e.g., 2 large trays" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Estimated Servings</label>
              <input required type="number" min="1" name="servings" onChange={handleChange} className="input-field" placeholder="10" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Freshness (hours)</label>
              <input required type="number" min="1" name="freshnessHours" onChange={handleChange} className="input-field" placeholder="4" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Pickup Location</label>
            <input required name="pickupLocation" value={formData.pickupLocation} onChange={handleChange} className="input-field" placeholder="Full address" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description (Optional)</label>
            <textarea 
              name="description" 
              onChange={handleChange} 
              className="input-field min-h-[80px] resize-none" 
              placeholder="Any specific instructions for pickup?" 
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2">
            ✨ {isSubmitting ? 'Creating...' : 'Create Listing'}
          </button>
        </form>
      </div>
    </div>
  );
};

