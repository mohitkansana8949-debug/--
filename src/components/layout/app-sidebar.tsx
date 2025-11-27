
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, User, Shield, LogOut, Library, LifeBuoy, Youtube } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar
} from "@/components/ui/sidebar";
import { useUser, useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useFirebase } from "@/firebase";

export function AppSidebar() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const { isMobile, setOpenMobile } = useSidebar();


  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Could not log you out. Please try again.",
      });
    }
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const navItems = [
    { href: "/", label: "होम", icon: Home, tooltip: "Dashboard" },
    { href: "/courses", label: "कोर्स", icon: BookOpen, tooltip: "Courses" },
    { href: "/my-library", label: "मेरी लाइब्रेरी", icon: Library, tooltip: "My Library" },
    { href: "/watch", label: "वीडियो देखें", icon: Youtube, tooltip: "Watch Video" },
    { href: "/support", label: "सहायता", icon: LifeBuoy, tooltip: "Support" },
  ];
  
  const adminNavItems = [
    { href: "/admin", label: "एडमिन पैनल", icon: Shield, tooltip: "Admin Panel" },
  ];

  const profileNavItem = { href: "/profile", label: "प्रोफ़ाइल", icon: User, tooltip: "Profile" };

  const noSidebarPaths = ['/login', '/signup'];
  const fullScreenPaths = ['/live-classes/'];

  if (noSidebarPaths.includes(pathname) || (pathname && fullScreenPaths.some(p => pathname.startsWith(p)))) {
    return null;
  }
  
  if (isUserLoading) {
      return (
          <Sidebar>
            <SidebarHeader>
                <Link href="/" className="flex items-center gap-2" prefetch={false}>
                    <GraduationCap className="h-8 w-8 text-primary" />
                    <span className="text-xl font-bold whitespace-nowrap">QuklyStudy</span>
                </Link>
            </SidebarHeader>
          </Sidebar>
      )
  }
  
  if (!user) {
    return null; // Don't show sidebar if user is not logged in
  }


  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2" prefetch={false}>
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold whitespace-nowrap">QuklyStudy</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{ children: item.tooltip }}
                onClick={handleLinkClick}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {adminNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={{ children: item.tooltip }}
                onClick={handleLinkClick}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                    asChild
                    isActive={pathname === profileNavItem.href}
                    tooltip={{ children: profileNavItem.tooltip }}
                    onClick={handleLinkClick}
                >
                    <Link href={profileNavItem.href}>
                    <profileNavItem.icon />
                    <span>{profileNavItem.label}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} tooltip={{children: 'Logout'}}>
                    <LogOut />
                    <span>लॉगआउट</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function GraduationCap(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c0 1.66 4 3 10 3s10-1.34 10-3v-5" />
      </svg>
    )
  }
