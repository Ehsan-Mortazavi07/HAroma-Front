'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Eye, Edit2, X, CheckCircle2, Truck, Clock } from 'lucide-react';
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
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold bg-[#f0eae0] text-[#9f815b] dark:bg-[#283228] dark:text-[#d4be9b] border border-[#bfa27a]/30 whitespace-nowrap leading-none">
            {isPersian ? 'در حال پردازش' : 'Processing'}
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold bg-[#f8f5f0] text-[#7a5d3e] dark:bg-[#242c24] dark:text-[#d4be9b] border border-[#e6dcce] dark:border-[#2e3a2e] gap-1.5 whitespace-nowrap leading-none">
            <Truck className="w-3.5 h-3.5" />
            <span>{isPersian ? 'تحویل پست شده' : 'Shipped'}</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold bg-[#e6dcce] text-[#1d241d] dark:bg-[#2e3a2e] dark:text-[#f7f4ee] gap-1.5 whitespace-nowrap leading-none">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#9f815b]" />
            <span>{isPersian ? 'تحویل داده شده' : 'Delivered'}</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 whitespace-nowrap leading-none">
            {isPersian ? 'لغو شده' : 'Cancelled'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold bg-[#f8f5f0] text-[#73695c] dark:bg-[#242c24] dark:text-[#a69c8e] whitespace-nowrap leading-none">
            {isPersian ? 'در انتظار' : 'Pending'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#1d241d] dark:text-[#f7f4ee]">
          {isPersian ? 'مدیریت و پیگیری سفارشات مشتریان' : 'Orders Management'}
        </h1>
        <p className="text-xs text-[#73695c] dark:text-[#a69c8e] mt-1">
          {isPersian
            ? `مجموعاً ${toPersianDigits(total)} سفارش در سیستم ثبت گردیده است`
            : `Total of ${total} orders recorded in system`}
        </p>
      </div>

      {/* Toolbar: Search & Filter */}
      <div className="bg-[#ffffff] dark:bg-[#1c231c] p-4 rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isPersian ? 'جستجو بر اساس شماره سفارش یا نام مشتری...' : 'Search by order number or customer...'}
            className="w-full h-11 pr-10 pl-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-semibold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a]"
          />
          <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-[#73695c] dark:text-[#a69c8e]" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto h-11 px-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs font-bold text-[#1d241d] dark:text-[#f7f4ee] focus:ring-2 focus:ring-[#bfa27a] cursor-pointer"
        >
          <option value="">{isPersian ? 'همه وضعیت‌ها' : 'All Statuses'}</option>
          <option value="pending">{isPersian ? 'در انتظار پرداخت' : 'Pending'}</option>
          <option value="processing">{isPersian ? 'در حال پردازش' : 'Processing'}</option>
          <option value="shipped">{isPersian ? 'تحویل پست شده' : 'Shipped'}</option>
          <option value="delivered">{isPersian ? 'تحویل داده شده' : 'Delivered'}</option>
          <option value="cancelled">{isPersian ? 'لغو شده' : 'Cancelled'}</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#73695c] dark:text-[#a69c8e]">
            {isPersian ? 'در حال بارگذاری لیست سفارشات...' : 'Loading orders list...'}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-[#9f815b] mx-auto opacity-40" />
            <h3 className="font-bold text-sm text-[#1d241d] dark:text-[#f7f4ee]">
              {isPersian ? 'سفارشی یافت نشد' : 'No orders found'}
            </h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="bg-[#f8f5f0] dark:bg-[#242c24] border-b border-[#e6dcce] dark:border-[#2e3a2e] text-[#73695c] dark:text-[#a69c8e] font-bold">
                  <th className="py-4 px-6">{isPersian ? 'شماره سفارش' : 'Order ID'}</th>
                  <th className="py-4 px-4">{isPersian ? 'نام تحویل‌گیرنده' : 'Customer'}</th>
                  <th className="py-4 px-4">{isPersian ? 'اقلام' : 'Items'}</th>
                  <th className="py-4 px-4">{isPersian ? 'مبلغ کل' : 'Total Amount'}</th>
                  <th className="py-4 px-4">{isPersian ? 'روش پرداخت' : 'Payment'}</th>
                  <th className="py-4 px-4">{isPersian ? 'وضعیت' : 'Status'}</th>
                  <th className="py-4 px-4">{isPersian ? 'کد رهگیری' : 'Tracking Code'}</th>
                  <th className="py-4 px-6 text-center">{isPersian ? 'عملیات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6dcce] dark:divide-[#2e3a2e]">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-[#f8f5f0] dark:hover:bg-[#242c24] transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-[#9f815b] dark:text-[#d4be9b]">
                      {isPersian ? toPersianDigits(order.orderNumber) : order.orderNumber}
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-[#1d241d] dark:text-[#f7f4ee]">
                        {order.deliveryAddress?.fullName || 'کاربر مهمان'}
                      </div>
                      <div className="text-[11px] text-[#73695c] dark:text-[#a69c8e]">
                        {order.deliveryAddress?.phone || '—'}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-[#73695c] dark:text-[#a69c8e]">
                      {isPersian
                        ? `${toPersianDigits(order.items?.length || 0)} قلم کالا`
                        : `${order.items?.length || 0} items`}
                    </td>

                    <td className="py-4 px-4 font-black text-[#1d241d] dark:text-[#d4be9b]">
                      {formatToman(order.total, isPersian)}
                    </td>

                    <td className="py-4 px-4 text-[#73695c] dark:text-[#a69c8e]">
                      {order.paymentMethod === 'online'
                        ? isPersian ? 'آنلاین شتاب' : 'Online'
                        : order.paymentMethod === 'installment'
                        ? isPersian ? 'اقساطی' : 'Installment'
                        : isPersian ? 'در محل' : 'COD'}
                    </td>

                    <td className="py-4 px-4">{getStatusBadge(order.status)}</td>

                    <td className="py-4 px-4 font-mono text-[11px] text-[#73695c] dark:text-[#a69c8e]">
                      {order.trackingCode || '—'}
                    </td>

                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => openOrderModal(order)}
                        className="px-3 py-1.5 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] text-[#1d241d] dark:text-[#f7f4ee] hover:bg-[#e6dcce] dark:hover:bg-[#2e382e] border border-[#e6dcce] dark:border-[#2e3a2e] font-bold text-[11px] flex items-center gap-1.5 mx-auto transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#9f815b]" />
                        <span>{isPersian ? 'بررسی / تغییر وضعیت' : 'Inspect'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details & Status Modal */}
      {modalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#ffffff] dark:bg-[#1c231c] text-[#1d241d] dark:text-[#f7f4ee] rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-[#e6dcce] dark:border-[#2e3a2e] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
              <div>
                <h3 className="font-black text-base">
                  {isPersian
                    ? `جزئیات سفارش #${toPersianDigits(selectedOrder.orderNumber)}`
                    : `Order Details #${selectedOrder.orderNumber}`}
                </h3>
                <span className="text-[11px] text-[#73695c] dark:text-[#a69c8e]">
                  {new Date(selectedOrder.createdAt).toLocaleDateString(isPersian ? 'fa-IR' : 'en-US')}
                </span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-[#73695c] hover:bg-[#f0eae0] dark:hover:bg-[#283228]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Order Items List */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-[#73695c] dark:text-[#a69c8e]">
                {isPersian ? 'اقلام سفارش داده شده:' : 'Ordered Items:'}
              </h4>
              <div className="p-3 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] divide-y divide-[#e6dcce] dark:divide-[#2e3a2e]">
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-[#1d241d] dark:text-[#f7f4ee]">{item.title}</div>
                      {item.selectedAttributes && (
                        <div className="text-[10px] text-[#73695c] dark:text-[#a69c8e]">{item.selectedAttributes}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-[#9f815b] dark:text-[#d4be9b]">
                        {isPersian ? `${toPersianDigits(item.quantity)} × ${formatToman(item.price, isPersian)}` : `${item.quantity} × ${formatToman(item.price, isPersian)}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address Details */}
            {selectedOrder.deliveryAddress && (
              <div className="p-4 rounded-2xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] text-xs space-y-1">
                <div className="font-bold text-[#1d241d] dark:text-[#f7f4ee]">
                  {isPersian ? 'تحویل‌گیرنده:' : 'Recipient:'} {selectedOrder.deliveryAddress.fullName} ({selectedOrder.deliveryAddress.phone})
                </div>
                <div className="text-[#73695c] dark:text-[#a69c8e]">
                  {selectedOrder.deliveryAddress.province}، {selectedOrder.deliveryAddress.city} — {selectedOrder.deliveryAddress.addressDetail}
                </div>
              </div>
            )}

            {/* Status Update Form */}
            <form onSubmit={handleUpdateStatus} className="space-y-4 pt-2 border-t border-[#e6dcce] dark:border-[#2e3a2e] text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">
                    {isPersian ? 'تغییر وضعیت سفارش' : 'Update Status'}
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-bold focus:ring-2 focus:ring-[#bfa27a]"
                  >
                    <option value="pending">{isPersian ? 'در انتظار پرداخت' : 'Pending'}</option>
                    <option value="processing">{isPersian ? 'در حال پردازش' : 'Processing'}</option>
                    <option value="shipped">{isPersian ? 'تحویل پست شده' : 'Shipped'}</option>
                    <option value="delivered">{isPersian ? 'تحویل داده شده' : 'Delivered'}</option>
                    <option value="cancelled">{isPersian ? 'لغو شده' : 'Cancelled'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    {isPersian ? 'کد رهگیری پستی (۲۴ رقمی)' : 'Postal Tracking Code'}
                  </label>
                  <input
                    type="text"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="مثال: ۱۲۳۴۵۶۷۸۹۰۱۲۳۴"
                    className="w-full h-11 px-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] border border-[#e6dcce] dark:border-[#2e3a2e] font-mono focus:ring-2 focus:ring-[#bfa27a]"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl font-black bg-brand-gold hover:bg-[#d4be9b] text-[#141914] shadow-md transition-all duration-200 ease-out active:scale-98"
                >
                  {submitting
                    ? isPersian ? 'در حال ثبت...' : 'Saving...'
                    : isPersian ? 'ثبت و ارسال پیامک به مشتری' : 'Update & Notify Customer'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-[#f8f5f0] dark:bg-[#242c24] font-bold border border-[#e6dcce] dark:border-[#2e3a2e]"
                >
                  {isPersian ? 'بستن' : 'Close'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
