'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ArrowLeft, ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { toggleCartDrawer } from '@/stores/ui/uiSlice';
import { updateQuantity, removeFromCart } from '@/stores/cart/cartSlice';
import { formatToman, toPersianDigits, getLocalizedVariantTitle } from '@/common/utils';
import { PATHS } from '@/common/constants/PATHS';
import { useTranslation } from '@/common/i18n';

export function CartDrawer() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isCartDrawerOpen);
  const items = useAppSelector((state) => state.cart.items);
  const { t, isPersian, isRTL } = useTranslation();

  const closeDrawer = () => dispatch(toggleCartDrawer(false));

  const subtotal = items.reduce((acc, item) => {
    const price = item.selectedVariant
      ? item.selectedVariant.discountPrice && item.selectedVariant.discountPrice > 0
        ? item.selectedVariant.discountPrice
        : item.selectedVariant.price
      : item.product.discountPrice && item.product.discountPrice > 0
      ? item.product.discountPrice
      : item.product.price;
    return acc + price * item.quantity;
  }, 0);

  // Smooth hardware-accelerated drawer transition
  const drawerTransition = {
    type: 'tween' as const,
    ease: [0.16, 1, 0.3, 1] as const,
    duration: 0.26,
  };

  const offscreenX = isRTL ? '-100%' : '100%';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop with quick smooth fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-black/60 cursor-pointer"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: offscreenX }}
            animate={{ x: 0 }}
            exit={{ x: offscreenX }}
            transition={drawerTransition}
            style={{ willChange: 'transform' }}
            className={`fixed top-0 bottom-0 ${
              isRTL ? 'left-0 border-r' : 'right-0 border-l'
            } w-full max-w-md h-full bg-brand-surface shadow-2xl flex flex-col z-10 border-brand-border`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#344034] bg-[#202620] text-[#f7f4ee] shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-brand-gold" />
                <h3 className="font-bold text-base">
                  {t.cart.title}
                </h3>
              </div>
              <button
                onClick={closeDrawer}
                className="p-1.5 rounded-xl text-brand-text-muted hover:text-[#f7f4ee] hover:bg-[#2a342a] transition-colors"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content / Items List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-brand-border">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-brand-text-muted">
                  <ShoppingBag className="w-16 h-16 mb-4 text-brand-bronze opacity-40" />
                  <h4 className="font-bold text-base text-brand-text mb-1">
                    {t.cart.emptyTitle}
                  </h4>
                  <p className="text-xs mb-6 max-w-xs leading-relaxed">
                    {t.cart.emptySub}
                  </p>
                  <button
                    onClick={closeDrawer}
                    className="px-6 py-2.5 rounded-2xl bg-brand-olive hover:bg-brand-olive/90 text-brand-champagne font-bold text-xs border border-brand-gold/40 shadow-sm"
                  >
                    {t.cart.browseProducts}
                  </button>
                </div>
              ) : (
                items.map(({ product, quantity, selectedVariant, selectedAttributes }) => {
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
                    <div key={itemKey} className="py-4 first:pt-0 last:pb-0 flex gap-3">
                      <div className="relative w-18 h-18 rounded-2xl overflow-hidden bg-brand-surface-elevated border border-brand-border shrink-0">
                        <Image src={itemImage} alt={product.title} fill className="object-cover" />
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-brand-text line-clamp-1">
                            {isPersian ? product.title : product.titleEn || product.title}
                          </h4>
                          {(selectedVariant || selectedAttributes) && (
                            <span className="text-[11px] font-bold text-brand-bronze block mt-0.5">
                              {selectedVariant ? getLocalizedVariantTitle(selectedVariant.title, isPersian) : selectedAttributes}
                            </span>
                          )}
                          <div className="text-xs font-black text-brand-text mt-1">
                            {formatToman(itemPrice, isPersian)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 bg-brand-surface-elevated border border-brand-border rounded-2xl p-0.5">
                            <button
                              type="button"
                              aria-label={isPersian ? 'کاهش تعداد' : 'Decrease quantity'}
                              onClick={() =>
                                dispatch(
                                  updateQuantity({
                                    productId: product._id,
                                    variantId: selectedVariant?.id,
                                    quantity: quantity - 1,
                                  }),
                                )
                              }
                              className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-brand-surface text-brand-text text-sm font-black flex items-center justify-center shadow-xs hover:bg-brand-surface-elevated transition-all active:scale-95 touch-manipulation focus-visible:ring-2 focus-visible:ring-brand-gold"
                            >
                              -
                            </button>
                            <span className="w-7 text-center text-xs font-bold text-brand-text font-mono" aria-live="polite">
                              {isPersian ? toPersianDigits(quantity) : quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={isPersian ? 'افزایش تعداد' : 'Increase quantity'}
                              onClick={() =>
                                dispatch(
                                  updateQuantity({
                                    productId: product._id,
                                    variantId: selectedVariant?.id,
                                    quantity: quantity + 1,
                                  }),
                                )
                              }
                              className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-brand-gold hover:bg-brand-champagne text-brand-olive text-sm font-black flex items-center justify-center shadow-xs transition-all active:scale-95 touch-manipulation focus-visible:ring-2 focus-visible:ring-brand-gold"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              dispatch(
                                removeFromCart({
                                  productId: product._id,
                                  variantId: selectedVariant?.id,
                                }),
                              )
                            }
                            className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all active:scale-95 touch-manipulation focus-visible:ring-2 focus-visible:ring-rose-400"
                            aria-label={t.common.remove}
                            title={t.common.remove}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Summary & Checkout */}
            {items.length > 0 && (
              <div className="p-4 border-t border-brand-border bg-brand-surface-elevated space-y-3 shrink-0">
                <div className="flex items-center justify-between text-xs font-bold text-brand-text-muted">
                  <span>{t.cart.subtotal}</span>
                  <span className="text-sm font-black text-brand-text">
                    {formatToman(subtotal, isPersian)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href={PATHS.CART}
                    onClick={closeDrawer}
                    className="py-3 rounded-2xl bg-brand-surface border border-brand-border text-brand-text font-bold text-xs flex items-center justify-center gap-1 hover:bg-brand-surface-elevated transition-colors"
                  >
                    <span>{t.cart.viewCart}</span>
                  </Link>

                  <Link
                    href={PATHS.CHECKOUT}
                    onClick={closeDrawer}
                    className="py-3 rounded-2xl bg-brand-gold hover:bg-brand-champagne text-brand-olive font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-brand-bronze/20 active:scale-98 transition-all border border-brand-champagne/30"
                  >
                    <span>{t.cart.proceedToCheckout}</span>
                    {isRTL ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
