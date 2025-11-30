
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ManageYoutubePage() {
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage YouTube</CardTitle>
                <CardDescription>
                    The YouTube feature has been simplified to only show your channel's content to save API costs.
                    No further configuration is needed here.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    All videos are now being pulled directly from the "Quickly Study" YouTube channel. The public-facing
                    YouTube page now acts as a showcase for your channel.
                </p>
                 <Button asChild className="mt-4">
                    <Link href="/youtube">Go to YouTube Page</Link>
                </Button>
            </CardContent>
        </Card>
    );
}
