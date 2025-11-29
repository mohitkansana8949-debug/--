
'use client';

import { useParams } from 'next/navigation';
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader, Award, AlertTriangle, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CertificatePage() {
    const { certificateId } = useParams();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const certificateRef = useMemoFirebase(
        () => (firestore && user && certificateId ? doc(firestore, `users/${user.uid}/certificates`, certificateId as string) : null),
        [firestore, user, certificateId]
    );

    const { data: certificate, isLoading: certificateLoading } = useDoc(certificateRef);

    const isLoading = isUserLoading || certificateLoading;

    if (isLoading) {
        return <div className="fixed inset-0 bg-background flex items-center justify-center"><Loader className="animate-spin text-primary h-12 w-12" /></div>;
    }

    if (!certificate) {
        return (
             <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-2xl font-bold">Certificate Not Found</h2>
                <p className="text-muted-foreground">The certificate you are looking for does not exist or you do not have permission to view it.</p>
                <Button asChild className="mt-6">
                    <Link href="/profile">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Profile
                    </Link>
                </Button>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-background text-foreground rounded-lg shadow-2xl border-4 border-primary p-6 sm:p-8 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-24 h-24 sm:w-32 sm:h-32 border-t-8 border-l-8 border-amber-400 rounded-tl-lg opacity-50"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 sm:w-32 sm:h-32 border-b-8 border-r-8 border-amber-400 rounded-br-lg opacity-50"></div>

                <div className="text-center space-y-4 sm:space-y-6 relative z-10">
                    <Award className="mx-auto h-20 w-20 sm:h-24 sm:w-24 text-amber-500" />

                    <h1 className="text-3xl sm:text-5xl font-bold text-primary tracking-wider font-display">
                        Certificate of Completion
                    </h1>

                    <p className="text-base sm:text-xl text-muted-foreground">
                        This certificate is proudly presented to
                    </p>

                    <h2 className="text-2xl sm:text-4xl font-semibold font-serif text-amber-600 dark:text-amber-400">
                        {certificate.userName}
                    </h2>

                    <p className="text-base sm:text-xl text-muted-foreground">
                        for successfully completing the {certificate.itemType}
                    </p>

                    <h3 className="text-xl sm:text-3xl font-bold">
                        &ldquo;{certificate.itemName}&rdquo;
                    </h3>
                    
                     <p className="text-base sm:text-xl text-muted-foreground">
                        with a score of <span className="font-bold text-primary">{certificate.grade}%</span> on
                    </p>

                    <p className="text-lg sm:text-2xl font-medium">
                        {format(certificate.completionDate.toDate(), 'MMMM d, yyyy')}
                    </p>
                </div>
                 <div className="mt-8 sm:mt-12 text-center relative z-10">
                    <p className="text-base sm:text-lg font-bold">Quickly Study</p>
                    <p className="text-xs text-muted-foreground">The Quickest Way to Study</p>
                </div>
            </div>
        </div>
    );
}
