import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Primary font - Space Grotesk (per design spec)
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap", // Prevent FOIT
  preload: true,
});

// Mono font for code/hashes
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
  preload: true,
});

// Optimized metadata
export const metadata: Metadata = {
  title: {
    default: "AGA Portal | Attested Intelligence",
    template: "%s | AGA Portal",
  },
  description: "Attested Governance Artifacts - Cryptographic attestation platform for creating tamper-evident policy artifacts and verifiable evidence bundles.",
  keywords: ["attestation", "governance", "artifacts", "cryptographic", "verification", "evidence", "policy", "compliance"],
  authors: [{ name: "Attested Intelligence" }],
  creator: "Attested Intelligence",
  metadataBase: new URL("https://attestedintelligence.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "AGA Portal",
    title: "AGA Portal | Attested Intelligence",
    description: "Attested Governance Artifacts - The Integrity Layer for Autonomous Defense.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AGA Portal | Attested Intelligence",
    description: "Attested Governance Artifacts - The Integrity Layer for Autonomous Defense.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Viewport optimization
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0A0E17" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0E17" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${geistMono.variable} font-sans antialiased bg-void text-foreground min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
