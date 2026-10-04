'use client';

import React, { useEffect } from 'react';
import { ReduxProvider } from './ReduxProvider';
import { HeroUIProviderWrapper } from './HeroUIProviderWrapper';
import { ThemeProvider } from './ThemeProvider';
import { ToastContainer } from '../common/ToastContainer';
import { useAppDispatch } from '@/stores/hooks';
import { fetchProfile } from '@/stores/auth/authSlice';

function AuthInitializer() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    void dispatch(fetchProfile());
  }, [dispatch]);
  return null;
}

export function ClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <AuthInitializer />
      <HeroUIProviderWrapper>
        <ThemeProvider>
          {children}
          <ToastContainer />
        </ThemeProvider>
      </HeroUIProviderWrapper>
    </ReduxProvider>
  );
}
