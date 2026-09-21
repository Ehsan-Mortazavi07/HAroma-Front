'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface UseDraggableScrollOptions {
  isRTL?: boolean;
  friction?: number;
}

export function useDraggableScroll({
  isRTL = true,
  friction = 0.88,
}: UseDraggableScrollOptions = {}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const prevCanPrev = useRef(false);
  const prevCanNext = useRef(true);

  const isPointerDown = useRef(false);
  const startX = useRef(0);
  const initialScrollLeft = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const velocityX = useRef(0);
  const hasMoved = useRef(false);
  const hasDraggedRef = useRef(false);
  const momentumRaf = useRef<number | null>(null);

  // Update button enabled states ONLY when state actually flips (0 re-renders during dragging)
  const updateButtonsState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 4) {
      if (prevCanPrev.current) {
        prevCanPrev.current = false;
        setCanScrollPrev(false);
      }
      if (prevCanNext.current) {
        prevCanNext.current = false;
        setCanScrollNext(false);
      }
      return;
    }

    const current = Math.abs(el.scrollLeft);
    const nextCanPrev = current > 12;
    const nextCanNext = current < maxScroll - 12;

    if (nextCanPrev !== prevCanPrev.current) {
      prevCanPrev.current = nextCanPrev;
      setCanScrollPrev(nextCanPrev);
    }
    if (nextCanNext !== prevCanNext.current) {
      prevCanNext.current = nextCanNext;
      setCanScrollNext(nextCanNext);
    }
  }, []);

  // Setup passive listeners
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateButtonsState();

    let scrollTimeout: NodeJS.Timeout | null = null;
    const onScroll = () => {
      // Throttle button state updates to avoid unnecessary checks
      if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
          updateButtonsState();
          scrollTimeout = null;
        }, 80);
      }
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateButtonsState);

    // Capture-phase click interceptor to stop unwanted navigation on drag
    const handleClickCapture = (e: MouseEvent) => {
      if (hasDraggedRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener('click', handleClickCapture, { capture: true });

    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateButtonsState);
      el.removeEventListener('click', handleClickCapture, { capture: true });
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (momentumRaf.current) cancelAnimationFrame(momentumRaf.current);
    };
  }, [updateButtonsState]);

  // Programmatic scroll step for Prev/Next buttons
  const handleScroll = useCallback(
    (direction: 'next' | 'prev', cardWidth = 320) => {
      const el = scrollRef.current;
      if (!el) return;

      if (momentumRaf.current) {
        cancelAnimationFrame(momentumRaf.current);
        momentumRaf.current = null;
      }

      const distance = Math.min(cardWidth * 2, el.clientWidth * 0.85);
      const factor = isRTL ? (direction === 'next' ? -1 : 1) : (direction === 'next' ? 1 : -1);
      el.scrollBy({ left: factor * distance, behavior: 'smooth' });
    },
    [isRTL]
  );

  // Drag Pointer Handlers
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const el = scrollRef.current;
    if (!el) return;

    if (momentumRaf.current) {
      cancelAnimationFrame(momentumRaf.current);
      momentumRaf.current = null;
    }

    isPointerDown.current = true;
    hasMoved.current = false;
    startX.current = e.clientX;
    initialScrollLeft.current = el.scrollLeft;
    lastX.current = e.clientX;
    lastTime.current = performance.now();
    velocityX.current = 0;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDown.current) return;
    const el = scrollRef.current;
    if (!el) return;

    const deltaX = e.clientX - startX.current;

    if (!hasMoved.current && Math.abs(deltaX) > 6) {
      hasMoved.current = true;
      try {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
      el.style.scrollSnapType = 'none';
    }

    if (hasMoved.current) {
      // 1:1 Instant DOM displacement - 0 React re-renders, 120fps smooth
      el.scrollLeft = initialScrollLeft.current - deltaX;

      const now = performance.now();
      const dt = now - lastTime.current;
      if (dt > 10) {
        velocityX.current = (e.clientX - lastX.current) / dt;
        lastX.current = e.clientX;
        lastTime.current = now;
      }
    }
  }, []);

  const finishDrag = useCallback(
    (e?: React.PointerEvent<HTMLDivElement>) => {
      if (!isPointerDown.current) return;
      isPointerDown.current = false;

      if (e?.pointerId) {
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
        } catch {
          // ignore
        }
      }

      const el = scrollRef.current;

      if (hasMoved.current) {
        hasDraggedRef.current = true;
        setTimeout(() => {
          hasDraggedRef.current = false;
        }, 50);

        // Momentum inertia glide on release
        let momentumVelocity = velocityX.current * 14;
        if (momentumVelocity > 24) momentumVelocity = 24;
        if (momentumVelocity < -24) momentumVelocity = -24;

        const frictionVal = friction || 0.88;
        const step = () => {
          if (Math.abs(momentumVelocity) > 0.5 && scrollRef.current) {
            scrollRef.current.scrollLeft -= momentumVelocity;
            momentumVelocity *= frictionVal;
            momentumRaf.current = requestAnimationFrame(step);
          } else {
            if (scrollRef.current) {
              scrollRef.current.style.scrollSnapType = '';
            }
            updateButtonsState();
          }
        };

        if (Math.abs(momentumVelocity) > 0.8) {
          momentumRaf.current = requestAnimationFrame(step);
        } else {
          if (el) {
            el.style.scrollSnapType = '';
          }
          updateButtonsState();
        }
        hasMoved.current = false;
      }
    },
    [friction, updateButtonsState]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      finishDrag(e);
    },
    [finishDrag]
  );

  const onPointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      finishDrag(e);
    },
    [finishDrag]
  );

  const onDragStart = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  return {
    scrollRef,
    canScrollPrev,
    canScrollNext,
    handleScroll,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onDragStart,
    },
  };
}
