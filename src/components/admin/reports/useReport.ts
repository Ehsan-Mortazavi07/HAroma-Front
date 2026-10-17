'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiErrorMessage } from '@/common/utils';

/** Loads a report and reloads whenever `deps` change; stale responses are dropped. */
export function useReport<T>(loader: () => Promise<T>, deps: unknown[], isPersian: boolean) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    const request = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await loader();
      if (request === requestRef.current) setData(result);
    } catch (err) {
      if (request === requestRef.current) setError(getApiErrorMessage(err, isPersian));
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}
