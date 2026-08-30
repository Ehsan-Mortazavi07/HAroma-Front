'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Crown,
  Package,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { adminApi } from '@/common/api/admin';
import { formatToman, toPersianDigits } from '@/common/utils';
import { PATHS } from '@/common/constants/PATHS';
import { IOrder } from '@/common/interfaces';
import { useTranslation } from '@/common/i18n';

export default function AdminDashboardPage() {
  const { isPersian } = useTranslation();
  const [stats, setStats] = useState({
    totalRevenue: 34500000,
    totalOrders: 14,
    pendingOrders: 3,
    totalUsers: 28,
    totalProducts: 8,
  });
  const [recentOrders, setRecentOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsRes, ordersRes, productsRes] = await Promise.all([
          adminApi.getDashboardStats(),
          adminApi.getOrders({ pageSize: 5 }),
          adminApi.getProducts({ pageSize: 1 }),
        ]);

        if (statsRes) {
          setStats((prev) => ({
            ...prev,
            totalRevenue: statsRes.totalRevenue || prev.totalRevenue,
            totalOrders: statsRes.totalOrders || prev.totalOrders,
            pendingOrders: statsRes.pendingOrders || prev.pendingOrders,
            totalProducts: productsRes.total || prev.totalProducts,
          }));
        }

        if (ordersRes?.items) {
          setRecentOrders(ordersRes.items);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const kpiCards = [
    {
      title: isPersian ? 'فروش کل فروشگاه' : 'Total Revenue',
      value: formatToman(stats.totalRevenue, isPersian),
      subtitle: isPersian ? '+۱۸٪ رشد نسبت به ماه قبل' : '+18% from last month',
      icon: DollarSign,
      color: 'bg-[#bfa27a]/20 text-[#bfa27a] border-[#bfa27a]/30',
    },
    {
      title: isPersian ? 'تعداد کل سفارشات' : 'Total Orders',
      value: isPersian ? `${toPersianDigits(stats.totalOrders)} سفارش` : `${stats.totalOrders} Orders`,
      subtitle: isPersian ? `${toPersianDigits(stats.pendingOrders)} سفارش در حال پردازش` : `${stats.pendingOrders} Processing`,
      icon: ShoppingBag,
      color: 'bg-[#9f815b]/20 text-[#9f815b] border-[#9f815b]/30',
    },
    {
      title: isPersian ? 'محصولات موجود در انبار' : 'Total Products',
      value: isPersian ? `${toPersianDigits(stats.totalProducts)} عطر و کالا` : `${stats.totalProducts} Fragrances`,
      subtitle: isPersian ? 'همگی با ویژگی‌های داینامیک' : 'With dynamic attributes',
      icon: Package,
      color: 'bg-[#d4be9b]/20 text-[#d4be9b] border-[#d4be9b]/30',
    },
    {
      title: isPersian ? 'کاربران و اعضای VIP' : 'Users & VIP Members',
      value: isPersian ? `${toPersianDigits(stats.totalUsers)} کاربر` : `${stats.totalUsers} Users`,
      subtitle: isPersian ? 'دسترسی به تخفیف‌های ویژه' : 'VIP discount access',
      icon: Crown,
      color: 'bg-[#bfa27a]/20 text-[#bfa27a] border-[#bfa27a]/30',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1d241d] dark:text-[#f7f4ee]">
            {isPersian ? 'داشبورد مدیریت و تحلیل فروش هاتف آروما' : 'Hatef Aroma Admin Dashboard'}
          </h1>
          <p className="text-xs text-[#73695c] dark:text-[#a69c8e] mt-1">
            {isPersian
              ? 'وضعیت زنده موجودی، سفارش‌ها، اشتراک‌های ویژه و درآمد فروشگاه'
              : 'Real-time sales, inventory, orders, and VIP memberships analytics'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={PATHS.ADMIN_PRODUCT_NEW}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#bfa27a] to-[#9f815b] text-[#1d241d] font-black text-xs shadow-md shadow-[#9f815b]/20 flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isPersian ? '+ تعریف محصول جدید' : '+ Add New Product'}</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-[#ffffff] dark:bg-[#1c231c] p-6 rounded-3xl border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#73695c] dark:text-[#a69c8e]">{kpi.title}</span>
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#1d241d] dark:text-[#f7f4ee]">
                {kpi.value}
              </div>
              <div className="text-[11px] font-semibold text-[#73695c] dark:text-[#a69c8e] flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-[#9f815b]" />
                <span>{kpi.subtitle}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders Table */}
      <div className="bg-[#ffffff] dark:bg-[#1c231c] rounded-3xl p-6 sm:p-8 border border-[#e6dcce] dark:border-[#2e3a2e] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-[#e6dcce] dark:border-[#2e3a2e]">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#9f815b]" />
            <h3 className="font-bold text-base text-[#1d241d] dark:text-[#f7f4ee]">
              {isPersian ? 'آخرین سفارشات ثبت‌شده اخیر' : 'Recent Customer Orders'}
            </h3>
          </div>
          <Link
            href={PATHS.ADMIN_ORDERS}
            className="text-xs font-bold text-[#9f815b] dark:text-[#d4be9b] hover:underline"
          >
            {isPersian ? 'مشاهده همه سفارشات' : 'View All Orders'}
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#73695c] dark:text-[#a69c8e]">
            {isPersian ? 'سفارشی برای نمایش موجود نیست.' : 'No recent orders to display.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-[#e6dcce] dark:border-[#2e3a2e] text-[#73695c] dark:text-[#a69c8e] font-bold">
                  <th className="py-3 px-4">{isPersian ? 'شماره سفارش' : 'Order ID'}</th>
                  <th className="py-3 px-4">{isPersian ? 'مشتری' : 'Customer'}</th>
                  <th className="py-3 px-4">{isPersian ? 'مبلغ کل' : 'Total'}</th>
                  <th className="py-3 px-4">{isPersian ? 'روش پرداخت' : 'Payment'}</th>
                  <th className="py-3 px-4">{isPersian ? 'وضعیت' : 'Status'}</th>
                  <th className="py-3 px-4">{isPersian ? 'تاریخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6dcce] dark:divide-[#2e3a2e]">
                {recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-[#f8f5f0] dark:hover:bg-[#242c24] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#9f815b] dark:text-[#d4be9b]">
                      {isPersian ? toPersianDigits(order.orderNumber) : order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#1d241d] dark:text-[#f7f4ee]">
                      {order.deliveryAddress?.fullName || 'کاربر مهمان'}
                    </td>
                    <td className="py-3.5 px-4 font-black text-[#1d241d] dark:text-[#f7f4ee]">
                      {formatToman(order.total, isPersian)}
                    </td>
                    <td className="py-3.5 px-4 text-[#73695c] dark:text-[#a69c8e]">
                      {order.paymentMethod === 'online'
                        ? isPersian ? 'آنلاین' : 'Online'
                        : order.paymentMethod === 'installment'
                        ? isPersian ? 'اقساطی' : 'Installment'
                        : isPersian ? 'در محل' : 'COD'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f0eae0] text-[#9f815b] dark:bg-[#283228] dark:text-[#d4be9b] border border-[#bfa27a]/30">
                        {order.status === 'delivered'
                          ? isPersian ? 'تحویل شد' : 'Delivered'
                          : order.status === 'processing'
                          ? isPersian ? 'در حال پردازش' : 'Processing'
                          : order.status === 'shipped'
                          ? isPersian ? 'ارسال شده' : 'Shipped'
                          : isPersian ? 'در انتظار' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#73695c] dark:text-[#a69c8e]">
                      {new Date(order.createdAt).toLocaleDateString(isPersian ? 'fa-IR' : 'en-US')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
