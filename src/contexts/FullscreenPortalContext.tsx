import React, { createContext, useContext } from 'react';

const FullscreenPortalContext = createContext<HTMLElement | null>(null);

export function FullscreenPortalProvider({
  container,
  children,
}: {
  container: HTMLElement | null
  children: React.ReactNode
}) {
  return (
    <FullscreenPortalContext.Provider value={container}>
      {children}
    </FullscreenPortalContext.Provider>
  );
}

/** Returns the portal container: the fullscreen element when in fullscreen, otherwise null (defaults to document.body) */
export function useFullscreenPortalContainer(): HTMLElement | null {
  return useContext(FullscreenPortalContext);
}
