import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/services/providers/query.provider";
import { AuthProvider } from "@/services/providers/auth.provider";
import { SocketProvider } from "@/services/providers/SocketProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://your-domain.com"),

  title: {
    default: "CTF Platform",
    template: "%s | CTF PLATFORM",
  },

  description:
    "A modern full-stack Capture The Flag platform featuring live cybersecurity competitions, real-time leaderboards, team battles, challenge stories, notifications, and event infrastructure built for serious hackers and CTF communities.",

  keywords: [
    "CTF",
    "Capture The Flag",
    "Cybersecurity",
    "Hacking Platform",
    "CTF Platform",
    "Cyber Security Challenges",
    "Ethical Hacking",
    "Penetration Testing",
    "Bug Bounty",
    "CTF Events",
    "Hackathons",
    "Security Training",
    "Real-time Leaderboards",
    "Cyber Range",
  ],

  authors: [
    {
      name: "Mayank",
    },
  ],

  creator: "Mayank Mahajan",
  publisher: "Mayank Mahajan",

  applicationName: "CTF PLATFORM",

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://your-domain.com",
    siteName: "CTF PLATFORM",
    title: "Advanced CTF Platform",
    description:
      "Compete in real-time cybersecurity challenges, team battles, and live Capture The Flag events on a modern hacker-focused platform.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CTF Platform",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Advanced CTF Platform",
    description:
      "Modern Capture The Flag platform for hackers, teams, and live cybersecurity competitions.",
    images: ["/og-image.png"],
  },

  category: "technology",

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  alternates: {
    canonical: "https://your-domain.com",
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
        <TooltipProvider>
          <QueryProvider>
            <AuthProvider>
              <SocketProvider>
                <main>{children}</main>
              </SocketProvider>
            </AuthProvider>
          </QueryProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
