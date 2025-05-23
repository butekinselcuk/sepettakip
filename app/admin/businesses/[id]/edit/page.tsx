"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useToast } from "@/app/components/ui/use-toast";
import { Status } from "@prisma/client";

interface Business {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  logoUrl?: string;
  coverUrl?: string;
  latitude?: number;
  longitude?: number;
  status: Status;
  rating?: number;
  tax_id?: string;
  bank_iban?: string;
  openingTime?: string;
  closingTime?: string;
  deliveryRadius?: number;
  deliveryFee?: number;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  type?: string;
  tags?: string[];
  features?: string[];
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function EditBusinessPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        setLoading(true);
        setError("");
        
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (!token) {
          toast({
            title: 'Hata',
            description: 'Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.',
            type: 'error'
          } as any);
          router.push('/auth/login');
          return;
        }

        const response = await axios.get(`/api/businesses/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setBusiness(response.data);
      } catch (err) {
        setError("İşletme bilgileri yüklenirken bir hata oluştu.");
        console.error('Error fetching business:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [params.id, router, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!business) return;

    try {
      setSaving(true);
      setError("");

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        toast({
          title: 'Hata',
          description: 'Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.',
          type: 'error'
        } as any);
        router.push('/auth/login');
        return;
      }

      await axios.put(`/api/businesses/${params.id}`, business, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast({
        title: 'Başarılı',
        description: 'İşletme bilgileri güncellendi.',
        type: 'success'
      } as any);

      router.push(`/admin/businesses/${params.id}`);
    } catch (err) {
      setError("İşletme bilgileri güncellenirken bir hata oluştu.");
      console.error('Error updating business:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!business) return;

    const { name, value } = e.target;
    setBusiness(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: value
      };
    });
  };

  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!business) return;

    const { name, value } = e.target;
    setBusiness(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: value.split(',').map(item => item.trim())
      };
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-4">
          <p>İşletme bulunamadı.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
      <div className="mb-6">
        <Link
          href={`/admin/businesses/${params.id}`}
          className="text-blue-600 hover:text-blue-900"
        >
          ← İşletme Detayına Dön
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            İşletme Bilgilerini Düzenle
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            İşletme bilgilerini güncelleyin
          </p>
        </div>

        <form onSubmit={handleSubmit} className="border-t border-gray-200">
          <div className="px-4 py-5 bg-white sm:p-6">
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  İşletme Adı
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={business.name}
                  onChange={handleChange}
                  required
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  E-posta
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={business.email}
                  onChange={handleChange}
                  required
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Telefon
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={business.phone}
                  onChange={handleChange}
                  required
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Durum
                </label>
                <select
                  id="status"
                  name="status"
                  value={business.status}
                  onChange={handleChange}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="ACTIVE">Aktif</option>
                  <option value="INACTIVE">Pasif</option>
                  <option value="SUSPENDED">Askıya Alınmış</option>
                </select>
              </div>

              <div className="col-span-6">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Adres
                </label>
                <input
                  type="text"
                  name="address"
                  id="address"
                  value={business.address}
                  onChange={handleChange}
                  required
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="tax_id" className="block text-sm font-medium text-gray-700">
                  Vergi Numarası
                </label>
                <input
                  type="text"
                  name="tax_id"
                  id="tax_id"
                  value={business.tax_id}
                  onChange={handleChange}
                  required
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="bank_iban" className="block text-sm font-medium text-gray-700">
                  IBAN
                </label>
                <input
                  type="text"
                  name="bank_iban"
                  id="bank_iban"
                  value={business.bank_iban}
                  onChange={handleChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="openingTime" className="block text-sm font-medium text-gray-700">
                  Açılış Saati
                </label>
                <input
                  type="time"
                  name="openingTime"
                  id="openingTime"
                  value={business.openingTime}
                  onChange={handleChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="closingTime" className="block text-sm font-medium text-gray-700">
                  Kapanış Saati
                </label>
                <input
                  type="time"
                  name="closingTime"
                  id="closingTime"
                  value={business.closingTime}
                  onChange={handleChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="deliveryRadius" className="block text-sm font-medium text-gray-700">
                  Teslimat Yarıçapı (km)
                </label>
                <input
                  type="number"
                  name="deliveryRadius"
                  id="deliveryRadius"
                  value={business.deliveryRadius}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="deliveryFee" className="block text-sm font-medium text-gray-700">
                  Teslimat Ücreti (TL)
                </label>
                <input
                  type="number"
                  name="deliveryFee"
                  id="deliveryFee"
                  value={business.deliveryFee}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="facebook" className="block text-sm font-medium text-gray-700">
                  Facebook
                </label>
                <input
                  type="url"
                  name="facebook"
                  id="facebook"
                  value={business.facebook}
                  onChange={handleChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="instagram" className="block text-sm font-medium text-gray-700">
                  Instagram
                </label>
                <input
                  type="url"
                  name="instagram"
                  id="instagram"
                  value={business.instagram}
                  onChange={handleChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="twitter" className="block text-sm font-medium text-gray-700">
                  Twitter
                </label>
                <input
                  type="url"
                  name="twitter"
                  id="twitter"
                  value={business.twitter}
                  onChange={handleChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  İşletme Tipi
                </label>
                <input
                  type="text"
                  name="type"
                  id="type"
                  value={business.type}
                  onChange={handleChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                  Etiketler (virgülle ayırın)
                </label>
                <input
                  type="text"
                  name="tags"
                  id="tags"
                  value={business.tags?.join(', ')}
                  onChange={handleArrayChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="features" className="block text-sm font-medium text-gray-700">
                  Özellikler (virgülle ayırın)
                </label>
                <input
                  type="text"
                  name="features"
                  id="features"
                  value={business.features?.join(', ')}
                  onChange={handleArrayChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <button
              type="button"
              onClick={() => router.push(`/admin/businesses/${params.id}`)}
              className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 