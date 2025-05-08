"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";
  const registered = searchParams?.get("registered");
  
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(registered ? "Kayıt başarılı! Şimdi giriş yapabilirsiniz." : "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      console.log("Attempting login with:", email);
      
      // For development testing purposes, use Test123 as password
      const passwordToUse = process.env.NODE_ENV === 'development' && !password 
        ? 'Test123' 
        : password;
      
      const response = await axios.post("/api/auth/login", {
        email,
        password: passwordToUse,
      }, {
        // Add timeout to prevent long waiting time
        timeout: 10000
      });
      
      console.log("Login successful:", response.data.user);
      
      // Save token to localStorage for client-side API calls
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        // Kullanıcı bilgilerini de localStorage'a kaydet
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      // Redirect to appropriate dashboard based on user role
      const { role } = response.data.user;
      
      let redirectPath = callbackUrl;
      
      // If no specific callback URL, redirect based on role
      if (callbackUrl === "/") {
        switch (role) {
          case "ADMIN":
            redirectPath = "/admin/dashboard";
            break;
          case "BUSINESS":
            redirectPath = "/business/dashboard";
            break;
          case "COURIER":
            redirectPath = "/courier/dashboard";
            break;
          case "CUSTOMER":
            redirectPath = "/customer/dashboard";
            break;
          default:
            redirectPath = "/";
            break;
        }
      }
      
      setSuccess("Giriş başarılı! Yönlendiriliyorsunuz...");
      setTimeout(() => {
        router.push(redirectPath);
      }, 500);
      
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.response) {
        // Response received with error status
        if (err.response.status === 401) {
          setError("E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.");
        } else if (err.response.data?.message) {
          setError(err.response.data.message);
        } else {
          setError("Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.");
        }
      } else if (err.request) {
        // Request made but no response received
        setError("Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.");
      } else {
        // Error in setting up the request
        setError("Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Left side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-10">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2 text-blue-600">SepetTakip</h1>
            <p className="text-gray-600">Hesabınıza giriş yapın</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-md">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-gray-700 font-medium">
                  Şifre
                </label>
                <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
                  Şifremi Unuttum
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="*************"
              />
              <p className="text-xs text-gray-500 mt-1">
                Geliştirme modunda test için: admin@example.com / Test123
              </p>
            </div>
            
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Beni hatırla
              </label>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200"
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
            
            <div className="text-center mt-4">
              <p className="text-gray-600">
                Hesabınız yok mu?{" "}
                <Link href="/auth/register" className="text-blue-600 hover:underline">
                  Kayıt Ol
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
            SepetTakip, e-ticaret ve yemek teslimatı platformları için geliştirilmiş kapsamlı bir sipariş ve kurye yönetim sistemidir.
          </p>
          <div className="flex justify-center">
            <div className="w-64 h-64 bg-blue-500 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-32 h-32">
                <path d="M3 9a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9z"></path>
                <path d="M3 9v-2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v2"></path>
                <path d="M10 14l-2 -2l2 -2m4 0l2 2l-2 2"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 