import "@/app/globals.css";
import GlobalLoading from "@/components/GlobalLoading";
import { Toaster } from "@/components/Toaster";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3B82F6" },
    { media: "(prefers-color-scheme: dark)", color: "#1E293B" },
  ],
};

export const metadata: Metadata = {
  title: "ĐẠI THIÊN THẾ GIỚI - Vô địch",
  description:
    "Hệ thống tìm kiếm và trả lời câu hỏi của event đua top tông môn",
  keywords: [
    "DDTG",
    "ĐẠI THIÊN THẾ GIỚI",
    "Vô địch",
    "Đua Top Tông Môn HH3D",
    "Event Đua Top Tông Môn HH3D",
    "hh3d",
    "duatoptongmon",
  ],
  authors: [{ name: "DDTG Team" }],
  openGraph: {
    title: "ĐẠI THIÊN THẾ GIỚI - Vô địch",
    description:
      "Hệ thống tìm kiếm và trả lời câu hỏi của event đua top tông môn",
    type: "website",
    locale: "vi_VN",
  },
  robots: {
    index: true,
    follow: true,
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
        <meta
          name="apple-mobile-web-app-title"
          content="ĐẠI THIÊN THẾ GIỚI - Vô địch"
        />
        <meta name="msapplication-TileColor" content="#3B82F6" />
        <link rel="preload" href="/character-hero.jpg" as="image" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-background">
          {children}
          <Toaster />
          <GlobalLoading />
        </div>
      </body>
    </html>
  );
}
