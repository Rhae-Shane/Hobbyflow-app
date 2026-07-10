import { create } from 'zustand';

type RoadmapUiState = {
  selectedRoadmapId: string | null;
  setSelectedRoadmapId: (id: string | null) => void;
};

/** Ephemeral UI selection for which roadmap the Roadmap tab shows. */
export const useRoadmapUiStore = create<RoadmapUiState>((set) => ({
  selectedRoadmapId: null,
  setSelectedRoadmapId: (selectedRoadmapId) => set({ selectedRoadmapId }),
}));
