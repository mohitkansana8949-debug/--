"use client";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null; 
  }

  return (
    <div className="container mx-auto p-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to QuklyStudy</h1>
        <p className="text-xl text-muted-foreground">Your journey to knowledge begins here.</p>
      </div>
      <div className="flex justify-center gap-6">
        <Button size="lg" asChild>
          <Link href="/courses?filter=free">Explore Free Courses</Link>
        </Button>
        <Button size="lg" variant="secondary" asChild>
          <Link href="/courses?filter=paid">Browse Paid Courses</Link>
        </Button>
      </div>
    </div>
  );
}
