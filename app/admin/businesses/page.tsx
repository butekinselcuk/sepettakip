"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios, { AxiosError } from "axios";
import { useToast } from "@/app/components/ui/use-toast";

// Status türleri için string literal tip
type BusinessStatus = "ACTIVE" | "INACTIVE" | "PENDING";
type StatusFilterType = "Tüm Durumlar" | "Aktif" | "Pasif" | "Beklemede";

interface Business {
  id: string;
  userId: string;
  name: string;
  status: BusinessStatus;
  address: string;
  phone: string;
  email: string;
  taxNumber: string;
  rating?: number;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt?: string;
}

interface ApiResponse {
  businesses: Business[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

export default function BusinessesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("Tüm Durumlar");
  const [error, setError] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  // Status mapping
  const statusMap: Record<BusinessStatus, string> = {
    'ACTIVE': 'Aktif',
    'INACTIVE': 'Pasif',
    'PENDING': 'Beklemede',
  };

  // Ters status mapping (UI'dan API'ye)
  const reverseStatusMap: Record<string, BusinessStatus> = {
    'Aktif': 'ACTIVE',
    'Pasif': 'INACTIVE',
    'Beklemede': 'PENDING',
  };

  const fetchBusinesses = async () => {
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

      let url = `/api/businesses?page=${currentPage}&limit=${limit}`;
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

      setBusinesses(response.data.businesses);
      setTotalItems(response.data.pagination.totalItems);
    } catch (err) {
      const error = err as AxiosError;
      setError("İşletme verileri yüklenirken bir hata oluştu.");
      
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
    fetchBusinesses();
  }, [currentPage, searchTerm, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on search
    fetchBusinesses();
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

  const handleAddNewBusiness = () => {
    router.push('/admin/businesses/add');
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">İşletmeler</h1>
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
              
              <button
                onClick={handleAddNewBusiness}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Yeni İşletme Ekle
              </button>
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
              <p>{error}</p>
            </div>
          )}
          
          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Businesses Table */}
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşletme Adı
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        E-posta
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Telefon
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vergi No
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kayıt Tarihi
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {businesses.map((business) => (
                      <tr key={business.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{business.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{business.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{business.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{business.taxNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            business.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            business.status === 'INACTIVE' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {statusMap[business.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(business.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/admin/businesses/${business.id}`}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Detay
                          </Link>
                          <button
                            onClick={() => router.push(`/admin/businesses/${business.id}/edit`)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Düzenle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalItems > limit && (
                <div className="flex justify-center mt-6">
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      Önceki
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === Math.ceil(totalItems / limit)}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === Math.ceil(totalItems / limit) ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      Sonraki
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 