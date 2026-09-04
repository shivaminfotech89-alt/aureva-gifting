import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';

export interface SavedAddress {
  id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address: string;
  city: string;
  state?: string;
  pincode: string;
  isDefault?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  adminRole?: string | null;
  phone?: string;
  company?: string;
  photoURL?: string;
  savedAddresses?: SavedAddress[];
  defaultAddressId?: string;
  createdAt?: number;
  updatedAt?: number;
}

interface AuthState {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  setUser: (user: FirebaseUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
}));
