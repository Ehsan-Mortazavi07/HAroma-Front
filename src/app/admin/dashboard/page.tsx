'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Skeleton,
} from '@heroui/react';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Crown,
  Package,
  Sparkles,
  TrendingUp,
  Clock,
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

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <Chip size="sm" variant="flat" color="success" className="font-bold text-[10px]">
            {isPersian ? 'تحویل شد' : 'Delivered'}
          </Chip>
        );
      case 'processing':
        return (
          <Chip size="sm" variant="flat" color="warning" className="font-bold text-[10px]">
            {isPersian ? 'در حال پردازش' : 'Processing'}
          </Chip>
        );
      case 'shipped':
        return (
          <Chip size="sm" variant="flat" color="primary" className="font-bold text-[10px]">
            {isPersian ? 'ارسال شده' : 'Shipped'}
          </Chip>
        );
      default:
        return (
          <Chip size="sm" variant="flat" className="font-bold text-[10px] bg-brand-surface-elevated text-brand-text-muted">
            {isPersian ? 'در انتظار' : 'Pending'}
          </Chip>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-text">
            {isPersian ? 'داشبورد مدیریت و تحلیل فروش هاتف آروما' : 'Hatef Aroma Admin Dashboard'}
          </h1>
          <p className="text-xs text-brand-text-muted mt-1">
            {isPersian
              ? 'وضعیت زنده موجودی، سفارش‌ها، اشتراک‌های ویژه و درآمد فروشگاه'
              : 'Real-time sales, inventory, orders, and VIP memberships analytics'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            as={Link}
            href={PATHS.ADMIN_PRODUCT_NEW}
            radius="lg"
            className="h-10 px-5 bg-brand-gold hover:bg-[#d4be9b] text-[#141914] font-black text-xs shadow-md shadow-brand-gold/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isPersian ? '+ تعریف محصول جدید' : '+ Add New Product'}</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={idx}
              className="bg-brand-surface p-6 rounded-3xl border border-brand-border shadow-xs"
            >
              <CardBody className="p-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-text-muted">{kpi.title}</span>
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${kpi.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-brand-text">
                  {kpi.value}
                </div>
                <div className="text-[11px] font-semibold text-brand-text-muted flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-brand-bronze dark:text-brand-gold" />
                  <span>{kpi.subtitle}</span>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Recent Orders Table */}
      <Card className="bg-brand-surface rounded-3xl p-6 sm:p-8 border border-brand-border shadow-xs">
        <CardBody className="p-0 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-brand-border">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-bronze dark:text-brand-gold" />
              <h3 className="font-bold text-base text-brand-text">
                {isPersian ? 'آخرین سفارشات ثبت‌شده اخیر' : 'Recent Customer Orders'}
              </h3>
            </div>
            <Link
              href={PATHS.ADMIN_ORDERS}
              className="text-xs font-bold text-brand-bronze dark:text-brand-gold hover:underline"
            >
              {isPersian ? 'مشاهده همه سفارشات' : 'View All Orders'}
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 py-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-2xl bg-brand-surface-elevated" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8 text-xs text-brand-text-muted">
              {isPersian ? 'سفارشی برای نمایش موجود نیست.' : 'No recent orders to display.'}
            </div>
          ) : (
            <Table
              aria-label="Recent Orders Table"
              classNames={{
                wrapper: "p-0 bg-transparent shadow-none border-none",
                th: "bg-brand-surface-elevated text-brand-text-muted font-bold text-xs py-3 px-4",
                td: "py-3.5 px-4 text-xs font-semibold",
                tr: "border-b border-brand-border hover:bg-brand-surface-elevated/60 transition-colors",
              }}
            >
              <TableHeader>
                <TableColumn>{isPersian ? 'شماره سفارش' : 'Order ID'}</TableColumn>
                <TableColumn>{isPersian ? 'مشتری' : 'Customer'}</TableColumn>
                <TableColumn>{isPersian ? 'مبلغ کل' : 'Total'}</TableColumn>
                <TableColumn>{isPersian ? 'روش پرداخت' : 'Payment'}</TableColumn>
                <TableColumn>{isPersian ? 'وضعیت' : 'Status'}</TableColumn>
                <TableColumn>{isPersian ? 'تاریخ' : 'Date'}</TableColumn>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-bold text-brand-bronze dark:text-brand-gold">
                      {isPersian ? toPersianDigits(order.orderNumber) : order.orderNumber}
                    </TableCell>
                    <TableCell className="text-brand-text font-bold">
                      {order.deliveryAddress?.fullName || 'کاربر مهمان'}
                    </TableCell>
                    <TableCell className="font-black text-brand-text">
                      {formatToman(order.total, isPersian)}
                    </TableCell>
                    <TableCell className="text-brand-text-muted">
                      {order.paymentMethod === 'online'
                        ? isPersian ? 'آنلاین' : 'Online'
                        : order.paymentMethod === 'installment'
                        ? isPersian ? 'اقساطی' : 'Installment'
                        : isPersian ? 'در محل' : 'COD'}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(order.status)}
                    </TableCell>
                    <TableCell className="text-brand-text-muted">
                      {new Date(order.createdAt).toLocaleDateString(isPersian ? 'fa-IR' : 'en-US')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
