import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE_URL = "https://atc-acting.online";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "MFATC — မြန်မာ့ရှပ်ရှင်သရုပ်ဆောင်မြှင့်တင်ရေးသင်တန်း (Myanmar Film Acting Promotion Course)",
    template: "%s · MFATC",
  },
  description:
    "Myanmar Film Acting Promotion Course (MFATC) — Yangon အခြေစိုက် ရုပ်ရှင် သရုပ်ဆောင် သင်တန်း၏ တရားဝင် လျှောက်လွှာ form။ အသက် ၁၈–၂၈ ကြား မြန်မာနိုင်ငံသား လူငယ်များအတွက် သင်တန်းသား စိစစ်ရေး application။",
  applicationName: "MFATC",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "MFATC",
    title: "MFATC — Myanmar Film Acting Promotion Course",
    description:
      "Yangon အခြေစိုက် ရုပ်ရှင် သရုပ်ဆောင် သင်တန်း၏ တရားဝင် လျှောက်လွှာ form။ အသက် ၁၈–၂၈ ကြား။",
    locale: "my_MM",
    images: [{ url: "/IMG_4294.png", width: 1200, height: 630, alt: "MFATC" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MFATC — Myanmar Film Acting Promotion Course",
    description:
      "Yangon အခြေစိုက် ရုပ်ရှင် သရုပ်ဆောင် သင်တန်း၏ တရားဝင် လျှောက်လွှာ form။",
    images: ["/IMG_4294.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  themeColor: "#FDC83A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="my" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
