'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Card, CardBody } from '@heroui/react';
import { ShoppingBag, Trash2, ArrowLeft, ArrowRight, ShieldCheck, Zap, Minus, Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { updateQuantity, removeFromCart, clearCart } from '@/stores/cart/cartSlice';
import { PATHS } from '@/common/constants/PATHS';
import { formatToman, toPersianDigits, getLocalizedVariantTitle } from '@/common/utils';
import { useTranslation } from '@/common/i18n';

export function CartPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);
  const { t, isPersian, isRTL } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter out any corrupted or malformed items
  const validItems = (items || []).filter(
    (item) => item && item.product && typeof item.product === 'object' && (item.product._id || item.product.title),
  );

  const subtotal = validItems.reduce((sum, item) => {
    const product = item.product;
    const price = item.selectedVariant
      ? (item.selectedVariant.discountPrice && item.selectedVariant.discountPrice > 0
          ? item.selectedVariant.discountPrice
          : item.selectedVariant.price) || 0
      : (product.discountPrice && product.discountPrice > 0
          ? product.discountPrice
          : product.price) || 0;
    return sum + price * (item.quantity || 1);
  }, 0);

  const shippingFee = subtotal >= 1000000 || subtotal === 0 ? 0 : 45000;
  const total = subtotal + shippingFee;

  // Hydration protection
  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (validItems.length === 0) {
    return (
      <Card className="min-h-[60vh] bg-brand-surface rounded-3xl my-8 border border-brand-border shadow-xs">
        <CardBody className="p-8 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-brand-surface-elevated border border-brand-border flex items-center justify-center mb-4 text-brand-bronze">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-black text-brand-text mb-2">
            {t.cart.emptyTitle}
          </h2>
          <p className="text-xs text-brand-text-muted max-w-sm mb-6 leading-relaxed">
            {t.cart.emptySub}
          </p>
          <Link
            href={PATHS.PRODUCTS}
            className="inline-flex items-center justify-center h-12 px-8 rounded-2xl bg-brand-olive hover:bg-brand-olive/90 text-brand-gold font-black text-sm border border-brand-gold/40 shadow-md transition-all cursor-pointer"
          >
            {t.cart.browseProducts}
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="min-h-screen py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-black text-brand-text mb-6 sm:mb-8">
        {t.cart.title}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="bg-brand-surface rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-brand-border/60 shadow-xs">
            <CardBody className="p-0 divide-y divide-brand-border/60">
              {validItems.map(({ product, quantity, selectedVariant, selectedAttributes }, idx) => {
                const itemPrice = selectedVariant
                  ? (selectedVariant.discountPrice && selectedVariant.discountPrice > 0
                      ? selectedVariant.discountPrice
                      : selectedVariant.price) || 0
                  : (product.discountPrice && product.discountPrice > 0
                      ? product.discountPrice
                      : product.price) || 0;

                const hasValidImage =
                  Array.isArray(product.images) &&
                  product.images.length > 0 &&
                  typeof product.images[0] === 'string';

                const itemImage = hasValidImage
                  ? product.images[0].startsWith('http')
                    ? product.images[0]
                    : `http://127.0.0.1:7731${product.images[0]}`
                  : 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop';

                const itemKey = `${product._id || idx}-${selectedVariant?.id || 'base'}`;
                const productSlug = product.slug || product._id || '';
                const productHref = productSlug ? PATHS.PRODUCT(productSlug) : PATHS.PRODUCTS;
                const productTitle = isPersian ? product.title : product.titleEn || product.title;

                return (
                  <div
                    key={itemKey}
                    className="py-4 sm:py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden bg-brand-surface-elevated border border-brand-border/60 shrink-0">
                        <Image
                          src={itemImage}
                          alt={productTitle || 'Product'}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={productHref}
                          className="font-bold text-sm sm:text-base text-brand-text hover:text-brand-gold transition-colors line-clamp-1 block"
                        >
                          {productTitle}
                        </Link>
                        {(selectedVariant || selectedAttributes) && (
                          <span className="text-xs font-bold text-brand-bronze block mt-0.5">
                            {selectedVariant
                              ? getLocalizedVariantTitle(selectedVariant.title, isPersian)
                              : selectedAttributes}
                          </span>
                        )}
                        <div className="text-xs font-black text-brand-text mt-1.5">
                          {formatToman(itemPrice, isPersian)}
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Actions */}
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-brand-border/40">
                      <div className="inline-flex items-center bg-brand-surface-elevated border border-brand-border/80 rounded-full p-1 h-9 shadow-xs transition-all">
                        <Button
                          isIconOnly
                          size="sm"
                          radius="full"
                          variant="light"
                          onPress={() =>
                            dispatch(
                              updateQuantity({
                                productId: product._id,
                                variantId: selectedVariant?.id,
                                quantity: (quantity || 1) - 1,
                              }),
                            )
                          }
                          className="w-7 h-7 min-w-7 max-w-7 min-h-7 max-h-7 rounded-full text-brand-text-muted hover:text-brand-text hover:bg-brand-surface transition-colors p-0 cursor-pointer active:scale-90"
                          aria-label={isPersian ? 'کاهش تعداد' : 'Decrease quantity'}
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </Button>
                        <span
                          className="w-8 text-center text-xs font-bold text-brand-text flex items-center justify-center select-none"
                          aria-live="polite"
                        >
                          {isPersian ? toPersianDigits(quantity || 1) : quantity || 1}
                        </span>
                        <Button
                          isIconOnly
                          size="sm"
                          radius="full"
                          variant="light"
                          onPress={() =>
                            dispatch(
                              updateQuantity({
                                productId: product._id,
                                variantId: selectedVariant?.id,
                                quantity: (quantity || 1) + 1,
                              }),
                            )
                          }
                          className="w-7 h-7 min-w-7 max-w-7 min-h-7 max-h-7 rounded-full text-brand-text-muted hover:text-brand-gold hover:bg-brand-gold/15 transition-colors p-0 cursor-pointer active:scale-90"
                          aria-label={isPersian ? 'افزایش تعداد' : 'Increase quantity'}
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </Button>
                      </div>

                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        radius="full"
                        onPress={() =>
                          dispatch(
                            removeFromCart({
                              productId: product._id,
                              variantId: selectedVariant?.id,
                            }),
                          )
                        }
                        className="w-8 h-8 min-w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full cursor-pointer active:scale-90"
                        aria-label={t.common.remove}
                        title={t.common.remove}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardBody>
          </Card>

          <div className="flex justify-between items-center px-2">
            <Button
              variant="light"
              size="sm"
              color="danger"
              onPress={() => dispatch(clearCart())}
              className="text-xs font-bold cursor-pointer hover:bg-rose-500/10 rounded-xl"
            >
              {t.cart.clearCart}
            </Button>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-6">
          <Card className="bg-brand-surface rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-brand-border/60 shadow-xs">
            <CardBody className="p-0 space-y-4">
              <h3 className="font-black text-base text-brand-text pb-3 border-b border-brand-border/60">
                {isPersian ? 'خلاصه سفارش' : 'Order Summary'}
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-brand-text-muted">
                  <span>{t.cart.subtotal}</span>
                  <span className="font-bold text-brand-text">
                    {formatToman(subtotal, isPersian)}
                  </span>
                </div>

                <div className="flex justify-between text-brand-text-muted">
                  <span>{t.cart.shippingFee}</span>
                  <span className="font-bold text-brand-text">
                    {shippingFee === 0
                      ? isPersian ? 'رایگان' : 'Free'
                      : formatToman(shippingFee, isPersian)}
                  </span>
                </div>

                <div className="pt-3 border-t border-brand-border/60 flex justify-between items-baseline">
                  <span className="font-bold text-sm text-brand-text">
                    {t.cart.total}
                  </span>
                  <span className="font-black text-lg text-brand-bronze dark:text-brand-gold">
                    {formatToman(total, isPersian)}
                  </span>
                </div>
              </div>

              <Link
                href={PATHS.CHECKOUT}
                className="w-full h-12 rounded-2xl bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-sm shadow-lg shadow-brand-gold/20 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 ease-out active:scale-98"
              >
                <span>{t.cart.proceedToCheckout}</span>
                {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </Link>
            </CardBody>
          </Card>

          {/* Guarantee Highlights */}
          <Card className="p-4 rounded-2xl bg-brand-surface-elevated border border-brand-border/60">
            <CardBody className="p-0 space-y-2 text-xs text-brand-text-muted">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-bronze shrink-0" />
                <span>{isPersian ? 'ارسال رایگان برای سفارش‌های بالای ۱ میلیون تومان' : 'Free shipping on orders above 1M Toman'}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-bronze shrink-0" />
                <span>{t.common.authenticityGuarantee}</span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
