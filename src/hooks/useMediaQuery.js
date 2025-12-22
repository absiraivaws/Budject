import { useState, useEffect } from 'react';
import { BREAKPOINTS } from '../config/constants.js';

/**
 * Custom hook for responsive breakpoint detection
 * @param {number} breakpoint - Breakpoint in pixels
 * @returns {boolean} True if screen width is above breakpoint
 */
export function useMediaQuery(query) {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);

        if (media.matches !== matches) {
            setMatches(media.matches);
        }

        const listener = () => setMatches(media.matches);
        media.addEventListener('change', listener);

        return () => media.removeEventListener('change', listener);
    }, [matches, query]);

    return matches;
}

/**
 * Get current device type
 * @returns {string} 'mobile', 'tablet', or 'desktop'
 */
export function useDeviceType() {
    const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.desktop}px)`);
    const isTablet = useMediaQuery(`(min-width: ${BREAKPOINTS.mobile}px)`);

    if (isDesktop) return 'desktop';
    if (isTablet) return 'tablet';
    return 'mobile';
}
