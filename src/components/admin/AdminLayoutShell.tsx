'use client';

import React, { useEffect, useRef } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminGuardClient } from './AdminGuardClient';
import { useAdminSidebar } from './AdminSidebarContext';
import { useTranslation } from '@/common/i18n';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const adminPanelRef = useRef<HTMLDivElement>(null);
  const { isPersian, isRTL } = useTranslation();
  const pathname = usePathname();
  const { isCollapsed } = useAdminSidebar();

  useEffect(() => {
    document.title = isPersian
      ? 'پنل مدیریت هاتف آروما | HatefAroma'
      : 'Admin Dashboard | HatefAroma';
  }, [isPersian]);

  useEffect(() => {
    const root = adminPanelRef.current;
    if (!root) return;

    let drag: {
      element: HTMLElement;
      pointerId: number;
      startX: number;
      startScrollLeft: number;
      direction: 'ltr' | 'rtl';
      didMove: boolean;
    } | null = null;
    let suppressClickUntil = 0;

    const findScrollable = (target: HTMLElement) => {
      let element: HTMLElement | null = target;
      while (element && element !== root) {
        const style = window.getComputedStyle(element);
        if (
          /(auto|scroll)/.test(style.overflowX) &&
          element.scrollWidth > element.clientWidth + 1
        ) {
          return element;
        }
        element = element.parentElement;
      }
      return null;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (!target || target.closest('button, a, input, textarea, select, [role="button"], [contenteditable="true"]')) return;

      const element = findScrollable(target);
      if (!element) return;

      element.dataset.adminScrollDrag = 'true';
      drag = {
        element,
        pointerId: event.pointerId,
        startX: event.clientX,
        startScrollLeft: element.scrollLeft,
        direction: window.getComputedStyle(element).direction === 'rtl' ? 'rtl' : 'ltr',
        didMove: false,
      };
      try {
        element.setPointerCapture(event.pointerId);
      } catch {
        // The scroll container can be detached between hit testing and capture.
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const deltaX = event.clientX - drag.startX;
      if (Math.abs(deltaX) > 4) {
        drag.didMove = true;
        drag.element.classList.add('admin-scroll-dragging');
      }
      if (drag.didMove) {
        drag.element.scrollLeft = drag.direction === 'rtl'
          ? drag.startScrollLeft + deltaX
          : drag.startScrollLeft - deltaX;
        event.preventDefault();
      }
    };

    const finishDrag = (event: PointerEvent) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      if (drag.didMove) suppressClickUntil = Date.now() + 120;
      drag.element.classList.remove('admin-scroll-dragging');
      delete drag.element.dataset.adminScrollDrag;
      drag = null;
    };

    const suppressDraggedClick = (event: MouseEvent) => {
      if (Date.now() > suppressClickUntil) return;
      suppressClickUntil = 0;
      event.preventDefault();
      event.stopPropagation();
    };

    root.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('pointermove', onPointerMove, { passive: false });
    root.addEventListener('pointerup', finishDrag);
    root.addEventListener('pointercancel', finishDrag);
    root.addEventListener('click', suppressDraggedClick, true);

    return () => {
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerup', finishDrag);
      root.removeEventListener('pointercancel', finishDrag);
      root.removeEventListener('click', suppressDraggedClick, true);
      if (drag) {
        drag.element.classList.remove('admin-scroll-dragging');
        delete drag.element.dataset.adminScrollDrag;
      }
    };
  }, []);

  return (
    <AdminGuardClient>
      <div
        ref={adminPanelRef}
        data-admin-panel
        className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 pb-12 transition-colors"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
          {/* Admin Sidebar with smooth width transition */}
          <aside
            className={`shrink-0 w-full transition-[width] duration-300 ease-in-out ${
              isCollapsed ? 'lg:w-[76px]' : 'lg:w-72 xl:w-80'
            }`}
          >
            <AdminSidebar />
          </aside>

          {/* Admin Main Content Area */}
          <div className="flex-1 min-w-0 w-full">
            <motion.main
              key={pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-full"
            >
              {children}
            </motion.main>
          </div>
        </div>
      </div>
    </AdminGuardClient>
  );
}
