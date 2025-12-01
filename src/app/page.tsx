
'use client';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BookOpen,
  Gift,
  GraduationCap,
  Library,
  Newspaper,
  Loader,
  ShoppingBag,
  Star,
  Home,
  Bell,
  Rss,
  ClipboardList,
  Users,
  Download,
  Book as EbookIcon,
  FileQuestion,
  Youtube,
  BarChart,
  Clapperboard,
  Package,
  Wand2,
  LifeBuoy,
  ShoppingCart,
} from 'lucide-react';
import Image from 'next/image';
import { collection, doc } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { useCart } from '@/hooks/use-cart';

const footerItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Library', icon: Library, href: '/my-library' },
    { name: 'Cart', href: '/cart', icon: ShoppingCart },
    { name: 'Profile', icon: Users, href: '/profile' },
];

function AiDoubtSolverCard() {
    return (
        <Link href="/ai-doubt-solver" className="block">
            <div className="relative p-4 rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-xy">
                <div className="text-white text-center">
                    <Wand2 className="mx-auto h-8 w-8 mb-2" />
                    <h2 className="text-xl font-bold mb-1">Quickly Study Doubt Solver</h2>
                     <Button variant="secondary" size="sm" className="mt-1">Start Now</Button>
                </div>
            </div>
        </Link>
    );
}

function PwaInstallCard() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setIsInstallable(true);
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setIsInstallable(false);
      setDeferredPrompt(null);
    });
  };
  
  // Also check if app is already installed
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }
  }, []);

  if (!isInstallable) return null;

  return (
    <Card className="bg-primary text-primary-foreground">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download /> Install Quickly Study App
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>Get a better experience by installing our app on your device. It's fast and free!</p>
        <Button onClick={handleInstallClick} variant="secondary" className="mt-4 w-full">
          Install App
        </Button>
      </CardContent>
    </Card>
  );
}


export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { cart } = useCart();

  const educatorsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'educators') : null), [firestore]);
  const { data: educators, isLoading: educatorsLoading } = useCollection(educatorsQuery);

  const appSettingsRef = useMemoFirebase(() => (firestore ? doc(firestore, 'settings', 'app') : null), [firestore]);
  const { data: appSettings, isLoading: settingsLoading } = useDoc(appSettingsRef);

  const showYoutubeFeature = useMemo(() => appSettings?.youtubeFeatureEnabled !== false, [appSettings]);
  const showAiDoubtSolver = useMemo(() => appSettings?.aiDoubtSolverEnabled === true, [appSettings]);
  
  const featureCards = useMemo(() => {
    let cards = [
      { title: 'कोर्सेस', href: '/courses', gradient: 'bg-gradient-to-br from-blue-500 to-purple-600', icon: BookOpen },
      { title: 'Live Classes', href: '/live-lectures', gradient: 'bg-gradient-to-br from-red-500 to-orange-500', icon: Clapperboard },
      { title: 'Bookshala', href: '/bookshala', gradient: 'bg-gradient-to-br from-indigo-500 to-purple-500', icon: Package },
      { title: 'E-books', href: '/ebooks', gradient: 'bg-gradient-to-br from-teal-500 to-green-500', icon: EbookIcon },
      { title: 'PYQs', href: '/pyqs', gradient: 'bg-gradient-to-br from-yellow-500 to-amber-600', icon: FileQuestion },
      { title: 'टेस्ट सीरीज', href: '/test-series', gradient: 'bg-gradient-to-br from-purple-500 to-pink-500', icon: Newspaper },
      { title: 'फ्री कोर्सेस', href: '/courses?filter=free', gradient: 'bg-gradient-to-br from-orange-400 to-red-500', icon: Gift },
      { title: 'लाइब्रेरी', href: '/my-library', gradient: 'bg-gradient-to-br from-cyan-500 to-blue-500', icon: Library },
    ];
    
    if (showYoutubeFeature) {
        cards.push({ title: 'YouTube', href: '/youtube', gradient: 'bg-gradient-to-br from-rose-500 to-red-600', icon: Youtube });
    } else {
        cards.push({ title: 'Order Support', href: '/order-support', gradient: 'bg-gradient-to-br from-rose-500 to-pink-600', icon: LifeBuoy });
    }
    
    // Ensure it's always 9 cards for a clean grid
    while (cards.length < 9) {
        cards.push({ title: 'Explore', href: '/', gradient: 'bg-gradient-to-br from-gray-500 to-gray-600', icon: Star });
    }
    
    return cards.slice(0, 9);
}, [showYoutubeFeature]);


  if (isUserLoading || settingsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-8 pb-20 md:pb-8">
      
      <div className="flex justify-between items-center">
        <div className="text-left">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome to Quickly Study</h1>
            <p className="text-sm text-muted-foreground">The quickest way to study.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/support">Support</Link>
        </Button>
      </div>

      <PwaInstallCard />

      <div className="grid grid-cols-3 gap-4">
        {featureCards.map((card, index) => (
          <Link href={card.href} key={index}>
            <Card
              className={`flex flex-col items-center justify-center p-2 text-center aspect-square text-white transition-transform hover:scale-105 ${card.gradient} animate-gradient-xy`}
            >
              <card.icon className="mb-2 h-6 w-6 md:h-8 md:w-8" />
              <span className="font-semibold text-xs md:text-sm">{card.title}</span>
            </Card>
          </Link>
        ))}
      </div>
      
      {showAiDoubtSolver && <AiDoubtSolverCard />}

       <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center"><Users className="mr-2 h-6 w-6" /> हमारे एजुकेटर्स</h2>
         {educatorsLoading ? <Card className="p-8 flex justify-center items-center"><Loader className="animate-spin" /></Card> : (educators && educators.length > 0) ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {educators.map(educator => (
                <Card key={educator.id} className="text-center overflow-hidden transition-transform hover:scale-105">
                  {educator.imageUrl ? 
                    <Image src={educator.imageUrl} alt={educator.name} width={200} height={200} className="w-full h-32 object-cover object-top"/>
                    : <div className="w-full h-32 bg-secondary flex items-center justify-center"><Users className="h-12 w-12 text-muted-foreground"/></div>
                  }
                  <CardHeader className="p-2">
                      <CardTitle className="text-sm font-semibold truncate">{educator.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 pt-0">
                      <p className="text-xs text-muted-foreground truncate">{educator.experience}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
         ) : <p className="text-muted-foreground">अभी कोई एजुकेटर नहीं है।</p>}
       </div>

      <footer className="fixed bottom-0 left-0 right-0 bg-card border-t p-2 flex justify-around md:hidden">
        {footerItems.map(item => {
            const Icon = item.icon;
            return (
                <Link href={item.href} key={item.name} className="flex flex-col items-center text-xs text-muted-foreground w-1/4 text-center relative">
                    {item.name === 'Cart' && cart.length > 0 && (
                        <span className="absolute top-0 right-3 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {cart.reduce((acc, item) => acc + item.quantity, 0)}
                        </span>
                    )}
                    <Icon className="h-5 w-5 mb-1"/> 
                    <span>{item.name}</span>
                </Link>
            )
        })}
      </footer>

    </div>
  );
}
