import { create } from 'zustand';

export interface CheckInEntry {
  id?: string;
  created_at: string;
  mood: string;
  energy_level: number;
  meaningfulness: number;
  stress_triggers?: string[];
  recovery_activities?: string[];
  burnout_score: number;
}

interface CheckInStore {
  entries: CheckInEntry[];
  setEntries: (data: CheckInEntry[]) => void;
  addEntry: (entry: CheckInEntry) => void;
  clearEntries: () => void;
}

export const useCheckInStore = create<CheckInStore>((set) => ({
  entries: [],
  setEntries: (data: CheckInEntry[]) => set({ entries: data }),
  addEntry: (entry: CheckInEntry) =>
    set((state: CheckInStore) => ({ entries: [...state.entries, entry] })),
  clearEntries: () => set({ entries: [] }),
}));
