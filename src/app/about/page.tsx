import type { Metadata } from 'next';
import { ConsultationChat } from '@/components/pages/consultation/ConsultationChat';

export const metadata: Metadata = {
  title: 'گفت‌وگوی مشاوره تخصصی | هاتف آروما',
  description: 'در گفت‌وگوی آنلاین مشاورهٔ هاتف آروما، خواسته‌ات را با کارشناس مطرح کن و پاسخ را همین‌جا دریافت کن.',
};

export default function ConsultationPage() {
  return <ConsultationChat />;
}
