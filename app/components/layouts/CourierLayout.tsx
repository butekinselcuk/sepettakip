"use client";

import { ReactNode, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface CourierLayoutProps {
  children: ReactNode;
}

export default function CourierLayout({ children }: CourierLayoutProps) {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    setIsClient(true);
    
    // Oturum kontrolü
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
      if (userData.role !== "COURIER") {
        console.log("Kullanıcı rolü COURIER değil, login sayfasına yönlendiriliyor");
        router.push("/auth/login");
        return;
      }

      console.log("COURIER kullanıcısı doğrulandı:", userData.email);
    } catch (error) {
      console.error("Kullanıcı bilgisi işlenirken hata:", error);
      router.push("/auth/login");
    }
  }, [router]);

  if (!isClient) {
    return null;
  }

  const isActive = (path: string) => {
    return pathname === path ? "bg-gray-900 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white";
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-white text-xl font-bold">Kurye Paneli</span>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link href="/courier/dashboard" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/courier/dashboard')}`}>
                    Kontrol Paneli
                  </Link>
                  <Link href="/courier/deliveries" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/courier/deliveries')}`}>
                    Teslimatlarım
                  </Link>
                  <Link href="/courier/map" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/courier/map')}`}>
                    Harita
                  </Link>
                  <Link href="/courier/earnings" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/courier/earnings')}`}>
                    Kazançlarım
                  </Link>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="bg-gray-800 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                >
                  <span className="text-sm">Çıkış Yap</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Kurye Paneli. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
} 