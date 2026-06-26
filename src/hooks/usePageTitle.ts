/*
 * @Author: Lei Zhang daisy_zlei@163.com
 * @Date: 2026-06-05 18:02:10
 * @LastEditors: Lei Zhang daisy_zlei@163.com
 * @LastEditTime: 2026-06-05 18:02:52
 * @FilePath: /git-arkkvm-app-frontend/src/hooks/usePageTitle.ts
 * @Description:
 */
import { useEffect } from 'react';

/**
 * Hook to update document title with optional hostname suffix.
 * Updates title dynamically when hostname changes.
 */
export function usePageTitle(hostname: unknown) {
  useEffect(() => {
    const baseTitle = 'ArkKVM';
    const host = typeof hostname === 'string' ? hostname.trim() : '';
    if (host) {
      document.title = `${host} - ${baseTitle} `;
    } else {
      document.title = baseTitle;
    }

    // Cleanup: restore original title on unmount
    return () => {
      document.title = baseTitle;
    };
  }, [hostname]);
}
