import { createLogger } from '@/utils/logger';
import { useCallback, useEffect, useRef } from 'react';

const logger = createLogger('useLongPressEscape');

interface UseLongPressEscapeOptions {
  onLongPress: () => void
  delay?: number // Long press duration, default 1000ms
  enabled?: boolean // Whether to enable
}

export function useLongPressEscape({
  onLongPress,
  delay = 3000,
  enabled = true,
}: UseLongPressEscapeOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isPressingRef = useRef(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || event.key !== 'Escape') return;

      // Force prevent browser's default ESC exit fullscreen behavior
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (isPressingRef.current) return;

      isPressingRef.current = true;
      logger.debug('ESC keydown - starting long press timer');

      // Start timer
      timerRef.current = setTimeout(() => {
        if (isPressingRef.current) {
          logger.info('Long press ESC 3s, exiting fullscreen');
          onLongPress();
        }
      }, delay);
    },
    [onLongPress, delay, enabled]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || event.key !== 'Escape') return;

      // Force prevent browser's default ESC exit fullscreen behavior
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      logger.debug('ESC keyup - stopping long press timer');
      isPressingRef.current = false;

      // Clear timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    // Use capture phase to intercept before browser's default behavior
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);

      // Cleanup timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [handleKeyDown, handleKeyUp, enabled]);

  // Manual cleanup function
  const cleanup = useCallback(() => {
    isPressingRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { cleanup };
}
