import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/auth';

export default async function IndexPage() {
  const userId = await getCurrentUserId();
  if (userId) {
    redirect('/home');
  } else {
    redirect('/login');
  }
}
