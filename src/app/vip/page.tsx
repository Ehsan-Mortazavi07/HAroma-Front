import React from 'react';
import { VipPage } from '@/components/pages/vip/VipPage';
import { getVipPlans } from '@/common/api/catalog';

export const metadata = {
  title: 'باشگاه مشتریان خاص و اشتراک VIP | هاتف آروما',
  description: 'عضویت در باشگاه VIP هاتف آروما، تخفیف‌های دائمی، سمپل‌های رایگان و ارسال رایگان بدون سقف.',
};

export default async function VipRoute() {
  const plans = await getVipPlans();
  return <VipPage plans={plans} />;
}
