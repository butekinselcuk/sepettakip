"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/layouts/AdminLayout";
import axios from "axios";

interface ScheduledReport {
  id: string;
  title: string;
  type: string;
  format: string;
  frequency: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  isActive: boolean;
  createdAt: string;
  lastRunAt?: string;
  nextRunAt?: string | null;
  userId: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function ScheduledReports() {
  const router = useRouter();
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch scheduled reports
  useEffect(() => {
    const fetchScheduledReports = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        if (!token) {
          router.push("/auth/login");
          return;
        }
        
        const response = await axios.get("/api/reports/scheduled", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setReports(response.data);
      } catch (err: any) {
        console.error("Error fetching scheduled reports:", err);
        setError("Zamanlı raporları yüklerken bir hata oluştu.");
        
        // Mock data for development
        if (process.env.NODE_ENV === "development") {
          setReports([
            {
              id: "sr-1",
              title: "Haftalık Satış Raporu",
              type: "SALES",
              format: "PDF",
              frequency: "WEEKLY",
              dayOfWeek: 1,
              time: "08:00",
              isActive: true,
              createdAt: "2023-05-15T10:30:00Z",
              lastRunAt: "2023-05-15T08:00:00Z",
              nextRunAt: "2023-05-22T08:00:00Z",
              userId: "user-1",
              user: {
                name: "Admin User",
                email: "admin@example.com"
              }
            },
            {
              id: "sr-2",
              title: "Aylık Kurye Performans Raporu",
              type: "COURIER",
              format: "EXCEL",
              frequency: "MONTHLY",
              dayOfMonth: 1,
              time: "07:00",
              isActive: true,
              createdAt: "2023-04-20T11:15:00Z",
              lastRunAt: "2023-05-01T07:00:00Z",
              nextRunAt: "2023-06-01T07:00:00Z",
              userId: "user-1",
              user: {
                name: "Admin User",
                email: "admin@example.com"
              }
            },
            {
              id: "sr-3",
              title: "Günlük Müşteri Aktivite Raporu",
              type: "CUSTOMER",
              format: "CSV",
              frequency: "DAILY",
              time: "23:00",
              isActive: false,
              createdAt: "2023-03-10T14:45:00Z",
              lastRunAt: "2023-05-14T23:00:00Z",
              nextRunAt: null,
              userId: "user-2",
              user: {
                name: "Manager User",
                email: "manager@example.com"
              }
            }
          ]);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchScheduledReports();
  }, [router]);

  // Helper functions
  const getReportTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      SALES: "Satış Raporu",
      COURIER: "Kurye Raporu",
      CUSTOMER: "Müşteri Raporu",
      BUSINESS: "İşletme Raporu",
      INVENTORY: "Envanter Raporu"
    };
    return types[type] || type;
  };

  const getFrequencyLabel = (report: ScheduledReport) => {
    if (report.frequency === "DAILY") return "Günlük";
    if (report.frequency === "WEEKLY") {
      const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
      return `Haftalık (${days[report.dayOfWeek || 0]})`;
    }
    if (report.frequency === "MONTHLY") {
      return `Aylık (Ayın ${report.dayOfMonth}. günü)`;
    }
    return report.frequency;
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  // Toggle report active status
  const toggleReportStatus = async (reportId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }
      
      await axios.patch(`/api/reports/scheduled/${reportId}`, 
        { isActive: !currentStatus },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Update local state
      setReports(reports.map(report => 
        report.id === reportId 
          ? { ...report, isActive: !currentStatus } 
          : report
      ));
      
    } catch (err: any) {
      console.error("Error toggling report status:", err);
      alert("Rapor durumu değiştirilirken bir hata oluştu.");
    }
  };

  // Delete report
  const deleteReport = async (reportId: string) => {
    if (!confirm("Bu zamanlı raporu silmek istediğinizden emin misiniz?")) {
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }
      
      await axios.delete(`/api/reports/scheduled/${reportId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state
      setReports(reports.filter(report => report.id !== reportId));
      
    } catch (err: any) {
      console.error("Error deleting report:", err);
      alert("Rapor silinirken bir hata oluştu.");
    }
  };

  // Filter reports based on search term and status filter
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          getReportTypeLabel(report.type).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && report.isActive) ||
                         (statusFilter === "inactive" && !report.isActive);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Zamanlı Raporlar</h1>
            <button
              onClick={() => router.push('/admin/reports/scheduled/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Yeni Zamanlı Rapor
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-700">
            Otomatik olarak oluşturulan zamanlanmış raporlarınızı yönetin.
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            {/* Search and filters */}
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-5">
              <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <div className="relative flex items-stretch flex-grow">
                      <input
                        type="text"
                        name="search"
                        id="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full rounded-l-md sm:text-sm border-gray-300"
                        placeholder="Rapor adı veya türü ile ara..."
                      />
                    </div>
                    <button
                      type="button"
                      className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      onClick={() => setSearchTerm("")}
                    >
                      Temizle
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                  <select
                    id="status"
                    name="status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="all">Tüm Durumlar</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Pasif</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4 mb-5">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Hata</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Loading state */}
            {loading ? (
              <div className="flex justify-center py-8">
                <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <>
                {/* No reports or no matching reports */}
                {reports.length === 0 ? (
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6 text-center">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Henüz zamanlı rapor oluşturulmadı</h3>
                      <div className="mt-2 max-w-xl text-sm text-gray-500 mx-auto">
                        <p>İlk zamanlı raporunuzu oluşturmak için yukarıdaki "Yeni Zamanlı Rapor" butonuna tıklayın.</p>
                      </div>
                      <div className="mt-5">
                        <button
                          type="button"
                          onClick={() => router.push('/admin/reports/scheduled/create')}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Yeni Zamanlı Rapor Oluştur
                        </button>
                      </div>
                    </div>
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6 text-center">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Arama kriterlerine uygun rapor bulunamadı</h3>
                      <div className="mt-2 max-w-xl text-sm text-gray-500 mx-auto">
                        <p>Farklı arama kriterleri deneyin veya tüm raporları görmek için filtreleri temizleyin.</p>
                      </div>
                      <div className="mt-5">
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm("");
                            setStatusFilter("all");
                          }}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Filtreleri Temizle
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Reports table */
                  <div className="flex flex-col">
                    <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                      <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Rapor Adı
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Tür / Format
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Sıklık
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Son / Sonraki Çalışma
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Durum
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Oluşturan
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                  <span className="sr-only">İşlemler</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {filteredReports.map((report) => (
                                <tr key={report.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{report.title}</div>
                                    <div className="text-sm text-gray-500">ID: {report.id}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{getReportTypeLabel(report.type)}</div>
                                    <div className="text-sm text-gray-500">{report.format} formatında</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{getFrequencyLabel(report)}</div>
                                    <div className="text-sm text-gray-500">Saat: {report.time}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">Son: {formatDate(report.lastRunAt)}</div>
                                    <div className="text-sm text-gray-500">Sonraki: {formatDate(report.nextRunAt)}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      report.isActive 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {report.isActive ? 'Aktif' : 'Pasif'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {report.user?.name || 'Bilinmiyor'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-2">
                                      <button
                                        onClick={() => router.push(`/admin/reports/scheduled/${report.id}`)}
                                        className="text-blue-600 hover:text-blue-900"
                                      >
                                        Detay
                                      </button>
                                      <button
                                        onClick={() => toggleReportStatus(report.id, report.isActive)}
                                        className={`${
                                          report.isActive 
                                            ? 'text-yellow-600 hover:text-yellow-900' 
                                            : 'text-green-600 hover:text-green-900'
                                        }`}
                                      >
                                        {report.isActive ? 'Durdur' : 'Etkinleştir'}
                                      </button>
                                      <button
                                        onClick={() => deleteReport(report.id)}
                                        className="text-red-600 hover:text-red-900"
                                      >
                                        Sil
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 