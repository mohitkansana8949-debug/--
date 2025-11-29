'use client';
import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Pencil, ShieldCheck, Mail, Phone, User as UserIcon, MapPin, BookCopy, Trophy, BarChartHorizontal, Users } from 'lucide-react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, getDoc, onSnapshot, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Progress } from '@/components/ui/progress';

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

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [referralData, setReferralData] = useState<{ points: number; count: number }>({ points: 0, count: 0 });
  const [isReferralLoading, setIsReferralLoading] = useState(true);

  // Queries for all content types
  const coursesQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'courses') : null), [firestore]);
  const ebooksQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'ebooks') : null), [firestore]);
  const pyqsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'pyqs') : null), [firestore]);
  const testsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'tests') : null), [firestore]);

  const { data: allCourses } = useCollection(coursesQuery);
  const { data: allEbooks } = useCollection(ebooksQuery);
  const { data: allPyqs } = useCollection(pyqsQuery);
  const { data: allTests } = useCollection(testsQuery);

  const enrollmentsQuery = useMemoFirebase(
    () => user ? query(collection(firestore, 'enrollments'), where('userId', '==', user.uid)) : null,
    [user, firestore]
  );
  const { data: enrollments } = useCollection(enrollmentsQuery);
  
  const referralsQuery = useMemoFirebase(
      () => user ? query(collection(firestore, 'referrals'), where('referrerId', '==', user.uid)) : null,
      [user, firestore]
    );
  const { data: referrals, isLoading: referralsLoading } = useCollection(referralsQuery);


  const calculateProgress = useCallback(() => {
    if (!user || !enrollments || !allCourses || !allEbooks || !allPyqs || !allTests) {
      setProgress(0);
      return;
    }
    const totalItems = (allCourses.length || 0) + (allEbooks.length || 0) + (allPyqs.length || 0) + (allTests.length || 0);
    const approvedEnrollments = new Set(enrollments.filter(e => e.status === 'approved').map(e => e.itemId));
    
    if (totalItems === 0) {
      setProgress(0);
      return;
    }
    
    const progressPercentage = (approvedEnrollments.size / totalItems) * 100;
    setProgress(Math.min(100, progressPercentage));

  }, [allCourses, allEbooks, allPyqs, allTests, enrollments, user]);

  useEffect(() => {
    calculateProgress();
  }, [calculateProgress]);

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
    const checkAdminStatus = async () => {
        setIsAdminLoading(true);
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
    
    // Fetch User Data
    const userRef = doc(firestore, 'users', user.uid);
    const unsubUser = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
    });

    checkAdminStatus();

    return () => {
        unsubUser();
    };
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
                <CardDescription className="truncate">UID: {user.uid}</CardDescription>
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
            <CardTitle className="flex items-center"><Trophy className="mr-2 h-5 w-5 text-yellow-500"/>Referral Stats</CardTitle>
             <CardDescription>Track your referral earnings.</CardDescription>
          </CardHeader>
          <CardContent>
            {isReferralLoading ? (
                <div className="flex justify-center"><Loader className="animate-spin" /></div>
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
          </CardContent>
      </Card>

      <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><BarChartHorizontal className="mr-2 h-5 w-5"/>My Progress</CardTitle>
            <CardDescription>Track your learning journey through all our content.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-muted-foreground">Completion</span>
                    <span className="font-bold text-primary">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
                 <div className="text-center text-sm text-muted-foreground p-4 mt-2 rounded-lg border bg-card">
                    <Trophy className="mx-auto h-8 w-8 text-yellow-500 mb-2"/>
                    <p className="font-semibold">Complete 100% and get a ₹20 reward!</p>
                    <p>Finish all courses, e-books, and tests to claim your prize.</p>
                </div>
            </div>
          </CardContent>
      </Card>

    </div>
  );
}
