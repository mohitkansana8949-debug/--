"use client";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ArrowRight, BookOpen, Gift, GraduationCap, Laptop, Library, Newspaper } from "lucide-react";


const featureCards = [
  { title: "कोर्सेस", href: "/courses", icon: BookOpen, color: "bg-blue-500" },
  { title: "फ्री कोर्सेस", href: "/courses?filter=free", icon: Gift, color: "bg-orange-500" },
  { title: "स्कॉलरशिप", href: "/scholarship", icon: GraduationCap, color: "bg-green-500" },
  { title: "टेस्ट सीरीज", href: "/test-series", icon: Newspaper, color: "bg-purple-500" },
  { title: "लाइव क्लासेस", href: "/live-classes", icon: Laptop, color: "bg-pink-500" },
  { title: "बुक शाला", href: "/book-shala", icon: Library, color: "bg-red-500" },
]


export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/signup");
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>लोड हो रहा है...</p>
      </div>
    );
  }

  if (!user) {
    return null; 
  }

  return (
    <div className="p-4 space-y-6">
      <div className="text-left">
        <h1 className="text-3xl font-bold">नमस्ते {user.displayName || 'स्टूडेंट'}!</h1>
      </div>

      <div className="bg-yellow-400 text-black p-3 rounded-lg text-center font-semibold">
        <p>कृपया सब्सक्राइब करें 👍 क्लिक करें 👍</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {featureCards.map(card => (
          <Link href={card.href} key={card.title}>
            <Card className={`flex flex-col items-center justify-center p-4 text-center aspect-square text-white ${card.color}`}>
              <card.icon className="w-8 h-8 mb-2"/>
              <span className="font-semibold text-sm">{card.title}</span>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">हमारे शिक्षक</h2>
        <Card className="p-4">
          <p className="text-muted-foreground">शिक्षकों की सूची जल्द ही आ रही है।</p>
        </Card>
      </div>
    </div>
  );
}
