
'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ChannelRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/youtube');
    }, [router]);

    return null;
}
