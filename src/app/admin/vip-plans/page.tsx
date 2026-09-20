'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Skeleton,
} from '@heroui/react';
import { Crown, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { adminApi } from '@/common/api/admin';
import { IVipPlan } from '@/common/interfaces';
import { formatToman, toPersianDigits, toast } from '@/common/utils';
import { useTranslation } from '@/common/i18n';
import { SmoothSwitch } from '@/components/admin/SmoothSwitch';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';

export default function AdminVipPlansPage() {
  const { isPersian, isRTL } = useTranslation();
  const [plans, setPlans] = useState<IVipPlan[]>([]);

  const vipInputClassNames = {
    label: `text-xs font-bold text-brand-text mb-1.5 block ${isRTL ? 'text-right' : 'text-left'}`,
    inputWrapper:
      'h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold hover:!border-[#d4be9b] rounded-2xl shadow-xs transition-colors',
    input: 'text-xs font-semibold text-brand-text text-start',
  };

  const vipTextareaClassNames = {
    label: `text-xs font-bold text-brand-text mb-1.5 block ${isRTL ? 'text-right' : 'text-left'}`,
    inputWrapper:
      'p-3.5 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 focus-within:!border-brand-gold hover:!border-[#d4be9b] rounded-2xl shadow-xs transition-colors min-h-[84px] !resize-none',
    input: 'text-xs font-medium text-brand-text text-start',
  };

  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<IVipPlan | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(390000);
  const [durationDays, setDurationDays] = useState<number>(30);
  const [discountPercent, setDiscountPercent] = useState<number>(5);
  const [perks, setPerks] = useState<string[]>([]);
  const [perkInput, setPerkInput] = useState('');
  const [badgeColor, setBadgeColor] = useState('#bfa27a');
  const [isPopular, setIsPopular] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getVipPlans();
      setPlans(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setTitle('');
    setTitleEn('');
    setDescription('');
    setPrice(490000);
    setDurationDays(30);
    setDiscountPercent(5);
    setPerks([
      'ارسال رایگان تمام سفارش‌ها',
      'تخفیف ۵٪ ثابت روی کلیه کالاها',
      '۲ عدد تستر رایگان عطر نیش در هر خرید',
    ]);
    setBadgeColor('#bfa27a');
    setIsPopular(false);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (plan: IVipPlan) => {
    setEditingPlan(plan);
    setTitle(plan.title);
    setTitleEn(plan.titleEn || '');
    setDescription(plan.description);
    setPrice(plan.price);
    setDurationDays(plan.durationDays);
    setDiscountPercent(plan.discountPercent);
    setPerks(plan.perks || []);
    setBadgeColor(plan.badgeColor || '#bfa27a');
    setIsPopular(plan.isPopular || false);
    setIsActive(plan.isActive);
    setModalOpen(true);
  };

  const addPerk = () => {
    if (!perkInput.trim()) return;
    setPerks([...perks, perkInput.trim()]);
    setPerkInput('');
  };

  const removePerk = (idx: number) => {
    setPerks(perks.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      toast.error(isPersian ? 'عنوان پلن الزامی است.' : 'Plan title is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        titleEn: titleEn.trim() || undefined,
        description: description.trim() || '',
        price: Number(price),
        durationDays: Number(durationDays),
        discountPercent: Number(discountPercent),
        perks,
        badgeColor,
        isPopular,
        isActive,
      };

      if (editingPlan) {
        await adminApi.updateVipPlan(editingPlan._id, payload);
        toast.success(isPersian ? 'پلن با موفقیت به‌روزرسانی شد.' : 'Plan updated successfully.');
      } else {
        await adminApi.createVipPlan(payload);
        toast.success(isPersian ? 'پلن جدید با موفقیت ایجاد شد.' : 'Plan created successfully.');
      }

      setModalOpen(false);
      loadPlans();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در ذخیره پلن.' : 'Failed to save plan.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (plan: IVipPlan, nextStatus: boolean) => {
    setPlans((prev) =>
      prev.map((p) => (p._id === plan._id ? { ...p, isActive: nextStatus } : p))
    );
    try {
      await adminApi.updateVipPlan(plan._id, {
        title: plan.title,
        price: plan.price,
        durationDays: plan.durationDays,
        discountPercent: plan.discountPercent,
        isActive: nextStatus,
      });
      toast.success(
        nextStatus
          ? isPersian ? 'پلن با موفقیت فعال شد.' : 'VIP Plan activated.'
          : isPersian ? 'پلن غیرفعال شد.' : 'VIP Plan deactivated.'
      );
    } catch (err: any) {
      setPlans((prev) =>
        prev.map((p) => (p._id === plan._id ? { ...p, isActive: !nextStatus } : p))
      );
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در تغییر وضعیت.' : 'Failed to toggle status.'));
    }
  };

  const handleDeleteClick = (id: string, planTitle: string) => {
    setPlanToDelete({ id, title: planTitle });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!planToDelete) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteVipPlan(planToDelete.id);
      toast.success(isPersian ? 'پلن با موفقیت حذف شد.' : 'Plan deleted successfully.');
      setDeleteModalOpen(false);
      setPlanToDelete(null);
      loadPlans();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در حذف پلن.' : 'Failed to delete plan.'));
    } finally {
      setIsDeleting(false);
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
            {isPersian ? 'مدیریت پلن‌های اشتراک ویژه VIP' : 'VIP Membership Plans'}
          </h1>
          <p className="text-xs text-brand-text-muted mt-1">
            {isPersian
              ? 'ایجاد و ویرایش اشتراک‌های اختصاصی اعضای ویژه با درصد تخفیف و مزایای خاص'
              : 'Configure membership tiers with exclusive discounts and perks'}
          </p>
        </div>

        <Button
          onPress={openCreateModal}
          startContent={<Plus className="w-4 h-4" />}
          radius="full"
          className="h-11 px-5 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md shadow-brand-gold/20 cursor-pointer rounded-full transition-all active:scale-95"
        >
          {isPersian ? 'تعریف پلن اشتراک جدید' : 'Create VIP Plan'}
        </Button>
      </motion.div>

      {/* Plans Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-3xl bg-brand-surface-elevated" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card className="p-12 text-center bg-brand-surface rounded-3xl border border-brand-border space-y-3">
          <CardBody className="flex flex-col items-center">
            <Crown className="w-12 h-12 text-brand-bronze mx-auto opacity-40 mb-3" />
            <h3 className="font-bold text-sm text-brand-text">
              {isPersian ? 'هنوز هیچ پلن عضویتی تعریف نشده است' : 'No VIP plans created yet'}
            </h3>
          </CardBody>
        </Card>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 overflow-visible"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
          }}
        >
          <AnimatePresence>
            {plans.map((plan) => (
              <motion.div
                key={plan._id}
                variants={{
                  hidden: { opacity: 0, y: 20, scale: 0.97 },
                  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 360, damping: 28 } },
                }}
                layout
                className="overflow-visible"
              >
              <Card
                className={`relative bg-brand-surface rounded-3xl p-6 border shadow-xs flex flex-col justify-between space-y-4 hover:border-brand-gold transition-colors group h-full overflow-visible ${
                  plan.isPopular ? 'border-brand-gold/80 ring-1 ring-brand-gold/40' : 'border-brand-border'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-brand-gold text-[#141914] text-[10px] font-black uppercase tracking-wider shadow-sm whitespace-nowrap">
                    {isPersian ? 'محبوب‌ترین انتخاب' : 'Most Popular'}
                  </div>
                )}

                <CardBody className="p-0 flex flex-col justify-between h-full space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-2xl bg-brand-gold/20 flex items-center justify-center border border-brand-gold/30 text-brand-bronze dark:text-brand-gold shadow-xs">
                        <Crown className="w-5 h-5 fill-current" />
                      </div>
                      <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-brand-surface-elevated text-brand-text border border-brand-border">
                        {isPersian ? `${toPersianDigits(plan.durationDays)} روزه` : `${plan.durationDays} Days`}
                      </span>
                    </div>

                    <h3 className="font-black text-lg text-brand-text">
                      {isPersian ? plan.title : plan.titleEn || plan.title}
                    </h3>
                    {isPersian && plan.titleEn ? (
                      <div className="text-xs text-brand-text-muted font-sans">
                        {plan.titleEn}
                      </div>
                    ) : !isPersian && plan.title ? (
                      <div className="text-xs text-brand-text-muted">
                        {plan.title}
                      </div>
                    ) : null}
                    <p className="text-xs text-brand-text-muted mt-1 line-clamp-2">
                      {isPersian ? plan.description : plan.descriptionEn || plan.description}
                    </p>

                    <div className="mt-4 pt-4 border-t border-brand-border">
                      <div className="text-2xl font-black text-brand-text dark:text-brand-gold">
                        {formatToman(plan.price, isPersian)}
                      </div>
                      <div className="text-[11px] font-bold text-brand-bronze dark:text-brand-gold mt-0.5">
                        {isPersian
                          ? `تخفیف دائمی ${toPersianDigits(plan.discountPercent)}٪ روی کالاها`
                          : `${plan.discountPercent}% permanent discount on items`}
                      </div>
                    </div>

                    {/* Perks */}
                    {((isPersian ? plan.perks : (plan.perksEn && plan.perksEn.length > 0 ? plan.perksEn : plan.perks)) || []).length > 0 && (
                      <div className="mt-4 space-y-1.5">
                        {(isPersian ? plan.perks : (plan.perksEn && plan.perksEn.length > 0 ? plan.perksEn : plan.perks)).map((p, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs text-brand-text-muted">
                            <Check className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold shrink-0" />
                            <span className="line-clamp-1">{p}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-brand-border flex items-center justify-between">
                    <SmoothSwitch
                      size="sm"
                      isSelected={plan.isActive}
                      onValueChange={(val) => handleToggleStatus(plan, val)}
                    >
                      <span className={`text-[11px] font-bold ${plan.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-text-muted'}`}>
                        {plan.isActive ? (isPersian ? 'فعال' : 'Active') : (isPersian ? 'غیرفعال' : 'Inactive')}
                      </span>
                    </SmoothSwitch>

                    <div className="flex items-center gap-1.5">
                      <Button
                        isIconOnly
                        size="sm"
                        radius="full"
                        variant="light"
                        onPress={() => openEditModal(plan)}
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
                        onPress={() => handleDeleteClick(plan._id, plan.title)}
                        className="text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        aria-label={isPersian ? 'حذف' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modal Dialog */}
      <Modal
        isOpen={modalOpen}
        onOpenChange={setModalOpen}
        backdrop="blur"
        placement="center"
        scrollBehavior="inside"
        size="2xl"
        classNames={{
          base: "bg-brand-surface border border-brand-border text-brand-text rounded-3xl shadow-2xl mx-4",
          header: "border-b border-brand-border pb-3 px-6 pt-5",
          body: "py-5 px-6",
          footer: "border-t border-brand-border pt-3 px-6 pb-5",
        }}
      >
        <ModalContent dir={isRTL ? 'rtl' : 'ltr'}>
          {(onClose) => (
            <>
              <ModalHeader className="font-black text-base">
                {editingPlan
                  ? isPersian ? 'ویرایش پلن اشتراک VIP' : 'Edit VIP Plan'
                  : isPersian ? 'تعریف پلن اشتراک جدید' : 'New VIP Plan'}
              </ModalHeader>

              <ModalBody className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={isPersian ? 'عنوان فارسی پلن' : 'Plan Title (Persian)'}
                    labelPlacement="outside-top"
                    isRequired
                    value={title}
                    onValueChange={setTitle}
                    placeholder={isPersian ? 'مثال: اشتراک طلایی ۱ ماهه' : 'e.g. 1-Month Gold VIP'}
                    variant="bordered"
                    classNames={vipInputClassNames}
                  />

                  <Input
                    label={isPersian ? 'عنوان انگلیسی پلن' : 'Plan Title (English)'}
                    labelPlacement="outside-top"
                    value={titleEn}
                    onValueChange={setTitleEn}
                    placeholder="e.g. 1-Month Gold VIP"
                    dir="ltr"
                    variant="bordered"
                    classNames={{
                      ...vipInputClassNames,
                      input: 'text-xs font-semibold text-brand-text text-left font-sans',
                    }}
                  />
                </div>

                <Textarea
                  label={isPersian ? 'توضیحات کوتاه' : 'Short Description'}
                  labelPlacement="outside-top"
                  minRows={2}
                  maxRows={4}
                  value={description}
                  onValueChange={setDescription}
                  placeholder={isPersian ? 'توضیح کوتاه در مورد مزایای این پلن...' : 'Short description...'}
                  variant="bordered"
                  classNames={vipTextareaClassNames}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label={isPersian ? 'قیمت (تومان)' : 'Price (Toman)'}
                    labelPlacement="outside-top"
                    type="number"
                    value={String(price)}
                    onValueChange={(v) => setPrice(Number(v) || 0)}
                    variant="bordered"
                    classNames={{
                      ...vipInputClassNames,
                      input: 'text-xs font-bold text-brand-text text-start font-mono',
                    }}
                  />

                  <Input
                    label={isPersian ? 'مدت (روز)' : 'Days'}
                    labelPlacement="outside-top"
                    type="number"
                    value={String(durationDays)}
                    onValueChange={(v) => setDurationDays(Number(v) || 0)}
                    variant="bordered"
                    classNames={{
                      ...vipInputClassNames,
                      input: 'text-xs font-bold text-brand-text text-start font-mono',
                    }}
                  />

                  <Input
                    label={isPersian ? 'درصد تخفیف' : 'Discount %'}
                    labelPlacement="outside-top"
                    type="number"
                    value={String(discountPercent)}
                    onValueChange={(v) => setDiscountPercent(Number(v) || 0)}
                    variant="bordered"
                    classNames={{
                      ...vipInputClassNames,
                      input: 'text-xs font-bold text-brand-text text-start font-mono',
                    }}
                  />
                </div>

                {/* Perks List */}
                <div>
                  <label className={vipInputClassNames.label}>
                    {isPersian ? 'مزایای پلن (سفارشی)' : 'Plan Perks'}
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={perkInput}
                      onValueChange={setPerkInput}
                      placeholder={isPersian ? 'مثال: ارسال رایگان، هدیه تستر' : 'e.g. Free shipping, 2 tester vials'}
                      variant="bordered"
                      className="flex-1"
                      classNames={vipInputClassNames}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addPerk();
                        }
                      }}
                    />
                    <Button
                      onPress={addPerk}
                      variant="flat"
                      className="h-12 px-5 bg-brand-surface-elevated text-brand-bronze dark:text-brand-gold border border-brand-border hover:border-brand-gold/80 hover:text-brand-gold font-bold text-xs rounded-2xl cursor-pointer transition-colors shrink-0"
                    >
                      {isPersian ? 'افزودن' : 'Add'}
                    </Button>
                  </div>

                  {perks.length > 0 && (
                    <div className="space-y-1.5 p-3 rounded-2xl bg-brand-surface-elevated border border-brand-border">
                      {perks.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs font-semibold text-brand-text gap-2">
                          <span className="text-start flex-1">• {p}</span>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            radius="full"
                            onPress={() => removePerk(idx)}
                            className="text-rose-500 hover:text-rose-700 min-w-6 w-6 h-6 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-3.5 rounded-2xl bg-brand-surface-elevated border border-brand-border flex items-center justify-between">
                    <SmoothSwitch isSelected={isPopular} onValueChange={setIsPopular}>
                      <span className="text-xs font-bold text-brand-text">
                        {isPersian ? 'برچسب محبوب‌ترین' : 'Popular Badge'}
                      </span>
                    </SmoothSwitch>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-brand-surface-elevated border border-brand-border flex items-center justify-between">
                    <SmoothSwitch isSelected={isActive} onValueChange={setIsActive}>
                      <span className="text-xs font-bold text-brand-text">
                        {isPersian ? 'پلن فعال باشد' : 'Plan is Active'}
                      </span>
                    </SmoothSwitch>
                  </div>
                </div>
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="flat"
                  onPress={onClose}
                  className="bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 text-brand-text font-bold text-xs rounded-2xl cursor-pointer transition-all active:scale-95 px-5 h-11"
                >
                  {isPersian ? 'انصراف' : 'Cancel'}
                </Button>
                <Button
                  isLoading={submitting}
                  onPress={() => handleSubmit()}
                  className="bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md rounded-2xl cursor-pointer transition-all active:scale-95 px-6 h-11"
                >
                  {isPersian ? 'ذخیره پلن VIP' : 'Save VIP Plan'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* HeroUI Delete Confirmation Modal */}
      <AdminConfirmModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title={isPersian ? 'حذف پلن اشتراک VIP' : 'Delete VIP Plan'}
        description={
          isPersian ? (
            <div>
              <p>
                آیا از حذف پلن اشتراک <strong className="text-brand-text font-black">«{planToDelete?.title}»</strong> اطمینان دارید؟
              </p>
              <p className="mt-2 text-xs text-rose-500 font-medium">
                کاربران با اشتراک فعال تا پایان مهلت اعتبار خود دسترسی خواهند داشت اما خرید این پلن دیگر ممکن نخواهد بود.
              </p>
            </div>
          ) : (
            <div>
              <p>
                Are you sure you want to delete VIP plan <strong className="text-brand-text font-bold">&quot;{planToDelete?.title}&quot;</strong>?
              </p>
              <p className="mt-2 text-xs text-rose-500 font-medium">
                Users with active subscriptions will retain access until expiration, but new purchases will be disabled.
              </p>
            </div>
          )
        }
        confirmText={isPersian ? 'بله، حذف پلن' : 'Yes, Delete Plan'}
        cancelText={isPersian ? 'انصراف' : 'Cancel'}
        confirmColor="danger"
        icon={<Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
