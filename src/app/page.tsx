
'use client';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  BookOpen,
  Gift,
  GraduationCap,
  Laptop,
  Library,
  Newspaper,
  Loader,
  Megaphone,
  ShoppingBag,
  Star,
  Home,
  Bell,
  Rss,
  ClipboardList
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Image from 'next/image';
import { collection, query, orderBy } from 'firebase/firestore';

const featureCards = [
  { title: 'कोर्सेस', href: '/courses', icon: BookOpen, color: 'bg-blue-500' },
  { title: 'फ्री कोर्सेस', href: '/courses?filter=free', icon: Gift, color: 'bg-orange-500' },
  { title: 'स्कॉलरशिप', href: '/scholarship', icon: GraduationCap, color: 'bg-green-500' },
  { title: 'टेस्ट सीरीज', href: '/test-series', icon: Newspaper, color: 'bg-purple-500' },
  { title: 'लाइव क्लासेस', href: '/live-classes', icon: Laptop, color: 'bg-pink-500' },
  { title: 'बुक शाला', href: '/book-shala', icon: Library, color: 'bg-red-500' },
  { title: 'प्रमोशन', href: '/promotions', icon: Megaphone, color: 'bg-yellow-500' },
  { title: 'शॉप', href: '/shop', icon: ShoppingBag, color: 'bg-indigo-500' },
  { title: 'फीचर्स', href: '/features', icon: Star, color: 'bg-cyan-500' },
];

const footerItems = [
    { name: 'Home', icon: Home, href: '/' },
    { name: 'Library', icon: Library, href: '/my-library' },
    { name: 'Orders', icon: ClipboardList, href: '/orders' },
    { name: 'Feed', icon: Rss, href: '/feed' },
    { name: 'Alerts', icon: Bell, href: '/alerts' },
];


export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const promotionsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'promotions'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );
  
  const { data: promotions, isLoading: promotionsLoading } = useCollection(promotionsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/signup');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader className="animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-4 space-y-8 pb-20 md:pb-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          नमस्ते {user.displayName || 'स्टूडेंट'}!
        </h1>
        <Button variant="outline" asChild>
          <Link href="/support">Support</Link>
        </Button>
      </div>

       {promotionsLoading ? <Card className="p-4 flex justify-center items-center h-40"><Loader className="animate-spin" /></Card> : (promotions && promotions.length > 0) ? (
          <Carousel
            opts={{ align: 'start', loop: promotions.length > 1 }}
            className="w-full"
          >
            <CarouselContent>
              {promotions.map((promo) => (
                <CarouselItem key={promo.id}>
                  <Card className="overflow-hidden bg-yellow-400 text-black">
                    <CardContent className="p-4 flex items-center justify-center text-center">
                       <p className="font-bold text-lg">
                        {promo.text}
                      </p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
             {promotions.length > 1 && <>
              <CarouselPrevious className="ml-12" />
              <CarouselNext className="mr-12" />
             </>}
          </Carousel>
        ) : null }

      <div className="grid grid-cols-3 gap-4">
        {featureCards.map((card) => (
          <Link href={card.href} key={card.title}>
            <Card
              className={`flex flex-col items-center justify-center p-2 text-center aspect-square text-white transition-transform hover:scale-105 ${card.color}`}
            >
              <card.icon className="mb-2 h-6 w-6 md:h-8 md:w-8" />
              <span className="font-semibold text-xs md:text-sm">{card.title}</span>
            </Card>
          </Link>
        ))}
      </div>
      
       <div>
        <h2 className="text-2xl font-bold mb-4">Main Course</h2>
         <Card className="overflow-hidden">
            <Image
                src="https://picsum.photos/seed/main-course/800/400"
                alt="Main Course"
                width={800}
                height={400}
                className="w-full object-cover"
                data-ai-hint="online course banner"
            />
        </Card>
       </div>

      <footer className="fixed bottom-0 left-0 right-0 bg-card border-t p-2 flex justify-around md:hidden">
        {footerItems.map(item => {
            const Icon = item.icon;
            return (
                <Link href={item.href} key={item.name} className="flex flex-col items-center text-xs text-muted-foreground w-1/5 text-center">
                    <Icon className="h-5 w-5 mb-1"/> 
                    <span>{item.name}</span>
                </Link>
            )
        })}
      </footer>

    </div>
  );
}
