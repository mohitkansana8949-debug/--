'use client';
import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Pencil } from 'lucide-react';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'QS';
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length - 1]) {
        return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
  }

  if (isUserLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Card>
            <CardHeader><Skeleton className="h-8 w-32" /></CardHeader>
            <CardContent className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-60" />
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return <p>कृपया अपनी प्रोफ़ाइल देखने के लिए लॉगिन करें।</p>;
  }

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold">मेरी प्रोफ़ाइल</h1>
        <p className="text-muted-foreground">अपनी प्रोफ़ाइल जानकारी देखें और प्रबंधित करें।</p>
       </div>
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>यूज़र की जानकारी</CardTitle>
          <Button asChild variant="outline">
            <Link href="/complete-profile">
                <Pencil className="mr-2 h-4 w-4" />
                प्रोफ़ाइल संपादित करें
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <Avatar className="h-24 w-24">
             {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User Photo'} data-ai-hint="person face" />}
            <AvatarFallback className="text-3xl">{getInitials(user.displayName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-2xl font-semibold">{user.displayName || 'नाम प्रदान नहीं किया गया'}</p>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
