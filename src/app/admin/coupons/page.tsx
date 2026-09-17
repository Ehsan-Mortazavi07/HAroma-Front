'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardBody,
  Button,
  Input,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Skeleton,
} from '@heroui/react';
import { Ticket, Plus, Edit2, Trash2 } from 'lucide-react';
import { adminApi } from '@/common/api/admin';
import { ICoupon } from '@/common/interfaces';
import { formatToman, toPersianDigits, toast } from '@/common/utils';
import { useTranslation } from '@/common/i18n';
import { SmoothSwitch } from '@/components/admin/SmoothSwitch';

export default function AdminCouponsPage() {
  const { isPersian } = useTranslation();
  const [coupons, setCoupons] = useState<ICoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<ICoupon | null>(null);

  // Form
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [minPurchase, setMinPurchase] = useState<number>(200000);
  const [maxDiscount, setMaxDiscount] = useState<number>(300000);
  const [usageLimit, setUsageLimit] = useState<number>(100);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCoupons();
      setCoupons(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode('');
    setDiscountPercent(15);
    setDiscountAmount(0);
    setMinPurchase(300000);
    setMaxDiscount(250000);
    setUsageLimit(500);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (c: ICoupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDiscountPercent(c.discountPercent || 0);
    setDiscountAmount(c.discountAmount || 0);
    setMinPurchase(c.minPurchase || 0);
    setMaxDiscount(c.maxDiscount || 0);
    setUsageLimit(c.usageLimit || 100);
    setIsActive(c.isActive);
    setModalOpen(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) {
      toast.error(isPersian ? 'کد تخفیف الزامی است.' : 'Coupon code is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        discountPercent: Number(discountPercent) || undefined,
        discountAmount: Number(discountAmount) || undefined,
        minPurchase: Number(minPurchase) || 0,
        maxDiscount: Number(maxDiscount) || undefined,
        usageLimit: Number(usageLimit) || 100,
        isActive,
      };

      if (editingCoupon) {
        await adminApi.updateCoupon(editingCoupon._id, payload);
        toast.success(isPersian ? 'کد تخفیف با موفقیت به‌روزرسانی شد.' : 'Coupon updated successfully.');
      } else {
        await adminApi.createCoupon(payload);
        toast.success(isPersian ? 'کد تخفیف جدید ایجاد گردید.' : 'Coupon created successfully.');
      }

      setModalOpen(false);
      loadCoupons();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در ذخیره کد تخفیف.' : 'Failed to save coupon.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, couponCode: string) => {
    if (!confirm(isPersian ? `آیا از حذف کد تخفیف «${couponCode}» اطمینان دارید؟` : `Are you sure you want to delete coupon "${couponCode}"?`)) return;

    try {
      await adminApi.deleteCoupon(id);
      toast.success(isPersian ? 'کد تخفیف با موفقیت حذف شد.' : 'Coupon deleted successfully.');
      loadCoupons();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در حذف کد تخفیف.' : 'Failed to delete coupon.'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-black text-brand-text">
            {isPersian ? 'مدیریت کدهای تخفیف و پروموشن‌ها' : 'Discount Coupons Management'}
          </h1>
          <p className="text-xs text-brand-text-muted mt-1">
            {isPersian
              ? 'ایجاد کدهای درصدی یا مبلغی با تعیین سقف تخفیف و حداقل خرید'
              : 'Create percentage or fixed discount coupons with usage limits'}
          </p>
        </div>

        <Button
          onPress={openCreateModal}
          startContent={<Plus className="w-4 h-4" />}
          radius="full"
          className="h-11 px-5 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md shadow-brand-gold/20 cursor-pointer rounded-full transition-all active:scale-95"
        >
          {isPersian ? 'تعریف کد تخفیف جدید' : 'Add New Coupon'}
        </Button>
      </motion.div>

      {/* Coupons Table */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
      <Card className="bg-brand-surface rounded-3xl border border-brand-border shadow-xs overflow-hidden">
        <CardBody className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-2xl bg-brand-surface-elevated" />
              ))}
            </div>
          ) : coupons.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Ticket className="w-12 h-12 text-brand-bronze mx-auto opacity-40" />
              <h3 className="font-bold text-sm text-brand-text">
                {isPersian ? 'هنوز کد تخفیفی ایجاد نشده است' : 'No coupons created yet'}
              </h3>
            </div>
          ) : (
            <Table
              aria-label="Coupons Table"
              classNames={{
                wrapper: "p-0 bg-transparent shadow-none border-none overflow-x-auto",
                th: "bg-brand-surface-elevated text-brand-text-muted font-bold text-xs py-4 px-4 first:pr-6 last:pl-6",
                td: "py-4 px-4 text-xs font-semibold first:pr-6 last:pl-6",
                tr: "border-b border-brand-border hover:bg-brand-surface-elevated/60 transition-colors",
              }}
            >
              <TableHeader>
                <TableColumn>{isPersian ? 'کد تخفیف' : 'Coupon Code'}</TableColumn>
                <TableColumn>{isPersian ? 'میزان تخفیف' : 'Discount Rate'}</TableColumn>
                <TableColumn>{isPersian ? 'حداقل خرید' : 'Min Purchase'}</TableColumn>
                <TableColumn>{isPersian ? 'حداکثر تخفیف' : 'Max Discount'}</TableColumn>
                <TableColumn>{isPersian ? 'تعداد استفاده' : 'Usage Limit'}</TableColumn>
                <TableColumn>{isPersian ? 'وضعیت' : 'Status'}</TableColumn>
                <TableColumn className="text-center">{isPersian ? 'عملیات' : 'Actions'}</TableColumn>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon._id}>
                    <TableCell className="font-mono font-black text-sm text-brand-bronze dark:text-brand-gold">
                      {coupon.code}
                    </TableCell>

                    <TableCell className="font-bold text-brand-text">
                      {coupon.discountPercent
                        ? isPersian ? `${toPersianDigits(coupon.discountPercent)}٪ درصدی` : `${coupon.discountPercent}%`
                        : formatToman(coupon.discountAmount, isPersian)}
                    </TableCell>

                    <TableCell className="text-brand-text-muted">
                      {formatToman(coupon.minPurchase, isPersian)}
                    </TableCell>

                    <TableCell className="text-brand-text-muted">
                      {coupon.maxDiscount ? formatToman(coupon.maxDiscount, isPersian) : (isPersian ? 'بدون سقف' : 'No Limit')}
                    </TableCell>

                    <TableCell className="text-brand-text-muted">
                      {isPersian
                        ? `${toPersianDigits(coupon.usedCount || 0)} از ${toPersianDigits(coupon.usageLimit)}`
                        : `${coupon.usedCount || 0} of ${coupon.usageLimit}`}
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        className={
                          coupon.isActive
                            ? 'bg-brand-gold/20 text-brand-bronze dark:text-brand-gold border border-brand-gold/40 font-black'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-bold'
                        }
                      >
                        {coupon.isActive ? (isPersian ? 'فعال' : 'Active') : (isPersian ? 'غیرفعال' : 'Inactive')}
                      </Chip>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          radius="full"
                          variant="light"
                          onPress={() => openEditModal(coupon)}
                          className="text-brand-text hover:bg-brand-surface-elevated cursor-pointer"
                          aria-label={isPersian ? 'ویرایش' : 'Edit'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          isIconOnly
                          size="sm"
                          radius="full"
                          variant="light"
                          onPress={() => handleDelete(coupon._id, coupon.code)}
                          className="text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                          aria-label={isPersian ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
      </motion.div>

      {/* Modal Dialog */}
      <Modal
        isOpen={modalOpen}
        onOpenChange={setModalOpen}
        backdrop="blur"
        placement="center"
        classNames={{
          base: "bg-brand-surface border border-brand-border text-brand-text rounded-3xl shadow-2xl max-w-md mx-4",
          header: "border-b border-brand-border pb-3",
          body: "py-4",
          footer: "border-t border-brand-border pt-3",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="font-black text-base">
                {editingCoupon
                  ? isPersian ? 'ویرایش کد تخفیف' : 'Edit Coupon'
                  : isPersian ? 'تعریف کد تخفیف جدید' : 'New Coupon'}
              </ModalHeader>

              <ModalBody className="space-y-4">
                <Input
                  label={isPersian ? 'کد تخفیف (لاتین و بدون فاصله)' : 'Coupon Code (Latin)'}
                  labelPlacement="outside"
                  isRequired
                  value={code}
                  onValueChange={(v) => setCode(v.toUpperCase())}
                  placeholder="مثال: NOURUZ1405"
                  variant="bordered"
                  radius="full"
                  classNames={{
                    inputWrapper: "h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold font-mono font-bold uppercase rounded-full shadow-xs",
                    input: "text-xs font-semibold text-brand-text",
                    label: "text-xs font-bold text-brand-text mb-1",
                  }}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={isPersian ? 'درصد تخفیف (۱ تا ۱۰۰)' : 'Discount %'}
                    labelPlacement="outside"
                    type="number"
                    value={String(discountPercent)}
                    onValueChange={(v) => setDiscountPercent(Number(v) || 0)}
                    variant="bordered"
                    radius="full"
                    classNames={{
                      inputWrapper: "h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold rounded-full shadow-xs",
                      input: "text-xs font-bold text-brand-text",
                      label: "text-xs font-bold text-brand-text mb-1",
                    }}
                  />

                  <Input
                    label={isPersian ? 'یا مبلغ ثابت (تومان)' : 'Or Fixed Amount (Toman)'}
                    labelPlacement="outside"
                    type="number"
                    value={String(discountAmount)}
                    onValueChange={(v) => setDiscountAmount(Number(v) || 0)}
                    variant="bordered"
                    radius="full"
                    classNames={{
                      inputWrapper: "h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold rounded-full shadow-xs",
                      input: "text-xs font-bold text-brand-text",
                      label: "text-xs font-bold text-brand-text mb-1",
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={isPersian ? 'حداقل خرید (تومان)' : 'Min Purchase'}
                    labelPlacement="outside"
                    type="number"
                    value={String(minPurchase)}
                    onValueChange={(v) => setMinPurchase(Number(v) || 0)}
                    variant="bordered"
                    radius="full"
                    classNames={{
                      inputWrapper: "h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold rounded-full shadow-xs",
                      input: "text-xs font-bold text-brand-text",
                      label: "text-xs font-bold text-brand-text mb-1",
                    }}
                  />

                  <Input
                    label={isPersian ? 'سقف تخفیف (تومان)' : 'Max Discount'}
                    labelPlacement="outside"
                    type="number"
                    value={String(maxDiscount)}
                    onValueChange={(v) => setMaxDiscount(Number(v) || 0)}
                    variant="bordered"
                    radius="full"
                    classNames={{
                      inputWrapper: "h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold rounded-full shadow-xs",
                      input: "text-xs font-bold text-brand-text",
                      label: "text-xs font-bold text-brand-text mb-1",
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <Input
                    label={isPersian ? 'حداکثر دفعات استفاده' : 'Usage Limit'}
                    labelPlacement="outside"
                    type="number"
                    value={String(usageLimit)}
                    onValueChange={(v) => setUsageLimit(Number(v) || 0)}
                    variant="bordered"
                    radius="full"
                    classNames={{
                      inputWrapper: "h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 rounded-full shadow-xs transition-colors",
                      input: "text-xs font-bold text-brand-text",
                      label: "text-xs font-bold text-brand-text mb-1",
                    }}
                  />

                  <div className="pt-2">
                    <SmoothSwitch isSelected={isActive} onValueChange={setIsActive}>
                      {isPersian ? 'کد تخفیف فعال باشد' : 'Coupon is Active'}
                    </SmoothSwitch>
                  </div>
                </div>
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="flat"
                  radius="full"
                  onPress={onClose}
                  className="font-bold text-xs rounded-full cursor-pointer"
                >
                  {isPersian ? 'انصراف' : 'Cancel'}
                </Button>
                <Button
                  isLoading={submitting}
                  radius="full"
                  onPress={() => handleSubmit()}
                  className="bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md rounded-full cursor-pointer transition-all active:scale-95"
                >
                  {isPersian ? 'ذخیره کد تخفیف' : 'Save Coupon'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
