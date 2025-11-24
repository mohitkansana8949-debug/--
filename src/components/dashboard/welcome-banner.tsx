"use client";
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import placeholderData from '@/lib/placeholder-images.json';

export function WelcomeBanner() {
  const bannerImage = placeholderData.placeholderImages.find(p => p.id === 'dashboard-banner');
  return (
    <Card className="overflow-hidden shadow-lg">
      <div className="grid md:grid-cols-2">
        <div className="p-8 md:p-10 bg-card">
          <CardHeader className="p-0">
            <CardTitle className="text-3xl font-bold">Welcome to QuklyStudy!</CardTitle>
            <CardDescription className="mt-2 text-lg text-muted-foreground">
              The smartest and fastest way to create study materials.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 mt-6">
            <p className="max-w-prose">
              Turn your notes into interactive flashcards in seconds with the power of AI. Get started by generating your first deck.
            </p>
            <Button asChild className="mt-6" size="lg">
              <Link href="/generate">
                Generate Flashcards <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </CardContent>
        </div>
        <div className="relative h-60 md:h-full">
          {bannerImage && <Image
            src={bannerImage.imageUrl}
            alt={bannerImage.description}
            data-ai-hint={bannerImage.imageHint}
            fill
            className="object-cover"
          />}
           <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-card to-transparent"></div>
        </div>
      </div>
    </Card>
  );
}
