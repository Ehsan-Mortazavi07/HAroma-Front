import type { Metadata } from 'next';
import { ConsultationChat } from '@/components/pages/consultation/ConsultationChat';

export const metadata: Metadata = {
  title: 'مشاوره و چت آنلاین | هاتف آروما',
  description: 'با کارشناس هاتف آروما گفت‌وگو کن، رایحهٔ موردنظرت را توضیح بده و پاسخ را در همین صفحه دریافت کن.',
};

export default function ConsultationPage() {
  return <ConsultationChat />;
}
