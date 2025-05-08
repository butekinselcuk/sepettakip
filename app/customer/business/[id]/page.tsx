'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import Header from '@/components/Header';

export default function BusinessMenuPage() {
  const params = useParams();
  const router = useRouter();
  const [business, setBusiness] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

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
      if (userData.role !== "CUSTOMER") {
        console.log("Kullanıcı rolü CUSTOMER değil, login sayfasına yönlendiriliyor");
        router.push("/auth/login");
        return;
      }

      console.log("CUSTOMER kullanıcısı doğrulandı:", userData.email);
      
      // İşletme ve menü bilgilerini getir
      fetchBusinessAndMenu();
    } catch (error) {
      console.error("Kullanıcı bilgisi işlenirken hata:", error);
      router.push("/auth/login");
    }
  }, [router, params.id]);

  const fetchBusinessAndMenu = async () => {
    try {
      setLoading(true);
      const businessId = params.id;
      const token = localStorage.getItem("token");
      
      console.log("İşletme ve menü bilgileri alınıyor:", businessId);
      console.log("Token:", token ? "Mevcut" : "Yok");
      
      // API'den işletme detayını getir
      try {
        const businessResponse = await axios.get(`/api/business/${businessId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log("İşletme bilgileri başarıyla alındı:", businessResponse.data.name);
        setBusiness(businessResponse.data);
      } catch (businessErr) {
        console.error("İşletme bilgisi alınırken hata:", businessErr);
        setError("İşletme bilgisi alınamadı");
      }
      
      // API'den menü öğelerini getir
      try {
        const menuResponse = await axios.get(`/api/business/menu?businessId=${businessId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (menuResponse.data && menuResponse.data.menu) {
          // Menüyü düz bir dizi haline getir
          const allMenuItems = [];
          for (const category in menuResponse.data.menu) {
            allMenuItems.push(...menuResponse.data.menu[category]);
          }
          
          console.log("Menü öğeleri başarıyla alındı, öğe sayısı:", allMenuItems.length);
          setMenuItems(allMenuItems);
          
          // Kategorileri belirle
          if (allMenuItems.length > 0) {
            const categoriesSet = new Set();
            allMenuItems.forEach((item: any) => categoriesSet.add(item.category));
            const categories = Array.from(categoriesSet) as string[];
            
            console.log("Mevcut kategoriler:", categories);
            if (categories.length > 0) {
              setSelectedCategory(categories[0]);
            }
          }
        } else {
          // Menü bulunamadı veya boş
          setMenuItems([]);
          setError("Menü bilgisi bulunamadı");
        }
      } catch (menuErr) {
        console.error("Menü bilgisi alınırken hata:", menuErr);
        setError("Menü bilgisi alınamadı");
        setMenuItems([]);
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error("İşletme ve menü bilgileri alınırken hata:", err);
      setError(err.response?.data?.error || 'İşletme bilgileri alınamadı');
      setLoading(false);
    }
  };

  const getCategories = () => {
    if (!menuItems || menuItems.length === 0) return [];
    return [...new Set(menuItems.map(item => item.category))];
  };

  const getMenuItemsByCategory = () => {
    if (!menuItems || menuItems.length === 0) return [];
    if (!selectedCategory) return menuItems;
    return menuItems.filter(item => item.category === selectedCategory);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const addToCart = (item: any) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      // If item already in cart, update quantity
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 } 
          : cartItem
      ));
    } else {
      // Add new item to cart
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: number) => {
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem?.quantity === 1) {
      // Remove item if quantity will be 0
      setCart(cart.filter(item => item.id !== id));
    } else {
      // Decrease quantity
      setCart(cart.map(item => 
        item.id === id 
          ? { ...item, quantity: item.quantity - 1 } 
          : item
      ));
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Lütfen sepete ürün ekleyin.');
      return;
    }
    
    // Demo amaçlı sadece bir alert gösteriyoruz
    alert(`Siparişiniz oluşturuluyor...\nToplam Tutar: ${formatCurrency(getTotalPrice())}`);
    
    // Gerçek bir uygulamada ödeme sayfasına yönlendirme yapılabilir
    // veya sipariş oluşturma API'si çağrılabilir
    // router.push('/customer/checkout');
    
    // Demo için doğrudan sipariş oluşturulduğunu varsayalım
    const newOrder = {
      businessId: business.id,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      totalPrice: getTotalPrice(),
      notes: noteText
    };
    
    console.log('Sipariş oluşturuldu:', newOrder);
    
    // Sepeti temizle ve anasayfaya yönlendir
    setCart([]);
    router.push('/customer/dashboard');
  };

  if (!isClient) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
          <div className="text-center">
            <div className="spinner"></div>
            <p className="mt-2 text-gray-600">İşletme bilgileri yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xl font-medium text-red-600">Hata</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <button
              onClick={() => router.push('/customer/dashboard')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/customer/dashboard')}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Geri Dön
          </button>
        </div>
        
        {/* İşletme Bilgileri */}
        <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
                <div className="flex items-center mt-1">
                  <span className="text-yellow-400 flex">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`h-5 w-5 ${i < Math.floor(business.rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </span>
                  <span className="ml-2 text-sm text-gray-600">{business.rating} ({business.reviewCount} değerlendirme)</span>
                </div>
                <p className="mt-2 text-gray-600">{business.categories.join(" • ")}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Çalışma Saatleri</p>
                <p className="text-sm font-medium">{business.openingHours}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-gray-700">{business.description}</p>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <p><span className="font-medium">Adres:</span> {business.address}</p>
              <p><span className="font-medium">Telefon:</span> {business.phone}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Kategori ve Menü */}
          <div className="lg:col-span-2">
            {/* Kategori Seçimi */}
            <div className="flex overflow-x-auto pb-3 mb-4 space-x-4">
              {getCategories().map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            
            {/* Menü Öğeleri */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedCategory || 'Tüm Menü'}
                </h2>
                
                <div className="space-y-6">
                  {getMenuItemsByCategory().map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-4 border-b border-gray-200 last:border-0">
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 className="text-base font-medium text-gray-900">{item.name}</h3>
                        <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                        <p className="mt-1 text-sm font-medium text-gray-900">{formatCurrency(item.price)}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => addToCart(item)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Ekle
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Sepet */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg overflow-hidden sticky top-4">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Sepetim</h2>
                
                {cart.length === 0 ? (
                  <p className="text-sm text-gray-500">Sepetiniz boş.</p>
                ) : (
                  <div className="space-y-4">
                    <ul className="divide-y divide-gray-200">
                      {cart.map((item) => (
                        <li key={item.id} className="py-4 flex justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500">{formatCurrency(item.price)}</p>
                          </div>
                          <div className="flex items-center">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-gray-400 hover:text-gray-500 mr-2"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="text-gray-600 w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => addToCart(item)}
                              className="text-gray-400 hover:text-gray-500 ml-2"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between">
                        <span className="text-base font-medium text-gray-900">Toplam</span>
                        <span className="text-base font-medium text-gray-900">{formatCurrency(getTotalPrice())}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                        Sipariş Notu
                      </label>
                      <textarea
                        id="notes"
                        rows={3}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Ek istekleriniz, tercihleriniz..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                      />
                    </div>
                    
                    <button
                      onClick={handleCheckout}
                      className="w-full bg-indigo-600 text-white py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Siparişi Tamamla
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 