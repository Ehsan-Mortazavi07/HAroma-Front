'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface UseDraggableScrollOptions {
  isRTL?: boolean;
  speedMultiplier?: number;
  friction?: number;
}

export function useDraggableScroll({
  isRTL = true,
  speedMultiplier = 1,
  friction = 0.93,
}: UseDraggableScrollOptions = {}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const isPointerDown = useRef(false);
  const startX = useRef(0);
  const initialScrollLeft = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const velocityX = useRef(0);
  const hasMoved = useRef(false);
  const hasDraggedRef = useRef(false);
  const momentumRaf = useRef<number | null>(null);

  // Update progress and button enable/disable metrics
  const updateScrollMetrics = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setScrollProgress(100);
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    const current = Math.abs(el.scrollLeft);
    const progress = Math.min(100, Math.max(0, (current / maxScroll) * 100));
    setScrollProgress(progress);
    setCanScrollPrev(current > 8);
    setCanScrollNext(current < maxScroll - 8);
  }, []);

  // Listen for scroll & resize events
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollMetrics();

    const onScroll = () => {
      updateScrollMetrics();
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateScrollMetrics);

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
      window.removeEventListener('resize', updateScrollMetrics);
      el.removeEventListener('click', handleClickCapture, { capture: true });
      if (momentumRaf.current) {
        cancelAnimationFrame(momentumRaf.current);
      }
    };
  }, [updateScrollMetrics]);

  // Programmatic scroll step for Prev/Next buttons
  const handleScroll = useCallback(
    (direction: 'next' | 'prev', strideRatio = 0.7) => {
      const el = scrollRef.current;
      if (!el) return;

      if (momentumRaf.current) {
        cancelAnimationFrame(momentumRaf.current);
        momentumRaf.current = null;
      }

      const distance = Math.max(260, el.clientWidth * strideRatio);
      const factor = isRTL ? (direction === 'next' ? -1 : 1) : (direction === 'next' ? 1 : -1);
      el.scrollBy({ left: factor * distance, behavior: 'smooth' });
    },
    [isRTL]
  );

  // Drag Pointer Handlers
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Only primary mouse button or touch/pen
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

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isPointerDown.current) return;
      const el = scrollRef.current;
      if (!el) return;

      const deltaX = e.clientX - startX.current;

      // Threshold check to avoid interfering with normal clicks
      if (!hasMoved.current && Math.abs(deltaX) > 6) {
        hasMoved.current = true;
        setIsDragging(true);
        try {
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        } catch {
          // ignore if unsupported
        }
        // Temporarily disable smooth scroll & snap so dragging tracks cursor with zero lag
        el.style.scrollSnapType = 'none';
        el.style.scrollBehavior = 'auto';
      }

      if (hasMoved.current) {
        el.scrollLeft = initialScrollLeft.current - deltaX * speedMultiplier;

        // Calculate velocity for inertia momentum
        const now = performance.now();
        const dt = now - lastTime.current;
        if (dt > 8) {
          velocityX.current = (e.clientX - lastX.current) / dt;
          lastX.current = e.clientX;
          lastTime.current = now;
        }
      }
    },
    [speedMultiplier]
  );

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
        // Suppress clicks for 60ms after dragging
        setTimeout(() => {
          hasDraggedRef.current = false;
        }, 60);

        // Momentum inertia glide on release
        let momentumVelocity = velocityX.current * 16;
        if (momentumVelocity > 32) momentumVelocity = 32;
        if (momentumVelocity < -32) momentumVelocity = -32;

        const step = () => {
          if (Math.abs(momentumVelocity) > 0.4 && scrollRef.current) {
            scrollRef.current.scrollLeft -= momentumVelocity;
            momentumVelocity *= friction;
            momentumRaf.current = requestAnimationFrame(step);
          } else {
            setIsDragging(false);
            if (scrollRef.current) {
              scrollRef.current.style.scrollSnapType = '';
              scrollRef.current.style.scrollBehavior = '';
            }
            updateScrollMetrics();
          }
        };

        if (Math.abs(momentumVelocity) > 0.8) {
          momentumRaf.current = requestAnimationFrame(step);
        } else {
          setIsDragging(false);
          if (el) {
            el.style.scrollSnapType = '';
            el.style.scrollBehavior = '';
          }
          updateScrollMetrics();
        }
        hasMoved.current = false;
      } else {
        setIsDragging(false);
      }
    },
    [friction, updateScrollMetrics]
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

  // Prevent default HTML5 ghost image dragging
  const onDragStart = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  return {
    scrollRef,
    isDragging,
    scrollProgress,
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
