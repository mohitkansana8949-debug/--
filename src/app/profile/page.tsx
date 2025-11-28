
'use client';
import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Pencil, ShieldCheck, Mail, Phone, User as UserIcon, MapPin, BookCopy, Info } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useFirestore } from '@/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

// Helper function to get a color based on user ID
const getColorForId = (id: string) => {
  const colors = [
    'bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
    'bg-orange-500', 'bg-cyan-500'
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[hash % colors.length];
};

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (!user || !firestore) {
      if (!isUserLoading) setIsAdminLoading(false);
      return;
    }
    
    const checkAdminStatus = async () => {
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
    };

    const userRef = doc(firestore, 'users', user.uid);
    const unsub = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
    });
    
    checkAdminStatus();

    return () => unsub();
}, [user, firestore, isUserLoading]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'QS';
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length - 1]) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  
  const avatarColor = useMemo(() => user ? getColorForId(user.uid) : 'bg-muted', [user]);
  const finalLoading = isUserLoading || isAdminLoading;

  if (finalLoading) {
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
    return <p>Please login to view your profile.</p>;
  }

  const ProfileInfoItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | undefined | null }) => (
    value ? (
        <div className="flex items-start gap-3">
            <div className="text-muted-foreground mt-1">{icon}</div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-medium">{value}</p>
            </div>
        </div>
    ) : null
  );

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">View and manage your profile information.</p>
       </div>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-center gap-4">
             <Avatar className="h-20 w-20 text-3xl">
               <AvatarFallback className={`text-white font-bold ${avatarColor}`}>{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
            <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                {user.displayName || 'Unnamed User'}
                {isAdmin && <Badge variant="success"><ShieldCheck className="mr-1 h-3 w-3" /> Admin</Badge>}
                </CardTitle>
                <CardDescription>{user.email}</CardDescription>
            </div>
          </div>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/complete-profile">
                <Pencil className="mr-2 h-4 w-4" />
                Edit Profile
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 w-full mt-4">
            <ProfileInfoItem icon={<Phone size={18} />} label="Mobile" value={userData?.mobile} />
            <ProfileInfoItem icon={<UserIcon size={18} />} label="Category" value={userData?.category} />
            <ProfileInfoItem icon={<MapPin size={18} />} label="State" value={userData?.state} />
            <ProfileInfoItem icon={<BookCopy size={18} />} label="Class/Exam" value={userData?.class} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    