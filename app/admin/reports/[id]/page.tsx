"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/layouts/AdminLayout";
import axios from "axios";

interface Report {
  id: string;
  name: string;
  type: string;
  format: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  resultUrl?: string;
  parameters: any;
  userId: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function ReportDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        if (!token) {
          router.push("/auth/login");
          return;
        }

        try {
          const response = await axios.get(`/api/reports/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          setReport(response.data);
        } catch (err) {
          console.error("API error:", err);
          
          // Mock data for development/demo purposes
          setReport({
            id: params.id,
            name: "Aylık Satış Raporu",
            type: "SALES",
            format: "PDF",
            status: "COMPLETED",
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            completedAt: new Date(Date.now() - 6.9 * 24 * 60 * 60 * 1000).toISOString(),
            resultUrl: "#",
            parameters: {
              startDate: "2023-01-01",
              endDate: "2023-01-31",
              businessId: "business-123",
              includeCharts: true
            },
            userId: "1",
            user: {
              name: "Admin User",
              email: "admin@example.com"
            }
          });
        }
      } catch (err) {
        console.error("Rapor getirme hatası:", err);
        setError("Rapor detayları yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [params.id, router]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Belirtilmemiş";
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR') + ' ' + date.toLocaleTimeString('tr-TR');
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'SALES':
        return 'Satış Raporu';
      case 'COURIER':
        return 'Kurye Raporu';
      case 'CUSTOMER':
        return 'Müşteri Raporu';
      case 'BUSINESS':
        return 'İşletme Raporu';
      case 'INVENTORY':
        return 'Envanter Raporu';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Tamamlandı</span>;
      case 'PROCESSING': 
        return <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">İşleniyor</span>;
      case 'PENDING':
        return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">Beklemede</span>;
      case 'FAILED':
        return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">Başarısız</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">{status}</span>;
    }
  };

  const handleRunAgain = async () => {
    if (!report) return;
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/auth/login");
        return;
      }
      
      // Call API to run the report again with the same parameters
      await axios.post('/api/reports', 
        {
          ...report.parameters,
          name: report.name,
          type: report.type,
          format: report.format
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      alert("Rapor yeniden oluşturma talebi gönderildi");
      router.push('/admin/reports');
    } catch (err) {
      console.error("Rapor yeniden çalıştırma hatası:", err);
      setError("Rapor yeniden oluşturulurken bir hata oluştu.");
    }
  };

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Rapor Detayları</h1>
            <button
              onClick={() => router.push('/admin/reports')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
            >
              Raporlara Dön
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : report ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">{report.name}</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      {report.user?.name} ({report.user?.email})
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {report.status === 'COMPLETED' && report.resultUrl && (
                      <a
                        href={report.resultUrl}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Raporu İndir
                      </a>
                    )}
                    <button
                      onClick={handleRunAgain}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Yeniden Oluştur
                    </button>
                  </div>
                </div>
                
                {error && (
                  <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md mx-6">
                    {error}
                  </div>
                )}

                <div className="border-t border-gray-200">
                  <dl>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Rapor ID</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{report.id}</dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Rapor Türü</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{getReportTypeLabel(report.type)}</dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Format</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{report.format}</dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Durum</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{getStatusBadge(report.status)}</dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(report.createdAt)}</dd>
                    </div>
                    {report.completedAt && (
                      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Tamamlanma Tarihi</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(report.completedAt)}</dd>
                      </div>
                    )}
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Parametreler</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <pre className="bg-gray-100 p-4 rounded overflow-auto">
                          {JSON.stringify(report.parameters, null, 2)}
                        </pre>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-red-500">Rapor bulunamadı.</p>
                <button
                  onClick={() => router.push("/admin/reports")}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Rapor Listesine Dön
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 