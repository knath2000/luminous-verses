import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "../stack";
import { Geist, Geist_Mono, Amiri } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "./components/ClientProviders";
import { WebVitals } from "./components/WebVitals"; // Import WebVitals component

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap', // Add font-display swap
  preload: true,   // Preload primary font
  fallback: ['system-ui', 'arial'], // System fallbacks
});

const geistMono = Geist_Mono({ // Changed from Geist to Geist_Mono
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: false,  // Don't preload secondary fonts
  fallback: ['monospace'],
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: 'swap',
  preload: false,  // Load on demand for Arabic content
  fallback: ['serif'], // Arabic-compatible fallback
});

export const metadata: Metadata = {
  title: "Luminous Verses - Quran for Children",
  description: "A beautiful, child-friendly app to read and listen to verses of the Quran with stunning animations and engaging design.",
  keywords: "Quran, Islamic, Children, Education, Verses, Arabic",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${amiri.variable} antialiased`}
      >
        <StackProvider app={stackServerApp}>
          <StackTheme>
            <ClientProviders>
              {children}
              <div id="modal-root"></div>
              <WebVitals /> {/* Add WebVitals component */}
            </ClientProviders>
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
