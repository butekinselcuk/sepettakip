"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios, { AxiosError } from "axios";
import { useToast } from "@/app/components/ui/use-toast";

// Status türleri için string literal tip
type CourierStatus = "ACTIVE" | "INACTIVE" | "PENDING";
type StatusFilterType = "Tüm Durumlar" | "Aktif" | "Pasif" | "Beklemede";

interface Courier {
  id: string;
  userId: string;
  status: CourierStatus;
  ratings?: number;
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: string;
  vehicleType?: string;
  phone?: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt?: string;
}

interface ApiResponse {
  couriers: Courier[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

export default function CouriersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("Tüm Durumlar");
  const [error, setError] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  // Status mapping
  const statusMap: Record<CourierStatus, string> = {
    'ACTIVE': 'Aktif',
    'INACTIVE': 'Pasif',
    'PENDING': 'Beklemede',
  };

  // Ters status mapping (UI'dan API'ye)
  const reverseStatusMap: Record<string, CourierStatus> = {
    'Aktif': 'ACTIVE',
    'Pasif': 'INACTIVE',
    'Beklemede': 'PENDING',
  };

  const fetchCouriers = async () => {
    try {
      setLoading(true);
      setError("");
      
      // localStorage'dan token'ı al
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

      let url = `/api/couriers?page=${currentPage}&limit=${limit}`;
      if (searchTerm) {
        url += `&search=${searchTerm}`;
      }
      if (statusFilter !== "Tüm Durumlar") {
        // Convert Turkish status back to English for API
        const apiStatus = reverseStatusMap[statusFilter];
        if (apiStatus) {
          url += `&status=${apiStatus}`;
        }
      }

      const response = await axios.get<ApiResponse>(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setCouriers(response.data.couriers);
      setTotalItems(response.data.pagination.totalItems);
    } catch (err) {
      const error = err as AxiosError;
      setError("Kurye verileri yüklenirken bir hata oluştu.");
      
      if (error.response?.status === 401) {
        toast({
          title: 'Hata',
          description: 'Oturum süresi dolmuş olabilir. Lütfen tekrar giriş yapın.',
          type: 'error'
        } as any);
        router.push('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCouriers();
  }, [currentPage, searchTerm, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on search
    fetchCouriers();
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as StatusFilterType);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleAddNewCourier = () => {
    router.push('/admin/couriers/add');
  };

  // Check if account is created but courier profile is not
  const createMissingCourierProfiles = async () => {
    // This would check users with COURIER role but no courier profile and create them
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await axios.post('/api/couriers/sync', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast({
          title: "Başarılı",
          description: "Kurye profilleri başarıyla senkronize edildi"
        } as any);
        fetchCouriers();
      }
    } catch (err) {
      setError("Kurye profilleri senkronize edilirken bir hata oluştu.");
      toast({
        title: "Hata",
        description: "Kurye profilleri senkronize edilirken bir hata oluştu"
      } as any);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Kuryeler</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          {/* Search and Filter Section */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
            <div className="w-full md:w-1/3">
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  placeholder="İsim veya e-posta ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Ara
                </button>
              </form>
            </div>
            
            <div className="flex w-full md:w-auto space-x-2">
              <select
                value={statusFilter}
                onChange={handleStatusChange}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Tüm Durumlar">Tüm Durumlar</option>
                <option value="Aktif">Aktif</option>
                <option value="Pasif">Pasif</option>
                <option value="Beklemede">Beklemede</option>
              </select>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleAddNewCourier}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Yeni Kurye Ekle
                </button>
                <button
                  onClick={createMissingCourierProfiles}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Profil Senkronize Et
                </button>
              </div>
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
              <p>{error}</p>
            </div>
          )}
          
          {/* Couriers Table */}
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kurye
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-posta
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kayıt Tarihi
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Değerlendirme
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : couriers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      {searchTerm || statusFilter !== "Tüm Durumlar" 
                        ? "Arama kriterlerine uygun kurye bulunamadı." 
                        : "Henüz kurye kaydı bulunmuyor."}
                    </td>
                  </tr>
                ) : (
                  couriers.map((courier) => (
                    <tr key={courier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {courier.user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {courier.user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          courier.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                          courier.status === 'INACTIVE' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {statusMap[courier.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(courier.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {courier.ratings ? `${courier.ratings}/5` : "Değerlendirilmemiş"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link 
                            href={`/admin/couriers/${courier.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Görüntüle
                          </Link>
                          <Link 
                            href={`/admin/couriers/${courier.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Düzenle
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {!loading && couriers.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg shadow">
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Toplam <span className="font-medium">{totalItems}</span> kurye
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${
                        currentPage === 1 ? 'cursor-not-allowed' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Önceki</span>
                      &lt;
                    </button>
                    {[...Array(Math.min(5, Math.ceil(totalItems / limit)))].map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => handlePageChange(idx + 1)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          currentPage === idx + 1
                            ? 'bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === Math.ceil(totalItems / limit)}
                      className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${
                        currentPage === Math.ceil(totalItems / limit) ? 'cursor-not-allowed' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Sonraki</span>
                      &gt;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 