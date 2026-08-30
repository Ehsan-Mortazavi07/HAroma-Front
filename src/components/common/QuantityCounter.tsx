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
        className={`w-full flex items-center justify-center gap-1.5 rounded-xl font-bold transition-all bg-[#f0eae0] hover:bg-[#e6dcce] text-[#7a5d3e] dark:bg-[#2a342a] dark:hover:bg-[#344034] dark:text-[#d4be9b] border border-[#bfa27a]/30 shadow-xs ${
          size === 'sm' ? 'py-1.5 text-xs' : size === 'lg' ? 'py-3 text-base' : 'py-2 text-sm'
        }`}
      >
        <Plus className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span>{isPersian ? 'افزودن به سبد' : 'Add to Bag'}</span>
      </button>
    );
  }

  return (
    <div
      className={`w-full flex items-center justify-between px-2 rounded-xl font-bold bg-[#f0eae0] dark:bg-[#242c24] border border-[#bfa27a]/40 text-[#1d241d] dark:text-[#f7f4ee] shadow-sm ${
        size === 'sm' ? 'py-1 text-xs' : size === 'lg' ? 'py-2.5 text-base' : 'py-1.5 text-sm'
      }`}
    >
      <button
        onClick={handleDecrement}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#e2d7c5] hover:bg-[#d8ccb8] dark:bg-[#2e3a2e] dark:hover:bg-[#3e4c3e] text-[#1d241d] dark:text-[#f7f4ee] transition-colors"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <span className="font-extrabold text-sm px-2 text-[#1d241d] dark:text-[#d4be9b]">
        {isPersian ? toPersianDigits(quantity) : quantity}
      </span>

      <button
        onClick={handleIncrement}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#bfa27a] hover:bg-[#d4be9b] text-[#1d241d] font-bold shadow-sm transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
