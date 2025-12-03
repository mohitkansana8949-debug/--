
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
  BarChartHorizontal,
  Clapperboard,
  UserCheck,
  LifeBuoy,
  MessageCircle,
  Wand2,
  Trophy,
} from 'lucide-react';
import Image from 'next/image';
import { collection, doc } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const footerItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Library', href: '/my-library', icon: Library },
    { name: 'Feed', href: '/feed', icon: Rss },
    { name: 'Refer', href: '/refer', icon: Gift },
    { name: 'Profile', icon: Users, href: '/profile' },
];

function PwaInstallCard() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // Check if the app is already installed
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
          return;
      }
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;
    setIsInstallable(false);
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setDeferredPrompt(null);
    });
  };

  if (!isInstallable) return null;

  return (
    <Card className="bg-gradient-to-tr from-blue-500 to-cyan-400 text-white border-0">
        <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Download className="h-8 w-8" />
                <div>
                    <h3 className="font-bold">Install Quickly Study</h3>
                    <p className="text-xs">For a better experience.</p>
                </div>
            </div>
            <Button onClick={handleInstallClick} variant="secondary" size="sm">
            Install
            </Button>
      </CardContent>
    </Card>
  );
}

function AiDoubtSolverCard() {
    return (
        <Card className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white animate-gradient-xy p-0.5 relative overflow-hidden">
            <div className="flex flex-col h-full w-full bg-background/80 dark:bg-background/80 rounded-md p-4 gap-2 items-center text-center">
                <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                    <Wand2 />
                    Quickly Study Doubt Solver
                </h3>
                <p className="text-sm text-white/80">Stuck on a question? Get instant answers from our AI tutor.</p>
                <Button asChild variant="secondary" className="w-full mt-2">
                    <Link href="/ai-doubt-solver">Ask a Doubt</Link>
                </Button>
            </div>
        </Card>
    );
}

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const educatorsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'educators') : null), [firestore]);
  const { data: educators, isLoading: educatorsLoading } = useCollection(educatorsQuery);
  
  const toppersQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'toppers') : null), [firestore]);
  const { data: toppers, isLoading: toppersLoading } = useCollection(toppersQuery);

  const appSettingsRef = useMemoFirebase(() => (firestore ? doc(firestore, 'settings', 'app') : null), [firestore]);
  const { data: appSettings, isLoading: settingsLoading } = useDoc(appSettingsRef);

  const showYoutubeFeature = useMemo(() => appSettings?.youtubeFeatureEnabled !== false, [appSettings]);
  const showAiDoubtSolver = useMemo(() => appSettings?.aiDoubtSolverEnabled === true, [appSettings]);
  
  const featureCards = useMemo(() => {
    let cards = [
      { title: 'कोर्सेस', href: '/courses', gradient: 'bg-gradient-to-br from-blue-500 to-purple-600', icon: BookOpen },
      { title: 'Live Classes', href: '/live-lectures', gradient: 'bg-gradient-to-br from-red-500 to-orange-500', icon: Clapperboard },
      { title: 'AI Test', href: '/ai-test', gradient: 'bg-gradient-to-br from-indigo-500 to-violet-500', icon: Wand2 },
      { title: 'E-books', href: '/ebooks', gradient: 'bg-gradient-to-br from-teal-500 to-green-500', icon: EbookIcon },
      { title: 'PYQs', href: '/pyqs', gradient: 'bg-gradient-to-br from-yellow-500 to-amber-600', icon: FileQuestion },
      { title: 'टेस्ट सीरीज', href: '/test-series', gradient: 'bg-gradient-to-br from-purple-500 to-pink-500', icon: Newspaper },
      { title: 'Current Affairs', href: '/current-affairs', gradient: 'bg-gradient-to-br from-sky-400 to-cyan-400', icon: Newspaper },
      { title: 'फ्री कोर्सेस', href: '/courses?filter=free', gradient: 'bg-gradient-to-br from-orange-400 to-red-500', icon: Gift },
      { title: 'My Progress', href: '/my-progress', gradient: 'bg-gradient-to-br from-indigo-500 to-purple-500', icon: BarChartHorizontal },
      { title: 'Feed', href: '/feed', gradient: 'bg-gradient-to-br from-rose-500 to-pink-600', icon: Rss },
    ];
    
     if (showYoutubeFeature) {
      cards.push({ title: 'YouTube', href: '/youtube', gradient: 'bg-gradient-to-br from-rose-500 to-red-600', icon: Youtube });
    } else {
      cards.push({ title: 'Submit Result', href: '/submit-result', gradient: 'bg-gradient-to-br from-green-500 to-teal-600', icon: UserCheck });
    }
     cards.push({ title: 'लाइब्रेरी', href: '/my-library', gradient: 'bg-gradient-to-br from-cyan-500 to-blue-500', icon: Library });
    
    return cards;
}, [showYoutubeFeature]);


  if (isUserLoading || settingsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader className="animate-spin" />
      </div>
    );
  }

  const handleCardClick = (path: string) => {
    router.push(path);
  }

  return (
    <div className="p-4 space-y-8 pb-20 md:pb-8">
      
      <div className="flex justify-between items-center">
        <div className="text-left">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome to Quickly Study</h1>
            <p className="text-sm text-muted-foreground">The quickest way to study.</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white">
          <Link href="/support">Support</Link>
        </Button>
      </div>

      <PwaInstallCard />
      
      <div className="grid grid-cols-3 gap-2.5">
        {featureCards.map((card, index) => (
          <div key={index} onClick={() => handleCardClick(card.href)} className={cn("flex flex-col items-center justify-center p-2 text-center aspect-square text-white transition-transform hover:scale-105 rounded-lg cursor-pointer", card.gradient)}>
              <card.icon className="mb-1 h-5 w-5 md:h-6 md:w-6" />
              <span className="font-semibold text-[10px] md:text-xs leading-tight">{card.title}</span>
          </div>
        ))}
      </div>

      {showAiDoubtSolver && <AiDoubtSolverCard />}
      
       <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center"><Users className="mr-2 h-6 w-6" /> हमारे एजुकेटर्स</h2>
         {educatorsLoading ? <Card className="p-8 flex justify-center items-center"><Loader className="animate-spin" /></Card> : (educators && educators.length > 0) ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {educators.map(educator => (
                <Card key={educator.id} className="text-center overflow-hidden transition-transform hover:scale-105 cursor-pointer" onClick={() => handleCardClick(`/educators/${educator.id}`)}>
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

        <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center"><Trophy className="mr-2 h-6 w-6 text-yellow-500" /> Our Toppers</h2>
         {toppersLoading ? <Card className="p-8 flex justify-center items-center"><Loader className="animate-spin" /></Card> : (toppers && toppers.length > 0) ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {toppers.map(topper => (
                <Card key={topper.id} className="text-center overflow-hidden transition-transform hover:scale-105 cursor-pointer" onClick={() => handleCardClick(`/toppers/${topper.id}`)}>
                  {topper.imageUrl ? 
                    <Image src={topper.imageUrl} alt={topper.name} width={200} height={200} className="w-full h-32 object-cover object-top"/>
                    : <div className="w-full h-32 bg-secondary flex items-center justify-center"><Trophy className="h-12 w-12 text-muted-foreground"/></div>
                  }
                  <CardHeader className="p-2">
                      <CardTitle className="text-sm font-semibold truncate">{topper.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 pt-0">
                      <p className="text-xs text-muted-foreground truncate">{topper.achievement}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
         ) : <p className="text-muted-foreground">अभी कोई टॉपर नहीं है।</p>}
       </div>


      <footer className="fixed bottom-0 left-0 right-0 bg-card border-t p-2 flex justify-around md:hidden">
        {footerItems.map(item => {
            const Icon = item.icon;
            return (
                <Link href={item.href} key={item.name} className="flex flex-col items-center text-xs text-muted-foreground w-1/5 text-center relative" onClick={() => {}}>
                    <Icon className="h-5 w-5 mb-1"/> 
                    <span>{item.name}</span>
                </Link>
            )
        })}
      </footer>

    </div>
  );
}

    