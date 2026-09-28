'use client';

import React from 'react';
import { ReduxProvider } from './ReduxProvider';
import { HeroUIProviderWrapper } from './HeroUIProviderWrapper';
import { ThemeProvider } from './ThemeProvider';
import { ToastContainer } from '../common/ToastContainer';

export function ClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <HeroUIProviderWrapper>
        <ThemeProvider>
          {children}
          <ToastContainer />
        </ThemeProvider>
      </HeroUIProviderWrapper>
    </ReduxProvider>
  );
}
