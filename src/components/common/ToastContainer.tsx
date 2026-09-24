'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ type: 'success' | 'error' | 'info'; message: string }>;
      const newToast: ToastItem = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: customEvent.detail.type || 'info',
        message: customEvent.detail.message,
      };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4500);
    };

    window.addEventListener('app-toast', handleToast);
    return () => window.removeEventListener('app-toast', handleToast);
  }, []);

  return (
    <div className="fixed top-5 right-4 sm:right-8 z-[9999] flex flex-col gap-2.5 max-w-sm w-[calc(100%-2rem)] sm:w-96 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -35, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.92 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 28,
            }}
            className={`pointer-events-auto flex items-start justify-between gap-3 px-4 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl transform-gpu text-right select-none ${
              toast.type === 'success'
                ? 'bg-[#122418]/95 border-emerald-500/50 text-emerald-50 shadow-emerald-950/50'
                : toast.type === 'error'
                ? 'bg-[#2b1216]/95 border-rose-500/50 text-rose-50 shadow-rose-950/50'
                : 'bg-[#1b221c]/95 border-brand-gold/50 text-[#f5f1ea] shadow-black/60'
            }`}
          >
            <div className="flex items-start gap-2.5 flex-1 min-w-0">
              <div className="shrink-0 mt-0.5">
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-brand-gold" />}
              </div>
              <p className="text-xs font-bold leading-relaxed break-words flex-1">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 shrink-0 cursor-pointer mt-0.5"
              aria-label="بستن پیام"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
