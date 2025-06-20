import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionWrapper from "@/components/SessionWrapper";
import { Toaster } from "@/components/Toaster";
import GlobalLoading from "@/components/GlobalLoading";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3B82F6' },
    { media: '(prefers-color-scheme: dark)', color: '#1E293B' }
  ],
}

export const metadata: Metadata = {
  title: "HH3D Management - Hệ thống quản lý game chuyên nghiệp",
  description: "Hệ thống quản lý tài khoản HH3D với giao diện hiện đại, bảo mật cao và tính năng đa dạng",
  keywords: ["HH3D", "game management", "account management", "gaming", "quản lý game"],
  authors: [{ name: "HH3D Team" }],
  openGraph: {
    title: "HH3D Management",
    description: "Hệ thống quản lý tài khoản HH3D chuyên nghiệp",
    type: "website",
    locale: "vi_VN",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="HH3D Management" />
        <meta name="msapplication-TileColor" content="#3B82F6" />
        <link rel="preload" href="/character-hero.jpg" as="image" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionWrapper>
          <div className="min-h-screen bg-background">
            {children}
            <Toaster />
            <GlobalLoading />
          </div>
        </SessionWrapper>
      </body>
    </html>
  );
}
