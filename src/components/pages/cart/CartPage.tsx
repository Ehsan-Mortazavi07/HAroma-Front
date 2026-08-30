'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Trash2, ArrowLeft, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { updateQuantity, removeFromCart, clearCart } from '@/stores/cart/cartSlice';
import { PATHS } from '@/common/constants/PATHS';
import { formatToman, toPersianDigits, getLocalizedVariantTitle } from '@/common/utils';
import { useTranslation } from '@/common/i18n';

export function CartPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);
  const { t, isPersian, isRTL } = useTranslation();

  const subtotal = items.reduce((sum, item) => {
    const price = item.selectedVariant
      ? item.selectedVariant.discountPrice && item.selectedVariant.discountPrice > 0
        ? item.selectedVariant.discountPrice
        : item.selectedVariant.price
      : item.product.discountPrice && item.product.discountPrice > 0
      ? item.product.discountPrice
      : item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const shippingFee = subtotal >= 1000000 || subtotal === 0 ? 0 : 45000;
  const total = subtotal + shippingFee;

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl my-8 border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs">
        <div className="w-20 h-20 rounded-full bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] flex items-center justify-center mb-4 text-[#9f815b]">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-black text-[#1d241d] dark:text-[#f7f4ee] mb-2">
          {t.cart.emptyTitle}
        </h2>
        <p className="text-xs text-[#73695c] dark:text-[#a69c8e] max-w-sm mb-6 leading-relaxed">
          {t.cart.emptySub}
        </p>
        <Link
          href={PATHS.PRODUCTS}
          className="px-8 py-3.5 rounded-2xl bg-[#202620] hover:bg-[#2e382e] text-[#d4be9b] font-black text-sm border border-[#bfa27a]/40 shadow-md transition-all"
        >
          {t.cart.browseProducts}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <h1 className="text-2xl sm:text-3xl font-black text-[#1d241d] dark:text-[#f7f4ee] mb-8">
        {t.cart.title}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl p-6 border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs divide-y divide-[#e6dcce] dark:divide-[#2e3a2e]">
            {items.map(({ product, quantity, selectedVariant, selectedAttributes }) => {
              const itemPrice = selectedVariant
                ? selectedVariant.discountPrice && selectedVariant.discountPrice > 0
                  ? selectedVariant.discountPrice
                  : selectedVariant.price
                : product.discountPrice && product.discountPrice > 0
                ? product.discountPrice
                : product.price;

              const itemImage =
                product.images && product.images.length > 0
                  ? product.images[0].startsWith('http')
                    ? product.images[0]
                    : `http://127.0.0.1:7731${product.images[0]}`
                  : 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop';

              const itemKey = `${product._id}-${selectedVariant?.id || 'base'}`;

              return (
                <div
                  key={itemKey}
                  className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] shrink-0">
                      <Image src={itemImage} alt={product.title} fill className="object-cover" />
                    </div>

                    <div>
                      <Link
                        href={PATHS.PRODUCT(product.slug)}
                        className="font-bold text-sm sm:text-base text-[#1d241d] dark:text-[#f7f4ee] hover:text-[#9f815b] dark:hover:text-[#d4be9b] transition-colors line-clamp-1"
                      >
                        {isPersian ? product.title : product.titleEn || product.title}
                      </Link>
                      {(selectedVariant || selectedAttributes) && (
                        <span className="text-xs font-bold text-[#9f815b] dark:text-[#d4be9b] block mt-0.5">
                          {selectedVariant ? getLocalizedVariantTitle(selectedVariant.title, isPersian) : selectedAttributes}
                        </span>
                      )}
                      <div className="text-xs font-black text-[#1d241d] dark:text-[#d4be9b] mt-1.5">
                        {formatToman(itemPrice, isPersian)}
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Actions */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                    <div className="flex items-center gap-2 bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] rounded-xl p-1">
                      <button
                        onClick={() =>
                          dispatch(
                            updateQuantity({
                              productId: product._id,
                              variantId: selectedVariant?.id,
                              quantity: quantity - 1,
                            }),
                          )
                        }
                        className="w-7 h-7 rounded-lg bg-[#ffffff] dark:bg-[#2e3a2e] text-[#1d241d] dark:text-[#f7f4ee] text-xs font-black flex items-center justify-center shadow-xs"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-extrabold text-[#1d241d] dark:text-[#f7f4ee]">
                        {isPersian ? toPersianDigits(quantity) : quantity}
                      </span>
                      <button
                        onClick={() =>
                          dispatch(
                            updateQuantity({
                              productId: product._id,
                              variantId: selectedVariant?.id,
                              quantity: quantity + 1,
                            }),
                          )
                        }
                        className="w-7 h-7 rounded-lg bg-[#bfa27a] text-[#1d241d] text-xs font-black flex items-center justify-center shadow-xs"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() =>
                        dispatch(
                          removeFromCart({
                            productId: product._id,
                            variantId: selectedVariant?.id,
                          }),
                        )
                      }
                      className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                      title={t.common.remove}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center px-2">
            <button
              onClick={() => dispatch(clearCart())}
              className="text-xs font-bold text-rose-500 hover:underline"
            >
              {t.cart.clearCart}
            </button>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl p-6 border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs space-y-4">
            <h3 className="font-black text-base text-[#1d241d] dark:text-[#f7f4ee] pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
              {isPersian ? 'خلاصه سفارش' : 'Order Summary'}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-[#73695c] dark:text-[#a69c8e]">
                <span>{t.cart.subtotal}</span>
                <span className="font-bold text-[#1d241d] dark:text-[#f7f4ee]">
                  {formatToman(subtotal, isPersian)}
                </span>
              </div>

              <div className="flex justify-between text-[#73695c] dark:text-[#a69c8e]">
                <span>{t.cart.shippingFee}</span>
                <span className="font-bold text-[#1d241d] dark:text-[#f7f4ee]">
                  {shippingFee === 0
                    ? isPersian ? 'رایگان' : 'Free'
                    : formatToman(shippingFee, isPersian)}
                </span>
              </div>

              <div className="pt-3 border-t border-[#e6dcce] dark:border-[#2e3a2e] flex justify-between items-baseline">
                <span className="font-bold text-sm text-[#1d241d] dark:text-[#f7f4ee]">
                  {t.cart.total}
                </span>
                <span className="font-black text-lg text-[#9f815b] dark:text-[#d4be9b]">
                  {formatToman(total, isPersian)}
                </span>
              </div>
            </div>

            <Link
              href={PATHS.CHECKOUT}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#bfa27a] via-[#9f815b] to-[#7a5d3e] hover:from-[#d4be9b] hover:to-[#9f815b] text-[#1d241d] font-black text-sm shadow-md shadow-[#9f815b]/20 flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <span>{t.cart.proceedToCheckout}</span>
              {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Link>
          </div>

          {/* Guarantee Highlights */}
          <div className="p-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] space-y-2 text-xs text-[#73695c] dark:text-[#a69c8e]">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#9f815b]" />
              <span>{isPersian ? 'ارسال رایگان برای سفارش‌های بالای ۱ میلیون تومان' : 'Free shipping on orders above 1M Toman'}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#9f815b]" />
              <span>{t.common.authenticityGuarantee}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
