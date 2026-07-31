import type { Metadata, Viewport } from "next";
import { Prompt, Inter, Sarabun } from "next/font/google";
import "./globals.css";
import PWARegister from "./pwa-register";

const promptFont = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-prompt",
  display: "swap",
});

const interFont = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sarabunFont = Sarabun({
  weight: ["400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SmartApart - ระบบจัดการหอพักและอพาร์ทเม้นท์",
  description: "ระบบจดมิเตอร์น้ำไฟ บันทึกค่าเช่า และออกบิลอย่างสะดวกสำหรับหอพักและอพาร์ทเม้นท์",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SmartApart",
  },
  openGraph: {
    title: 'SmartApart - ระบบจัดการหอพักและอพาร์ทเม้นท์',
    description: 'ระบบจดมิเตอร์น้ำไฟ บันทึกค่าเช่า และออกบิลอย่างสะดวกสำหรับหอพักและอพาร์ทเม้นท์',
    type: 'website',
    locale: 'th_TH',
    siteName: 'SmartApart',
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${promptFont.variable} ${interFont.variable} ${sarabunFont.variable}`}>
      <body>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
