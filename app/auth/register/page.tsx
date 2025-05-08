"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "";
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("CUSTOMER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Basic validation
    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor");
      setLoading(false);
      return;
    }

    try {
      console.log("Registering with:", { name, email, password, role });
      const response = await axios.post("/api/auth/register", {
        name,
        email,
        password,
        role
      }, {
        // Add timeout to prevent long waiting time
        timeout: 10000
      });
      
      console.log("Registration successful:", response.data);
      
      // Redirect to login page or callback URL
      router.push(callbackUrl || "/auth/login?registered=true");
      
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(
        err.response?.data?.message || 
        "Kayıt olurken bir hata oluştu. Lütfen tekrar deneyin."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-10">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2 text-blue-600">SepetTakip</h1>
            <p className="text-gray-600">Yeni hesap oluşturun</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                Ad Soyad
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ad Soyad"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                E-posta Adresi
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="ornek@mail.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                Şifre
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="********"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">
                Şifre Tekrarı
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="********"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-gray-700 font-medium mb-2">
                Hesap Türü
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="CUSTOMER">Müşteri</option>
                <option value="BUSINESS">İşletme</option>
                <option value="COURIER">Kurye</option>
              </select>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200"
            >
              {loading ? "Kaydediliyor..." : "Kayıt Ol"}
            </button>
            
            <div className="text-center mt-4">
              <p className="text-gray-600">
                Zaten hesabınız var mı?{" "}
                <Link href="/auth/login" className="text-blue-600 hover:underline">
                  Giriş Yap
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
      
      {/* Right side - Banner */}
      <div className="hidden md:flex md:w-1/2 bg-blue-600 text-white p-10 flex-col justify-center items-center">
        <div className="max-w-md text-center">
          <h2 className="text-3xl font-bold mb-6">Sepetlerinizi SepetTakip ile Kolayca Yönetin</h2>
          <p className="text-xl mb-8">
            {role === "BUSINESS" 
              ? "İşletmenizin siparişlerini kolayca yönetin." 
              : role === "COURIER" 
                ? "Teslimat süreçlerinizi optimize edin." 
                : "Siparişlerinizi online takip edin ve yönetin."}
          </p>
          <div className="flex justify-center">
            <div className="w-64 h-64 bg-blue-500 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-32 h-32">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                <line x1="15" y1="9" x2="15.01" y2="9"></line>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 