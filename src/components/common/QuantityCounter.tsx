'use client';

import React from 'react';
import { Button } from '@heroui/react';
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
  const cartItems = useAppSelector((state) =>
    state.cart.items.filter((item) => item.product._id === product._id),
  );
  const isPersian = useAppSelector((state) => state.ui.lang === 'fa');

  // Total quantity of this product in cart
  const quantity = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const primaryItem = cartItems[0];

  const maxStock =
    primaryItem?.selectedVariant?.stockCount ??
    (product.stockCount !== undefined && product.stockCount !== null ? product.stockCount : 99);

  const handleIncrement = (e?: React.MouseEvent | any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (quantity === 0) {
      const defaultVariant =
        product.variants && product.variants.length > 0
          ? product.variants.find((v) => v.isDefault) || product.variants[0]
          : undefined;

      dispatch(
        addToCart({
          product,
          quantity: 1,
          selectedVariant: defaultVariant,
          selectedAttributes: defaultVariant?.title,
        }),
      );
      toast.success(
        isPersian
          ? `«${product.title}» به سبد خرید اضافه شد.`
          : `"${product.titleEn || product.title}" added to your bag.`,
      );
    } else {
      if (quantity < maxStock) {
        dispatch(
          updateQuantity({
            productId: product._id,
            variantId: primaryItem?.selectedVariant?.id,
            quantity: (primaryItem?.quantity || quantity) + 1,
          }),
        );
      } else {
        toast.error(
          isPersian ? 'حداکثر موجودی انبار انتخاب شده است.' : 'Maximum stock reached.',
        );
      }
    }
  };

  const handleDecrement = (e?: React.MouseEvent | any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (quantity > 0 && primaryItem) {
      dispatch(
        updateQuantity({
          productId: product._id,
          variantId: primaryItem.selectedVariant?.id,
          quantity: primaryItem.quantity - 1,
        }),
      );
    }
  };

  if (quantity === 0) {
    return (
      <Button
        onPress={handleIncrement}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        radius="full"
        aria-label={isPersian ? `افزودن ${product.title} به سبد خرید` : `Add ${product.title} to bag`}
        className={`w-full flex items-center justify-center gap-1.5 font-black transition-all duration-300 ease-out bg-brand-gold hover:bg-[#d4be9b] text-[#141914] shadow-xs hover:shadow-md min-h-[40px] rounded-full touch-manipulation active:scale-95 border border-brand-gold/40 ${
          size === 'sm' ? 'py-1.5 px-3 text-xs' : size === 'lg' ? 'py-3 px-5 text-base' : 'py-2 px-4 text-xs'
        }`}
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>{isPersian ? 'افزودن به سبد' : 'Add to Bag'}</span>
      </Button>
    );
  }

  return (
    <div
      className="w-full flex items-center justify-between p-0.5 rounded-full font-bold bg-brand-surface-elevated/90 border border-brand-gold/40 text-brand-text shadow-xs min-h-[40px]"
    >
      <Button
        isIconOnly
        radius="full"
        variant="light"
        onPress={handleDecrement}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        aria-label={isPersian ? 'کاهش تعداد' : 'Decrease quantity'}
        className="min-w-[32px] min-h-[32px] w-8 h-8 flex items-center justify-center rounded-full bg-brand-surface hover:bg-brand-champagne/60 text-brand-text transition-all duration-200 ease-out active:scale-90 touch-manipulation shadow-2xs"
      >
        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
      </Button>

      <span
        className="font-black text-xs px-2 text-brand-text dark:text-brand-gold min-w-[24px] text-center select-none"
        aria-live="polite"
      >
        {isPersian ? toPersianDigits(quantity) : quantity}
      </span>

      <Button
        isIconOnly
        radius="full"
        onPress={handleIncrement}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        aria-label={isPersian ? 'افزایش تعداد' : 'Increase quantity'}
        className="min-w-[32px] min-h-[32px] w-8 h-8 flex items-center justify-center rounded-full bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black shadow-xs transition-all duration-200 ease-out active:scale-90 touch-manipulation"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
      </Button>
    </div>
  );
}
