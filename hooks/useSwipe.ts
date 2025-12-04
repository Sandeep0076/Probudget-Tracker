import { TouchEvent, MouseEvent, useRef } from 'react';

interface SwipeInput {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    threshold?: number;
}

interface SwipeOutput {
    onTouchStart: (e: TouchEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchEnd: () => void;
    onMouseDown: (e: MouseEvent) => void;
    onMouseMove: (e: MouseEvent) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
}

export const useSwipe = ({ onSwipeLeft, onSwipeRight, threshold = 50 }: SwipeInput): SwipeOutput => {
    const touchStart = useRef<number | null>(null);
    const touchEnd = useRef<number | null>(null);

    // Touch Handlers
    const onTouchStart = (e: TouchEvent) => {
        touchEnd.current = null;
        touchStart.current = e.targetTouches[0].clientX;
    };

    const onTouchMove = (e: TouchEvent) => {
        touchEnd.current = e.targetTouches[0].clientX;
    };

    const onTouchEnd = () => {
        if (touchStart.current === null || touchEnd.current === null) return;

        const distance = touchStart.current - touchEnd.current;
        const isLeftSwipe = distance > threshold;
        const isRightSwipe = distance < -threshold;

        if (isLeftSwipe && onSwipeLeft) {
            onSwipeLeft();
        }

        if (isRightSwipe && onSwipeRight) {
            onSwipeRight();
        }

        // Reset after processing
        touchStart.current = null;
        touchEnd.current = null;
    };

    // Mouse Handlers
    const handleMouseMove = useRef<((e: globalThis.MouseEvent) => void) | null>(null);
    const handleMouseUp = useRef<(() => void) | null>(null);

    const onMouseDown = (e: MouseEvent) => {
        touchEnd.current = null;
        touchStart.current = e.clientX;

        const onMove = (moveEvent: globalThis.MouseEvent) => {
            if (touchStart.current !== null) {
                touchEnd.current = moveEvent.clientX;
            }
        };

        const onUp = () => {
            onTouchEnd();
            cleanupMouseListeners();
        };

        handleMouseMove.current = onMove;
        handleMouseUp.current = onUp;

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const cleanupMouseListeners = () => {
        if (handleMouseMove.current) {
            window.removeEventListener('mousemove', handleMouseMove.current);
            handleMouseMove.current = null;
        }
        if (handleMouseUp.current) {
            window.removeEventListener('mouseup', handleMouseUp.current);
            handleMouseUp.current = null;
        }
    };

    // We don't need onMouseMove, onMouseUp, onMouseLeave on the element anymore
    // but we keep onMouseDown

    return {
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        onMouseDown,
        // Return empty handlers for others to satisfy interface if needed, or remove from interface
        onMouseMove: () => { },
        onMouseUp: () => { },
        onMouseLeave: () => { }
    };
};
