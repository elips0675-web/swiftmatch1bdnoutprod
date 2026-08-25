import { useCallback, useEffect, useState } from 'react';
import { getToken } from '@/lib/token';

const variantCache: Record<string, string> = {};

export function useExperiment(key: string): { variant: string | null; loading: boolean } {
  const [variant, setVariant] = useState<string | null>(variantCache[key] ?? null);
  const [loading, setLoading] = useState(!variantCache[key]);

  useEffect(() => {
    if (variantCache[key]) {
      setVariant(variantCache[key]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const token = getToken();
    fetch(`/api/experiments/${encodeURIComponent(key)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (cancelled || !data) return;
        variantCache[key] = data.variant || 'control';
        setVariant(variantCache[key]);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [key]);

  return { variant, loading };
}

export function useTrackEvent() {
  return useCallback((eventType: string, metadata?: Record<string, unknown>) => {
    const token = getToken();
    if (!token) return;
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ event_type: eventType, metadata: metadata || {} }),
    }).catch(() => {});
  }, []);
}