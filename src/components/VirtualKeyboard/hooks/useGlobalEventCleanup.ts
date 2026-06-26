import { useEffect } from 'react';

/**
 * Custom hook for handling global mouse/touch events
 * Ensures proper cleanup when key is released outside the component
 *
 * @param isPressed - Whether the key is currently pressed
 * @param onRelease - Callback to execute when key should be released
 */
export const useGlobalEventCleanup = (
  isPressed: boolean,
  onRelease: () => void
) => {
  useEffect(() => {
    if (!isPressed) return;

    const handleGlobalMouseUp = () => onRelease();
    const handleGlobalTouchEnd = () => onRelease();

    // Add global listeners to catch release events outside the component
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchend', handleGlobalTouchEnd);
    document.addEventListener('touchcancel', handleGlobalTouchEnd);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
      document.removeEventListener('touchcancel', handleGlobalTouchEnd);
    };
  }, [isPressed, onRelease]);
};
