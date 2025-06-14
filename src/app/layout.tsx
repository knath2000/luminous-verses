import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "../stack";
import { Geist, Geist_Mono, Amiri } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "./components/ClientProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
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
      ><StackProvider app={stackServerApp}><StackTheme>
        <ClientProviders>
          {children}
        </ClientProviders>
        <div id="modal-root"></div>
      </StackTheme></StackProvider></body>
    </html>
  );
}
