'use client';

import { useState, useEffect } from 'react';

// Breakpoints theo Tailwind CSS convention
const BREAKPOINTS = {
  xs: 0,      // Extra small devices
  sm: 640,    // Small devices (phones)
  md: 768,    // Medium devices (tablets)
  lg: 1024,   // Large devices (desktops)
  xl: 1280,   // Extra large devices
  '2xl': 1536 // 2X Extra large devices
} as const;

type BreakpointKey = keyof typeof BREAKPOINTS;

interface ScreenInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  currentBreakpoint: BreakpointKey;
  isAtLeast: (breakpoint: BreakpointKey) => boolean;
  isAtMost: (breakpoint: BreakpointKey) => boolean;
  isBetween: (min: BreakpointKey, max: BreakpointKey) => boolean;
}

// Debounce function để optimize performance
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Utility function để get current breakpoint
function getCurrentBreakpoint(width: number): BreakpointKey {
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

export function useResponsive(): ScreenInfo {
  const [screenInfo, setScreenInfo] = useState<ScreenInfo>(() => {
    // SSR-safe initial state
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLargeDesktop: false,
        currentBreakpoint: 'lg' as BreakpointKey,
        isAtLeast: () => false,
        isAtMost: () => false,
        isBetween: () => false,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const currentBreakpoint = getCurrentBreakpoint(width);

    return {
      width,
      height,
      isMobile: width < BREAKPOINTS.md,
      isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
      isDesktop: width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl,
      isLargeDesktop: width >= BREAKPOINTS.xl,
      currentBreakpoint,
      isAtLeast: (breakpoint: BreakpointKey) => width >= BREAKPOINTS[breakpoint],
      isAtMost: (breakpoint: BreakpointKey) => width <= BREAKPOINTS[breakpoint],
      isBetween: (min: BreakpointKey, max: BreakpointKey) => 
        width >= BREAKPOINTS[min] && width <= BREAKPOINTS[max],
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateScreenInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const currentBreakpoint = getCurrentBreakpoint(width);

      setScreenInfo({
        width,
        height,
        isMobile: width < BREAKPOINTS.md,
        isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
        isDesktop: width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl,
        isLargeDesktop: width >= BREAKPOINTS.xl,
        currentBreakpoint,
        isAtLeast: (breakpoint: BreakpointKey) => width >= BREAKPOINTS[breakpoint],
        isAtMost: (breakpoint: BreakpointKey) => width <= BREAKPOINTS[breakpoint],
        isBetween: (min: BreakpointKey, max: BreakpointKey) => 
          width >= BREAKPOINTS[min] && width <= BREAKPOINTS[max],
      });
    };

    // Debounced resize handler để tránh quá nhiều re-renders
    const debouncedUpdateScreenInfo = debounce(updateScreenInfo, 150);

    // Initial call
    updateScreenInfo();

    // Add event listener
    window.addEventListener('resize', debouncedUpdateScreenInfo);

    // Cleanup
    return () => {
      window.removeEventListener('resize', debouncedUpdateScreenInfo);
    };
  }, []);

  return screenInfo;
}

// Export breakpoints để sử dụng ở nơi khác
export { BREAKPOINTS };

// Export type để sử dụng trong TypeScript
export type { BreakpointKey, ScreenInfo };

// Utility hook cho specific use cases
export function useIsMobile(): boolean {
  const { isMobile } = useResponsive();
  return isMobile;
}

export function useIsTablet(): boolean {
  const { isTablet } = useResponsive();
  return isTablet;
}

export function useIsDesktop(): boolean {
  const { isDesktop } = useResponsive();
  return isDesktop;
}

// Hook để check nếu screen nhỏ hơn breakpoint nhất định
export function useIsScreenBelow(breakpoint: BreakpointKey): boolean {
  const { width } = useResponsive();
  return width < BREAKPOINTS[breakpoint];
}

// Hook để check nếu screen lớn hơn breakpoint nhất định  
export function useIsScreenAbove(breakpoint: BreakpointKey): boolean {
  const { width } = useResponsive();
  return width >= BREAKPOINTS[breakpoint];
} 