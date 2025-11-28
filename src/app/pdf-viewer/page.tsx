
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
                  <button>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Go Back
                  </button>
                 </Button>
            </div>
        )
    }
    
    // Check if it's a Google Drive URL and convert it for embedding
    const getEmbedUrl = (url: string) => {
        const gdriveRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
        const match = url.match(gdriveRegex);
        if (match && match[1]) {
            return `https://drive.google.com/file/d/${match[1]}/preview`;
        }
        return url;
    }

    const embeddableUrl = getEmbedUrl(pdfUrl);

    return (
        <iframe 
            src={embeddableUrl}
            className="w-full h-full border-0"
            title="PDF Viewer"
            allow="fullscreen"
        >
        </iframe>
    )
}

export default function PdfViewerPage() {
    return (
        <div className="w-screen h-screen bg-gray-800">
            <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader className="animate-spin" /></div>}>
                <PdfViewerContent />
            </Suspense>
        </div>
    );
}
