'use client';

import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { addToCart, updateQuantity } from '@/stores/cart/cartSlice';
import { IProduct } from '@/common/interfaces';
import { toPersianDigits, toast } from '@/common/utils';

interface QuantityCounterProps {
  product: IProduct;
  size?: 'sm' | 'md' | 'lg';
}

export function QuantityCounter({ product, size = 'md' }: QuantityCounterProps) {
  const dispatch = useAppDispatch();
  const cartItem = useAppSelector((state) =>
    state.cart.items.find((item) => item.product._id === product._id),
  );
  const isPersian = useAppSelector((state) => state.ui.lang === 'fa');

  const quantity = cartItem?.quantity || 0;

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity === 0) {
      dispatch(addToCart({ product, quantity: 1 }));
      toast.success(`«${product.title}» به سبد خرید اضافه شد.`);
    } else {
      if (quantity < product.stockCount) {
        dispatch(updateQuantity({ productId: product._id, quantity: quantity + 1 }));
      } else {
        toast.error('حداکثر موجودی انبار انتخاب شده است.');
      }
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity > 0) {
      dispatch(updateQuantity({ productId: product._id, quantity: quantity - 1 }));
    }
  };

  if (quantity === 0) {
    return (
      <button
        onClick={handleIncrement}
        aria-label={isPersian ? `افزودن ${product.title} به سبد خرید` : `Add ${product.title} to bag`}
        className={`w-full flex items-center justify-center gap-2 rounded-2xl font-bold transition-all duration-200 ease-out bg-brand-surface-elevated hover:bg-brand-champagne/40 text-brand-bronze dark:text-brand-gold border border-brand-gold/30 shadow-xs min-h-[44px] touch-manipulation active:scale-98 ${
          size === 'sm' ? 'py-2 px-3 text-xs' : size === 'lg' ? 'py-3.5 px-5 text-base' : 'py-2.5 px-4 text-sm'
        }`}
      >
        <Plus className="w-4 h-4" />
        <span>{isPersian ? 'افزودن به سبد' : 'Add to Bag'}</span>
      </button>
    );
  }

  return (
    <div
      className={`w-full flex items-center justify-between p-1 rounded-2xl font-bold bg-brand-surface-elevated border border-brand-gold/40 text-brand-text shadow-sm min-h-[44px]`}
    >
      <button
        type="button"
        onClick={handleDecrement}
        aria-label={isPersian ? 'کاهش تعداد' : 'Decrease quantity'}
        className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-xl bg-brand-surface hover:bg-brand-champagne/40 text-brand-text transition-all duration-150 ease-out active:scale-95 touch-manipulation focus-visible:ring-2 focus-visible:ring-brand-gold"
      >
        <Minus className="w-4 h-4" />
      </button>

      <span
        className="font-extrabold text-sm px-2 text-brand-text dark:text-brand-gold min-w-[28px] text-center"
        aria-live="polite"
      >
        {isPersian ? toPersianDigits(quantity) : quantity}
      </span>

      <button
        type="button"
        onClick={handleIncrement}
        aria-label={isPersian ? 'افزایش تعداد' : 'Increase quantity'}
        className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-xl bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black shadow-sm transition-all duration-150 ease-out active:scale-95 touch-manipulation focus-visible:ring-2 focus-visible:ring-brand-gold"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
