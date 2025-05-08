"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { 
  ArrowDown, 
  ArrowUp, 
  FileDown, 
  Share2, 
  Plus, 
  MoreVertical,
  Printer,
  RefreshCw
} from "lucide-react";
import AdminLayout from "@/app/components/layouts/AdminLayout";

interface Report {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  frequency?: string;
  lastGenerated?: string;
  totalDownloads: number;
  format: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/auth/login");
        return;
      }

      // API çağrısı
      const response = await axios.get('/api/admin/reports', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200 && response.data.reports) {
        setReports(response.data.reports);
      } else {
        // API sorunu varsa boş bir dizi kullan
        setReports([]);
        console.warn("Raporlar alınırken sorun oluştu:", response.status);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Raporlar yüklenirken hata:", error);
      // API hatası durumunda boş bir dizi göster
      setReports([]);
      setLoading(false);
    }
  };

  // Filtreleri uygula
  const applyFilters = () => {
    let filteredReports = reports;
    
    // Durum filtreleme
    if (filterStatus !== "all") {
      filteredReports = filteredReports.filter(
        (report) => report.status.toLowerCase() === filterStatus
      );
    }
    
    // Tür filtreleme
    if (filterType !== "all") {
      filteredReports = filteredReports.filter(
        (report) => report.type.toLowerCase() === filterType
      );
    }
    
    // Tarih filtreleme
    if (filterDate !== "all") {
      const now = new Date();
      const oneDay = 24 * 60 * 60 * 1000;
      const oneWeek = 7 * oneDay;
      const oneMonth = 30 * oneDay;
      
      filteredReports = filteredReports.filter((report) => {
        const reportDate = new Date(report.createdAt);
        const diff = now.getTime() - reportDate.getTime();
        
        if (filterDate === "today") return diff < oneDay;
        if (filterDate === "week") return diff < oneWeek;
        if (filterDate === "month") return diff < oneMonth;
        return true;
      });
    }
    
    // Arama terimi filtresi
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredReports = filteredReports.filter(
        (report) =>
          report.title.toLowerCase().includes(term) ||
          report.id.toLowerCase().includes(term) ||
          report.createdBy.toLowerCase().includes(term)
      );
    }
    
    return filteredReports;
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            Tamamlandı
          </span>
        );
      case "scheduled":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            Zamanlandı
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            Başarısız
          </span>
        );
      case "processing":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            İşleniyor
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getFormatBadge = (format: string) => {
    switch (format.toLowerCase()) {
      case "pdf":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-50 text-red-700">
            PDF
          </span>
        );
      case "excel":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-50 text-green-700">
            Excel
          </span>
        );
      case "csv":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700">
            CSV
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-50 text-gray-700">
            {format}
          </span>
        );
    }
  };

  const getTypeName = (type: string) => {
    switch (type.toLowerCase()) {
      case "performance":
        return "Performans Raporu";
      case "financial":
        return "Finansal Rapor";
      case "delivery":
        return "Teslimat Raporu";
      case "courier":
        return "Kurye Raporu";
      case "analytics":
        return "Analitik Raporu";
      default:
        return type;
    }
  };

  const handleDownload = (id: string) => {
    alert(`Rapor indiriliyor: ${id}`);
  };

  const handleShare = (id: string) => {
    alert(`Rapor paylaşılıyor: ${id}`);
  };

  const handlePrint = (id: string) => {
    alert(`Rapor yazdırılıyor: ${id}`);
  };

  const filteredReports = applyFilters();

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Raporlar</h1>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push("/admin/reports/scheduled")}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Zamanlı Raporlar
              </button>
              <button
                onClick={() => router.push("/admin/reports/create")}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Rapor Oluştur
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Filtreler */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                    Ara
                  </label>
                  <input
                    type="text"
                    name="search"
                    id="search"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Rapor adı, ID veya oluşturan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Durum
                  </label>
                  <select
                    id="status"
                    name="status"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">Tümü</option>
                    <option value="completed">Tamamlandı</option>
                    <option value="scheduled">Zamanlandı</option>
                    <option value="processing">İşleniyor</option>
                    <option value="failed">Başarısız</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Rapor Türü
                  </label>
                  <select
                    id="type"
                    name="type"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">Tümü</option>
                    <option value="performance">Performans</option>
                    <option value="financial">Finansal</option>
                    <option value="delivery">Teslimat</option>
                    <option value="courier">Kurye</option>
                    <option value="analytics">Analitik</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Tarih
                  </label>
                  <select
                    id="date"
                    name="date"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  >
                    <option value="all">Tümü</option>
                    <option value="today">Bugün</option>
                    <option value="week">Bu Hafta</option>
                    <option value="month">Bu Ay</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={fetchReports}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <RefreshCw className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                  Yenile
                </button>
              </div>
            </div>
          </div>

          {/* Rapor Listesi */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="loader"></div>
                </div>
              ) : filteredReports.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Rapor
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Tür
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Durum
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Tarih
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Format
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredReports.map((report) => (
                        <tr key={report.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {report.title}
                                </div>
                                <div className="text-sm text-gray-500">
                                  #{report.id} • {report.createdBy}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{getTypeName(report.type)}</div>
                            {report.frequency && (
                              <div className="text-sm text-gray-500">{report.frequency}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(report.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(report.createdAt).toLocaleDateString("tr-TR")}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(report.createdAt).toLocaleTimeString("tr-TR")}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getFormatBadge(report.format)}
                              <span className="ml-2 text-sm text-gray-500">
                                {report.totalDownloads} indirme
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-3">
                              <button
                                onClick={() => handleDownload(report.id)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <FileDown className="h-5 w-5" aria-hidden="true" />
                              </button>
                              <button
                                onClick={() => handleShare(report.id)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Share2 className="h-5 w-5" aria-hidden="true" />
                              </button>
                              <button
                                onClick={() => handlePrint(report.id)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Printer className="h-5 w-5" aria-hidden="true" />
                              </button>
                              <button
                                onClick={() => router.push(`/admin/reports/${report.id}`)}
                                className="text-gray-400 hover:text-gray-500"
                              >
                                <MoreVertical className="h-5 w-5" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Rapor bulunamadı</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Herhangi bir rapor oluşturmak için başlayın.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => router.push("/admin/reports/create")}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      Yeni Rapor
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 