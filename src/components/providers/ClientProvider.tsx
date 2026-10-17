'use client';

import React, { Suspense, useEffect, useRef } from 'react';
import { ReduxProvider } from './ReduxProvider';
import { HeroUIProviderWrapper } from './HeroUIProviderWrapper';
import { ThemeProvider } from './ThemeProvider';
import { ToastContainer } from '../common/ToastContainer';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { fetchProfile } from '@/stores/auth/authSlice';
import { hydrateCart, loadCartFromStorage } from '@/stores/cart/cartSlice';
import { consultationChatApi } from '@/common/api/consultation-chat';
import { CONSULTATION_SESSION_STORAGE_KEY } from '@/common/socket/consultation-chat';
import { AnalyticsTracker } from './AnalyticsTracker';

function AuthInitializer() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    void dispatch(fetchProfile());
  }, [dispatch]);
  return null;
}

function CartInitializer() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(hydrateCart(loadCartFromStorage()));
  }, [dispatch]);
  return null;
}

function ConsultationSessionLinker() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const userId = useAppSelector((state) => state.auth.user?._id);
  const claimedSessionsRef = useRef(new Set<string>());
  const inFlightSessionsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    let sessionToken = '';
    try {
      sessionToken = window.localStorage.getItem(CONSULTATION_SESSION_STORAGE_KEY) || '';
    } catch {
      return;
    }
    if (!/^[A-Za-z0-9_-]{40,100}$/.test(sessionToken)) return;

    const claimKey = `${userId}:${sessionToken}`;
    if (claimedSessionsRef.current.has(claimKey) || inFlightSessionsRef.current.has(claimKey)) return;
    inFlightSessionsRef.current.add(claimKey);

    void consultationChatApi.claimGuestConversations(sessionToken)
      .then(() => claimedSessionsRef.current.add(claimKey))
      .catch((error) => console.warn('Guest consultation history could not be linked to this account.', error))
      .finally(() => inFlightSessionsRef.current.delete(claimKey));
  }, [isAuthenticated, userId]);

  return null;
}

export function ClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <AuthInitializer />
      <CartInitializer />
      <ConsultationSessionLinker />
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
      <HeroUIProviderWrapper>
        <ThemeProvider>
          {children}
          <ToastContainer />
        </ThemeProvider>
      </HeroUIProviderWrapper>
    </ReduxProvider>
  );
}
