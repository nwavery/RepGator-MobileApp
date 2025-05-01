import { create } from 'zustand';
import { fetchProtectedData } from '../services/apiClient';

// Define the shape of a Representative object based on expected API response
// TODO: Update this type based on the actual API response structure
export type Representative = {
  id: string;
  name: string;
  district: string; // Example field
  party: string; // Example field
  imageUrl?: string; // Optional image URL
  // Add other relevant fields
};

type RepsState = {
  representatives: Representative[];
  status: 'idle' | 'loading' | 'error' | 'success';
  error: string | null;
  fetchRepresentatives: () => Promise<void>;
};

export const useRepsStore = create<RepsState>((set, get) => ({
  representatives: [],
  status: 'idle',
  error: null,

  fetchRepresentatives: async () => {
    if (get().status === 'loading') return; // Prevent multiple simultaneous fetches

    set({ status: 'loading', error: null });
    try {
      // TODO: Verify the actual API endpoint for fetching representatives
      const endpoint = 'representatives'; // Placeholder endpoint
      const fetchedReps = await fetchProtectedData<Representative[]>(endpoint);

      set({ representatives: fetchedReps, status: 'success' });
    } catch (apiError: any) {
      console.error('Failed to fetch representatives:', apiError);
      const errorMessage = apiError.message || 'Failed to load representatives.';
      set({ status: 'error', error: errorMessage, representatives: [] });
    }
  },
})); 