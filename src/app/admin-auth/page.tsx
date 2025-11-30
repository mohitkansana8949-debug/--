
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader, Lock } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';

const ADMIN_ACCESS_CODE = 'Quicklyam01';

export default function AdminAuthPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [, setIsAdminAuthenticated] = useLocalStorage('isAdminAuthenticated', false);

    const handleVerifyCode = () => {
        setIsLoading(true);
        if (code === ADMIN_ACCESS_CODE) {
            toast({
                title: 'Access Granted',
                description: 'Welcome to the Admin Panel.',
            });
            setIsAdminAuthenticated(true);
            router.replace('/admin');
        } else {
            toast({
                variant: 'destructive',
                title: 'Access Denied',
                description: 'The code you entered is incorrect.',
            });
            setIsLoading(false);
        }
    };
    
    return (
         <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl flex items-center justify-center gap-2">
                        <Lock className="h-6 w-6" />
                        Admin Access
                    </CardTitle>
                    <CardDescription>Please enter the access code to continue.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input
                        type="password"
                        placeholder="Enter access code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
                        disabled={isLoading}
                    />
                    <Button onClick={handleVerifyCode} className="w-full" disabled={isLoading}>
                         {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Verify
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
