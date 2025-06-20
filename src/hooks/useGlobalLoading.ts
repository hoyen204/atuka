import { create } from 'zustand';

interface GlobalLoadingState {
  isLoading: boolean;
  loadingText: string;
  setLoading: (isLoading: boolean, text?: string) => void;
  showLoading: (text?: string) => void;
  hideLoading: () => void;
}

export const useGlobalLoading = create<GlobalLoadingState>((set: (partial: Partial<GlobalLoadingState>) => void) => ({
  isLoading: false,
  loadingText: 'Đang tải...',
  setLoading: (isLoading: boolean, text?: string) =>
    set({ isLoading, loadingText: text || 'Đang tải...' }),
  showLoading: (text?: string) =>
    set({ isLoading: true, loadingText: text || 'Đang tải...' }),
  hideLoading: () => set({ isLoading: false }),
})); 