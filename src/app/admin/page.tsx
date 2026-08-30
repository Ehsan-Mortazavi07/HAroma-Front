import { redirect } from 'next/navigation';
import { PATHS } from '@/common/constants/PATHS';

export default function AdminPage() {
  redirect(PATHS.ADMIN_DASHBOARD);
}
