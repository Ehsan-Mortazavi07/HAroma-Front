'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { PointerEventHandler } from 'react';

/** Updates the decorative glow at most once per frame without rerendering its React tree. */
export function usePointerGlow<T extends HTMLElement>() {
  const surfaceRef = useRef<T | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);

  const onPointerMove: PointerEventHandler<T> = useCallback((event) => {
    if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    surfaceRef.current = event.currentTarget;
    positionRef.current = { x: event.clientX, y: event.clientY };
    if (frameRef.current !== null) return;

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      const surface = surfaceRef.current;
      const glow = glowRef.current;
      if (!surface || !glow) return;

      const bounds = surface.getBoundingClientRect();
      const x = positionRef.current.x - bounds.left;
      const y = positionRef.current.y - bounds.top;
      glow.style.background = `radial-gradient(600px circle at ${x}px ${y}px, rgba(212, 190, 155, 0.17), transparent 70%)`;
    });
  }, []);

  const onPointerEnter: PointerEventHandler<T> = useCallback((event) => {
    if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (glowRef.current) glowRef.current.style.opacity = '0.75';
  }, []);

  const onPointerLeave: PointerEventHandler<T> = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (glowRef.current) glowRef.current.style.opacity = '0';
  }, []);

  useEffect(() => () => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
  }, []);

  return { glowRef, onPointerEnter, onPointerMove, onPointerLeave };
}
