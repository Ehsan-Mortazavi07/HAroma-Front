'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView } from '@/common/analytics/tracker';

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() || '';

  useEffect(() => {
    if (pathname) trackPageView(pathname, search);
  }, [pathname, search]);

  return null;
}
