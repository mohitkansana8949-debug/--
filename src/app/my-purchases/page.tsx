
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LifeBuoy, Info } from 'lucide-react';
import Link from 'next/link';

export default function MyPurchasesPage() {
  return (
    <div className="container mx-auto p-4 max-w-2xl">
        <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <LifeBuoy className="h-8 w-8 text-primary" />
                मेरे ऑर्डर्स
            </h1>
            <p className="text-muted-foreground">
                अपनी पुस्तक ऑर्डर के साथ सहायता प्राप्त करें।
            </p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>क्या आपको अपने ऑर्डर में सहायता चाहिए?</CardTitle>
                <CardDescription>
                    यदि आपके द्वारा दिए गए किसी पुस्तक ऑर्डर के बारे में आपके कोई प्रश्न हैं, तो कृपया हमसे संपर्क करें।
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                    <div className="flex">
                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-300 mr-3 mt-1 shrink-0" />
                        <div>
                            <h4 className="font-semibold text-blue-800 dark:text-blue-200">निर्देश</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                ऑर्डर देने के बाद, कृपया हमारी टीम से पुष्टि संदेश के लिए एक दिन प्रतीक्षा करें। यदि आपको पुष्टि नहीं मिलती है या आपके कोई अन्य प्रश्न हैं, तो कृपया हमारी सहायता टीम से संपर्क करें।
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                                हमें आपका ऑर्डर जल्दी खोजने में मदद करने के लिए, कृपया भुगतान के दौरान उपयोग किया गया अपना मोबाइल नंबर प्रदान करें।
                            </p>
                        </div>
                    </div>
                </div>
                
                <Button asChild className="w-full">
                    <Link href="/support">
                        <LifeBuoy className="mr-2 h-4 w-4" />
                        सहायता टीम से संपर्क करें
                    </Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
