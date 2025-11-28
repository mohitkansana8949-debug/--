
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
} from 'lucide-react';

const adminNavItems = [
  { href: '/admin', label: 'अवलोकन', icon: LayoutDashboard },
  { href: '/admin/courses', label: 'Manage Courses', icon: BookOpen },
  { href: '/admin/content', label: 'Manage Content', icon: Palette },
  { href: '/admin/ebooks', label: 'Manage E-books', icon: Book },
  { href: '/admin/pyqs', label: 'Manage PYQs', icon: FileQuestion },
  { href: '/admin/test-series', label: 'Manage Tests', icon: Newspaper },
  { href: '/admin/enrollments', label: 'एनरोलमेंट्स', icon: CreditCard },
  { href: '/admin/users', label: 'यूज़र्स', icon: Users },
  { href: '/admin/educators', label: 'एजुकेटर्स', icon: UserPlus },
  { href: '/admin/youtube', label: 'YouTube Channels', icon: Youtube },
  { href: '/admin/settings', label: 'सेटिंग्स', icon: Settings },
];

const creationNavItems = [
    { href: '/admin/create-course', label: 'नया कोर्स', icon: PlusCircle },
    { href: '/admin/create-ebook', label: 'Add E-book', icon: PlusCircle },
    { href: '/admin/create-pyq', label: 'Add PYQ', icon: PlusCircle },
    { href: '/admin/create-test', label: 'Add Test', icon: PlusCircle },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // These paths will not use the admin layout and will be rendered as full pages
  const fullPagePaths = ['/admin/create-course', '/admin/content/', '/admin/create-ebook', '/admin/create-pyq', '/admin/create-test'];

  if (fullPagePaths.some(p => pathname.startsWith(p))) {
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
            {adminNavItems.map((item) => (
              <Button
                key={item.href}
                asChild
                variant={pathname === item.href ? 'secondary' : 'ghost'}
                className="justify-start"
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
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
