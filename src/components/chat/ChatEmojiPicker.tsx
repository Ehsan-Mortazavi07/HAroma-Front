'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@heroui/react';
import { EmojiClickData, EmojiStyle, Theme } from 'emoji-picker-react';
import { createPortal } from 'react-dom';
import { Smile } from 'lucide-react';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface ChatEmojiPickerProps {
  onSelect: (emoji: string) => void;
  isDisabled?: boolean;
}

export function ChatEmojiPicker({ onSelect, isDisabled = false }: ChatEmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ left: 12, top: 12, width: 350, height: 430 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const bounds = trigger.getBoundingClientRect();
      const width = Math.min(360, window.innerWidth - 24);
      const height = Math.min(440, window.innerHeight * 0.58);
      const left = Math.max(12, Math.min(bounds.right - width, window.innerWidth - width - 12));
      const top = bounds.top >= height + 16
        ? bounds.top - height - 10
        : Math.min(bounds.bottom + 10, window.innerHeight - height - 12);
      setPosition({ left, top: Math.max(12, top), width, height });
    };

    const dismissOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!pickerRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    updatePosition();
    document.addEventListener('pointerdown', dismissOutside);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, { capture: true, passive: true });
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  const onEmojiClick = (emojiData: EmojiClickData) => {
    onSelect(emojiData.emoji);
    setIsOpen(false);
  };

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        isIconOnly
        aria-label="افزودن ایموجی"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        isDisabled={isDisabled}
        onPress={() => setIsOpen((open) => !open)}
        className="h-11 min-w-11 shrink-0 rounded-2xl border border-brand-border bg-brand-surface-elevated text-brand-text-muted hover:text-brand-gold"
      >
        <Smile className="h-5 w-5" />
      </Button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={pickerRef}
          role="dialog"
          aria-label="انتخاب ایموجی"
          dir="ltr"
          className="fixed z-[10020] overflow-hidden rounded-2xl border border-brand-border bg-brand-surface shadow-2xl"
          style={{ left: position.left, top: position.top, width: position.width, height: position.height }}
        >
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            emojiStyle={EmojiStyle.APPLE}
            theme={Theme.AUTO}
            lazyLoadEmojis
            searchPlaceHolder="جست‌وجوی ایموجی"
            searchClearButtonLabel="پاک‌کردن جست‌وجو"
            previewConfig={{ showPreview: false }}
            width="100%"
            height="100%"
          />
        </div>,
        document.body,
      )}
    </>
  );
}
