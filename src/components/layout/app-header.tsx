
"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, LogOut, ShoppingCart, ShieldCheck } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, useUser } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useMemo, useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useCart } from "@/hooks/use-cart";


// Helper function to get a color based on user ID
const getColorForId = (id: string) => {
  const colors = [
    'bg-red-500',
    'bg-green-500',
    'bg-blue-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  // Simple hash function to get a consistent color
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[hash % colors.length];
};

export function AppHeader() {
  const { user } = useUser();
  const { cart } = useCart();
  
  if (!user) {
     return (
       <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 justify-end">
         <ThemeToggle />
       </header>
    );
  }


  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
      <SidebarTrigger className="shrink-0 md:hidden" />
      <div className="w-full flex-1">
        {/* Future search bar can go here */}
      </div>
      <ThemeToggle />
      <Button asChild variant="ghost" size="icon" className="relative">
        <Link href="/cart">
            <ShoppingCart className="h-5 w-5" />
            <span className="sr-only">Shopping Cart</span>
            {cart.length > 0 && (
                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {cart.length}
                </span>
            )}
        </Link>
      </Button>
      <UserMenu />
    </header>
  );
}

function ThemeToggle() {
    const { setTheme, theme } = useTheme();

    return (
      <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
      </Button>
    )
}

function UserMenu() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAdminLoading, setIsAdminLoading] = useState(true);

    useEffect(() => {
        const checkAdminStatus = async () => {
            if (user && firestore) {
                 if (user.email === 'Qukly@study.com') {
                    setIsAdmin(true);
                    setIsAdminLoading(false);
                    return;
                }
                try {
                    const adminRef = doc(firestore, "roles_admin", user.uid);
                    const adminDoc = await getDoc(adminRef);
                    setIsAdmin(adminDoc.exists());
                } catch (error) {
                    console.error("Error checking admin status:", error);
                    setIsAdmin(false);
                } finally {
                    setIsAdminLoading(false);
                }
            } else if (!isUserLoading) {
                setIsAdmin(false);
                setIsAdminLoading(false);
            }
        };

        checkAdminStatus();
    }, [user, firestore, isUserLoading]);
    
    const avatarColor = useMemo(() => user ? getColorForId(user.uid) : 'bg-muted', [user]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast({
                title: "Logged Out",
                description: "You have been successfully logged out.",
            });
            router.push('/login');
        } catch (error) {
            console.error("Logout error:", error);
            toast({
                variant: "destructive",
                title: "Logout Failed",
                description: "Could not log you out. Please try again.",
            });
        }
    };
    
    if (isUserLoading || isAdminLoading) {
        return <Avatar className='h-8 w-8' />;
    }

    if (!user) {
        return null;
    }

    const getInitials = (name: string | null | undefined) => {
        if (!name) return 'QS';
        const names = name.split(' ');
        if (names.length > 1 && names[0] && names[names.length - 1]) {
            return (names[0][0] + names[names.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className='h-8 w-8'>
                        {user.photoURL ? (
                           <AvatarImage src={user.photoURL} data-ai-hint="person face" />
                        ) : (
                           <AvatarFallback className={`text-white ${avatarColor}`}>{getInitials(user.displayName)}</AvatarFallback>
                        )}
                    </Avatar>
                    <span className="sr-only">Toggle user menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                 <DropdownMenuItem asChild>
                    <Link href="/profile">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">{user.displayName || 'User'}</span>
                                {isAdmin && <Badge variant="success" className="h-5"><ShieldCheck className="mr-1 h-3 w-3"/>Admin</Badge>}
                            </div>
                            <span className="text-xs text-muted-foreground">{user.email || user.phoneNumber}</span>
                        </div>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
