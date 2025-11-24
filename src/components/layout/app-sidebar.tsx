"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, PlusSquare, BrainCircuit } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home, tooltip: "Dashboard" },
    { href: "/generate", label: "Generate Deck", icon: PlusSquare, tooltip: "Generate Flashcards" },
    { href: "/decks", label: "My Decks", icon: BookOpen, tooltip: "My Decks" },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2" prefetch={false}>
          <BrainCircuit className="h-8 w-8 text-primary" />
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
    </Sidebar>
  );
}
