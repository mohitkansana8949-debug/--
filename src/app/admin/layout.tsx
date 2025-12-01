'use client';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Users,
  BookOpen,
  CreditCard,
  UserPlus,
  LayoutDashboard,
  Settings,
  FileText,
  Radio,
  Book,
  FileQuestion,
  Newspaper,
  PlusCircle,
  Palette,
  Youtube,
  Clapperboard,
  MessageSquare,
  TicketPercent,
  Bell,
  ShieldCheck,
  BarChartHorizontal,
  PieChart,
  UserCheck,
} from 'lucide-react';
import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';


const adminNavItems = [
  { href: '/admin', label: 'अवलोकन', icon: LayoutDashboard },
  { href: '/admin/revenue', label: 'Revenue', icon: PieChart },
  { href: '/admin/courses', label: 'Manage Courses', icon: BookOpen },
  { href: '/admin/content', label: 'Manage Content', icon: Palette },
  { href: '/admin/ebooks', label: 'Manage E-books', icon: Book },
  { href: '/admin/pyqs', label: 'Manage PYQs', icon: FileQuestion },
  { href: '/admin/test-series', label: 'Manage Tests', icon: Newspaper },
  { href: '/admin/posts', label: 'Manage Posts', icon: MessageSquare },
  { href: '/admin/enrollments', label: 'एनरोलमेंट्स', icon: CreditCard },
  { href: '/admin/users', label: 'यूज़र्स', icon: Users },
  { href: '/admin/educators', label: 'एजुकेटर्स', icon: UserPlus },
  { href: '/admin/youtube', label: 'YouTube Channels', icon: Youtube },
  { href: '/admin/coupons', label: 'Manage Coupons', icon: TicketPercent },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/live-content', label: 'Live Content', icon: Radio },
  { href: '/admin/results', label: 'Submitted Results', icon: UserCheck },
  { href: '/admin/settings', label: 'सेटिंग्स', icon: Settings },
];

const creationNavItems = [
    { href: '/admin/create-course', label: 'नया कोर्स', icon: PlusCircle },
    { href: '/admin/create-ebook', label: 'Add E-book', icon: PlusCircle },
    { href: '/admin/create-pyq', label: 'Add PYQ', icon: PlusCircle },
    { href: '/admin/create-test', label: 'Add Test', icon: PlusCircle },
    { href: '/admin/create-coupon', label: 'Add Coupon', icon: PlusCircle },
    { href: '/admin/live-lectures', label: 'Add Live Lecture', icon: Clapperboard },
    { href: '/admin/create-notification', label: 'Send Notification', icon: Bell },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useLocalStorage('isAdminAuthenticated', false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // This effect runs on the client side
    if (!isUserLoading) {
      if (user && !isAdminAuthenticated) {
        // If user is logged in but hasn't passed the code check, force it.
        router.replace('/admin-auth');
      } else if (!user) {
        // If no user is logged in at all, go to the main login.
        router.replace('/login');
      }
      else {
        setIsCheckingAuth(false);
      }
    }
  }, [isAdminAuthenticated, user, isUserLoading, router]);

  if (isUserLoading || isCheckingAuth) {
    return <div className="flex h-screen items-center justify-center"><Loader className="animate-spin" /></div>;
  }
  
  if (!user || 
      !isAdminAuthenticated
    ) {
    // This will be shown briefly before the redirect happens, or if redirect fails.
    return null;
  }


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">एडमिन डैशबोर्ड</h1>
      <p className="text-muted-foreground mb-8">यूज़र, कोर्स, एनरोलमेंट और सेटिंग्स मैनेज करें।</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1">
          <nav className="flex flex-col gap-2">
            <h3 className="px-4 text-lg font-semibold tracking-tight mb-2">Management</h3>
            {adminNavItems.map((item) => {
              const isChildRouteOfItem = pathname.startsWith(item.href) && item.href !== '/admin';
              return (
                <Button
                  key={item.href}
                  asChild
                  variant={(pathname === item.href || isChildRouteOfItem) ? 'secondary' : 'ghost'}
                  className="justify-start"
                >
                  <Link href={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              )
            })}
            <h3 className="px-4 text-lg font-semibold tracking-tight mt-6 mb-2">Creation</h3>
             {creationNavItems.map((item) => (
              <Button
                key={item.href}
                asChild
                variant={pathname === item.href ? 'default' : 'outline'}
                className="justify-start"
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>
        </aside>
        <main className="md:col-span-3">{children}</main>
      </div>
    </div>
  );
}
