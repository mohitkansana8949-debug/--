
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
} from 'lucide-react';
import Image from 'next/image';
import { collection, doc } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';

const footerItems = [
    { name: 'Home', icon: Home, href: '/' },
    { name: 'Library', icon: Library, href: '/my-library' },
    { name: 'Feed', icon: Rss, href: '/feed' },
    { name: 'My Orders', icon: ShoppingBag, href: '/my-orders' },
    { name: 'Profile', icon: Users, href: '/profile' },
];

function InstallPWA() {
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
            if (window.matchMedia('(display-mode: standalone)').matches) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        window.addEventListener('appinstalled', () => {
            setIsVisible(false);
            setInstallPrompt(null);
            console.log('PWA was installed');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (installPrompt) {
            installPrompt.prompt();
            const { outcome } = await installPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
        }
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="relative p-6 rounded-lg overflow-hidden bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 animate-gradient-xy">
            <div className="text-white text-center">
                <h2 className="text-2xl font-bold mb-2">Install App for a Better Experience</h2>
                <p className="mb-4">Get the full app experience by installing it on your home screen.</p>
                <Button 
                    onClick={handleInstallClick} 
                    className="bg-white text-primary hover:bg-gray-100 font-bold py-2 px-4 rounded-full shadow-lg transition-transform hover:scale-105"
                >
                    <Download className="mr-2 h-5 w-5" />
                    Install App
                </Button>
            </div>
        </div>
    );
}

function AiDoubtSolverCard() {
    return (
        <Link href="/ai-doubt-solver" className="block">
            <div className="relative p-4 rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-xy">
                <div className="text-white text-center">
                    <Wand2 className="mx-auto h-8 w-8 mb-2" />
                    <h2 className="text-xl font-bold mb-1">AI Doubt Solver</h2>
                    <p className="text-sm">Get instant answers to all your questions.</p>
                </div>
            </div>
        </Link>
    );
}


export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const educatorsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'educators') : null), [firestore]);
  const { data: educators, isLoading: educatorsLoading } = useCollection(educatorsQuery);

  const appSettingsRef = useMemoFirebase(() => (firestore ? doc(firestore, 'settings', 'app') : null), [firestore]);
  const { data: appSettings, isLoading: settingsLoading } = useDoc(appSettingsRef);

  const showYoutubeFeature = useMemo(() => appSettings?.youtubeFeatureEnabled !== false, [appSettings]);
  const showAiDoubtSolver = useMemo(() => appSettings?.aiDoubtSolverEnabled === true, [appSettings]);
  
  const featureCards = useMemo(() => {
    let cards = [
      { title: 'कोर्सेस', href: '/courses', icon: BookOpen, color: 'bg-blue-500' },
      { title: 'Live Classes', href: '/live-lectures', icon: Clapperboard, color: 'bg-red-500' },
      { title: 'Bookshala', href: '/bookshala', icon: Package, color: 'bg-indigo-500' },
      { title: 'E-books', href: '/ebooks', icon: EbookIcon, color: 'bg-teal-500' },
      { title: 'PYQs', href: '/pyqs', icon: FileQuestion, color: 'bg-yellow-500' },
      { title: 'टेस्ट सीरीज', href: '/test-series', icon: Newspaper, color: 'bg-purple-500' },
      { title: 'फ्री कोर्सेस', href: '/courses?filter=free', icon: Gift, color: 'bg-orange-500' },
      { title: 'लाइब्रेरी', href: '/my-library', icon: Library, color: 'bg-cyan-500' },
    ];
    
    if (showYoutubeFeature) {
        cards.push({ title: 'YouTube', href: '/youtube', icon: Youtube, color: 'bg-rose-600' });
    } else {
        cards.push({ title: 'My Orders', href: '/my-orders', icon: ShoppingBag, color: 'bg-rose-600' });
    }
    
    // Ensure it's always 9 cards for a clean grid
    while (cards.length < 9) {
        cards.push({ title: 'Explore', href: '/', icon: Star, color: 'bg-gray-500' });
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
      <InstallPWA />
      <div className="flex justify-between items-center">
        <div className="text-left">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome to Quickly Study</h1>
            <p className="text-sm text-muted-foreground">The quickest way to study.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/support">Support</Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {featureCards.map((card, index) => (
          <Link href={card.href} key={index}>
            <Card
              className={`flex flex-col items-center justify-center p-2 text-center aspect-square text-white transition-transform hover:scale-105 ${card.color}`}
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

