import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div className="flex min-h-screen">
      <Sidebar email={user.email ?? ''} />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav email={user.email ?? ''} />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
