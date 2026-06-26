import { useEffect } from 'react';

interface KeyboardEventsOptions {
  videoRef: React.RefObject<HTMLVideoElement>
  onKeydown?: (event: KeyboardEvent) => void
  onKeyup?: (event: KeyboardEvent) => void
  enabled?: boolean // When false, do not bind listeners
}

export default function useKeyboardEvents(options: KeyboardEventsOptions) {
  const { videoRef, onKeydown, onKeyup, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;
    const video = videoRef.current;
    if (!video) return;
    const isEditing = () => {
      try {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return false;
        const tag = (el.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select')
          return true;
        if (el.isContentEditable) return true;
        // Check if active element or any ancestor has data-kvm-ignore attribute
        let current: HTMLElement | null = el;
        while (current) {
          if (current.getAttribute('data-kvm-ignore') === 'true') {
            return true;
          }
          current = current.parentElement;
        }
        return false;
      } catch {
        return false;
      }
    };

    // Create AbortController instance
    const abortController = new AbortController();
    const signal = abortController.signal;
    video.tabIndex = 0; // Make video element focusable
    if (!isEditing()) {
      try {
        video.focus();
      } catch {}
    }

    // Check if event target is inside data-kvm-ignore area or common UI components
    const isTargetIgnored = (e: Event): boolean => {
      const target = e.target as HTMLElement | null;
      if (!target) return false;
      // Check for data-kvm-ignore attribute
      if (target.closest('[data-kvm-ignore="true"]')) return true;
      // Check for common UI components that should receive keyboard input
      if (target.closest(
        '[role="dialog"], [role="alertdialog"], [data-radix-dialog-overlay], ' +
        '[data-radix-popover-content], [data-radix-dropdown-menu-content], ' +
        '[data-slot="dialog-overlay"], [data-slot="dialog-content"], ' +
        '[data-panel], [data-sidebar], [data-sheet]'
      )) return true;
      return false;
    };

    // Add event listeners, bind to video element
    const keydownHandler = (event: KeyboardEvent) => {
      if (isEditing()) return;
      if (isTargetIgnored(event)) return; // Allow keyboard in settings panel
      try {
        event.preventDefault();
      } catch {}

      if (onKeydown) onKeydown(event);
    };
    const keyupHandler = (event: KeyboardEvent) => {
      if (isEditing()) return;
      if (isTargetIgnored(event)) return; // Allow keyboard in settings panel
      try {
        event.preventDefault();
      } catch {}

      if (onKeyup) onKeyup(event);
    };

    // Listen to keyboard events on document level to capture all keyboard events
    document.addEventListener('keydown', keydownHandler, { signal });
    document.addEventListener('keyup', keyupHandler, { signal });

    // Cleanup event listeners
    return () => {
      abortController.abort(); // Cancel event listeners
      document.removeEventListener('keydown', keydownHandler);
      document.removeEventListener('keyup', keyupHandler);
    };
  }, [videoRef, onKeydown, onKeyup, enabled]);
}
