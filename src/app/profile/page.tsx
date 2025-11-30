
'use client';
import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Pencil, ShieldCheck, Mail, Phone, User as UserIcon, MapPin, BookCopy, Trophy, BarChartHorizontal, Users, Award, ChevronRight, Bell } from 'lucide-react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, getDoc, onSnapshot, collection, query, where, orderBy, Timestamp, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';


// Helper function to get a color based on user ID
const getColorForId = (id: string) => {
  if (!id) return 'bg-muted';
  const colors = [
    'bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
    'bg-orange-500', 'bg-cyan-500'
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const truncateEmail = (email: string | null | undefined) => {
    if (!email) return null;
    const atIndex = email.indexOf('@');
    if (atIndex < 3) return email;
    const name = email.substring(0, atIndex);
    const domain = email.substring(atIndex);
    return `${name.substring(0, 2)}*****${domain}`;
};

const truncateUid = (uid: string | null | undefined) => {
    if (!uid) return null;
    if (uid.length <= 8) return uid;
    return `${uid.substring(0, 4)}...${uid.substring(uid.length - 4)}`;
};


export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [referralData, setReferralData] = useState<{ points: number; count: number }>({ points: 0, count: 0 });
  const [isReferralLoading, setIsReferralLoading] = useState(true);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const referralsQuery = useMemoFirebase(
      () => user ? query(collection(firestore, 'referrals'), where('referrerId', '==', user.uid)) : null,
      [user, firestore]
    );
  const { data: referrals, isLoading: referralsLoading } = useCollection(referralsQuery);
  
  const certificatesQuery = useMemoFirebase(
    () => user ? query(collection(firestore, `users/${user.uid}/certificates`), orderBy('completionDate', 'desc')) : null,
    [user, firestore]
  );
  const { data: certificates, isLoading: certificatesLoading } = useCollection(certificatesQuery);

  useEffect(() => {
      if (!referralsLoading && referrals) {
          const count = referrals.length;
          const points = count * 10;
          setReferralData({ count, points });
      }
      if(!referralsLoading){
        setIsReferralLoading(false);
      }
  }, [referrals, referralsLoading]);


  useEffect(() => {
    if (!user || !firestore) {
      if (!isUserLoading) {
        setIsAdminLoading(false);
      }
      return;
    }
    
    // Check Admin Status
    const adminRef = doc(firestore, 'roles_admin', user.uid);
    const unsubAdmin = onSnapshot(adminRef, (doc) => {
        setIsAdmin(doc.exists() && doc.data().role === 'admin');
        setIsAdminLoading(false);
    });
    
    // Fetch User Data
    const userRef = doc(firestore, 'users', user.uid);
    const unsubUser = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserData(data);
        setNotificationsEnabled(!!data.fcmToken);
      }
    });

    return () => {
        unsubAdmin();
        unsubUser();
    };
}, [user, firestore, isUserLoading]);

  const handleNotificationToggle = async (enabled: boolean) => {
      if (!user || !firestore) return;
      
      const userRef = doc(firestore, 'users', user.uid);
      
      if (enabled) {
          // Logic to request permission and get token is in NotificationHandler
          // Here we just reflect the intended state, the handler will update fcmToken
          toast({ title: 'Please allow notification permission in your browser.' });
      } else {
          // User wants to disable, so we remove the token
          try {
              await updateDoc(userRef, { fcmToken: null });
              setNotificationsEnabled(false);
              toast({ title: 'Notifications Disabled' });
          } catch (error) {
              console.error("Error disabling notifications:", error);
              toast({ variant: 'destructive', title: 'Error', description: 'Could not disable notifications.' });
          }
      }
  }

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
                <p className="font-medium truncate">{value}</p>
            </div>
        </div>
    ) : null
  );

  return (
    <div className="space-y-6">
       <div className="min-w-0">
        <h1 className="text-3xl font-bold truncate">My Profile</h1>
        <p className="text-muted-foreground truncate">View and manage your profile information.</p>
       </div>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4 min-w-0">
             <Avatar className="h-16 w-16 text-2xl flex-shrink-0">
               <AvatarFallback className={`text-white font-bold ${avatarColor}`}>{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-xl truncate">
                <span className="truncate">{user.displayName || 'Unnamed User'}</span>
                {isAdmin && <Badge variant="success" className="flex-shrink-0"><ShieldCheck className="mr-1 h-3 w-3" /> Admin</Badge>}
                </CardTitle>
                <CardDescription className="truncate">UID: {truncateUid(user.uid)}</CardDescription>
            </div>
          </div>
          <Button asChild variant="outline" className="w-full sm:w-auto flex-shrink-0">
            <Link href="/complete-profile">
                <Pencil className="mr-2 h-4 w-4" />
                Edit Profile
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 w-full mt-4">
            <ProfileInfoItem icon={<Mail size={18} />} label="Email" value={truncateEmail(user.email)} />
            <ProfileInfoItem icon={<Phone size={18} />} label="Mobile" value={userData?.mobile} />
            <ProfileInfoItem icon={<UserIcon size={18} />} label="Category" value={userData?.category} />
            <ProfileInfoItem icon={<MapPin size={18} />} label="State" value={userData?.state} />
            <ProfileInfoItem icon={<BookCopy size={18} />} label="Class/Exam" value={userData?.class} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center"><Bell className="mr-2 h-5 w-5 text-primary"/>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
             <div className="flex items-center justify-between">
                <Label htmlFor="notif-toggle" className="font-medium">Receive Push Notifications</Label>
                <Switch
                    id="notif-toggle"
                    checked={notificationsEnabled}
                    onCheckedChange={handleNotificationToggle}
                />
            </div>
        </CardContent>
      </Card>
      
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Trophy className="mr-2 h-5 w-5 text-yellow-500"/>Referral Stats</CardTitle>
             <CardDescription>Track your referral earnings and rewards.</CardDescription>
          </CardHeader>
          <CardContent>
            {isReferralLoading ? (
                <div className="flex justify-center"><Skeleton className="h-20 w-full" /></div>
            ) : (
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-card rounded-lg border">
                        <p className="text-3xl font-bold">{referralData.count}</p>
                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><Users className="h-4 w-4"/>Friends Joined</p>
                    </div>
                    <div className="p-4 bg-card rounded-lg border">
                        <p className="text-3xl font-bold">{referralData.points}</p>
                        <p className="text-sm text-muted-foreground">Points Earned</p>
                    </div>
                </div>
            )}
             <Button asChild className="w-full mt-4"><Link href="/refer">View Refer & Earn</Link></Button>
          </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center"><Award className="mr-2 h-5 w-5 text-yellow-500"/>Your Certificates</CardTitle>
            <CardDescription>All certificates you have earned from completing tests and courses.</CardDescription>
        </CardHeader>
        <CardContent>
            {certificatesLoading ? (
                <div className="flex justify-center"><Skeleton className="h-10 w-full" /></div>
            ) : certificates && certificates.length > 0 ? (
                <div className="space-y-2">
                    {certificates.map(cert => (
                        <Card key={cert.id}>
                            <CardContent className="p-3 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold">{cert.itemName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Earned on {format(cert.completionDate.toDate(), 'MMMM d, yyyy')} with a score of {cert.grade}%
                                    </p>
                                </div>
                                <Button asChild variant="ghost" size="icon">
                                    <Link href={`/certificate/${cert.id}`}>
                                        <ChevronRight />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted-foreground p-4">You haven't earned any certificates yet.</p>
            )}
        </CardContent>
      </Card>

      <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><BarChartHorizontal className="mr-2 h-5 w-5"/>My Progress</CardTitle>
            <CardDescription>Track your learning journey through all our content.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full"><Link href="/my-progress">View Full Progress</Link></Button>
          </CardContent>
      </Card>

    </div>
  );
}
