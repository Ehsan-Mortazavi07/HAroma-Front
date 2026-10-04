'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@heroui/react';
import { Check, LoaderCircle, Plus, Search, Trash2, X } from 'lucide-react';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { Input, Textarea } from '@/components/common/DirectionalFields';
import { ProvinceCitySelect } from '@/components/common/ProvinceCitySelect';
import { adminApi } from '@/common/api/admin';
import type { IAdminOrderUpdate, IOrder, IProduct } from '@/common/interfaces';
import { formatToman, toast } from '@/common/utils';

interface AddedOrderItem {
  key: string;
  productId: string;
  quantity: number;
  variantId?: string;
  title: string;
  price: number;
  image?: string;
  selectedAttributes?: string;
}

type PendingItemDelete =
  | { kind: 'existing'; index: number; title: string }
  | { kind: 'added'; key: string; title: string };

const inputClassNames = {
  inputWrapper: 'min-h-11 px-3 bg-brand-surface border border-brand-border hover:border-brand-gold/70 focus-within:!border-brand-gold rounded-xl shadow-none transition-colors',
  input: 'text-xs font-semibold text-brand-text',
  label: 'text-[11px] font-bold text-brand-text-muted',
};

interface OrderEditFormProps {
  order: IOrder;
  isPersian: boolean;
  onCancel: () => void;
  onSaved: (order: IOrder) => void;
}

