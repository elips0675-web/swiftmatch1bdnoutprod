import { useEffect } from 'react';

export function PwaRegistry() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((error) => { if (import.meta.env.DEV) console.error('Service Worker registration failed:', error) });
    }
  }, []);

  return null;
}
