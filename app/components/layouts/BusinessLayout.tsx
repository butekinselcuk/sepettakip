"use client";

import { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Home, Package, FileText, Users, Settings, 
  LogOut, Menu, X, Bell, ChevronDown, User, ShoppingBag, 
  CreditCard, BarChart2
} from "lucide-react";

type BusinessLayoutProps = {
  children: ReactNode;
};

export default function BusinessLayout({ children }: BusinessLayoutProps) {
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [userName, setUserName] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    
    // Kimlik doğrulama token'ını kontrol et
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    
    // Token'dan işletme bilgilerini al
    try {
      const tokenData = JSON.parse(atob(token.split(".")[1]));
      if (tokenData.role !== "BUSINESS") {
        localStorage.removeItem("token");
        router.push("/auth/login");
        return;
      }
      
      // Kullanıcı bilgilerini sakla
      setIsAuthenticated(true);
      setUserName(tokenData.name || "İşletme Yöneticisi");
      
      // İşletme adını localStorage'dan al (eğer varsa)
      const storedBusinessName = localStorage.getItem("businessName");
      if (storedBusinessName) {
        setBusinessName(storedBusinessName);
      } else {
        setBusinessName("İşletme Portalı");
      }
    } catch (error) {
      console.error("Token işleme hatası:", error);
      localStorage.removeItem("token");
      router.push("/auth/login");
    }
  }, [router]);

  // Çıkış yap
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("businessName");
    router.push("/auth/login");
  };

  // Gezinme bağlantıları
  const navLinks = [
    { name: "Kontrol Paneli", href: "/business/dashboard", icon: <Home className="w-5 h-5" /> },
    { name: "Siparişler", href: "/business/orders", icon: <Package className="w-5 h-5" /> },
    { name: "Menü Yönetimi", href: "/business/menu", icon: <ShoppingBag className="w-5 h-5" /> },
    { name: "Kuryeler", href: "/business/couriers", icon: <Users className="w-5 h-5" /> },
    { name: "Ödemeler", href: "/business/payments", icon: <CreditCard className="w-5 h-5" /> },
    { name: "Raporlar", href: "/business/reports", icon: <BarChart2 className="w-5 h-5" /> },
    { name: "Profil", href: "/business/profile", icon: <User className="w-5 h-5" /> },
    { name: "Ayarlar", href: "/business/settings", icon: <Settings className="w-5 h-5" /> },
  ];

  if (!isClient || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Üst gezinme çubuğu */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <button
                  type="button"
                  className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 focus:outline-none"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? (
                    <X className="block h-6 w-6" />
                  ) : (
                    <Menu className="block h-6 w-6" />
                  )}
                </button>
                <Link href="/business/dashboard" className="font-bold text-lg text-blue-600 flex items-center">
                  <ShoppingBag className="h-6 w-6 mr-2" />
                  {businessName}
                </Link>
              </div>
            </div>

            <div className="flex items-center">
              {/* Bildirimler */}
              <div className="ml-4 flex items-center md:ml-6 relative">
                <button
                  type="button"
                  className="p-1 rounded-full text-gray-700 hover:text-gray-900 focus:outline-none"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                >
                  <span className="sr-only">Bildirimleri görüntüle</span>
                  <Bell className="h-6 w-6" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
                </button>

                {/* Bildirim açılır menüsü */}
                {notificationsOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <div className="px-4 py-2 text-sm text-gray-700 font-medium border-b">
                        Bildirimler
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        <div className="px-4 py-2 text-sm text-gray-600 border-b hover:bg-gray-50">
                          <p className="font-medium">Yeni sipariş alındı</p>
                          <p className="text-xs text-gray-500">10 dakika önce</p>
                        </div>
                        <div className="px-4 py-2 text-sm text-gray-600 border-b hover:bg-gray-50">
                          <p className="font-medium">Kurye siparişinizi teslim etti</p>
                          <p className="text-xs text-gray-500">1 saat önce</p>
                        </div>
                        <div className="px-4 py-2 text-sm text-gray-600 border-b hover:bg-gray-50">
                          <p className="font-medium">Yeni müşteri yorumu</p>
                          <p className="text-xs text-gray-500">Dün</p>
                        </div>
                      </div>
                      <div className="px-4 py-2 text-sm text-center">
                        <Link href="/business/notifications" className="text-blue-600 hover:text-blue-800">
                          Tüm bildirimleri görüntüle
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Profil açılır menüsü */}
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="max-w-xs flex items-center text-sm rounded-full focus:outline-none"
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  >
                    <span className="sr-only">Kullanıcı menüsünü aç</span>
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden md:flex md:items-center ml-2">
                      <span className="text-sm font-medium text-gray-700 mr-1">{userName}</span>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </span>
                  </button>
                </div>

                {profileMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <Link href="/business/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Profil
                      </Link>
                      <Link href="/business/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Ayarlar
                      </Link>
                      <button
                        type="button"
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleLogout}
                      >
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Yan gezinme çubuğu - Mobil */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}>
            <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-50" onClick={e => e.stopPropagation()}>
              <div className="h-16 flex items-center justify-between px-4 border-b">
                <div className="font-bold text-lg text-blue-600">
                  <ShoppingBag className="inline-block h-6 w-6 mr-2" />
                  {businessName}
                </div>
                <button
                  type="button"
                  className="p-2 rounded-md text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="mt-4 px-2 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <span className="mr-3 text-gray-500">{link.icon}</span>
                    {link.name}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <LogOut className="mr-3 h-5 w-5 text-gray-500" />
                  Çıkış Yap
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Yan gezinme çubuğu - Masaüstü */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
            <div className="h-0 flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <span className="mr-3 text-gray-500 group-hover:text-gray-700">{link.icon}</span>
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <button
                type="button"
                onClick={handleLogout}
                className="flex-shrink-0 w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <LogOut className="mr-3 h-5 w-5 text-gray-500 group-hover:text-gray-700" />
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>

        {/* Ana içerik */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            {children}
          </main>
          
          {/* Altbilgi */}
          <footer className="bg-white border-t border-gray-200 py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-center text-sm text-gray-500">
                &copy; 2023 SepetTakip - İşletme Portalı
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
} 