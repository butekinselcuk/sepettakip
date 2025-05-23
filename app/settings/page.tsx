'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Kullanıcı rolüne göre doğru ayarlar sayfasına yönlendir
      switch(user.role) {
        case 'ADMIN':
          router.push('/admin/settings');
          break;
        case 'BUSINESS':
          router.push('/business/settings');
          break;
        case 'COURIER':
          router.push('/courier/settings');
          break;
        case 'CUSTOMER':
          router.push('/customer/settings');
          break;
        default:
          router.push('/auth/login');
      }
    } else if (!loading && !user) {
      // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      {loading ? (
        <div className="flex flex-col items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-500">Yükleniyor...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center p-8">
          <p className="text-gray-500">Yönlendiriliyor...</p>
        </div>
      )}
    </div>
  );
} 