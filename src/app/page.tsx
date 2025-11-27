'use client';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BookOpen,
  Gift,
  GraduationCap,
  Laptop,
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
  Youtube,
  Download
} from 'lucide-react';
import Image from 'next/image';
import { collection } from 'firebase/firestore';
import { useEffect, useState } from 'react';

const featureCards = [
  { title: 'कोर्सेस', href: '/courses', icon: BookOpen, color: 'bg-blue-500' },
  { title: 'फ्री कोर्सेस', href: '/courses?filter=free', icon: Gift, color: 'bg-orange-500' },
  { title: 'स्कॉलरशिप', href: '/scholarship', icon: GraduationCap, color: 'bg-green-500' },
  { title: 'टेस्ट सीरीज', href: '/test-series', icon: Newspaper, color: 'bg-purple-500' },
  { title: 'लाइव क्लासेस', href: '/live-classes', icon: Laptop, color: 'bg-pink-500' },
  { title: 'Channels', href: '/channels', icon: Youtube, color: 'bg-red-500' },
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

function InstallPWA() {
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setInstallPrompt(e);
            // Show the install button if the app is not already installed
            if (window.matchMedia('(display-mode: standalone)').matches) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for app installation
        window.addEventListener('appinstalled', () => {
            // Hide the install prompt
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
            // We don't need to set the prompt to null here, it can only be used once.
            // The `appinstalled` event will handle hiding the button.
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

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const educatorsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'educators') : null), [firestore]);

  const { data: educators, isLoading: educatorsLoading } = useCollection(educatorsQuery);


  if (isUserLoading) {
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
            <h1 className="text-2xl font-semibold tracking-tight">Welcome to QuklyStudy</h1>
            <p className="text-sm text-muted-foreground">The quickest way to study.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/support">Support</Link>
        </Button>
      </div>

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
        <h2 className="text-2xl font-bold mb-4 flex items-center"><Users className="mr-2 h-6 w-6" /> हमारे एजुकेटर्स</h2>
         {educatorsLoading ? <Card className="p-8 flex justify-center items-center"><Loader className="animate-spin" /></Card> : (educators && educators.length > 0) ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {educators.map(educator => (
                <Card key={educator.id} className="text-center overflow-hidden transition-transform hover:scale-105">
                  {educator.imageUrl && <Image src={educator.imageUrl} alt={educator.name} width={200} height={200} className="w-full h-32 object-cover object-top"/>}
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
