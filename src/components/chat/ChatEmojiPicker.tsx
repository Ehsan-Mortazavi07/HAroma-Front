'use client';

import { useState } from 'react';
import { Button } from '@heroui/react';
import { Smile } from 'lucide-react';

const EMOJIS = ['😊', '😍', '🥰', '🌸', '🌹', '✨', '💐', '👋', '🙏', '👍', '❤️', '🎁'];

interface ChatEmojiPickerProps {
  onSelect: (emoji: string) => void;
  isDisabled?: boolean;
}

export function ChatEmojiPicker({ onSelect, isDisabled = false }: ChatEmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <Button
        type="button"
        isIconOnly
        aria-label="افزودن ایموجی"
        aria-expanded={isOpen}
        isDisabled={isDisabled}
        onPress={() => setIsOpen((open) => !open)}
        className="h-11 min-w-11 rounded-2xl border border-brand-border bg-brand-surface-elevated text-brand-text-muted hover:text-brand-gold"
      >
        <Smile className="h-5 w-5" />
      </Button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="انتخاب ایموجی"
          className="absolute bottom-full right-0 z-30 mb-2 w-56 rounded-2xl border border-brand-border bg-brand-surface p-3 shadow-xl"
        >
          <p className="mb-2 text-xs font-bold text-brand-text-muted">یک ایموجی انتخاب کن</p>
          <div className="grid grid-cols-6 gap-1">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                aria-label={emoji}
                onClick={() => {
                  onSelect(emoji);
                  setIsOpen(false);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-brand-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
