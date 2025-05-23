"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function CreateReport() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    type: "SALES",
    format: "PDF",
    startDate: "",
    endDate: "",
    businessId: "",
    includeCharts: true,
    includeDetails: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      // Create payload based on selected report type
      const payload = {
        name: formData.name,
        type: formData.type,
        format: formData.format,
        startDate: formData.startDate,
        endDate: formData.endDate,
        businessId: formData.businessId || undefined,
        includeCharts: formData.includeCharts,
        includeDetails: formData.includeDetails
      };

      const response = await axios.post("/api/reports", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 201 || response.status === 200) {
        alert("Rapor oluşturma talebi başarıyla gönderildi.");
        router.push("/admin/reports");
      }
    } catch (err: any) {
      console.error("Rapor oluşturma hatası:", err);
      setError(err.response?.data?.error || "Rapor oluşturulurken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  const getOneMonthAgoDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Yeni Rapor Oluştur</h1>
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
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Rapor Ayarları</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Yeni bir rapor oluşturmak için aşağıdaki bilgileri doldurun.
              </p>
            </div>
            
            {error && (
              <div className="mx-6 mb-4 p-4 text-red-700 bg-red-100 rounded-md">
                {error}
              </div>
            )}
            
            <div className="border-t border-gray-200">
              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Rapor Adı
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="Örn: Mayıs 2023 Satış Raporu"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                      Rapor Türü
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="SALES">Satış Raporu</option>
                      <option value="COURIER">Kurye Raporu</option>
                      <option value="CUSTOMER">Müşteri Raporu</option>
                      <option value="BUSINESS">İşletme Raporu</option>
                      <option value="INVENTORY">Envanter Raporu</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="format" className="block text-sm font-medium text-gray-700">
                      Rapor Formatı
                    </label>
                    <select
                      id="format"
                      name="format"
                      value={formData.format}
                      onChange={handleChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="PDF">PDF</option>
                      <option value="EXCEL">Excel</option>
                      <option value="CSV">CSV</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="businessId" className="block text-sm font-medium text-gray-700">
                      İşletme (Opsiyonel)
                    </label>
                    <select
                      id="businessId"
                      name="businessId"
                      value={formData.businessId}
                      onChange={handleChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Tüm İşletmeler</option>
                      <option value="business-1">Örnek İşletme 1</option>
                      <option value="business-2">Örnek İşletme 2</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                      Başlangıç Tarihi
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      id="startDate"
                      required
                      value={formData.startDate || getOneMonthAgoDate()}
                      onChange={handleChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                      Bitiş Tarihi
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      id="endDate"
                      required
                      value={formData.endDate || getTodayDate()}
                      onChange={handleChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <fieldset>
                      <legend className="text-sm font-medium text-gray-700">Rapor Seçenekleri</legend>
                      <div className="mt-4 space-y-4">
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="includeCharts"
                              name="includeCharts"
                              type="checkbox"
                              checked={formData.includeCharts}
                              onChange={handleChange}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="includeCharts" className="font-medium text-gray-700">Grafikleri dahil et</label>
                            <p className="text-gray-500">Rapor içerisinde görsel grafikler oluşturulur</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="includeDetails"
                              name="includeDetails"
                              type="checkbox"
                              checked={formData.includeDetails}
                              onChange={handleChange}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="includeDetails" className="font-medium text-gray-700">Detayları dahil et</label>
                            <p className="text-gray-500">Raporun sonunda detaylı veri tablosu eklenir</p>
                          </div>
                        </div>
                      </div>
                    </fieldset>
                  </div>
                </div>
                
                <div className="mt-6 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        İşleniyor...
                      </>
                    ) : 'Rapor Oluştur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 