import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// @ts-ignore: side-effect css import has no type declarations
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CSGO-Dog - CS:GO 饰品市场分析平台",
  description: "专业的 CS:GO 饰品市场分析平台,提供实时价格追踪、AI 预测、仓位建议和套利机会",
  icons: {
    icon: '/csgodog.png',
    shortcut: '/csgodog.png',
    apple: '/csgodog.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
