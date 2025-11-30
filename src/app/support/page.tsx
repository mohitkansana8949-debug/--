
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LifeBuoy, Mail, MessageSquare, Loader } from 'lucide-react';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function SupportPage() {
    const { firestore } = useFirebase();

    const supportSettingsRef = useMemoFirebase(
        () => (firestore ? doc(firestore, 'settings', 'support') : null),
        [firestore]
    );
    const { data: supportSettings, isLoading } = useDoc(supportSettingsRef);

    const whatsappNumber = supportSettings?.whatsappNumber || '8949814095';
    const email = supportSettings?.email || 'mohitkansana82@gmail.com';

    const openWhatsApp = () => {
        window.open(`https://wa.me/${whatsappNumber}`, '_blank');
    };

    const openEmail = () => {
        window.location.href = `mailto:${email}`;
    };

    return (
        <div className="container mx-auto p-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center">
                    <LifeBuoy className="mr-3 h-8 w-8" />
                    सहायता केंद्र
                </h1>
                <p className="text-muted-foreground">
                    मदद प्राप्त करें और हमसे संपर्क करें। हम आपके लिए यहां हैं!
                </p>
            </div>

            {isLoading ? (
                 <div className="flex h-64 items-center justify-center">
                    <Loader className="animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <MessageSquare className="mr-2 h-6 w-6 text-green-500" />
                                व्हाट्सएप सपोर्ट
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-4">
                                त्वरित प्रतिक्रिया के लिए व्हाट्सएप पर सीधे हमारे साथ चैट करें।
                            </p>
                            <p className="text-lg font-mono mb-4">{whatsappNumber}</p>
                            <Button onClick={openWhatsApp} className="w-full bg-green-600 hover:bg-green-700">
                                व्हाट्सएप पर चैट करें
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Mail className="mr-2 h-6 w-6 text-blue-500" />
                                ईमेल सपोर्ट
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-4">
                                हमें एक ईमेल भेजें और हम जल्द से जल्द आपसे संपर्क करेंगे।
                            </p>
                            <p className="text-lg font-mono mb-4 break-all">{email}</p>
                            <Button onClick={openEmail} className="w-full">
                                ईमेल भेजें
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

    