'use client';

import { Input } from '@/components/common/DirectionalFields';
import React, { useState, useEffect } from 'react';
import {
  motion,
  AnimatePresence } from 'framer-motion';
import {
  Card,
  CardBody,
  Button,
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
import {
  ShoppingBag,
  Search,
  Eye,
  Truck,
  CheckCircle2,
  X,
  Package,
  Check,
  Trash2,
} from 'lucide-react';
import { adminApi } from '@/common/api/admin';
import { IOrder } from '@/common/interfaces';
import { formatToman, toPersianDigits, toast } from '@/common/utils';
import { useTranslation } from '@/common/i18n';
import { SmoothCheckbox } from '@/components/admin/SmoothCheckbox';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { OrderDetailsPanel } from '@/components/common/OrderDetailsPanel';
import { OrderEditForm } from '@/components/admin/OrderEditForm';
import { OrderStatusSelect } from '@/components/admin/OrderStatusSelect';
import { useAppSelector } from '@/stores/hooks';

export default function AdminOrdersPage() {
  const { isPersian } = useTranslation();
  const currentUser = useAppSelector((state) => state.auth.user);
  const isAdmin = currentUser?.role === 'admin';

  const [orders, setOrders] = useState<IOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Multi-selection & Bulk action state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // HeroUI Confirm Modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    description: React.ReactNode;
    confirmText: string;
    action: () => Promise<void>;
  } | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  // View / Edit Modal
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [adminChangeNotesByOrder, setAdminChangeNotesByOrder] = useState<Record<string, IOrder['adminChangeNotes']>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditingFullOrder, setIsEditingFullOrder] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [shippingProvider, setShippingProvider] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getOrders({
        page,
        pageSize: 15,
        status: statusFilter || undefined,
        q: search || undefined,
      });
      setOrders(res?.items || []);
      setTotal(res?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter, search]);

  const openOrderModal = (order: IOrder) => {
    setSelectedOrder(order);
    setIsEditingFullOrder(false);
    setNewStatus(order.status);
    setTrackingCode(order.trackingCode || '');
    setShippingProvider(order.shippingProvider || '');
    setTrackingUrl(order.trackingUrl || '');
    setModalOpen(true);
    if (isAdmin && !Object.prototype.hasOwnProperty.call(adminChangeNotesByOrder, order._id)) {
      void adminApi.getOrderAdminChangeNotes(order._id)
        .then((notes) => setAdminChangeNotesByOrder((previous) => ({ ...previous, [order._id]: notes })))
        .catch(() => toast.error(isPersian ? 'یادداشت داخلی سفارش بارگذاری نشد.' : 'Could not load internal order notes.'));
    }
  };

  const handleUpdateStatus = async (e?: any) => {
    if (e && typeof e?.preventDefault === 'function') {
      e.preventDefault();
    }
    if (!selectedOrder) return;

    const orderId = selectedOrder._id || (selectedOrder as any).id;
    if (!orderId) {
      toast.error(isPersian ? 'شناسه سفارش نامعتبر است.' : 'Invalid order ID.');
      return;
    }

    if (!newStatus) {
      toast.error(isPersian ? 'لطفاً وضعیت سفارش را انتخاب کنید.' : 'Please select an order status.');
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.updateOrderStatus(orderId, {
        status: newStatus,
        trackingCode: trackingCode.trim(),
        shippingProvider: shippingProvider.trim(),
        trackingUrl: trackingUrl.trim(),
      });
      toast.success(isPersian ? 'وضعیت سفارش با موفقیت به‌روزرسانی شد.' : 'Order status updated successfully.');
      setModalOpen(false);
      loadOrders();
    } catch (err: any) {
      console.error('Failed to update order status:', err);
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در تغییر وضعیت سفارش.' : 'Failed to update order status.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(orders.map((o) => o._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Bulk status change (Processing, Shipped, Delivered, Cancelled)
  const handleBulkStatusChange = async (status: string, statusLabel: string) => {
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (selectedIds.includes(o._id) ? { ...o, status: status as any } : o)),
    );
    try {
      await adminApi.bulkUpdateOrdersStatus(selectedIds, status);
      toast.success(
        isPersian
          ? `وضعیت ${toPersianDigits(selectedIds.length)} سفارش با موفقیت به «${statusLabel}» تغییر یافت.`
          : `Status of ${selectedIds.length} orders updated to "${statusLabel}".`,
      );
      setSelectedIds([]);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          (isPersian ? 'خطا در تغییر وضعیت گروهی سفارشات.' : 'Failed to update orders status.'),
      );
      loadOrders();
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Bulk delete (Admin only)
  const handleBulkDelete = () => {
    if (!isAdmin) {
      toast.error(
        isPersian ? 'حذف سفارش منحصراً برای مدیر کل مجاز است.' : 'Restricted to admin.',
      );
      return;
    }
    if (selectedIds.length === 0) return;

    setConfirmConfig({
      title: isPersian ? 'حذف گروهی سفارشات' : 'Bulk Delete Orders',
      description: isPersian ? (
        <div>
          <p>
            آیا از حذف گروهی <strong className="text-brand-text font-black">{toPersianDigits(selectedIds.length)}</strong> سفارش انتخاب شده اطمینان کامل دارید؟
          </p>
          <p className="mt-2 text-xs text-rose-500 font-medium">
            این سفارشات از سیستم فروشگاه حذف خواهند شد.
          </p>
        </div>
      ) : (
        <div>
          <p>
            Are you sure you want to delete <strong className="text-brand-text font-bold">{selectedIds.length}</strong> selected orders?
          </p>
          <p className="mt-2 text-xs text-rose-500 font-medium">
            These orders will be permanently removed.
          </p>
        </div>
      ),
      confirmText: isPersian ? 'بله، حذف گروهی' : 'Yes, Delete All',
      action: async () => {
        setBulkActionLoading(true);
        try {
          await adminApi.bulkDeleteOrders(selectedIds);
          toast.success(
            isPersian
              ? `${toPersianDigits(selectedIds.length)} سفارش با موفقیت حذف گردید.`
              : `${selectedIds.length} orders deleted successfully.`,
          );
          setSelectedIds([]);
          loadOrders();
        } catch (err: any) {
          toast.error(
            err?.response?.data?.message ||
              (isPersian ? 'خطا در حذف گروهی سفارشات.' : 'Failed to delete orders.'),
          );
        } finally {
          setBulkActionLoading(false);
        }
      },
    });
    setConfirmModalOpen(true);
  };

  // Single order delete (Admin only)
  const handleDeleteOrder = (id: string, orderNumber: string) => {
    if (!isAdmin) {
      toast.error(
        isPersian ? 'حذف سفارش منحصراً برای مدیر کل مجاز است.' : 'Restricted to admin.',
      );
      return;
    }

    setConfirmConfig({
      title: isPersian ? 'حذف سفارش' : 'Delete Order',
      description: isPersian ? (
        <div>
          <p>
            آیا از حذف سفارش <strong className="text-brand-text font-black">{orderNumber}</strong> اطمینان دارید؟
          </p>
          <p className="mt-2 text-xs text-rose-500 font-medium">
            این عملیات غیرقابل بازگشت است و سفارش به طور کامل از دیتابیس پاک خواهد شد.
          </p>
        </div>
      ) : (
        <div>
          <p>
            Are you sure you want to delete order <strong className="text-brand-text font-bold">{orderNumber}</strong>?
          </p>
          <p className="mt-2 text-xs text-rose-500 font-medium">
            This action is permanent and will remove the order from the database.
          </p>
        </div>
      ),
      confirmText: isPersian ? 'بله، حذف سفارش' : 'Yes, Delete Order',
      action: async () => {
        try {
          await adminApi.deleteOrder(id);
          toast.success(isPersian ? 'سفارش با موفقیت حذف گردید.' : 'Order deleted successfully.');
          setSelectedIds((prev) => prev.filter((item) => item !== id));
          if (modalOpen && selectedOrder?._id === id) {
            setModalOpen(false);
          }
          loadOrders();
        } catch (err: any) {
          toast.error(
            err?.response?.data?.message ||
              (isPersian ? 'خطا در حذف سفارش.' : 'Failed to delete order.'),
          );
        }
      },
    });
    setConfirmModalOpen(true);
  };

  const executeConfirmAction = async () => {
    if (!confirmConfig) return;
    setIsConfirmLoading(true);
    try {
      await confirmConfig.action();
      setConfirmModalOpen(false);
      setConfirmConfig(null);
    } finally {
      setIsConfirmLoading(false);
    }
  };

  const isAllSelected = orders.length > 0 && selectedIds.length === orders.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < orders.length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return (
          <Chip size="sm" variant="flat" color="warning" className="font-bold text-[11px]">
            {isPersian ? 'در حال پردازش' : 'Processing'}
          </Chip>
        );
      case 'shipped':
        return (
          <Chip
            size="sm"
            variant="flat"
            color="primary"
            startContent={<Truck className="w-3.5 h-3.5 ml-1" />}
            className="font-bold text-[11px]"
          >
            {isPersian ? 'تحویل پست شده' : 'Shipped'}
          </Chip>
        );
      case 'delivered':
        return (
          <Chip
            size="sm"
            variant="flat"
            color="success"
            startContent={<CheckCircle2 className="w-3.5 h-3.5 ml-1" />}
            className="font-bold text-[11px]"
          >
            {isPersian ? 'تحویل داده شده' : 'Delivered'}
          </Chip>
        );
      case 'cancelled':
        return (
          <Chip size="sm" variant="flat" color="danger" className="font-bold text-[11px]">
            {isPersian ? 'لغو شده' : 'Cancelled'}
          </Chip>
        );
      default:
        return (
          <Chip size="sm" variant="flat" className="font-bold text-[11px] bg-brand-surface-elevated text-brand-text-muted">
            {isPersian ? 'در انتظار' : 'Pending'}
          </Chip>
        );
    }
  };

  return (
    <div dir={isPersian ? 'rtl' : 'ltr'} className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-2xl font-black text-brand-text">
          {isPersian ? 'مدیریت و پیگیری سفارشات مشتریان' : 'Orders Management'}
        </h1>
        <p className="text-xs text-brand-text-muted mt-1">
          {isPersian
            ? `مجموعاً ${toPersianDigits(total)} سفارش در سیستم ثبت گردیده است`
            : `Total of ${total} orders recorded in system`}
        </p>
      </motion.div>

      {/* Toolbar: Search & Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      >
      <Card className="bg-brand-surface p-4 rounded-3xl border border-brand-border shadow-xs overflow-visible">
        <CardBody className="p-0 flex flex-col sm:flex-row gap-3 items-center justify-between overflow-visible">
          <Input
            dir="auto"
            value={search}
            onValueChange={setSearch}
            placeholder={isPersian ? 'جستجو بر اساس شماره سفارش یا نام مشتری...' : 'Search by order number or customer...'}
            startContent={<Search className="w-4 h-4 text-brand-text-muted shrink-0" />}
            variant="bordered"
            radius="full"
            className="w-full sm:w-80"
            classNames={{
              inputWrapper: "h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 rounded-full shadow-xs transition-colors",
              input: "text-sm font-semibold text-brand-text",
            }}
          />

          {/* Custom Status Filter Dropdown */}
          <OrderStatusSelect
            value={statusFilter as '' | IOrder['status']}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            isPersian={isPersian}
            includeAll
            className="w-full sm:w-52"
          />
        </CardBody>
      </Card>
      </motion.div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
      <Card className="bg-brand-surface rounded-3xl border border-brand-border shadow-xs overflow-hidden">
        <CardBody className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-2xl bg-brand-surface-elevated" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-brand-bronze mx-auto opacity-40" />
              <h3 className="font-bold text-sm text-brand-text">
                {isPersian ? 'سفارشی یافت نشد' : 'No orders found'}
              </h3>
            </div>
          ) : (
            <Table
              aria-label="Orders Table"
              classNames={{
                wrapper: "p-0 bg-transparent shadow-none border-none overflow-x-auto",
                th: "bg-brand-surface-elevated text-brand-text-muted font-bold text-xs py-4 px-4 first:pr-6 last:pl-6",
                td: "py-4 px-4 text-xs font-semibold first:pr-6 last:pl-6",
                tr: "border-b border-brand-border hover:bg-brand-surface-elevated/60 transition-colors",
              }}
            >
              <TableHeader>
                <TableColumn className="w-10 text-center">
                  <div className="flex items-center justify-center">
                    <SmoothCheckbox
                      isSelected={isAllSelected}
                      isIndeterminate={isIndeterminate}
                      onValueChange={handleSelectAll}
                      size="sm"
                      ariaLabel={isPersian ? 'انتخاب همه' : 'Select all'}
                    />
                  </div>
                </TableColumn>
                <TableColumn>{isPersian ? 'شماره سفارش' : 'Order ID'}</TableColumn>
                <TableColumn>{isPersian ? 'نام تحویل‌گیرنده' : 'Customer'}</TableColumn>
                <TableColumn>{isPersian ? 'اقلام' : 'Items'}</TableColumn>
                <TableColumn>{isPersian ? 'مبلغ کل' : 'Total Amount'}</TableColumn>
                <TableColumn>{isPersian ? 'روش پرداخت' : 'Payment'}</TableColumn>
                <TableColumn>{isPersian ? 'وضعیت' : 'Status'}</TableColumn>
                <TableColumn>{isPersian ? 'کد رهگیری' : 'Tracking Code'}</TableColumn>
                <TableColumn className="text-center">{isPersian ? 'عملیات' : 'Actions'}</TableColumn>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const isSelected = selectedIds.includes(order._id);
                  return (
                    <TableRow key={order._id} className={isSelected ? 'bg-brand-gold/10' : ''}>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <SmoothCheckbox
                            isSelected={isSelected}
                            onValueChange={() => handleSelectRow(order._id)}
                            size="sm"
                            ariaLabel={order.orderNumber}
                          />
                        </div>
                      </TableCell>

                      <TableCell className="font-bold text-brand-bronze dark:text-brand-gold">
                      {isPersian ? toPersianDigits(order.orderNumber) : order.orderNumber}
                    </TableCell>

                    <TableCell>
                      <div className="font-bold text-brand-text">
                        {order.deliveryAddress?.fullName || 'کاربر مهمان'}
                      </div>
                      <div className="text-[11px] text-brand-text-muted">
                        {order.deliveryAddress?.phone || '—'}
                      </div>
                    </TableCell>

                    <TableCell className="text-brand-text-muted">
                      {isPersian
                        ? `${toPersianDigits(order.items?.length || 0)} قلم کالا`
                        : `${order.items?.length || 0} items`}
                    </TableCell>

                    <TableCell className="font-black text-brand-text">
                      {formatToman(order.total, isPersian)}
                    </TableCell>

                    <TableCell className="text-brand-text-muted">
                      {order.paymentMethod === 'online'
                        ? isPersian ? 'آنلاین شتاب' : 'Online'
                        : order.paymentMethod === 'installment'
                        ? isPersian ? 'اقساطی' : 'Installment'
                        : isPersian ? 'در محل' : 'COD'}
                    </TableCell>

                    <TableCell>{getStatusBadge(order.status)}</TableCell>

                    <TableCell className="font-mono text-[11px] text-brand-text-muted">
                      {order.trackingCode || '—'}
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          size="sm"
                          variant="flat"
                          radius="full"
                          onPress={() => openOrderModal(order)}
                          className="h-8 px-3 rounded-xl bg-brand-surface-elevated text-brand-text hover:bg-brand-border/60 border border-brand-border font-bold text-[11px] cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-brand-bronze dark:text-brand-gold" />
                          <span>{isPersian ? 'بررسی' : 'Inspect'}</span>
                        </Button>
                        {isAdmin && (
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            radius="full"
                            onPress={() => handleDeleteOrder(order._id, order.orderNumber)}
                            className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
                            aria-label={isPersian ? 'حذف سفارش' : 'Delete order'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
      </motion.div>

      {/* Order Details & Status Modal */}
      <Modal
        isOpen={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setIsEditingFullOrder(false);
          }
        }}
        backdrop="blur"
        placement="center"
        classNames={{
          base: "bg-brand-surface border border-brand-border text-brand-text rounded-3xl shadow-2xl max-w-5xl mx-4 max-h-[92vh] overflow-hidden",
          header: "border-b border-brand-border pb-3",
          body: "py-5 max-h-[72vh] overflow-y-auto",
          footer: "border-t border-brand-border pt-3",
        }}
      >
        <ModalContent dir={isPersian ? 'rtl' : 'ltr'}>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="font-black text-base text-brand-text">
                  {selectedOrder && (isEditingFullOrder
                    ? (isPersian ? `ویرایش کامل سفارش #${toPersianDigits(selectedOrder.orderNumber)}` : `Edit order #${selectedOrder.orderNumber}`)
                    : isPersian
                      ? `جزئیات سفارش #${toPersianDigits(selectedOrder.orderNumber)}`
                      : `Order Details #${selectedOrder.orderNumber}`)}
                </h3>
                {selectedOrder && (
                  <span className="text-[11px] text-brand-text-muted font-normal">
                    {new Date(selectedOrder.createdAt).toLocaleDateString(isPersian ? 'fa-IR' : 'en-US')}
                  </span>
                )}
              </ModalHeader>

              <ModalBody className="admin-details-scroll min-h-0 space-y-5 overflow-y-auto">
                {selectedOrder && (
                  isEditingFullOrder ? (
                    <OrderEditForm
                      order={selectedOrder}
                      isPersian={isPersian}
                      onCancel={() => setIsEditingFullOrder(false)}
                      onSaved={(updatedOrder) => {
                        setSelectedOrder(updatedOrder);
                        setAdminChangeNotesByOrder((previous) => ({
                          ...previous,
                          [updatedOrder._id]: updatedOrder.adminChangeNotes || previous[updatedOrder._id] || [],
                        }));
                        setOrders((previous) => previous.map((order) => order._id === updatedOrder._id ? updatedOrder : order));
                        setIsEditingFullOrder(false);
                        void loadOrders();
                      }}
                    />
                  ) : (
                  <>
                    <OrderDetailsPanel
                      order={selectedOrder}
                      isPersian={isPersian}
                      adminChangeNotes={adminChangeNotesByOrder[selectedOrder._id]}
                      headerActions={isAdmin ? (
                        <Button
                          variant="flat"
                          onPress={() => setIsEditingFullOrder(true)}
                          className="h-9 rounded-xl border border-brand-gold/30 bg-brand-gold/10 px-3 text-xs font-black text-brand-bronze dark:text-brand-gold"
                        >
                          {isPersian ? 'ویرایش گیرنده و اقلام' : 'Edit recipient and items'}
                        </Button>
                      ) : null}
                    />

                    {/* Status Update Form Elements */}
                    <div className="space-y-4 pt-2 border-t border-brand-border">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-brand-text">
                          {isPersian ? 'تغییر وضعیت سفارش' : 'Update status'}
                        </label>
                        <OrderStatusSelect
                          value={newStatus as IOrder['status'] | ''}
                          onChange={(value) => setNewStatus(value)}
                          isPersian={isPersian}
                          className="w-full"
                        />
                      </div>

                      <Input
                        dir="auto"
                        label={isPersian ? 'کد رهگیری پستی (۲۴ رقمی)' : 'Postal Tracking Code'}
                        labelPlacement="outside-top"
                        value={trackingCode}
                        onValueChange={setTrackingCode}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleUpdateStatus();
                          }
                        }}
                        placeholder="مثال: ۱۲۳۴۵۶۷۸۹۰۱۲۳۴"
                        variant="bordered"
                        radius="lg"
                        classNames={{
                          inputWrapper:
                            'h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/70 focus-within:!border-brand-gold focus-within:!ring-2 focus-within:!ring-brand-gold/20 rounded-2xl shadow-xs transition-all',
                          input: 'text-sm font-mono font-semibold text-brand-text',
                          label: 'text-xs font-bold text-brand-text mb-1',
                        }}
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          dir="auto"
                          label={isPersian ? 'شرکت حمل یا روش ارسال' : 'Carrier or shipping provider'}
                          labelPlacement="outside-top"
                          value={shippingProvider}
                          onValueChange={setShippingProvider}
                          placeholder={isPersian ? 'مثال: پست، تیپاکس' : 'e.g. National Post'}
                          variant="bordered"
                          radius="lg"
                          classNames={{
                            inputWrapper: 'h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/70 focus-within:!border-brand-gold focus-within:!ring-2 focus-within:!ring-brand-gold/20 rounded-2xl shadow-xs transition-all',
                            input: 'text-sm font-semibold text-brand-text',
                            label: 'text-xs font-bold text-brand-text mb-1',
                          }}
                        />
                        <Input
                          dir="ltr"
                          type="url"
                          label={isPersian ? 'لینک پیگیری مرسوله' : 'Shipment tracking URL'}
                          labelPlacement="outside-top"
                          value={trackingUrl}
                          onValueChange={setTrackingUrl}
                          placeholder="https://..."
                          variant="bordered"
                          radius="lg"
                          classNames={{
                            inputWrapper: 'h-12 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/70 focus-within:!border-brand-gold focus-within:!ring-2 focus-within:!ring-brand-gold/20 rounded-2xl shadow-xs transition-all',
                            input: 'text-sm font-mono font-semibold text-brand-text',
                            label: 'text-xs font-bold text-brand-text mb-1',
                          }}
                        />
                      </div>
                    </div>
                  </>
                  )
                )}
              </ModalBody>

              {!isEditingFullOrder && <ModalFooter className="flex items-center justify-between">
                {isAdmin && selectedOrder ? (
                  <Button
                    variant="light"
                    color="danger"
                    radius="full"
                    onPress={() => handleDeleteOrder(selectedOrder._id, selectedOrder.orderNumber)}
                    className="text-rose-500 hover:bg-rose-500/10 font-bold text-xs"
                    startContent={<Trash2 className="w-4 h-4" />}
                  >
                    {isPersian ? 'حذف سفارش' : 'Delete Order'}
                  </Button>
                ) : <div />}
                <div className="flex items-center gap-2">
                  <Button
                    variant="flat"
                    radius="full"
                    onPress={onClose}
                    className="bg-brand-surface-elevated border border-brand-border text-brand-text font-bold text-xs rounded-full cursor-pointer"
                  >
                    {isPersian ? 'انصراف' : 'Cancel'}
                  </Button>
                  <Button
                    onPress={() => handleUpdateStatus()}
                    isLoading={submitting}
                    radius="full"
                    className="bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md rounded-full cursor-pointer transition-all active:scale-95"
                  >
                    {isPersian ? 'ثبت و ارسال پیامک به مشتری' : 'Update & Notify Customer'}
                  </Button>
                </div>
              </ModalFooter>}
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Zero-Layout-Shift Fixed Floating Bulk Action Island */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <div className="fixed bottom-4 sm:bottom-7 inset-x-0 z-50 flex justify-center pointer-events-none px-3 sm:px-4">
            <motion.div
              initial={{ opacity: 0, y: 36, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 28, scale: 0.94 }}
              transition={{
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="pointer-events-auto bg-[#141a14]/98 dark:bg-[#121812]/98 backdrop-blur-2xl border border-brand-gold/40 shadow-2xl shadow-black/70 rounded-2xl sm:rounded-full p-2.5 sm:p-2 sm:ps-3.5 sm:pe-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 text-[#f7f4ee] w-[calc(100vw-1.5rem)] max-w-md sm:w-auto sm:max-w-none"
            >
              {/* Mobile Top Header: Count + Close Button */}
              <div className="flex sm:hidden items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-gold shrink-0 animate-pulse" />
                  <span className="text-xs font-black text-brand-gold">
                    {isPersian
                      ? `${toPersianDigits(selectedIds.length)} سفارش انتخاب شده`
                      : `${selectedIds.length} orders selected`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-neutral-400 hover:text-[#f7f4ee] active:scale-95 transition-all text-xs font-bold flex items-center gap-1 cursor-pointer py-0.5 px-2 rounded-lg hover:bg-white/10"
                  aria-label={isPersian ? 'لغو انتخاب' : 'Cancel selection'}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{isPersian ? 'انصراف' : 'Cancel'}</span>
                </button>
              </div>

              {/* Desktop Count Badge */}
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <span className="px-3 py-1 rounded-full bg-brand-gold text-[#141914] font-black text-xs shadow-xs flex items-center gap-1.5 shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>
                    {isPersian
                      ? `${toPersianDigits(selectedIds.length)} سفارش انتخاب شده`
                      : `${selectedIds.length} selected`}
                  </span>
                </span>
                <span className="w-px h-5 bg-white/15 shrink-0" />
              </div>

              {/* Action Buttons: Responsive Grid on Mobile, Flex on Desktop */}
              <div
                className={`grid ${
                  isAdmin ? 'grid-cols-4' : 'grid-cols-3'
                } sm:flex sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto`}
              >
                <Button
                  size="sm"
                  radius="full"
                  variant="flat"
                  isLoading={bulkActionLoading}
                  onPress={() => handleBulkStatusChange('processing', isPersian ? 'در حال پردازش' : 'Processing')}
                  className="bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 font-bold text-xs cursor-pointer rounded-full h-8.5 sm:h-8 px-2.5 sm:px-3.5 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {!bulkActionLoading && <Package className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                  <span className="truncate">
                    <span className="sm:hidden">{isPersian ? 'پردازش' : 'Processing'}</span>
                    <span className="hidden sm:inline">{isPersian ? 'در حال پردازش' : 'Processing'}</span>
                  </span>
                </Button>

                <Button
                  size="sm"
                  radius="full"
                  variant="flat"
                  isLoading={bulkActionLoading}
                  onPress={() => handleBulkStatusChange('shipped', isPersian ? 'تحویل پست شده' : 'Shipped')}
                  className="bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 font-bold text-xs cursor-pointer rounded-full h-8.5 sm:h-8 px-2.5 sm:px-3.5 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {!bulkActionLoading && <Truck className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                  <span className="truncate">
                    <span className="sm:hidden">{isPersian ? 'پست' : 'Shipped'}</span>
                    <span className="hidden sm:inline">{isPersian ? 'تحویل پست' : 'Shipped'}</span>
                  </span>
                </Button>

                <Button
                  size="sm"
                  radius="full"
                  variant="flat"
                  isLoading={bulkActionLoading}
                  onPress={() => handleBulkStatusChange('delivered', isPersian ? 'تحویل داده شده' : 'Delivered')}
                  className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs cursor-pointer rounded-full h-8.5 sm:h-8 px-2.5 sm:px-3.5 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {!bulkActionLoading && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  <span className="truncate">
                    <span className="sm:hidden">{isPersian ? 'تحویل' : 'Delivered'}</span>
                    <span className="hidden sm:inline">{isPersian ? 'تحویل شد' : 'Delivered'}</span>
                  </span>
                </Button>

                {isAdmin && (
                  <Button
                    size="sm"
                    radius="full"
                    variant="flat"
                    isLoading={bulkActionLoading}
                    onPress={handleBulkDelete}
                    className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold text-xs cursor-pointer rounded-full h-8.5 sm:h-8 px-2.5 sm:px-3.5 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    {!bulkActionLoading && <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                    <span className="truncate">
                      <span className="sm:hidden">{isPersian ? 'حذف' : 'Delete'}</span>
                      <span className="hidden sm:inline">{isPersian ? 'حذف همگانی' : 'Bulk Delete'}</span>
                    </span>
                  </Button>
                )}

                {/* Desktop Deselect Button */}
                <Button
                  size="sm"
                  radius="full"
                  variant="light"
                  onPress={() => setSelectedIds([])}
                  className="hidden sm:flex text-neutral-400 hover:text-[#f7f4ee] hover:bg-white/10 font-bold text-xs cursor-pointer rounded-full h-8 px-2.5 transition-all items-center gap-1 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{isPersian ? 'انصراف' : 'Deselect'}</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Confirm Modal */}
      <AdminConfirmModal
        isOpen={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        title={confirmConfig?.title || ''}
        description={confirmConfig?.description || null}
        confirmText={confirmConfig?.confirmText || (isPersian ? 'بله، حذف' : 'Yes, Delete')}
        cancelText={isPersian ? 'انصراف' : 'Cancel'}
        confirmColor="danger"
        icon={<Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
        isLoading={isConfirmLoading}
        onConfirm={executeConfirmAction}
      />
    </div>
  );
}
