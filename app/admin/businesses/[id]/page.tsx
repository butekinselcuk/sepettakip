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

export default function BusinessDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-red-100 text-red-800';
      case 'SUSPENDED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
          href="/admin/businesses"
          className="text-blue-600 hover:text-blue-900"
        >
          ← İşletmelere Dön
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              İşletme Bilgileri
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Detaylı işletme bilgileri ve istatistikler
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => router.push(`/admin/businesses/${business.id}/edit`)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Düzenle
            </button>
            <button
              onClick={() => router.push(`/admin/businesses/${business.id}/orders`)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Siparişler
            </button>
          </div>
        </div>

        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">İşletme Adı</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {business.name}
              </dd>
            </div>

            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Durum</dt>
              <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(business.status)}`}>
                  {business.status}
                </span>
              </dd>
            </div>

            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">E-posta</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {business.email}
              </dd>
            </div>

            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Telefon</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {business.phone}
              </dd>
            </div>

            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Adres</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {business.address}
              </dd>
            </div>

            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Vergi Numarası</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {business.tax_id}
              </dd>
            </div>

            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">IBAN</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {business.bank_iban}
              </dd>
            </div>

            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Çalışma Saatleri</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {business.openingTime} - {business.closingTime}
              </dd>
            </div>

            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Teslimat Bilgileri</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div>Yarıçap: {business.deliveryRadius} km</div>
                <div>Teslimat Ücreti: {business.deliveryFee} TL</div>
              </dd>
            </div>

            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Sosyal Medya</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="space-y-2">
                  {business.facebook && (
                    <div>
                      <span className="font-medium">Facebook:</span>{" "}
                      <a href={business.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900">
                        {business.facebook}
                      </a>
                    </div>
                  )}
                  {business.instagram && (
                    <div>
                      <span className="font-medium">Instagram:</span>{" "}
                      <a href={business.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900">
                        {business.instagram}
                      </a>
                    </div>
                  )}
                  {business.twitter && (
                    <div>
                      <span className="font-medium">Twitter:</span>{" "}
                      <a href={business.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900">
                        {business.twitter}
                      </a>
                    </div>
                  )}
                </div>
              </dd>
            </div>

            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">İşletme Sahibi</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div>{business.user.name}</div>
                <div className="text-gray-500">{business.user.email}</div>
              </dd>
            </div>

            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Kayıt Tarihi</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(business.createdAt)}
              </dd>
            </div>

            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Son Güncelleme</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(business.updatedAt)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
} 