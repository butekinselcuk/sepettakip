import './globals.css'
import 'leaflet/dist/leaflet.css'
import type { Metadata, Viewport } from 'next'
import { ReactNode } from 'react'
import { Inter } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import Header from "@/components/Header";
import { Toaster } from '@/app/components/ui/toaster';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Sepet - Kurye Teslimat Sistemi',
  description: 'Kurye teslimat sistemi',
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}