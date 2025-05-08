"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/layouts/AdminLayout";
import axios from "axios";

interface Report {
  id: string;
  title: string;
  type: string;
  format: string;
  frequency: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  parameters: {
    startDate?: string;
    endDate?: string;
    businessId?: string;
    includeCharts: boolean;
    includeDetails: boolean;
  };
  isActive: boolean;
  createdAt: string;
  lastRunAt?: string;
  nextRunAt?: string | null;
  userId: string;
  user?: {
    name: string;
    email: string;
  };
  generatedReports?: Array<{
    id: string;
    createdAt: string;
    status: string;
    fileUrl?: string;
  }>;
}

export default function ScheduledReportDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [runLoading, setRunLoading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        if (!token) {
          router.push("/auth/login");
          return;
        }
        
        const response = await axios.get(`/api/reports/scheduled/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setReport(response.data);
      } catch (err: any) {
        console.error("Error fetching scheduled report:", err);
        setError("Zamanlı rapor detayları yüklenirken bir hata oluştu.");
        
        // Mock data for development
        if (process.env.NODE_ENV === "development") {
          setReport({
            id: "sr-1",
            title: "Haftalık Satış Raporu",
            type: "SALES",
            format: "PDF",
            frequency: "WEEKLY",
            dayOfWeek: 1,
            time: "08:00",
            parameters: {
              startDate: "2023-05-01",
              endDate: "2023-05-15",
              includeCharts: true,
              includeDetails: true
            },
            isActive: true,
            createdAt: "2023-05-15T10:30:00Z",
            lastRunAt: "2023-05-15T08:00:00Z",
            nextRunAt: "2023-05-22T08:00:00Z",
            userId: "user-1",
            user: {
              name: "Admin User",
              email: "admin@example.com"
            },
            generatedReports: [
              {
                id: "r-123",
                createdAt: "2023-05-15T08:00:00Z",
                status: "COMPLETED",
                fileUrl: "/reports/report-123.pdf"
              },
              {
                id: "r-122",
                createdAt: "2023-05-08T08:00:00Z",
                status: "COMPLETED",
                fileUrl: "/reports/report-122.pdf"
              },
              {
                id: "r-121",
                createdAt: "2023-05-01T08:00:00Z",
                status: "COMPLETED",
                fileUrl: "/reports/report-121.pdf"
              }
            ]
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchReport();
  }, [params.id, router]);

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

  const getFrequencyLabel = (report: Report) => {
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

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      COMPLETED: "bg-green-100 text-green-800",
      PROCESSING: "bg-blue-100 text-blue-800",
      FAILED: "bg-red-100 text-red-800",
      PENDING: "bg-yellow-100 text-yellow-800"
    };
    
    const statusLabels: Record<string, string> = {
      COMPLETED: "Tamamlandı",
      PROCESSING: "İşleniyor",
      FAILED: "Başarısız",
      PENDING: "Beklemede"
    };
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status] || "bg-gray-100 text-gray-800"}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  // Toggle report active status
  const toggleReportStatus = async () => {
    if (!report) return;
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }
      
      await axios.patch(`/api/reports/scheduled/${report.id}`, 
        { isActive: !report.isActive },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Update local state
      setReport(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
      
    } catch (err: any) {
      console.error("Error toggling report status:", err);
      alert("Rapor durumu değiştirilirken bir hata oluştu.");
    }
  };

  // Delete report
  const deleteReport = async () => {
    if (!report) return;
    
    if (!confirm("Bu zamanlı raporu silmek istediğinizden emin misiniz?")) {
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }
      
      await axios.delete(`/api/reports/scheduled/${report.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      router.push("/admin/reports/scheduled");
      
    } catch (err: any) {
      console.error("Error deleting report:", err);
      alert("Rapor silinirken bir hata oluştu.");
    }
  };

  // Run report now
  const runReportNow = async () => {
    if (!report) return;
    
    try {
      setRunLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }
      
      await axios.post(`/api/reports/scheduled/${report.id}/run`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      alert("Rapor başarıyla çalıştırıldı. Kısa süre içinde hazır olacaktır.");
      
      // Refresh the report data
      const response = await axios.get(`/api/reports/scheduled/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setReport(response.data);
      
    } catch (err: any) {
      console.error("Error running report:", err);
      alert("Rapor çalıştırılırken bir hata oluştu.");
    } finally {
      setRunLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              Zamanlı Rapor Detayı
            </h1>
            <button
              onClick={() => router.push('/admin/reports/scheduled')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
            >
              Zamanlı Raporlara Dön
            </button>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
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
            ) : report ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                {/* Header with actions */}
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                      {report.title}
                      <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        report.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {report.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      ID: {report.id}
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={runReportNow}
                      disabled={runLoading}
                      className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        runLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {runLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          İşleniyor...
                        </>
                      ) : 'Şimdi Çalıştır'}
                    </button>
                    <button
                      onClick={toggleReportStatus}
                      className={`${
                        report.isActive 
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      } px-3 py-2 rounded-md text-sm font-medium`}
                    >
                      {report.isActive ? 'Durdur' : 'Etkinleştir'}
                    </button>
                    <button
                      onClick={() => router.push(`/admin/reports/scheduled/edit/${report.id}`)}
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={deleteReport}
                      className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Sil
                    </button>
                  </div>
                </div>
                
                {/* Report details */}
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Rapor Türü</dt>
                      <dd className="mt-1 text-sm text-gray-900">{getReportTypeLabel(report.type)}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Format</dt>
                      <dd className="mt-1 text-sm text-gray-900">{report.format}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Sıklık</dt>
                      <dd className="mt-1 text-sm text-gray-900">{getFrequencyLabel(report)}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Saat</dt>
                      <dd className="mt-1 text-sm text-gray-900">{report.time}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(report.createdAt)}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Oluşturan Kullanıcı</dt>
                      <dd className="mt-1 text-sm text-gray-900">{report.user?.name || "Bilinmiyor"}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Son Çalışma</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(report.lastRunAt)}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Sonraki Çalışma</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(report.nextRunAt)}</dd>
                    </div>
                    
                    {/* Report parameters */}
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Rapor Parametreleri</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                            <div className="sm:col-span-1">
                              <dt className="text-xs font-medium text-gray-500">Başlangıç Tarihi</dt>
                              <dd className="mt-1 text-sm text-gray-900">{report.parameters.startDate || "-"}</dd>
                            </div>
                            <div className="sm:col-span-1">
                              <dt className="text-xs font-medium text-gray-500">Bitiş Tarihi</dt>
                              <dd className="mt-1 text-sm text-gray-900">{report.parameters.endDate || "-"}</dd>
                            </div>
                            <div className="sm:col-span-1">
                              <dt className="text-xs font-medium text-gray-500">İşletme ID</dt>
                              <dd className="mt-1 text-sm text-gray-900">{report.parameters.businessId || "Tüm İşletmeler"}</dd>
                            </div>
                            <div className="sm:col-span-1">
                              <dt className="text-xs font-medium text-gray-500">Seçenekler</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                <ul className="list-disc list-inside">
                                  {report.parameters.includeCharts && <li>Grafikler dahil</li>}
                                  {report.parameters.includeDetails && <li>Detaylar dahil</li>}
                                </ul>
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </dd>
                    </div>
                  </dl>
                </div>
                
                {/* Generated reports history */}
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Oluşturulan Raporlar</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Bu zamanlı rapor için oluşturulan raporların geçmişi
                  </p>
                  
                  {report.generatedReports && report.generatedReports.length > 0 ? (
                    <div className="mt-4 flex flex-col">
                      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rapor ID
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Oluşturulma Tarihi
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Durum
                                  </th>
                                  <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">İşlemler</span>
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {report.generatedReports.map((genReport) => (
                                  <tr key={genReport.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {genReport.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {formatDate(genReport.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {getStatusBadge(genReport.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                      {genReport.fileUrl && genReport.status === "COMPLETED" && (
                                        <a 
                                          href={genReport.fileUrl} 
                                          className="text-blue-600 hover:text-blue-900"
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          İndir
                                        </a>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                      <p className="text-sm text-gray-500">
                        Bu zamanlı rapor için henüz oluşturulmuş rapor bulunmamaktadır.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6 text-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Rapor bulunamadı</h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500 mx-auto">
                    <p>Belirtilen ID ile zamanlı rapor bulunamadı veya erişim izniniz yok.</p>
                  </div>
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => router.push('/admin/reports/scheduled')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Zamanlı Raporlara Geri Dön
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 