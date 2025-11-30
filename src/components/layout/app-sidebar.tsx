
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, User, Shield, LogOut, Library, LifeBuoy, Youtube, Gift, Instagram, Send, Facebook } from "lucide-react";
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
import { Separator } from "../ui/separator";

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M16.75 13.96c.25.13.43.2.5.33.07.13.07.75-.12 1.38-.19.63-.98 1.2-1.7 1.33-.72.13-1.38.07-1.94-.19-.56-.25-1.38-.5-2.63-1.12-1.25-.63-2.25-1.5-3.06-2.63-.81-1.12-1.25-2.38-1.19-3.56.07-1.19.69-2.19 1.38-2.81.69-.63 1.56-.81 2.31-.81.25 0 .5.06.69.06.31 0 .5.13.69.38.19.25.19.56.13.88-.07.31-.13.5-.25.69-.13.19-.25.31-.44.44-.19.13-.31.25-.38.38-.07.13-.07.19.06.38.13.19.31.44.5.63.19.19.44.44.69.63.25.19.44.31.63.5.19.19.31.31.38.44.07.13.07.25.07.38zm-4.88 5.81c-1.38 0-2.69-.38-3.81-1.06l-4.06 1.06 1.12-3.94c-.75-1.19-1.19-2.63-1.19-4.13 0-4.31 3.5-7.81 7.81-7.81 4.31 0 7.81 3.5 7.81 7.81 0 4.31-3.5 7.81-7.81 7.81z" />
  </svg>
);


export function AppSidebar() {
  const pathname = usePathname();
  const { isUserLoading } = useUser();
  const auth = useAuth();
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
    { href: "/youtube", label: "यूट्यूब", icon: Youtube, tooltip: "YouTube" },
    { href: "/support", label: "सहायता", icon: LifeBuoy, tooltip: "Support" },
  ];
  
  const adminNavItems = [
    { href: "/admin", label: "एडमिन पैनल", icon: Shield, tooltip: "Admin Panel" },
  ];
  
  const socialLinks = [
    { href: "https://whatsapp.com/channel/0029Vai66i2Jpe8cngwmG11R", label: "WhatsApp", icon: WhatsAppIcon },
    { href: "https://www.instagram.com/ashokraj__62?utm_source=qr", label: "Instagram", icon: Instagram },
    { href: "https://youtube.com/@quicklystudy01?si=smW5n5d72HYt8__U", label: "YouTube", icon: Youtube },
    { href: "https://t.me/Quicklystudy", label: "Telegram", icon: Send },
    { href: "https://www.facebook.com/share/1CEwFx3NuX/", label: "Facebook", icon: Facebook },
  ];

  const profileNavItem = { href: "/profile", label: "प्रोफ़ाइल", icon: User, tooltip: "Profile" };
  
  if (isUserLoading) {
      return (
          <Sidebar>
            <SidebarHeader>
                <Link href="/" className="flex items-center gap-2" prefetch={false}>
                    <GraduationCap className="h-8 w-8 text-primary" />
                    <span className="text-xl font-bold whitespace-nowrap">Quickly Study</span>
                </Link>
            </SidebarHeader>
          </Sidebar>
      )
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2" prefetch={false}>
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold whitespace-nowrap">Quickly Study</span>
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
        <div className="p-2">
          <Link href="/refer" onClick={handleLinkClick} className="block w-full p-3 text-center rounded-lg bg-yellow-400/20 text-yellow-600 dark:text-yellow-300 border border-yellow-500/50 hover:bg-yellow-400/30">
            <div className="flex items-center justify-center gap-2">
              <Gift className="h-5 w-5"/>
              <span className="font-bold">Refer & Earn</span>
            </div>
          </Link>
        </div>
        <Separator className="my-1" />
         <div className="px-4 py-2">
             <p className="text-xs font-semibold text-muted-foreground group-data-[collapsible=icon]:hidden">
                Follow the 🔥QUICKLY🚀STUDY 📖🎯
             </p>
         </div>
         <SidebarMenu>
             {socialLinks.map(link => (
                <SidebarMenuItem key={link.label}>
                    <SidebarMenuButton asChild tooltip={{children: link.label}} onClick={handleLinkClick}>
                        <a href={link.href} target="_blank" rel="noopener noreferrer">
                            <link.icon/>
                            <span>{link.label}</span>
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
        <Separator className="my-1" />
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

    