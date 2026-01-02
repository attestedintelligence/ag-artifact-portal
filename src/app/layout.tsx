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
    default: "Attested Intelligence | Cryptographic Proof of Integrity",
    template: "%s | Attested Intelligence",
  },
  description: "Seal files and systems. Detect unauthorized changes. Prove what happened. Tamper-evident cryptographic attestation for consumers and enterprises.",
  keywords: ["cryptographic attestation", "file verification", "tamper-evident", "blockchain alternative", "Ed25519", "SHA-256", "offline verification", "integrity proof", "AI governance", "autonomous systems"],
  authors: [{ name: "Attested Intelligence" }],
  creator: "Attested Intelligence",
  metadataBase: new URL("https://attestedintelligence.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Attested Intelligence",
    title: "Attested Intelligence | Cryptographic Proof of Integrity",
    description: "Seal files and systems. Detect unauthorized changes. Prove what happened.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Attested Intelligence | Cryptographic Proof of Integrity",
    description: "Seal files and systems. Detect unauthorized changes. Prove what happened.",
    images: ["/og-image.png"],
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
