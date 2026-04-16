export type Role = 'donor' | 'volunteer' | 'receiver' | 'ngo';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: Role;
}

export type ListingStatus = 'available' | 'active' | 'pending_receiver' | 'in_delivery' | 'completed';

export interface Listing {
  id: string;
  donorId: string;
  foodType: string;
  quantity: string;
  servings: number;
  freshnessHours: number;
  pickupLocation: string;
  description?: string;
  status: ListingStatus;
  createdAt: string;
  
  // High impact badge is shown if servings >= 20
  // Interactions:
  claimedByVolunteerId?: string; // Volunteer who claimed it
  claimedAt?: string;
  acceptedByReceiverId?: string; // Receiver who accepted it
  acceptedAt?: string;
}

// Global context state for auth
export interface AuthState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}
