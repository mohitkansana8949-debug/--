
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { FirebaseClientProvider } from '@/firebase';
import { AuthGate } from '@/components/layout/auth-gate';
import { Suspense } from 'react';


const APP_NAME = "Quickly Study";
const APP_DEFAULT_TITLE = "Quickly Study";
const APP_TITLE_TEMPLATE = "%s - Quickly Study";
const APP_DESCRIPTION = "The quickest way to study.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: 'https://i.supaimg.com/6f2c48a1-5943-4025-9203-d0712fa34d7b.jpg',
    apple: 'https://i.supaimg.com/6f2c48a1-5943-4025-9203-d0712fa34d7b.jpg',
  },
  other: {
    "google-site-verification": "tpxyguMPSOqv1W6Aj42I4lhHQB-Ky5tA2SjqoP66LtI"
  }
};

export const viewport: Viewport = {
  themeColor: '#090E23',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <FirebaseClientProvider>
            <Suspense>
              <AuthGate>
                {children}
              </AuthGate>
            </Suspense>
          </FirebaseClientProvider>
          <Toaster />
          <div id="recaptcha-container"></div>
        </ThemeProvider>
      </body>
    </html>
  );
}
