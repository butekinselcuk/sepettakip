"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
import { LogOut, User, Package, ShoppingCart, BarChart2, Settings, Menu, ArrowLeft } from 'lucide-react';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.log("Token bulunamadı, login sayfasına yönlendiriliyor");
        router.push("/auth/login");
        return;
      }

      try {
        // Kullanıcı bilgilerini localStorage'dan al
        const storedUser = localStorage.getItem("user");
        
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setIsLoading(false);
            console.log("Header - Kullanıcı localStorage'dan yüklendi:", parsedUser.email, parsedUser.role);
          } catch (e) {
            console.error('Kullanıcı verisi çözümlenirken hata:', e);
            // localStorage'dan alınamadıysa API'den al
            await fetchFromApi(token);
          }
        } else {
          // localStorage'da user yoksa API'den al
          await fetchFromApi(token);
        }
      } catch (error: any) {
        console.error('Kullanıcı bilgisi alınamadı:', error);
        
        // Token geçersizse login sayfasına yönlendir
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          handleLogout();
        }
        
        setIsLoading(false);
      }
    };

    const fetchFromApi = async (token: string) => {
      try {
        const response = await axios.get('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setUser(response.data.user);
        // Kullanıcı verisini localStorage'a kaydet
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log("Header - Kullanıcı API'den yüklendi:", response.data.user.email, response.data.user.role);
      } catch (error) {
        console.error('API\'den kullanıcı bilgisi alınamadı:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, [router]);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
    } finally {
      // Client-side oturumu temizle
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Login sayfasına yönlendir
      router.push('/auth/login');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

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
            {user?.role === 'ADMIN' && (
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

            {user?.role === 'BUSINESS' && (
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

            {user?.role === 'COURIER' && (
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

            {user?.role === 'CUSTOMER' && (
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
          {!isLoading && user && (
            <div className="flex items-center relative">
              <button 
                onClick={toggleUserMenu}
                className="relative h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-200"
              >
                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </button>
              
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 top-8 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="py-1">
                    <Link 
                      href="/profile" 
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Profil</span>
                    </Link>
                    <Link 
                      href="/settings" 
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Ayarlar</span>
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center w-full text-left"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobil Menü */}
      {mobileMenuOpen && (
        <div className="md:hidden px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
          {user?.role === 'ADMIN' && (
            <>
              <Link 
                href="/admin/dashboard" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname?.includes('/admin/dashboard') 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                Dashboard
              </Link>
              <Link 
                href="/admin/users" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname?.includes('/admin/users') 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                Kullanıcılar
              </Link>
              <Link 
                href="/admin/businesses" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname?.includes('/admin/businesses') 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                İşletmeler
              </Link>
              <Link 
                href="/admin/orders" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname?.includes('/admin/orders') 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                Siparişler
              </Link>
              <Link 
                href="/admin/reports" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname?.includes('/admin/reports') 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                Raporlar
              </Link>
            </>
          )}

          {user?.role === 'BUSINESS' && (
            <>
              <Link 
                href="/business/dashboard" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname?.includes('/business/dashboard') 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                Dashboard
              </Link>
              <Link 
                href="/business/products" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname?.includes('/business/products') 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                Ürünler
              </Link>
              <Link 
                href="/business/orders" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname?.includes('/business/orders') 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                Siparişler
              </Link>
            </>
          )}

          {user?.role === 'COURIER' && (
            <>
              <Link 
                href="/courier/dashboard" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname?.includes('/courier/dashboard') 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                Teslimatlar
              </Link>
            </>
          )}

          {user?.role === 'CUSTOMER' && (
            <>
              <Link 
                href="/customer/dashboard" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname?.includes('/customer/dashboard') 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                Siparişlerim
              </Link>
              <Link 
                href="/customer/profile" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname?.includes('/customer/profile') 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                Profilim
              </Link>
            </>
          )}

          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user?.name}</div>
                <div className="text-sm font-medium text-gray-500">{user?.email}</div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <Link 
                href="/profile" 
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600"
              >
                Profil
              </Link>
              <Link 
                href="/settings" 
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600"
              >
                Ayarlar
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
} 