import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  title: "talksy.code.visualizer",
  description: "Step-by-step code execution visualization platform",
  metadataBase: new URL(siteUrl),
  applicationName: "talksy.code.visualizer",
  keywords: [
    "code visualization",
    "programming visualizer",
    "algorithm animation",
    "execution trace",
    "JavaScript debugger",
    "Python debugger",
    "learning to code",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon_web.jpg",
    shortcut: "/favicon_web.jpg",
    apple: "/favicon_web.jpg",
  },
  openGraph: {
    title: "talksy.code.visualizer",
    description: "Step-by-step code execution visualization platform",
    url: siteUrl,
    siteName: "talksy.code.visualizer",
    type: "website",
    images: [
      {
        url: "/sharing_icon.jpg",
        width: 1200,
        height: 630,
        alt: "talksy.code.visualizer sharing preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "talksy.code.visualizer",
    description: "Step-by-step code execution visualization platform",
    images: ["/sharing_icon.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} antialiased`}
    >
      <body>
        <ClerkProvider>
          {children}
          {gaMeasurementId ? (
            <>
              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
                strategy="afterInteractive"
              />
              <Script id="google-analytics" strategy="afterInteractive">
                {`window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaMeasurementId}', { page_path: window.location.pathname });`}
              </Script>
            </>
          ) : null}
        </ClerkProvider>
      </body>
    </html>
  );
}
