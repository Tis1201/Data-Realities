import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { SIDEBAR_KEYBOARD_SHORTCUT } from './constants';

// Types
export type SidebarState = 'expanded' | 'collapsed';
export type SidebarSide = 'left' | 'right';
export type SidebarVariant = 'sidebar' | 'floating' | 'inset';
export type SidebarCollapsible = 'offcanvas' | 'icon' | 'none';

// Initial state from localStorage if available
const getInitialState = (): SidebarState => {
  if (browser) {
    const savedState = localStorage.getItem('sidebar-state');
    if (savedState === 'expanded' || savedState === 'collapsed') {
      return savedState;
    }
  }
  return 'expanded';
};

// Create the store
const createSidebarStore = () => {
  // Core state
  const state = writable<SidebarState>(getInitialState());
  const openMobile = writable<boolean>(false);
  const isMobile = writable<boolean>(false);

  // Update localStorage when state changes
  if (browser) {
    state.subscribe((value) => {
      localStorage.setItem('sidebar-state', value);
    });
  }

  // Derived state
  const open = derived(
    [state, isMobile],
    ([$state, $isMobile]) => $isMobile ? false : $state === 'expanded'
  );

  // Initialize mobile detection
  if (browser) {
    const mediaQuery = window.matchMedia('(max-width: 1024px)');
    
    // Set initial value
    isMobile.set(mediaQuery.matches);
    
    // Update when media query changes
    const handleChange = (e: MediaQueryListEvent) => {
      isMobile.set(e.matches);
      if (e.matches) {
        openMobile.set(false);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
  }

  // Initialize keyboard shortcut
  if (browser) {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === SIDEBAR_KEYBOARD_SHORTCUT) {
        e.preventDefault();
        toggle();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
  }

  // Actions
  const toggle = () => {
    isMobile.update(($isMobile) => {
      if ($isMobile) {
        openMobile.update((value) => !value);
      } else {
        state.update((value) => value === 'expanded' ? 'collapsed' : 'expanded');
      }
      return $isMobile;
    });
  };

  const setOpen = (value: boolean) => {
    state.set(value ? 'expanded' : 'collapsed');
  };

  const setOpenMobile = (value: boolean) => {
    openMobile.set(value);
  };

  return {
    state,
    open,
    openMobile,
    isMobile,
    toggle,
    setOpen,
    setOpenMobile
  };
};

// Export a singleton instance
export const sidebarStore = createSidebarStore();
