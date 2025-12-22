import { useEffect, useRef, RefObject } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minSwipeDistance?: number; // Minimum distance in pixels to trigger a swipe
  maxSwipeTime?: number; // Maximum time in ms for a swipe gesture
}

/**
 * Custom hook to detect swipe gestures on touch devices
 *
 * Usage:
 * const ref = useSwipeGesture({
 *   onSwipeLeft: () => console.log('Swiped left'),
 *   onSwipeRight: () => console.log('Swiped right')
 * });
 *
 * <div ref={ref}>Content</div>
 */
export const useSwipeGesture = (options: SwipeGestureOptions): RefObject<HTMLDivElement> => {
  const {
    onSwipeLeft,
    onSwipeRight,
    minSwipeDistance = 50,
    maxSwipeTime = 300
  } = options;

  const elementRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      touchStartTime.current = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const touchEndX = touch.clientX;
      const touchEndY = touch.clientY;
      const touchEndTime = Date.now();

      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;
      const deltaTime = touchEndTime - touchStartTime.current;

      // Check if it's a horizontal swipe (more horizontal than vertical)
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);

      // Check if swipe distance and time are within thresholds
      if (
        isHorizontalSwipe &&
        Math.abs(deltaX) >= minSwipeDistance &&
        deltaTime <= maxSwipeTime
      ) {
        if (deltaX > 0 && onSwipeRight) {
          // Swiped right (previous tab)
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          // Swiped left (next tab)
          onSwipeLeft();
        }
      }
    };

    // Use passive: false to allow preventDefault if needed
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, minSwipeDistance, maxSwipeTime]);

  return elementRef;
};
