'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@heroui/react';
import { Check, Trash2, X } from 'lucide-react';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { Input, Textarea } from '@/components/common/DirectionalFields';
import { adminApi } from '@/common/api/admin';
import type { IAdminOrderUpdate, IOrder } from '@/common/interfaces';
import { formatToman, toast } from '@/common/utils';

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
  const [itemPendingDelete, setItemPendingDelete] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDeliveryAddress(order.deliveryAddress);
    setRemovedIndexes([]);
    setItemPendingDelete(null);
  }, [order]);

  const updateAddress = (key: keyof IOrder['deliveryAddress'], value: string) => {
    setDeliveryAddress((previous) => ({ ...previous, [key]: value }));
  };

  const confirmRemoveItem = () => {
    if (itemPendingDelete === null) return;
    setRemovedIndexes((previous) => previous.includes(itemPendingDelete)
      ? previous
      : [...previous, itemPendingDelete]);
    setItemPendingDelete(null);
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

    const payload: IAdminOrderUpdate = {
      version: order.__v ?? 0,
      removeItemIndexes: [...removedIndexes].sort((a, b) => a - b),
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
      toast.success(isPersian
        ? 'مشخصات گیرنده و اقلام سفارش ذخیره شد.'
        : 'Recipient details and order items saved.');
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
    dir: 'auto' | 'ltr' | 'rtl' = 'auto',
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
          {textField(isPersian ? 'استان' : 'Province', deliveryAddress.province, (value) => updateAddress('province', value))}
          {textField(isPersian ? 'شهر' : 'City', deliveryAddress.city, (value) => updateAddress('city', value))}
          {textField(isPersian ? 'کد پستی' : 'Postal code', deliveryAddress.postalCode || '', (value) => updateAddress('postalCode', value), 'ltr')}
          {textField(isPersian ? 'پلاک' : 'Building number', deliveryAddress.buildingNumber || '', (value) => updateAddress('buildingNumber', value))}
          {textField(isPersian ? 'واحد' : 'Unit', deliveryAddress.unit || '', (value) => updateAddress('unit', value))}
          <div className="sm:col-span-2 lg:col-span-3">
            <Textarea
              label={isPersian ? 'نشانی دقیق' : 'Full address'}
              labelPlacement="outside-top"
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
            {isPersian
              ? 'جزئیات و قیمت اقلام قابل ویرایش نیست؛ حذف هر قلم با تأیید انجام می‌شود.'
              : 'Item details and prices are read-only. Each removal requires confirmation.'}
          </p>
        </div>

        <div className="space-y-2.5">
          {visibleItems.map(({ item, index }) => (
            <div key={`${item.product}-${index}`} className="flex min-w-0 items-center gap-3 rounded-xl border border-brand-border bg-brand-surface p-3">
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
                  {isPersian
                    ? `${item.quantity} عدد × ${formatToman(item.price, true)}`
                    : `${item.quantity} × ${formatToman(item.price, false)}`}
                </p>
              </div>
              <span className="shrink-0 text-[11px] font-bold text-brand-text">
                {formatToman(item.price * item.quantity, isPersian)}
              </span>
              <Button
                type="button"
                isIconOnly
                size="sm"
                variant="light"
                isDisabled={visibleItems.length <= 1}
                aria-label={isPersian ? `حذف ${item.title} از سفارش` : `Remove ${item.title} from order`}
                onPress={() => setItemPendingDelete(index)}
                className="h-9 w-9 min-w-9 shrink-0 rounded-xl text-rose-500 transition-colors hover:bg-rose-500/10 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {visibleItems.length <= 1 && (
            <p className="text-[10px] text-brand-text-muted">
              {isPersian ? 'برای حفظ اعتبار سفارش، حداقل یک قلم باید باقی بماند.' : 'At least one item must remain in the order.'}
            </p>
          )}
        </div>
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
          ? <>آیا از حذف <strong>«{itemPendingDelete === null ? '' : order.items[itemPendingDelete]?.title || 'این قلم'}»</strong> از سفارش اطمینان دارید؟</>
          : <>Remove <strong>&quot;{itemPendingDelete === null ? '' : order.items[itemPendingDelete]?.title || 'this item'}&quot;</strong> from this order?</>}
        confirmText={isPersian ? 'حذف از سفارش' : 'Remove item'}
        cancelText={isPersian ? 'انصراف' : 'Cancel'}
        confirmColor="danger"
        onConfirm={confirmRemoveItem}
      />
    </form>
  );
}
