import { useState, useEffect, useCallback, useMemo } from 'react';
import { GameLayoutSize } from '@/types';
import { getGameById } from '@/data/games';

export type LayoutMode = 'none' | 'float' | 'split' | 'dominant';

export interface LayoutState {
    /** Current layout mode based on game size + viewport */
    layoutMode: LayoutMode;
    /** The active game's layout size classification */
    gameSize: GameLayoutSize | null;
    /** Whether the viewport is considered mobile (<768px) */
    isMobile: boolean;
    /** Whether the viewport is considered tablet (768-1023px) */
    isTablet: boolean;
    /** Current viewport dimensions */
    viewport: { width: number; height: number };
    /** CSS grid template for the main layout */
    gridTemplate: string;
    /** Whether video should render in compact/PiP mode */
    videoCompact: boolean;
}

interface UseLayoutEngineOptions {
    activeGameId: string | null;
    showChat: boolean;
    showGames: boolean;
}

/**
 * Smart layout engine that determines how game and video containers
 * should be arranged based on game size classification and viewport.
 */
export function useLayoutEngine({ activeGameId, showChat, showGames }: UseLayoutEngineOptions): LayoutState {
    const [viewport, setViewport] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1280,
        height: typeof window !== 'undefined' ? window.innerHeight : 720,
    });

    // Debounced viewport resize handler
    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;

        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setViewport({ width: window.innerWidth, height: window.innerHeight });
            }, 150);
        };

        window.addEventListener('resize', handleResize);
        // Also handle orientation changes on mobile
        window.addEventListener('orientationchange', () => {
            // Orientation change needs a longer delay for the viewport to settle
            setTimeout(handleResize, 300);
        });

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    // Get game size classification
    const gameSize = useMemo<GameLayoutSize | null>(() => {
        if (!activeGameId) return null;
        const game = getGameById(activeGameId);
        return game?.layoutSize ?? null;
    }, [activeGameId]);

    // Viewport breakpoints
    const isMobile = viewport.width < 768;
    const isTablet = viewport.width >= 768 && viewport.width < 1024;

    // Determine layout mode
    const layoutMode = useMemo<LayoutMode>(() => {
        if (!activeGameId || !gameSize) return 'none';

        // Mobile: always use appropriate mode but may force certain behaviors
        if (isMobile) {
            // On mobile, small games still float; medium/large games stack vertically
            if (gameSize === 'small') return 'float';
            return 'dominant'; // Stack vertically with video minimized
        }

        // Tablet
        if (isTablet) {
            if (gameSize === 'small') return 'float';
            if (gameSize === 'medium') return 'split';
            return 'dominant';
        }

        // Desktop
        switch (gameSize) {
            case 'small': return 'float';
            case 'medium': return 'split';
            case 'large': return 'dominant';
            default: return 'float';
        }
    }, [activeGameId, gameSize, isMobile, isTablet]);

    // Determine CSS grid template
    const gridTemplate = useMemo<string>(() => {
        // Base: video area + optional sidebars
        if (layoutMode === 'none' || layoutMode === 'float') {
            // No game panel in the grid — game floats on top
            if (showGames) return 'lg:grid-cols-[1fr_20rem]';
            if (showChat) return 'lg:grid-cols-[1fr_20rem]';
            return 'lg:grid-cols-[1fr]';
        }

        if (layoutMode === 'split') {
            // Video left, game right
            if (showChat) return 'lg:grid-cols-[1fr_minmax(320px,40%)_20rem]';
            return 'lg:grid-cols-[1fr_minmax(320px,40%)]';
        }

        if (layoutMode === 'dominant') {
            // Game takes primary space, video shrinks to PiP (not in grid)
            if (showChat) return 'lg:grid-cols-[1fr_20rem]';
            return 'lg:grid-cols-[1fr]';
        }

        return 'lg:grid-cols-[1fr]';
    }, [layoutMode, showChat, showGames]);

    // Whether video should be in compact/PiP mode
    const videoCompact = layoutMode === 'dominant';

    return {
        layoutMode,
        gameSize,
        isMobile,
        isTablet,
        viewport,
        gridTemplate,
        videoCompact,
    };
}
