'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import SettingsForm from '@/components/settings/SettingsForm';

export default function BusinessSettingsPage() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    
    // Auth kontrolü
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("Token bulunamadı, login sayfasına yönlendiriliyor");
      router.push("/auth/login");
      return;
    }
    
    // Kullanıcı bilgilerini kontrol et
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        console.log("Kullanıcı bilgisi bulunamadı, login sayfasına yönlendiriliyor");
        router.push("/auth/login");
        return;
      }
      
      const userData = JSON.parse(storedUser);
      if (userData.role !== "BUSINESS") {
        console.log("Kullanıcı rolü BUSINESS değil, login sayfasına yönlendiriliyor");
        router.push("/auth/login");
        return;
      }

      console.log("BUSINESS kullanıcısı doğrulandı:", userData.email);
    } catch (error) {
      console.error("Kullanıcı bilgisi işlenirken hata:", error);
      router.push("/auth/login");
    }
  }, [router]);

  const handleSettingsUpdate = (data: any) => {
    console.log('Ayarlar güncellendi:', data);
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              İşletme Ayarları
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Bildirim tercihleri, uygulama ayarları ve gizlilik seçeneklerinizi yönetin.
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <SettingsForm onUpdate={handleSettingsUpdate} />
          </div>
        </div>
      </main>
    </div>
  );
} 