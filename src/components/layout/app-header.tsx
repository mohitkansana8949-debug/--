"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, LogOut, ShoppingCart } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, useUser } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export function AppHeader() {
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/signup' || pathname === '/complete-profile') {
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
      <Button variant="ghost" size="icon">
        <ShoppingCart className="h-5 w-5" />
        <span className="sr-only">Shopping Cart</span>
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
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();

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
    
    if (isUserLoading) {
        return <Avatar className='h-8 w-8' />;
    }

    if (!user) {
        return null;
    }

    const getInitials = (name: string | null | undefined) => {
        if (!name) return 'QS';
        const names = name.split(' ');
        if (names.length > 1) {
            return names[0][0] + names[names.length - 1][0];
        }
        return name.substring(0, 2);
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className='h-8 w-8'>
                        {user.photoURL && <AvatarImage src={user.photoURL} data-ai-hint="person face" />}
                        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                    <span className="sr-only">Toggle user menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                 <DropdownMenuItem asChild>
                    <Link href="/profile">
                        <div className="flex flex-col">
                            <span className="font-semibold">{user.displayName || 'User'}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
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
