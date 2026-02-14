import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GripHorizontal, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingPanelProps {
    children: React.ReactNode;
    /** Initial position */
    defaultPosition?: { x: number; y: number };
    /** Default corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' */
    defaultCorner?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    /** Minimum dimensions */
    minWidth?: number;
    minHeight?: number;
    /** Default dimensions */
    defaultWidth?: number;
    defaultHeight?: number;
    /** Whether the panel can be resized */
    resizable?: boolean;
    /** Whether to show the drag handle */
    showDragHandle?: boolean;
    /** Additional class names */
    className?: string;
    /** Panel title for the header */
    title?: string;
    /** Z-index override */
    zIndex?: number;
    /** Header extra content (buttons, etc.) */
    headerExtra?: React.ReactNode;
    /** Called when panel is closed via minimize */
    onMinimize?: () => void;
}

const SNAP_THRESHOLD = 40;
const EDGE_PADDING = 16;

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
    children,
    defaultCorner = 'bottom-right',
    minWidth = 200,
    minHeight = 200,
    defaultWidth = 360,
    defaultHeight = 400,
    resizable = true,
    showDragHandle = true,
    className,
    title,
    zIndex = 40,
    headerExtra,
    onMinimize,
}) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [dimensions, setDimensions] = useState({ width: defaultWidth, height: defaultHeight });
    const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });
    const [initialized, setInitialized] = useState(false);

    // Calculate initial position based on corner
    useEffect(() => {
        if (initialized) return;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let x = EDGE_PADDING;
        let y = EDGE_PADDING;

        switch (defaultCorner) {
            case 'top-right':
                x = vw - defaultWidth - EDGE_PADDING;
                y = EDGE_PADDING;
                break;
            case 'bottom-left':
                x = EDGE_PADDING;
                y = vh - defaultHeight - EDGE_PADDING - 80; // account for control bar
                break;
            case 'bottom-right':
                x = vw - defaultWidth - EDGE_PADDING;
                y = vh - defaultHeight - EDGE_PADDING - 80;
                break;
            case 'top-left':
            default:
                x = EDGE_PADDING;
                y = EDGE_PADDING;
                break;
        }

        setPosition({ x: Math.max(EDGE_PADDING, x), y: Math.max(EDGE_PADDING, y) });
        setInitialized(true);
    }, [defaultCorner, defaultWidth, defaultHeight, initialized]);

    // Snap to nearest edge
    const snapToEdge = useCallback((pos: { x: number; y: number }) => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let { x, y } = pos;

        // Snap to left
        if (x < SNAP_THRESHOLD) x = EDGE_PADDING;
        // Snap to right
        if (x + dimensions.width > vw - SNAP_THRESHOLD) x = vw - dimensions.width - EDGE_PADDING;
        // Snap to top
        if (y < SNAP_THRESHOLD) y = EDGE_PADDING;
        // Snap to bottom
        if (y + dimensions.height > vh - SNAP_THRESHOLD) y = vh - dimensions.height - EDGE_PADDING;

        return { x, y };
    }, [dimensions]);

    // Clamp position within viewport
    const clampPosition = useCallback((pos: { x: number; y: number }) => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        return {
            x: Math.max(EDGE_PADDING, Math.min(pos.x, vw - 60)), // at least 60px visible
            y: Math.max(EDGE_PADDING, Math.min(pos.y, vh - 40)),
        };
    }, []);

    // --- Drag handlers ---
    const handleDragStart = useCallback((e: React.PointerEvent) => {
        if (isMinimized) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [position, isMinimized]);

    const handleDragMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const newPos = clampPosition({
            x: e.clientX - dragOffset.current.x,
            y: e.clientY - dragOffset.current.y,
        });
        setPosition(newPos);
    }, [isDragging, clampPosition]);

    const handleDragEnd = useCallback((e: React.PointerEvent) => {
        if (!isDragging) return;
        setIsDragging(false);
        setPosition(prev => snapToEdge(prev));
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }, [isDragging, snapToEdge]);

    // --- Resize handlers ---
    const handleResizeStart = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        resizeStart.current = {
            x: e.clientX,
            y: e.clientY,
            width: dimensions.width,
            height: dimensions.height,
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [dimensions]);

    const handleResizeMove = useCallback((e: React.PointerEvent) => {
        if (!isResizing) return;
        e.preventDefault();
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;
        const maxWidth = Math.min(window.innerWidth * 0.8, window.innerWidth - position.x - EDGE_PADDING);
        const maxHeight = Math.min(window.innerHeight * 0.8, window.innerHeight - position.y - EDGE_PADDING);
        setDimensions({
            width: Math.max(minWidth, Math.min(resizeStart.current.width + dx, maxWidth)),
            height: Math.max(minHeight, Math.min(resizeStart.current.height + dy, maxHeight)),
        });
    }, [isResizing, minWidth, minHeight, position]);

    const handleResizeEnd = useCallback((e: React.PointerEvent) => {
        if (!isResizing) return;
        setIsResizing(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }, [isResizing]);

    // Toggle minimize
    const handleToggleMinimize = () => {
        if (isMinimized && onMinimize) {
            onMinimize();
            return;
        }
        setIsMinimized(!isMinimized);
    };

    if (!initialized) return null;

    return (
        <div
            ref={panelRef}
            className={cn(
                'fixed rounded-2xl overflow-hidden shadow-2xl border border-border/50',
                'bg-card/95 backdrop-blur-xl transition-shadow duration-200',
                isDragging && 'shadow-neon-purple cursor-grabbing',
                isMinimized && 'h-auto',
                className
            )}
            style={{
                zIndex,
                transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
                width: isMinimized ? 200 : dimensions.width,
                height: isMinimized ? 'auto' : dimensions.height,
                willChange: isDragging ? 'transform' : 'auto',
                touchAction: 'none',
            }}
        >
            {/* Drag handle / header */}
            {showDragHandle && (
                <div
                    className={cn(
                        'flex items-center justify-between px-3 py-2 border-b border-border/30',
                        'bg-background/50 backdrop-blur-sm select-none',
                        isDragging ? 'cursor-grabbing' : 'cursor-grab'
                    )}
                    onPointerDown={handleDragStart}
                    onPointerMove={handleDragMove}
                    onPointerUp={handleDragEnd}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <GripHorizontal className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        {title && (
                            <span className="text-sm font-medium truncate">{title}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {headerExtra}
                        <button
                            onClick={handleToggleMinimize}
                            className="p-1 rounded hover:bg-muted transition-colors"
                            onPointerDown={e => e.stopPropagation()}
                        >
                            {isMinimized ? (
                                <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
                            ) : (
                                <Minimize2 className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Content */}
            {!isMinimized && (
                <div className="relative w-full h-[calc(100%-40px)] overflow-auto">
                    {children}
                </div>
            )}

            {/* Resize handle */}
            {resizable && !isMinimized && (
                <div
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                    onPointerDown={handleResizeStart}
                    onPointerMove={handleResizeMove}
                    onPointerUp={handleResizeEnd}
                    style={{ touchAction: 'none' }}
                >
                    <svg className="w-4 h-4 text-muted-foreground/50" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="8" cy="12" r="1.5" />
                        <circle cx="12" cy="8" r="1.5" />
                    </svg>
                </div>
            )}
        </div>
    );
};
