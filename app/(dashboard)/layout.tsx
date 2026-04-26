import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { RoleProvider } from '@/contexts/RoleContext';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <div className="md:ml-[var(--sidebar-width)] flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <RoleProvider>
              {children}
            </RoleProvider>
          </div>
        </main>
      </div>
    </div>
  );
}
