"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tab } from '@headlessui/react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Report {
  id: string;
  title: string;
  description: string;
  status: string;
  type: string;
  format: string;
  createdAt: string;
  updatedAt: string;
  fileUrl: string | null;
  user: {
    name: string;
    email: string;
  };
}

interface ScheduledReport {
  id: string;
  title: string;
  description: string;
  frequency: string;
  isActive: boolean;
  type: string;
  format: string;
  createdAt: string;
  nextRunAt: string;
  options: string;
}

interface ReportFilter {
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export default function BusinessReportsPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState(0);
  const [reports, setReports] = useState<Report[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [filters, setFilters] = useState<ReportFilter>({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      router.push('/auth/login');
      return;
    }
    
    const userData = JSON.parse(user);
    if (userData.role !== 'BUSINESS') {
      router.push('/auth/login');
      return;
    }
    
    setIsAuthenticated(true);
    fetchReports();
    fetchScheduledReports();
  }, [router, page, filters]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = `/api/reports?page=${page}&limit=10`;
      if (filters.status) url += `&status=${filters.status}`;
      if (filters.type) url += `&type=${filters.type}`;
      if (filters.startDate) url += `&startDate=${filters.startDate}`;
      if (filters.endDate) url += `&endDate=${filters.endDate}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Raporlar alınırken bir hata oluştu');
      }
      
      const data = await response.json();
      setReports(data.reports);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledReports = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/reports/scheduled', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Planlanmış raporlar alınırken bir hata oluştu');
      }
      
      const data = await response.json();
      setScheduledReports(data.scheduledReports);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy, HH:mm', { locale: tr });
  };

  const toggleScheduledReportStatus = async (id: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/reports/scheduled/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !isActive })
      });
      
      if (!response.ok) {
        throw new Error('Rapor durumu güncellenemedi');
      }
      
      // Rapor durumu güncellendikten sonra listeyi yenile
      fetchScheduledReports();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateReport = () => {
    setIsCreatingReport(true);
    // Rapor oluşturma formunu göster veya rapor oluşturma sayfasına yönlendir
    router.push('/business/reports/create');
  };

  const handleCreateScheduledReport = () => {
    // Planlanmış rapor oluşturma sayfasına yönlendir
    router.push('/business/reports/scheduled/create');
  };

  const handleDownloadReport = (fileUrl: string | null, id: string) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    } else {
      // Rapor henüz oluşturulmamışsa bir mesaj göster
      setError('Bu rapor henüz oluşturulmamış veya dosya yok');
    }
  };

  const handleDeleteReport = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/reports/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Rapor silinemedi');
      }
      
      // Rapor silindikten sonra listeyi yenile
      fetchReports();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isAuthenticated) {
    return <div className="flex justify-center items-center h-screen">Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Raporlar</h1>
        <div className="space-x-2">
          <button
            onClick={handleCreateReport}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Yeni Rapor Oluştur
          </button>
          <button
            onClick={handleCreateScheduledReport}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Planlanmış Rapor Oluştur
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-4">
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
              ${selected
                ? 'bg-white text-blue-700 shadow'
                : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
              }`
            }
          >
            Raporlarım
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
              ${selected
                ? 'bg-white text-blue-700 shadow'
                : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
              }`
            }
          >
            Planlanmış Raporlar
          </Tab>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <p>Yükleniyor...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">Henüz rapor bulunmuyor</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Başlık
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tür
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Format
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Durum
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Oluşturulma Tarihi
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reports.map((report) => (
                        <tr key={report.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{report.title}</div>
                            <div className="text-sm text-gray-500">{report.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{report.type}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{report.format}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${report.status === 'COMPLETED' 
                                ? 'bg-green-100 text-green-800' 
                                : report.status === 'PROCESSING' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : report.status === 'FAILED' 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-gray-100 text-gray-800'
                              }`}>
                              {report.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(report.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleDownloadReport(report.fileUrl, report.id)}
                              disabled={!report.fileUrl || report.status !== 'COMPLETED'}
                              className={`text-indigo-600 hover:text-indigo-900 mr-2 
                                ${(!report.fileUrl || report.status !== 'COMPLETED') ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              İndir
                            </button>
                            <button
                              onClick={() => handleDeleteReport(report.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-center mt-4">
                  <nav className="flex space-x-2" aria-label="Pagination">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium 
                          ${page === pageNum
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </nav>
                </div>
              </>
            )}
          </Tab.Panel>
          <Tab.Panel>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <p>Yükleniyor...</p>
              </div>
            ) : scheduledReports.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">Henüz planlanmış rapor bulunmuyor</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Başlık
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tür
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Format
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sıklık
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sonraki Çalıştırma
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scheduledReports.map((report) => (
                      <tr key={report.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{report.title}</div>
                          <div className="text-sm text-gray-500">{report.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{report.type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{report.format}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {report.frequency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(report.nextRunAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${report.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                            }`}>
                            {report.isActive ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => toggleScheduledReportStatus(report.id, report.isActive)}
                            className={`px-2 py-1 rounded text-xs font-semibold 
                              ${report.isActive 
                                ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                          >
                            {report.isActive ? 'Devre Dışı Bırak' : 'Etkinleştir'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
} 