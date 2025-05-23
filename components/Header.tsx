"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
import { LogOut, User, Package, ShoppingCart, BarChart2, Settings, Menu, ArrowLeft } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { isAuthenticated, getUser } from '@/lib/auth-utils';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [localUser, setLocalUser] = useState<UserInfo | null>(null);

  // İlk yükleme ve navigasyon sonrası kullanıcı bilgisini kontrol et
  useEffect(() => {
    // Auth Context'ten user gelmemişse localStorage'dan kontrol et
    if (!user && !isLoading && isAuthenticated()) {
      const localStorageUser = getUser();
      if (localStorageUser) {
        setLocalUser(localStorageUser);
      }
    } else if (user) {
      setLocalUser(user);
    }
  }, [user, isLoading, pathname]);

  // Header görüntülenmeden önce kullanıcı durumunu doğrula
  useEffect(() => {
    if (!user && !isLoading && isAuthenticated()) {
      try {
        const storedUser = getUser();
        if (storedUser) {
          setLocalUser(storedUser);
        }
      } catch (error) {
        console.error('Kullanıcı bilgisi alınamadı:', error);
      }
    }
  }, []);

  const handleBack = () => {
    router.back();
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleLogout = async () => {
    try {
      console.log('Header: Çıkış yapılıyor...');
      
      // Önce API çağrısı yap
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Header: Çıkış yanıtı:', data);
      
      // Sonra AuthContext'teki logout fonksiyonunu çağır
      await logout();
      
      // En son yönlendirme yap
      router.push('/auth/login');
    } catch (error) {
      console.error('Header: Çıkış hatası:', error);
      // Hata durumunda da yönlendir
    router.push('/auth/login');
    }
  };

  const refreshPage = () => {
    window.location.reload();
  };

  // Hangi kullanıcı bilgisini göstereceğimize karar ver (context veya localStorage)
  const currentUser = user || localUser;

  // Eğer path /auth/ ile başlıyorsa (login, register gibi) header'ı gösterme
  if (pathname?.startsWith('/auth/')) {
    return null;
  }

  // Layout sayfalarında header'ı gösterme
  if (pathname === '/' || pathname === '/app' || pathname === '/error') {
    return null;
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo ve Geri Butonu */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
              aria-label="Geri"
              title="Geri git"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            
            <Link href="/" className="font-bold text-xl text-blue-600">
              SepetTakip
            </Link>
          </div>

          {/* Navigasyon - Mobil için */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          {/* Navigasyon - Masaüstü için */}
          <nav className="hidden md:flex space-x-8">
            {currentUser?.role === 'ADMIN' && (
              <>
                <Link 
                  href="/admin/dashboard" 
                  className={`text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium ${
                    pathname?.includes('/admin/dashboard') ? 'text-blue-600 border-b-2 border-blue-600' : ''
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/admin/users" 
                  className={`text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium ${
                    pathname?.includes('/admin/users') ? 'text-blue-600 border-b-2 border-blue-600' : ''
                  }`}
                >
                  Kullanıcılar
                </Link>
                <Link 
                  href="/admin/businesses" 
                  className={`text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium ${
                    pathname?.includes('/admin/businesses') ? 'text-blue-600 border-b-2 border-blue-600' : ''
                  }`}
                >
                  İşletmeler
                </Link>
                <Link 
                  href="/admin/orders" 
                  className={`text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium ${
                    pathname?.includes('/admin/orders') ? 'text-blue-600 border-b-2 border-blue-600' : ''
                  }`}
                >
                  Siparişler
                </Link>
                <Link 
                  href="/admin/reports" 
                  className={`text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium ${
                    pathname?.includes('/admin/reports') ? 'text-blue-600 border-b-2 border-blue-600' : ''
                  }`}
                >
                  Raporlar
                </Link>
              </>
            )}

            {currentUser?.role === 'BUSINESS' && (
              <>
                <Link 
                  href="/business/dashboard" 
                  className={`text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium ${
                    pathname?.includes('/business/dashboard') ? 'text-blue-600 border-b-2 border-blue-600' : ''
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/business/products" 
                  className={`text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium ${
                    pathname?.includes('/business/products') ? 'text-blue-600 border-b-2 border-blue-600' : ''
                  }`}
                >
                  Ürünler
                </Link>
                <Link 
                  href="/business/orders" 
                  className={`text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium ${
                    pathname?.includes('/business/orders') ? 'text-blue-600 border-b-2 border-blue-600' : ''
                  }`}
                >
                  Siparişler
                </Link>
              </>
            )}

            {currentUser?.role === 'COURIER' && (
              <>
                <Link 
                  href="/courier/dashboard" 
                  className={`text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium ${
                    pathname?.includes('/courier/dashboard') ? 'text-blue-600 border-b-2 border-blue-600' : ''
                  }`}
                >
                  Teslimatlar
                </Link>
              </>
            )}

            {currentUser?.role === 'CUSTOMER' && (
              <>
                <Link 
                  href="/customer/dashboard" 
                  className={`text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium ${
                    pathname?.includes('/customer/dashboard') ? 'text-blue-600 border-b-2 border-blue-600' : ''
                  }`}
                >
                  Siparişlerim
                </Link>
                <Link 
                  href="/customer/profile" 
                  className={`text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium ${
                    pathname?.includes('/customer/profile') ? 'text-blue-600 border-b-2 border-blue-600' : ''
                  }`}
                >
                  Profilim
                </Link>
              </>
            )}
          </nav>

          {/* Kullanıcı menüsü */}
          {currentUser && (
            <div className="flex items-center relative">
              <button 
                onClick={toggleUserMenu}
                className="relative h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-200"
                aria-label="Kullanıcı Menüsü"
                title={`${currentUser.name || currentUser.email} - ${currentUser.role}`}
              >
                {currentUser.name?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
              </button>
              
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 top-8 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                      <p className="text-xs leading-none text-gray-500">{currentUser.email}</p>
                      <p className="text-xs mt-1 font-medium text-gray-500">
                        Rol: {currentUser.role === 'ADMIN' ? 'Yönetici' : 
                              currentUser.role === 'BUSINESS' ? 'İşletme' : 
                              currentUser.role === 'COURIER' ? 'Kurye' : 
                              currentUser.role === 'CUSTOMER' ? 'Müşteri' : currentUser.role}
                      </p>
                    </div>
                  </div>
                  <div className="py-1">
                    <Link 
                      href={`/${currentUser.role.toLowerCase()}/profile`}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profil
                    </Link>
                    <Link 
                      href={`/${currentUser.role.toLowerCase()}/settings`}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Ayarlar
                    </Link>
                    <button 
                      onClick={refreshPage}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <BarChart2 className="h-4 w-4 mr-2" />
                      Yenile
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobil menü */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 p-4 shadow-md">
          <nav className="grid gap-2">
            {currentUser?.role === 'ADMIN' && (
              <>
                <Link 
                  href="/admin/dashboard" 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/admin/users" 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Kullanıcılar
                </Link>
                <Link 
                  href="/admin/businesses" 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  İşletmeler
                </Link>
                <Link 
                  href="/admin/orders" 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Siparişler
                </Link>
                <Link 
                  href="/admin/reports" 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Raporlar
                </Link>
              </>
            )}

            {currentUser?.role === 'BUSINESS' && (
              <>
                <Link 
                  href="/business/dashboard" 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/business/products" 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Ürünler
                </Link>
                <Link 
                  href="/business/orders" 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Siparişler
                </Link>
              </>
            )}

            {currentUser?.role === 'COURIER' && (
              <>
                <Link 
                  href="/courier/dashboard" 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Teslimatlar
                </Link>
                <Link 
                  href="/courier/profile" 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profil
                </Link>
                <Link 
                  href="/courier/settings" 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Ayarlar
                </Link>
              </>
            )}

            {currentUser?.role === 'CUSTOMER' && (
              <>
                <Link 
                  href="/customer/dashboard" 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Siparişlerim
                </Link>
                <Link 
                  href="/customer/profile" 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profil
                </Link>
                <Link 
                  href="/customer/settings" 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Ayarlar
                </Link>
              </>
            )}

            {currentUser && (
              <>
                <div className="border-t border-gray-200 my-2"></div>
                <button 
                  onClick={refreshPage}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-left"
                >
                  Yenile
                </button>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md text-left"
                >
                  Çıkış Yap
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
} 