"use client";

import React, { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  BarChart4,
  Bell,
  Cog,
  FileText,
  Home,
  LucideIcon,
  Menu,
  Shield,
  UserCog,
  Users,
  X,
  LogOut,
  Wallet
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavigationItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

// Ana navigasyon öğeleri
const mainNavItems: NavigationItem[] = [
  { title: 'Dashboard', href: '/admin/dashboard', icon: Home },
  { title: 'Kullanıcılar', href: '/admin/users', icon: Users, badge: 2 },
  { title: 'Raporlar', href: '/admin/reports', icon: FileText },
  { title: 'Sistem Ayarları', href: '/admin/settings', icon: Cog },
  { title: 'Güvenlik', href: '/admin/security', icon: Shield },
];

// Alt navigasyon öğeleri
const otherNavItems: NavigationItem[] = [
  { title: 'Siparişler', href: '/admin/orders', icon: FileText },
  { title: 'Kuryeler', href: '/admin/couriers', icon: Users },
  { title: 'Analizler', href: '/analytics', icon: BarChart4 },
  { title: 'Finansal Rapor', href: '/admin/finance', icon: Wallet },
  { title: 'Email Yönetimi', href: '/admin/email', icon: Bell },
  { title: 'Kurye Takip', href: '/admin/kurye', icon: Users },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('Admin Kullanıcı');
  const notificationCount = 3;
  
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    // Token kontrolü - localStorage ve sessionStorage'dan alınan tokenlar ile yapılır
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
      console.log('🚨 No token found, redirecting to login');
      // Halihazırda login sayfasında değilsek yönlendir
      if (!pathname.includes('/auth/login')) {
        router.push('/auth/login');
      }
      return;
    }

    // Kullanıcı bilgilerini al - localStorage ve sessionStorage'dan alınan user bilgisi ile
    const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (!userDataStr) {
      console.log('🚨 User data not found, redirecting to login');
      // Token var ama user yoksa çıkış yap
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      router.push('/auth/login');
      return;
    }

    try {
      const userData = JSON.parse(userDataStr);
      
      if (userData.role !== 'ADMIN') {
        console.log('🚨 Non-admin user detected, redirecting to login');
        // Admin olmayan kullanıcıları yönlendir
        router.push('/auth/login');
      } else {
        console.log('✅ Admin user authenticated:', userData.name);
        setUserName(userData.name || 'Admin Kullanıcı');
      }
    } catch (error) {
      console.error('🚨 User data parsing error:', error);
      // JSON parse hatası varsa token ve user verilerini temizle
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      router.push('/auth/login');
    }
  }, [router, pathname]);
  
  const handleLogout = () => {
    console.log('👋 Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    router.push('/auth/login');
  };
  
  // Mobil görünümde sidebar'ı kapat
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        {/* Mobil sidebar */}
        <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? 'overflow-hidden' : 'pointer-events-none'}`}>
          <div 
            className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${sidebarOpen ? 'opacity-100 ease-out duration-300' : 'opacity-0 ease-in duration-200 pointer-events-none'}`}
            onClick={closeSidebar}
          ></div>
          
          <div className={`relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white transition-transform ${sidebarOpen ? 'translate-x-0 ease-out duration-300' : '-translate-x-full ease-in duration-200'}`}>
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={closeSidebar}
              >
                <span className="sr-only">Kapat</span>
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="flex items-center">
                <UserCog className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-semibold text-gray-900">Admin Panel</span>
              </div>
            </div>
            
            <div className="mt-5 flex-1 h-0 overflow-y-auto">
              <nav className="px-2 space-y-1">
                {mainNavItems.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                      pathname === item.href
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={closeSidebar}
                  >
                    <item.icon
                      className={`mr-4 flex-shrink-0 h-6 w-6 ${
                        pathname === item.href ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.title}
                    {item.badge && (
                      <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-600 text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
                
                <hr className="my-4 border-t border-gray-200" />
                
                {otherNavItems.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                      pathname === item.href
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={closeSidebar}
                  >
                    <item.icon
                      className={`mr-4 flex-shrink-0 h-6 w-6 ${
                        pathname === item.href ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.title}
                    {item.badge && (
                      <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-600 text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
          
          <div className="flex-shrink-0 w-14" aria-hidden="true">
            {/* Force sidebar to shrink to fit close icon */}
          </div>
        </div>
        
        {/* Masaüstü sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
          <div className="flex flex-col flex-grow border-r border-gray-200 pt-5 pb-4 bg-white overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-5">
              <div className="flex items-center">
                <UserCog className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-semibold text-gray-900">Admin Panel</span>
              </div>
            </div>
            
            <div className="mt-5 flex-1 h-0 overflow-y-auto">
              <nav className="px-2 space-y-1">
                {mainNavItems.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      pathname === item.href
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-6 w-6 ${
                        pathname === item.href ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.title}
                    {item.badge && (
                      <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-600 text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
                
                <hr className="my-4 border-t border-gray-200" />
                
                {otherNavItems.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      pathname === item.href
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-6 w-6 ${
                        pathname === item.href ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.title}
                    {item.badge && (
                      <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-600 text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <button
                onClick={handleLogout}
                className="flex items-center text-sm text-red-700 hover:text-red-900 group"
              >
                <LogOut className="mr-3 h-5 w-5 text-red-500 group-hover:text-red-600" />
                <span>Çıkış Yap</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Ana içerik */}
        <div className={`md:pl-64 flex flex-col flex-1`}>
          <div className="sticky top-0 z-10 flex-shrink-0 h-16 bg-white shadow">
            <div className="flex items-center justify-between px-4 md:px-6">
              <div className="flex items-center">
                <button
                  type="button"
                  className="md:hidden px-4 text-gray-500 focus:outline-none"
                  onClick={() => setSidebarOpen(true)}
                >
                  <span className="sr-only">Menüyü Aç</span>
                  <Menu className="h-6 w-6" />
                </button>
              </div>

              <div className="flex items-center">
                <div className="flex-shrink-0 relative">
                  <button className="p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-500 focus:outline-none">
                    <span className="sr-only">Bildirimleri görüntüle</span>
                    <Bell className="h-6 w-6" />
                    {notificationCount > 0 && (
                      <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
                    )}
                  </button>
                </div>
                <div className="ml-4 flex items-center md:ml-6">
                  <span className="text-sm text-gray-700 mr-3 hidden md:inline-block">
                    {userName}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-sm text-gray-700 hover:text-indigo-600 focus:outline-none gap-1"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="hidden md:inline-block">Çıkış Yap</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <main>
            <div className="py-6">
              <div className="max-w-8xl mx-auto px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminLayout; 