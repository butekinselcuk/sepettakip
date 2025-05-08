import './globals.css'
import 'leaflet/dist/leaflet.css'
import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { Toaster } from './components/ui/toaster';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'SepetTakip - Teslimat ve Kurye Yönetim Sistemi',
  description: 'SepetTakip, e-ticaret ve yemek teslimatı platformları için geliştirilmiş kapsamlı bir sipariş ve kurye yönetim sistemidir.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}