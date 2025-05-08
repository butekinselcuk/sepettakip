"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import AdminLayout from "@/app/components/layouts/AdminLayout";

interface Courier {
  id: string;
  userId: string;
  status: string;
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

export default function CouriersPage() {
  const router = useRouter();
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tüm Durumlar");
  const [error, setError] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  // Status mapping
  const statusMap: Record<string, string> = {
    'ACTIVE': 'Aktif',
    'INACTIVE': 'Pasif',
    'PENDING': 'Beklemede',
  };

  const fetchCouriers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/auth/login');
        return;
      }

      let url = `/api/couriers?page=${currentPage}&limit=${limit}`;
      if (searchTerm) {
        url += `&search=${searchTerm}`;
      }
      if (statusFilter !== "Tüm Durumlar") {
        // Convert Turkish status back to English for API
        const statusKey = Object.keys(statusMap).find(key => statusMap[key] === statusFilter);
        if (statusKey) {
          url += `&status=${statusKey}`;
        }
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setCouriers(response.data.couriers);
      setTotalItems(response.data.pagination.totalItems);
      setError("");
    } catch (err: any) {
      console.error("Kuryeler yüklenirken hata:", err);
      setError("Kurye verileri yüklenirken bir hata oluştu.");
      if (err.response?.status === 401) {
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
    setStatusFilter(e.target.value);
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
        alert("Kurye profilleri senkronize edildi");
        fetchCouriers();
      }
    } catch (err) {
      console.error("Kurye profillerini senkronize ederken hata:", err);
      setError("Kurye profilleri senkronize edilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
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
                  <option>Tüm Durumlar</option>
                  <option>Aktif</option>
                  <option>Pasif</option>
                  <option>Beklemede</option>
                </select>
                
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
                  Profilleri Senkronize Et
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
                {error}
              </div>
            )}

            {/* Couriers Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İsim
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        E-posta
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Araç Tipi
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Puan
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Son Konum Güncelleme
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex justify-center items-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                            <span className="ml-2">Yükleniyor...</span>
                          </div>
                        </td>
                      </tr>
                    ) : couriers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                          Kayıt bulunamadı
                        </td>
                      </tr>
                    ) : (
                      couriers.map((courier) => (
                        <tr key={courier.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {courier.user.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {courier.user.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${courier.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                                courier.status === 'INACTIVE' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'}`}>
                              {statusMap[courier.status] || courier.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {courier.vehicleType || "Belirtilmemiş"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {courier.ratings ? `${courier.ratings.toFixed(1)}/5.0` : "Değerlendirilmemiş"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {courier.lastLocationUpdate ? formatDate(courier.lastLocationUpdate) : "Hiç Güncellenmedi"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/admin/couriers/${courier.id}`}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Düzenle
                            </Link>
                            <button 
                              className="text-red-600 hover:text-red-900"
                              onClick={() => {
                                if (window.confirm('Bu kuryeyi silmek istediğinize emin misiniz?')) {
                                  // API call to delete courier would go here
                                  alert('Bu özellik henüz aktif değil');
                                }
                              }}
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalItems > 0 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700">
                  Toplam <span className="font-medium">{totalItems}</span> kayıt
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md
                      ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    Önceki
                  </button>
                  <span className="px-3 py-1 bg-blue-500 text-white rounded-md">
                    {currentPage}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage * limit >= totalItems}
                    className={`px-3 py-1 rounded-md
                      ${currentPage * limit >= totalItems ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    Sonraki
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 