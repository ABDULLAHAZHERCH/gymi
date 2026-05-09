import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Bebas_Neue, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { UnitProvider } from "@/components/providers/UnitProvider";
import { Analytics } from "@vercel/analytics/next";
import { InstallPromptLoader } from "@/components/ui/InstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Kinetic v2 typography stack
const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const interSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans-kinetic",
  display: "swap",
});

const jetMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-kinetic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GYMI - AI Fitness Coach",
  description: "AI-powered fitness coach with real-time form correction",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              const theme = localStorage.getItem('gymi-theme') || 'dark';
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
              window.__deferredInstallPrompt = null;
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.__deferredInstallPrompt = e;
              });
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').catch(function() {});
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bebas.variable} ${interSans.variable} ${jetMono.variable} antialiased`}
      >
        <Script src="/shader-bg.js" strategy="afterInteractive" />
        <AuthProvider>
          <UnitProvider>
            <ThemeProvider>
              {children}
              <InstallPromptLoader />
            </ThemeProvider>
          </UnitProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
