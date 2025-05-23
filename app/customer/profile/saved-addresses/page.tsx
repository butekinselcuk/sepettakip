'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import AddressList from '@/components/profile/AddressList';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/app/components/ui/use-toast';

export default function SavedAddressesPage() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    
    // Auth kontrolü
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Token bulunamadı, login sayfasına yönlendiriliyor");
      router.push("/auth/login");
      return;
    }
    
    // Kullanıcı bilgilerini kontrol et
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        console.error("Kullanıcı bilgisi bulunamadı, login sayfasına yönlendiriliyor");
        router.push("/auth/login");
        return;
      }
      
      const userData = JSON.parse(storedUser);
      if (userData.role !== "CUSTOMER") {
        console.error("Kullanıcı rolü CUSTOMER değil, login sayfasına yönlendiriliyor");
        router.push("/auth/login");
        return;
      }
    } catch (error) {
      console.error("Kullanıcı bilgisi işlenirken hata:", error);
      router.push("/auth/login");
    }
  }, [router]);

  const handleAddressCreated = () => {
    toast({
      title: "Başarılı",
      description: "Adres başarıyla oluşturuldu",
    });
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
            <div className="flex items-center mb-4">
              <Button variant="ghost" onClick={() => router.back()} className="mr-2">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Geri
              </Button>
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Kayıtlı Adreslerim
              </h1>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Adreslerinizi yönetin, yeni adresler ekleyin veya mevcut adreslerinizi düzenleyin.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link href="/customer/address/create">
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Yeni Adres Ekle
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md">
          <AddressList />
        </div>
      </main>
    </div>
  );
} 