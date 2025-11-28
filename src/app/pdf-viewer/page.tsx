
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Loader, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';

function PdfViewerContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pdfUrl = searchParams.get('url');

    if (!pdfUrl) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-center p-4">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-2xl font-bold">PDF Not Found</h2>
                <p className="text-muted-foreground">The document you are looking for is not available.</p>
                 <Button asChild className="mt-6" variant="outline" onClick={() => router.back()}>
                  <Link href="/">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Go Back
                  </Link>
                 </Button>
            </div>
        )
    }

    return (
        <iframe 
            src={pdfUrl}
            className="w-full h-full border-0"
            title="PDF Viewer"
        >
        </iframe>
    )
}

export default function PdfViewerPage() {
    return (
        <div className="w-screen h-screen">
            <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader className="animate-spin" /></div>}>
                <PdfViewerContent />
            </Suspense>
        </div>
    );
}

    