"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CourierPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Token kontrolü
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    
    // Kullanıcı bilgilerini kontrol et
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        router.push("/auth/login");
        return;
      }
      
      const userData = JSON.parse(storedUser);
      if (userData.role !== "COURIER") {
        router.push("/auth/login");
        return;
      }
      
      // Kurye dashboard sayfasına yönlendir
      router.push("/courier/dashboard");
    } catch (error) {
      console.error("Kullanıcı bilgisi işlenirken hata:", error);
      router.push("/auth/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md max-w-md w-full">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Yönlendiriliyor</h2>
        <p className="text-gray-600 text-center">
          Kurye paneline yönlendiriliyorsunuz, lütfen bekleyin...
        </p>
      </div>
    </div>
  );
} 