'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LifeBuoy, Mail, MessageSquare } from 'lucide-react';

export default function SupportPage() {
  const whatsappNumber = '8949814095';
  const email = 'mohitkansana82@gmail.com';

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
          Support Center
        </h1>
        <p className="text-muted-foreground">
          Get help and contact us. We're here for you!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-6 w-6 text-green-500" />
              WhatsApp Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Chat with us directly on WhatsApp for a quick response.
            </p>
            <p className="text-lg font-mono mb-4">{whatsappNumber}</p>
            <Button onClick={openWhatsApp} className="w-full bg-green-600 hover:bg-green-700">
              Chat on WhatsApp
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="mr-2 h-6 w-6 text-blue-500" />
              Email Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Send us an email and we'll get back to you as soon as possible.
            </p>
            <p className="text-lg font-mono mb-4 break-all">{email}</p>
            <Button onClick={openEmail} className="w-full">
              Send Email
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