export function OrderEditForm({ order, isPersian, onCancel, onSaved }: OrderEditFormProps) {
  const [deliveryAddress, setDeliveryAddress] = useState<IOrder['deliveryAddress']>(order.deliveryAddress);
  const [removedIndexes, setRemovedIndexes] = useState<number[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<number, number>>({});
  const [addedItems, setAddedItems] = useState<AddedOrderItem[]>([]);
  const [itemPendingDelete, setItemPendingDelete] = useState<PendingItemDelete | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<IProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [productSearchError, setProductSearchError] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDeliveryAddress(order.deliveryAddress);
    setRemovedIndexes([]);
    setItemQuantities({});
    setAddedItems([]);
    setItemPendingDelete(null);
    setProductSearch('');
    setProductResults([]);
    setSelectedProduct(null);
    setSelectedVariantId('');
    setNewItemQuantity(1);
    setAdminNote('');
  }, [order]);

  useEffect(() => {
    const query = productSearch.trim();
    if (query.length < 2 || selectedProduct) {
      setProductResults([]);
      setIsSearchingProducts(false);
      setProductSearchError('');
      return;
    }

    let isCurrent = true;
    const timeout = window.setTimeout(async () => {
      setIsSearchingProducts(true);
      setProductSearchError('');
      try {
        const result = await adminApi.getProducts({
          page: 1,
          pageSize: 8,
          q: query,
          includeUnpublished: 'true',
        });
        if (isCurrent) setProductResults(result?.items || []);
      } catch {
        if (isCurrent) {
          setProductResults([]);
          setProductSearchError(isPersian ? 'جستجوی کالا انجام نشد؛ دوباره تلاش کنید.' : 'Product search failed. Try again.');
        }
      } finally {
        if (isCurrent) setIsSearchingProducts(false);
      }
    }, 300);

    return () => {
      isCurrent = false;
      window.clearTimeout(timeout);
    };
  }, [productSearch, selectedProduct, isPersian]);

  const updateAddress = (key: keyof IOrder['deliveryAddress'], value: string) => {
    setDeliveryAddress((previous) => ({ ...previous, [key]: value }));
  };

  const setProvince = (province: string) => {
    updateAddress('province', province);
  };

  const confirmRemoveItem = () => {
    if (!itemPendingDelete) return;
    if (itemPendingDelete.kind === 'existing') {
      setRemovedIndexes((previous) => previous.includes(itemPendingDelete.index)
        ? previous
        : [...previous, itemPendingDelete.index]);
    } else {
      setAddedItems((previous) => previous.filter((item) => item.key !== itemPendingDelete.key));
    }
    setItemPendingDelete(null);
  };

  const chooseProduct = (product: IProduct) => {
    setSelectedProduct(product);
    setProductSearch(product.title);
    const defaultVariant = product.variants?.find((variant) => variant.isDefault) || product.variants?.[0];
    setSelectedVariantId(defaultVariant?.id || '');
    setNewItemQuantity(1);
  };

  const addSelectedProduct = () => {
    if (!selectedProduct) return;
    const variant = selectedProduct.variants?.find((item) => item.id === selectedVariantId);
    const priceSource = variant || selectedProduct;
    const price = priceSource.discountPrice && priceSource.discountPrice > 0
      ? priceSource.discountPrice
      : priceSource.price;
    const added: AddedOrderItem = {
      key: `${selectedProduct._id}-${selectedVariantId || 'base'}-${Date.now()}`,
      productId: selectedProduct._id,
      quantity: newItemQuantity,
      variantId: variant?.id,
      title: selectedProduct.title,
      price,
      image: selectedProduct.images?.[0],
      selectedAttributes: variant?.title || '',
    };
    setAddedItems((previous) => [...previous, added]);
    setSelectedProduct(null);
    setSelectedVariantId('');
    setProductSearch('');
    setProductResults([]);
    setNewItemQuantity(1);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !deliveryAddress.fullName.trim() ||
      !deliveryAddress.phone.trim() ||
      !deliveryAddress.province.trim() ||
      !deliveryAddress.city.trim() ||
      !deliveryAddress.addressDetail.trim()
    ) {
      toast.error(isPersian
        ? 'نام، تلفن، استان، شهر و نشانی دقیق گیرنده الزامی است.'
        : 'Recipient, phone, province, city, and full address are required.');
      return;
    }

    const invalidQuantity = Object.entries(itemQuantities).some(([index, quantity]) =>
      !removedIndexes.includes(Number(index)) && (!Number.isInteger(quantity) || quantity < 1 || quantity > 99),
    );
    const invalidAddedQuantity = addedItems.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99);
    const invalidNewItemQuantity = Boolean(selectedProduct) && (!Number.isInteger(newItemQuantity) || newItemQuantity < 1 || newItemQuantity > 99);
    if (invalidQuantity || invalidAddedQuantity || invalidNewItemQuantity) {
      toast.error(isPersian ? 'تعداد هر قلم باید بین ۱ تا ۹۹ باشد.' : 'Each item quantity must be between 1 and 99.');
      return;
    }

    const payload: IAdminOrderUpdate = {
      version: order.__v ?? 0,
      removeItemIndexes: [...removedIndexes].sort((a, b) => a - b),
      itemQuantityUpdates: Object.entries(itemQuantities)
        .filter(([index, quantity]) => !removedIndexes.includes(Number(index)) && quantity !== order.items[Number(index)]?.quantity)
        .map(([index, quantity]) => ({ index: Number(index), quantity })),
      addItems: addedItems.map(({ productId, quantity, variantId }) => ({ productId, quantity, variantId })),
      adminNote: adminNote.trim() || undefined,
      deliveryAddress: {
        fullName: deliveryAddress.fullName.trim(),
        phone: deliveryAddress.phone.trim(),
        email: deliveryAddress.email?.trim() || '',
        province: deliveryAddress.province.trim(),
        city: deliveryAddress.city.trim(),
        postalCode: deliveryAddress.postalCode?.trim() || '',
        buildingNumber: deliveryAddress.buildingNumber?.trim() || '',
        unit: deliveryAddress.unit?.trim() || '',
        addressDetail: deliveryAddress.addressDetail.trim(),
        description: deliveryAddress.description?.trim() || '',
      },
    };

    setIsSaving(true);
    try {
      const updated = await adminApi.updateOrder(order._id, payload);
      toast.success(isPersian ? 'تغییرات سفارش ذخیره شد.' : 'Order changes saved.');
      onSaved(updated as IOrder);
    } catch (error: any) {
      const message = error?.response?.data?.message;
      toast.error(Array.isArray(message)
        ? message.join('، ')
        : message || (isPersian ? 'ذخیره تغییرات سفارش انجام نشد.' : 'Could not save order changes.'));
    } finally {
      setIsSaving(false);
    }
  };

  const textField = (
    label: string,
    value: string,
    onValueChange: (value: string) => void,
    dir: 'ltr' | 'rtl' = isPersian ? 'rtl' : 'ltr',
  ) => (
    <Input
      label={label}
      labelPlacement="outside-top"
      value={value}
      onValueChange={onValueChange}
      dir={dir}
      variant="bordered"
      radius="lg"
      classNames={inputClassNames}
    />
  );

  const visibleItems = (order.items || [])
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => !removedIndexes.includes(index));
  const itemCount = visibleItems.length + addedItems.length;
  const canEditItems = !['shipped', 'delivered', 'cancelled'].includes(order.status);
  const selectedVariant = selectedProduct?.variants?.find((item) => item.id === selectedVariantId);
  const selectedProductPrice = selectedProduct
    ? ((selectedVariant || selectedProduct).discountPrice && (selectedVariant || selectedProduct).discountPrice! > 0
      ? (selectedVariant || selectedProduct).discountPrice!
      : (selectedVariant || selectedProduct).price)
    : 0;

  return (
    <form dir={isPersian ? 'rtl' : 'ltr'} onSubmit={submit} className="space-y-5 text-start">
      <section className="space-y-4 rounded-2xl border border-brand-border bg-brand-surface-elevated/25 p-4 sm:p-5">
        <div>
          <h4 className="text-sm font-black text-brand-text">
            {isPersian ? 'مشخصات گیرنده و نشانی تحویل' : 'Recipient and delivery address'}
          </h4>
          <p className="mt-1 text-[11px] text-brand-text-muted">
            {isPersian
              ? 'این تغییر فقط برای همین سفارش ثبت می‌شود و مشخصات حساب کاربر را تغییر نمی‌دهد.'
              : "These changes apply to this order only and do not change the user's profile."}
          </p>
        </div>
        <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {textField(isPersian ? 'نام تحویل‌گیرنده' : 'Recipient name', deliveryAddress.fullName, (value) => updateAddress('fullName', value))}
          {textField(isPersian ? 'شماره تماس' : 'Phone number', deliveryAddress.phone, (value) => updateAddress('phone', value), 'ltr')}
          {textField(isPersian ? 'ایمیل' : 'Email', deliveryAddress.email || '', (value) => updateAddress('email', value), 'ltr')}
          <div className="sm:col-span-2 lg:col-span-2">
            <ProvinceCitySelect
              province={deliveryAddress.province}
              city={deliveryAddress.city}
              required
              className="gap-4"
              onChangeProvince={setProvince}
              onChangeCity={(city) => updateAddress('city', city)}
            />
          </div>
          {textField(isPersian ? 'کد پستی' : 'Postal code', deliveryAddress.postalCode || '', (value) => updateAddress('postalCode', value), 'ltr')}
          {textField(isPersian ? 'پلاک' : 'Building number', deliveryAddress.buildingNumber || '', (value) => updateAddress('buildingNumber', value))}
          {textField(isPersian ? 'واحد' : 'Unit', deliveryAddress.unit || '', (value) => updateAddress('unit', value))}
          <div className="sm:col-span-2 lg:col-span-3">
            <Textarea
              label={isPersian ? 'نشانی دقیق' : 'Full address'}
              labelPlacement="outside-top"
              dir={isPersian ? 'rtl' : 'ltr'}
              value={deliveryAddress.addressDetail}
              onValueChange={(value) => updateAddress('addressDetail', value)}
              minRows={2}
              maxLength={1000}
              variant="bordered"
              radius="lg"
              classNames={{ ...inputClassNames, inputWrapper: `${inputClassNames.inputWrapper} py-2` }}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Textarea
              label={isPersian ? 'توضیحات نشانی' : 'Address notes'}
              labelPlacement="outside-top"
              dir={isPersian ? 'rtl' : 'ltr'}
              value={deliveryAddress.description || ''}
              onValueChange={(value) => updateAddress('description', value)}
              minRows={2}
              maxLength={500}
              variant="bordered"
              radius="lg"
              classNames={{ ...inputClassNames, inputWrapper: `${inputClassNames.inputWrapper} py-2` }}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-brand-border bg-brand-surface-elevated/25 p-4 sm:p-5">
        <div>
          <h4 className="text-sm font-black text-brand-text">{isPersian ? 'اقلام سفارش' : 'Order items'}</h4>
          <p className="mt-1 text-[11px] text-brand-text-muted">
            {!canEditItems
              ? (isPersian ? 'به دلیل وضعیت ارسال یا لغو، اقلام این سفارش قابل تغییر نیست.' : 'Items cannot be changed after shipping, delivery, or cancellation.')
              : isPersian
              ? 'تعداد اقلام را تغییر دهید، کالا اضافه کنید یا قلم‌های جایگزین را پس از تأیید حذف کنید.'
              : 'Change quantities, add products, or remove items with confirmation. Add a new item to replace an existing one.'}
          </p>
        </div>

        <div className="space-y-4 rounded-xl border border-brand-border/70 bg-brand-surface/70 p-3">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-end">
            <div className="relative min-w-0">
              <Input
                label={isPersian ? 'جستجو و افزودن کالا' : 'Search and add a product'}
                labelPlacement="outside-top"
                dir={isPersian ? 'rtl' : 'ltr'}
                value={productSearch}
                onValueChange={(value) => {
                  setProductSearch(value);
                  if (selectedProduct && value !== selectedProduct.title) setSelectedProduct(null);
                }}
                isDisabled={!canEditItems}
                placeholder={isPersian ? 'حداقل دو حرف از نام کالا را بنویسید' : 'Type at least two characters'}
                startContent={<Search className="h-4 w-4 shrink-0 text-brand-text-muted" />}
                variant="bordered"
                radius="lg"
                classNames={inputClassNames}
              />
              {(productResults.length > 0 || isSearchingProducts || productSearchError || productSearch.trim().length >= 2) && !selectedProduct && (
                <div className="absolute inset-x-0 top-full z-40 mt-2 max-h-64 overflow-y-auto rounded-xl border border-brand-border bg-brand-surface p-1.5 shadow-xl">
                  {isSearchingProducts ? (
                    <div className="flex items-center gap-2 px-3 py-3 text-xs text-brand-text-muted">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      {isPersian ? 'در حال جستجوی کالا…' : 'Searching products…'}
                    </div>
                  ) : productSearchError ? (
                    <p className="px-3 py-3 text-xs text-rose-500">{productSearchError}</p>
                  ) : productResults.length ? (
                    productResults.map((product) => {
                      const available = product.inStock && product.stockCount > 0;
                      return (
                        <button
                          key={product._id}
                          type="button"
                          disabled={!available}
                          onClick={() => chooseProduct(product)}
                          className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-start transition-colors hover:bg-brand-gold/10 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-bold text-brand-text">{product.title}</span>
                            <span className="mt-0.5 block text-[10px] text-brand-text-muted">
                              {formatToman(product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price, isPersian)}
                              {' · '}{isPersian ? `موجودی ${product.stockCount}` : `Stock ${product.stockCount}`}
                            </span>
                          </span>
                          <Plus className="h-4 w-4 shrink-0 text-brand-bronze dark:text-brand-gold" />
                        </button>
                      );
                    })
                  ) : (
                    <p className="px-3 py-3 text-xs text-brand-text-muted">
                      {isPersian ? 'کالایی با این نام پیدا نشد.' : 'No matching products found.'}
                    </p>
                  )}
                </div>
              )}
            </div>
            <Input
              type="number"
              min={1}
              max={99}
              label={isPersian ? 'تعداد' : 'Quantity'}
              labelPlacement="outside-top"
              dir="ltr"
              value={String(newItemQuantity)}
              onValueChange={(value) => setNewItemQuantity(Number(value))}
              isDisabled={!canEditItems || !selectedProduct}
              variant="bordered"
              radius="lg"
              classNames={inputClassNames}
            />
            <Button
              type="button"
              onPress={addSelectedProduct}
              isDisabled={!canEditItems || !selectedProduct || !Number.isInteger(newItemQuantity) || newItemQuantity < 1 || newItemQuantity > 99}
              startContent={<Plus className="h-4 w-4" />}
              className="h-11 rounded-xl bg-brand-gold px-4 text-xs font-black text-[#141914]"
            >
              {isPersian ? 'افزودن' : 'Add'}
            </Button>
          </div>

          {selectedProduct?.variants && selectedProduct.variants.length > 0 && (
            <fieldset className="space-y-2">
              <legend className="text-[11px] font-bold text-brand-text-muted">
                {isPersian ? 'ویژگی یا حجم کالا' : 'Product variant'}
              </legend>
              <div className="flex flex-wrap gap-2">
                {selectedProduct.variants.map((variant) => {
                  const active = variant.id === selectedVariantId;
                  const price = variant.discountPrice && variant.discountPrice > 0 ? variant.discountPrice : variant.price;
                  return (
                    <Button
                      key={variant.id}
                      type="button"
                      size="sm"
                      variant={active ? 'solid' : 'bordered'}
                      aria-pressed={active}
                      isDisabled={!canEditItems}
                      onPress={() => setSelectedVariantId(variant.id)}
                      className={`h-9 rounded-lg px-3 text-[11px] font-bold ${active ? 'bg-brand-gold text-[#141914]' : 'border-brand-border bg-brand-surface text-brand-text'}`}
                    >
                      {variant.title} · {formatToman(price, isPersian)}
                    </Button>
                  );
                })}
              </div>
              <p className="text-[10px] text-brand-text-muted">
                {isPersian ? 'موجودی براساس موجودی کلی کالا کنترل می‌شود.' : 'Availability is checked against the product stock.'}
              </p>
            </fieldset>
          )}
          {selectedProduct && (
            <p className="text-[11px] font-bold text-brand-text-muted">
              {isPersian ? 'قیمت فعلی هر واحد:' : 'Current unit price:'} {formatToman(selectedProductPrice, isPersian)}
            </p>
          )}
        </div>

        <div className="space-y-2.5">
          {visibleItems.map(({ item, index }) => (
            <div key={`${item.product}-${index}`} className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-brand-border bg-brand-surface p-3">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.title}
                  width={56}
                  height={56}
                  unoptimized
                  className="h-14 w-14 shrink-0 rounded-lg bg-brand-surface-elevated object-contain p-1"
                />
              ) : (
                <div aria-hidden="true" className="h-14 w-14 shrink-0 rounded-lg bg-brand-surface-elevated" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-brand-text">{item.title}</p>
                {(item.selectedAttributes || item.selectedVariant?.title) && (
                  <p className="mt-0.5 truncate text-[10px] text-brand-text-muted">
                    {item.selectedAttributes || item.selectedVariant?.title}
                  </p>
                )}
                <p className="mt-1 text-[10px] text-brand-text-muted">
                  {isPersian ? formatToman(item.price, true) : formatToman(item.price, false)} {isPersian ? 'برای هر عدد' : 'each'}
                </p>
              </div>
              <div className="ms-auto flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={99}
                  aria-label={isPersian ? `تعداد ${item.title}` : `${item.title} quantity`}
                  dir="ltr"
                  value={String(itemQuantities[index] ?? item.quantity)}
                  onValueChange={(value) => setItemQuantities((previous) => ({ ...previous, [index]: Number(value) }))}
                  isDisabled={!canEditItems}
                  className="w-24"
                  variant="bordered"
                  radius="lg"
                  classNames={{ ...inputClassNames, inputWrapper: `${inputClassNames.inputWrapper} min-h-9 h-9` }}
                />
                <span className="min-w-24 text-end text-[11px] font-bold text-brand-text">
                  {formatToman(item.price * (itemQuantities[index] ?? item.quantity), isPersian)}
                </span>
              </div>
              <Button
                type="button"
                isIconOnly
                size="sm"
                variant="light"
                isDisabled={!canEditItems || itemCount <= 1}
                aria-label={isPersian ? `حذف ${item.title} از سفارش` : `Remove ${item.title} from order`}
                onPress={() => setItemPendingDelete({ kind: 'existing', index, title: item.title })}
                className="h-9 w-9 min-w-9 shrink-0 rounded-xl text-rose-500 transition-colors hover:bg-rose-500/10 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {addedItems.map((item) => (
            <div key={item.key} className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-brand-gold/40 bg-brand-surface p-3">
              {item.image ? (
                <Image src={item.image} alt={item.title} width={56} height={56} unoptimized className="h-14 w-14 shrink-0 rounded-lg bg-brand-surface-elevated object-contain p-1" />
              ) : <div aria-hidden="true" className="h-14 w-14 shrink-0 rounded-lg bg-brand-surface-elevated" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-brand-text">{item.title}</p>
                {item.selectedAttributes && <p className="mt-0.5 truncate text-[10px] text-brand-text-muted">{item.selectedAttributes}</p>}
                <p className="mt-1 text-[10px] text-brand-text-muted">{formatToman(item.price, isPersian)} {isPersian ? 'برای هر عدد' : 'each'}</p>
              </div>
              <div className="ms-auto flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={99}
                  aria-label={isPersian ? `تعداد ${item.title}` : `${item.title} quantity`}
                  dir="ltr"
                  value={String(item.quantity)}
                  onValueChange={(value) => setAddedItems((previous) => previous.map((added) => added.key === item.key ? { ...added, quantity: Number(value) } : added))}
                  isDisabled={!canEditItems}
                  className="w-24"
                  variant="bordered"
                  radius="lg"
                  classNames={{ ...inputClassNames, inputWrapper: inputClassNames.inputWrapper.replace('min-h-11 h-11', 'min-h-9 h-9') }}
                />
                <span className="min-w-24 text-end text-[11px] font-bold text-brand-text">{formatToman(item.price * item.quantity, isPersian)}</span>
              </div>
              <Button
                type="button"
                isIconOnly
                size="sm"
                variant="light"
                isDisabled={!canEditItems || itemCount <= 1}
                aria-label={isPersian ? `حذف ${item.title} از سفارش` : `Remove ${item.title} from order`}
                onPress={() => setItemPendingDelete({ kind: 'added', key: item.key, title: item.title })}
                className="h-9 w-9 min-w-9 shrink-0 rounded-xl text-rose-500 transition-colors hover:bg-rose-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {itemCount <= 1 && (
            <p className="text-[10px] text-brand-text-muted">
              {isPersian ? 'برای حفظ اعتبار سفارش، حداقل یک قلم باید باقی بماند.' : 'At least one item must remain in the order.'}
            </p>
          )}
        </div>
      </section>

      {isPersian && (
        <p className="text-[11px] text-brand-text-muted">
          قیمت کالای اضافه‌شده بر اساس قیمت فعلی آن ثبت می‌شود؛ قیمت اقلام قبلی همان قیمت زمان خرید باقی می‌ماند.
        </p>
      )}

      <section className="space-y-2 rounded-2xl border border-brand-border bg-brand-surface-elevated/25 p-4 sm:p-5">
        <Textarea
          label={isPersian ? 'یادداشت داخلی تغییرات (اختیاری)' : 'Internal change note (optional)'}
          labelPlacement="outside-top"
          dir={isPersian ? 'rtl' : 'ltr'}
          value={adminNote}
          onValueChange={setAdminNote}
          minRows={2}
          maxLength={1000}
          placeholder={isPersian ? 'توضیح کوتاه برای پنل مدیریت…' : 'Add a short note for the admin panel…'}
          variant="bordered"
          radius="lg"
          classNames={{ ...inputClassNames, inputWrapper: `${inputClassNames.inputWrapper} py-2` }}
        />
        <p className="text-[10px] leading-5 text-brand-text-muted">
          {isPersian ? 'این یادداشت فقط برای مدیران نمایش داده می‌شود و برای مشتری ارسال نمی‌شود.' : 'Only administrators can see this note. It is not sent to the customer.'}
        </p>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-brand-border pt-4">
        <Button type="button" variant="flat" onPress={onCancel} startContent={<X className="h-4 w-4" />} className="h-10 rounded-xl bg-brand-surface-elevated px-4 text-xs font-bold text-brand-text">
          {isPersian ? 'انصراف' : 'Cancel'}
        </Button>
        <Button type="submit" isLoading={isSaving} startContent={!isSaving && <Check className="h-4 w-4" />} className="h-10 rounded-xl bg-brand-gold px-5 text-xs font-black text-[#141914]">
          {isPersian ? 'ذخیره تغییرات' : 'Save changes'}
        </Button>
      </div>

      <AdminConfirmModal
        isOpen={itemPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setItemPendingDelete(null);
        }}
        title={isPersian ? 'حذف قلم سفارش' : 'Remove order item'}
        description={isPersian
          ? <>آیا از حذف <strong>«{itemPendingDelete?.title || 'این قلم'}»</strong> از سفارش اطمینان دارید؟</>
          : <>Remove <strong>&quot;{itemPendingDelete?.title || 'this item'}&quot;</strong> from this order?</>}
        confirmText={isPersian ? 'حذف از سفارش' : 'Remove item'}
        cancelText={isPersian ? 'انصراف' : 'Cancel'}
        confirmColor="danger"
        onConfirm={confirmRemoveItem}
      />
    </form>
  );
}
