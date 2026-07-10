import { create } from 'zustand';

interface UIState {
  mobileSidebarOpen: boolean;
  mobileBlogSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  openBlogSidebar: () => void;
  closeBlogSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  mobileSidebarOpen: false,
  mobileBlogSidebarOpen: false,
  openSidebar:      () => set({ mobileSidebarOpen: true }),
  closeSidebar:     () => set({ mobileSidebarOpen: false }),
  openBlogSidebar:  () => set({ mobileBlogSidebarOpen: true }),
  closeBlogSidebar: () => set({ mobileBlogSidebarOpen: false }),
}));
