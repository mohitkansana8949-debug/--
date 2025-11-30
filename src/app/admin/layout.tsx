
'use client';
import { usePathname } from 'next/navigation';
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
  ShoppingBag,
  Package,
  TicketPercent,
  Bell,
  ShieldCheck,
} from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import { useEffect, useState } from 'react';

const adminNavItems = [
  { href: '/admin', label: 'अवलोकन', icon: LayoutDashboard },
  { href: '/admin/courses', label: 'Manage Courses', icon: BookOpen },
  { href: '/admin/content', label: 'Manage Content', icon: Palette },
  { href: '/admin/ebooks', label: 'Manage E-books', icon: Book },
  { href: '/admin/pyqs', label: 'Manage PYQs', icon: FileQuestion },
  { href: '/admin/test-series', label: 'Manage Tests', icon: Newspaper },
  { href: '/admin/books', label: 'Manage Books', icon: Package },
  { href: '/admin/posts', label: 'Manage Posts', icon: MessageSquare },
  { href: '/admin/enrollments', label: 'एनरोलमेंट्स', icon: CreditCard },
  { href: '/admin/book-orders', label: 'Book Orders', icon: ShoppingBag },
  { href: '/admin/users', label: 'यूज़र्स', icon: Users },
  { href: '/admin/educators', label: 'एजुकेटर्स', icon: UserPlus },
  { href: '/admin/coupons', label: 'Manage Coupons', icon: TicketPercent },
  { href: '/admin/notifications', label: 'Send Notification', icon: Bell },
  { href: '/admin/live-content', label: 'Live Content', icon: Radio },
  { href: '/admin/settings', label: 'सेटिंग्स', icon: Settings },
];

const creationNavItems = [
    { href: '/admin/create-course', label: 'नया कोर्स', icon: PlusCircle },
    { href: '/admin/create-ebook', label: 'Add E-book', icon: PlusCircle },
    { href: '/admin/create-pyq', label: 'Add PYQ', icon: PlusCircle },
    { href: '/admin/create-test', label: 'Add Test', icon: PlusCircle },
    { href: '/admin/create-book', label: 'Add Book', icon: PlusCircle },
    { href: '/admin/create-coupon', label: 'Add Coupon', icon: PlusCircle },
    { href: '/admin/live-lectures', label: 'Add Live Lecture', icon: Clapperboard },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirestore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
        if (!user || !firestore) {
            setIsAdmin(false);
            setIsAdminLoading(false);
            return;
        }

        if (user.email === 'Qukly@study.com') {
            setIsAdmin(true);
            setIsAdminLoading(false);
            return;
        }
        
        try {
            const adminDoc = await getDoc(doc(firestore, 'roles_admin', user.uid));
            setIsAdmin(adminDoc.exists());
        } catch (error) {
            console.error("Error checking admin status:", error);
            setIsAdmin(false);
        } finally {
            setIsAdminLoading(false);
        }
    };
    if (!isUserLoading) {
        checkAdmin();
    }
  }, [user, firestore, isUserLoading]);


  const isFullPage = adminNavItems.some(item => pathname === item.href) && pathname !== '/admin';


  const isLoading = isUserLoading || isAdminLoading;

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader className="animate-spin" /></div>;
  }
  
  if (!isAdmin) {
      return (
          <div className="flex h-screen items-center justify-center">
            <Card className="m-8 max-w-md">
                <CardHeader>
                    <CardTitle>Access Denied</CardTitle>
                    <CardDescription>You do not have permission to view the admin dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild><Link href="/">Go to Home</Link></Button>
                </CardContent>
            </Card>
          </div>
      )
  }

  if (isFullPage) {
     return <>{children}</>;
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
              const isFullPageItem = item.href !== '/admin';
              return (
                <Button
                  key={item.href}
                  asChild
                  variant={pathname === item.href ? 'secondary' : 'ghost'}
                  className="justify-start"
                >
                  <Link href={item.href} target={isFullPageItem ? '_blank' : '_self'}>
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
                <Link href={item.href} target="_blank">
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
