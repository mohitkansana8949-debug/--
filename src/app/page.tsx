
'use client';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  BookOpen,
  Gift,
  GraduationCap,
  Laptop,
  Library,
  Newspaper,
  User as UserIcon,
  Loader,
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Image from 'next/image';
import { collection, query, where, orderBy } from 'firebase/firestore';

const featureCards = [
  {
    title: 'कोर्सेस',
    href: '/courses',
    icon: BookOpen,
    color: 'bg-blue-500',
  },
  {
    title: 'फ्री कोर्सेस',
    href: '/courses?filter=free',
    icon: Gift,
    color: 'bg-orange-500',
  },
  {
    title: 'स्कॉलरशिप',
    href: '/scholarship',
    icon: GraduationCap,
    color: 'bg-green-500',
  },
  {
    title: 'टेस्ट सीरीज',
    href: '/test-series',
    icon: Newspaper,
    color: 'bg-purple-500',
  },
  {
    title: 'लाइव क्लासेस',
    href: '/live-classes',
    icon: Laptop,
    color: 'bg-pink-500',
  },
  {
    title: 'बुक शाला',
    href: '/book-shala',
    icon: Library,
    color: 'bg-red-500',
  },
];

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const educatorsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'educators'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );
  
  const { data: educators, isLoading: educatorsLoading } = useCollection(educatorsQuery);
  

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
    <div className="p-4 space-y-8">
      <div className="text-left">
        <h1 className="text-3xl font-bold">
          नमस्ते {user.displayName || 'स्टूडेंट'}!
        </h1>
        <p className="text-muted-foreground">सीखने की अपनी यात्रा शुरू करें।</p>
      </div>

      

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {featureCards.map((card) => (
          <Link href={card.href} key={card.title}>
            <Card
              className={`flex flex-col items-center justify-center p-2 text-center aspect-square text-white transition-transform hover:scale-105 ${card.color}`}
            >
              <card.icon className="mb-2 h-8 w-8" />
              <span className="font-semibold text-sm">{card.title}</span>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">हमारे शिक्षक</h2>
        {educatorsLoading ? <Card className="p-4 flex justify-center items-center h-48"><Loader className="animate-spin" /></Card> : (educators && educators.length > 0) ? (
          <Carousel
            opts={{
              align: 'start',
              loop: educators.length > 2,
            }}
            className="w-full"
          >
            <CarouselContent>
              {educators.map((educator) => (
                <CarouselItem
                  key={educator.id}
                  className="md:basis-1/2 lg:basis-1/3"
                >
                  <Card className="overflow-hidden">
                    <CardContent className="p-0 text-center">
                      {educator.imageUrl && (
                        <Image
                          src={educator.imageUrl}
                          alt={educator.name}
                          width={400}
                          height={300}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <h3 className="text-lg font-semibold">{educator.name}</h3>
                        <p className="text-sm text-muted-foreground">{educator.experience}</p>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="ml-12" />
            <CarouselNext className="mr-12" />
          </Carousel>
        ) : (
          <Card className="p-8 flex items-center justify-center">
            <p className="text-muted-foreground">एडमिन पैनल से नए शिक्षकों को जोड़ें।</p>
          </Card>
        )}
      </div>
    </div>
  );
}

    
