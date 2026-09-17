'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
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
import { ShoppingBag, Search, Eye, Truck, CheckCircle2, X } from 'lucide-react';
import { adminApi } from '@/common/api/admin';
import { IOrder } from '@/common/interfaces';
import { formatToman, toPersianDigits, toast } from '@/common/utils';
import { useTranslation } from '@/common/i18n';

export default function AdminOrdersPage() {
  const { isPersian } = useTranslation();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // View / Edit Modal
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
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
    setNewStatus(order.status);
    setTrackingCode(order.trackingCode || '');
    setModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setSubmitting(true);
    try {
      await adminApi.updateOrderStatus(selectedOrder._id, newStatus, trackingCode.trim());
      toast.success(isPersian ? 'وضعیت سفارش با موفقیت به‌روزرسانی شد.' : 'Order status updated successfully.');
      setModalOpen(false);
      loadOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isPersian ? 'خطا در تغییر وضعیت سفارش.' : 'Failed to update order status.'));
    } finally {
      setSubmitting(false);
    }
  };

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

  const statusOptions = [
    { id: '', label: isPersian ? 'همه وضعیت‌ها' : 'All Statuses' },
    { id: 'pending', label: isPersian ? 'در انتظار پرداخت' : 'Pending' },
    { id: 'processing', label: isPersian ? 'در حال پردازش' : 'Processing' },
    { id: 'shipped', label: isPersian ? 'تحویل پست شده' : 'Shipped' },
    { id: 'delivered', label: isPersian ? 'تحویل داده شده' : 'Delivered' },
    { id: 'cancelled', label: isPersian ? 'لغو شده' : 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
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
            value={search}
            onValueChange={setSearch}
            placeholder={isPersian ? 'جستجو بر اساس شماره سفارش یا نام مشتری...' : 'Search by order number or customer...'}
            startContent={<Search className="w-4 h-4 text-brand-text-muted shrink-0" />}
            variant="bordered"
            radius="full"
            className="w-full sm:w-80"
            classNames={{
              inputWrapper: "h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 rounded-full shadow-xs transition-colors",
              input: "text-xs font-semibold text-brand-text",
            }}
          />

          <Select
            aria-label={isPersian ? 'فیلتر وضعیت' : 'Status Filter'}
            selectedKeys={new Set([statusFilter])}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              setStatusFilter(selected ?? '');
            }}
            variant="bordered"
            radius="full"
            className="w-full sm:w-48"
            classNames={{
              trigger: "h-11 px-4 bg-brand-surface-elevated border border-brand-border hover:border-brand-gold/80 rounded-full shadow-xs text-xs font-bold text-brand-text text-start",
              value: "text-xs font-bold text-brand-text text-start",
              popoverContent: "bg-brand-surface border border-brand-border text-brand-text rounded-2xl shadow-xl",
            }}
          >
            {statusOptions.map((opt) => (
              <SelectItem key={opt.id} textValue={opt.label}>
                {opt.label}
              </SelectItem>
            ))}
          </Select>
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
                {orders.map((order) => (
                  <TableRow key={order._id}>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
      </motion.div>

      {/* Order Details & Status Modal */}
      <Modal
        isOpen={modalOpen}
        onOpenChange={setModalOpen}
        backdrop="blur"
        placement="center"
        classNames={{
          base: "bg-brand-surface border border-brand-border text-brand-text rounded-3xl shadow-2xl max-w-xl mx-4",
          header: "border-b border-brand-border pb-3",
          body: "py-5",
          footer: "border-t border-brand-border pt-3",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="font-black text-base text-brand-text">
                  {selectedOrder && (isPersian
                    ? `جزئیات سفارش #${toPersianDigits(selectedOrder.orderNumber)}`
                    : `Order Details #${selectedOrder.orderNumber}`)}
                </h3>
                {selectedOrder && (
                  <span className="text-[11px] text-brand-text-muted font-normal">
                    {new Date(selectedOrder.createdAt).toLocaleDateString(isPersian ? 'fa-IR' : 'en-US')}
                  </span>
                )}
              </ModalHeader>

              <ModalBody className="space-y-4">
                {selectedOrder && (
                  <>
                    {/* Order Items List */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-xs text-brand-text-muted">
                        {isPersian ? 'اقلام سفارش داده شده:' : 'Ordered Items:'}
                      </h4>
                      <div className="p-3 rounded-2xl bg-brand-surface-elevated border border-brand-border divide-y divide-brand-border">
                        {selectedOrder.items?.map((item: any, idx: number) => (
                          <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-bold text-brand-text">{item.title}</div>
                              {item.selectedAttributes && (
                                <div className="text-[10px] text-brand-text-muted">{item.selectedAttributes}</div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-brand-bronze dark:text-brand-gold">
                                {isPersian
                                  ? `${toPersianDigits(item.quantity)} × ${formatToman(item.price, isPersian)}`
                                  : `${item.quantity} × ${formatToman(item.price, isPersian)}`}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Address Details */}
                    {selectedOrder.deliveryAddress && (
                      <div className="p-4 rounded-2xl bg-brand-surface-elevated border border-brand-border text-xs space-y-1">
                        <div className="font-bold text-brand-text">
                          {isPersian ? 'تحویل‌گیرنده:' : 'Recipient:'} {selectedOrder.deliveryAddress.fullName} ({selectedOrder.deliveryAddress.phone})
                        </div>
                        <div className="text-brand-text-muted">
                          {selectedOrder.deliveryAddress.province}، {selectedOrder.deliveryAddress.city} — {selectedOrder.deliveryAddress.addressDetail}
                        </div>
                      </div>
                    )}

                    {/* Status Update Form Elements */}
                    <div className="space-y-4 pt-2 border-t border-brand-border">
                      <Select
                        label={isPersian ? 'تغییر وضعیت سفارش' : 'Update Status'}
                        labelPlacement="outside"
                        aria-label={isPersian ? 'تغییر وضعیت' : 'Update Status'}
                        selectedKeys={new Set([newStatus])}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as string;
                          if (selected) setNewStatus(selected);
                        }}
                        variant="bordered"
                        radius="full"
                        disallowEmptySelection
                        classNames={{
                          trigger: "h-11 px-4 bg-brand-surface-elevated border border-brand-border rounded-full text-xs font-bold text-brand-text text-start shadow-xs",
                          value: "text-xs font-bold text-brand-text text-start",
                          label: "text-xs font-bold text-brand-text mb-1",
                          popoverContent: "bg-brand-surface border border-brand-border text-brand-text rounded-2xl shadow-xl",
                        }}
                      >
                        <SelectItem key="pending" textValue={isPersian ? 'در انتظار پرداخت' : 'Pending'}>
                          {isPersian ? 'در انتظار پرداخت' : 'Pending'}
                        </SelectItem>
                        <SelectItem key="processing" textValue={isPersian ? 'در حال پردازش' : 'Processing'}>
                          {isPersian ? 'در حال پردازش' : 'Processing'}
                        </SelectItem>
                        <SelectItem key="shipped" textValue={isPersian ? 'تحویل پست شده' : 'Shipped'}>
                          {isPersian ? 'تحویل پست شده' : 'Shipped'}
                        </SelectItem>
                        <SelectItem key="delivered" textValue={isPersian ? 'تحویل داده شده' : 'Delivered'}>
                          {isPersian ? 'تحویل داده شده' : 'Delivered'}
                        </SelectItem>
                        <SelectItem key="cancelled" textValue={isPersian ? 'لغو شده' : 'Cancelled'}>
                          {isPersian ? 'لغو شده' : 'Cancelled'}
                        </SelectItem>
                      </Select>

                      <Input
                        label={isPersian ? 'کد رهگیری پستی (۲۴ رقمی)' : 'Postal Tracking Code'}
                        labelPlacement="outside"
                        value={trackingCode}
                        onValueChange={setTrackingCode}
                        placeholder="مثال: ۱۲۳۴۵۶۷۸۹۰۱۲۳۴"
                        variant="bordered"
                        radius="full"
                        classNames={{
                          inputWrapper: "h-11 px-4 bg-brand-surface-elevated border border-brand-border rounded-full shadow-xs",
                          input: "text-xs font-mono font-semibold text-brand-text",
                          label: "text-xs font-bold text-brand-text mb-1",
                        }}
                      />
                    </div>
                  </>
                )}
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="flat"
                  radius="full"
                  onPress={onClose}
                  className="bg-brand-surface-elevated border border-brand-border text-brand-text font-bold text-xs rounded-full cursor-pointer"
                >
                  {isPersian ? 'انصراف' : 'Cancel'}
                </Button>
                <Button
                  onPress={handleUpdateStatus as any}
                  isLoading={submitting}
                  radius="full"
                  className="bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md rounded-full cursor-pointer transition-all active:scale-95"
                >
                  {isPersian ? 'ثبت و ارسال پیامک به مشتری' : 'Update & Notify Customer'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
