'use client';

import { useEffect } from 'react';

export const ADMIN_SEARCH_EVENT = 'admin-search-navigate';

/**
 * Pre-fills a list page's search box from `?q=` (set by the global admin search),
 * both on first load and when the palette navigates to the page you are already on.
 */
export function useAdminSearchParam(setSearch: (value: string) => void) {
  useEffect(() => {
    const apply = () => {
      const q = new URLSearchParams(window.location.search).get('q');
      if (q) setSearch(q);
    };
    apply();
    window.addEventListener(ADMIN_SEARCH_EVENT, apply);
    return () => window.removeEventListener(ADMIN_SEARCH_EVENT, apply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
