"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/admin/components/AdminLayout";
import axios, { AxiosError } from "axios";
import { useToast } from "@/app/components/ui/use-toast";

// Status türleri için string literal tip
type CourierStatus = "ACTIVE" | "INACTIVE" | "PENDING";
type VehicleType = "MOTORCYCLE" | "CAR" | "BICYCLE" | "WALKING" | "default-value" | "";

interface Courier {
  id: string;
  userId: string;
  status: CourierStatus;
  vehicleType: string | null;
  phone: string | null;
  ratings: number | null;
  currentLatitude: number | null;
  currentLongitude: number | null;
  lastLocationUpdate: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
}

interface CourierFormData {
  vehicleType: string;
  phone: string;
  status: CourierStatus;
}

export default function CourierDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [courier, setCourier] = useState<Courier | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<CourierFormData>({
    vehicleType: "",
    phone: "",
    status: "ACTIVE",
  });

  // Get courier ID from params
  const courierId = params.id;

  useEffect(() => {
    const fetchCourier = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");
        
        if (!token) {
          router.push("/auth/login");
          return;
        }

        const response = await axios.get<{courier: Courier}>(`/api/couriers/${courierId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.data?.courier) {
          setError("Kurye bilgileri bulunamadı.");
          setLoading(false);
          return;
        }

        const courierData = response.data.courier;
        setCourier(courierData);
        setFormData({
          vehicleType: courierData.vehicleType || "",
          phone: courierData.phone || "",
          status: courierData.status,
        });
      } catch (err) {
        setError("Kurye bilgileri yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourier();
  }, [courierId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'status' ? value as CourierStatus : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/auth/login");
        return;
      }

      // API call to update courier
      const response = await axios.patch(`/api/couriers/${courierId}`, 
        formData,
        {
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.status === 200) {
        toast({
          title: "Başarılı",
          description: "Kurye başarıyla güncellendi!"
        } as any);
        
        // Update local state with the typed formData
        if (courier) {
          setCourier({
            ...courier,
            vehicleType: formData.vehicleType || null,
            phone: formData.phone || null,
            status: formData.status
          });
        }
      }
    } catch (err) {
      const error = err as AxiosError;
      if (error.response?.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
        setError((error.response.data as any).error);
      } else {
        setError("Kurye güncellenirken bir hata oluştu.");
      }
      
      toast({
        title: "Hata",
        description: "Kurye güncellenirken bir hata oluştu."
      } as any);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Belirtilmemiş";
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR') + ' ' + date.toLocaleTimeString('tr-TR');
  };

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Kurye Detayları</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : courier ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">{courier.user.name}</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">{courier.user.email}</p>
                  </div>
                  <div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full
                      ${courier.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                        courier.status === 'INACTIVE' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {courier.status === 'ACTIVE' ? 'Aktif' : 
                       courier.status === 'INACTIVE' ? 'Pasif' : 'Beklemede'}
                    </span>
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
                      <dt className="text-sm font-medium text-gray-500">Kurye ID</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{courier.id}</dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Kullanıcı ID</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{courier.userId}</dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Puan</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {courier.ratings ? `${courier.ratings.toFixed(1)}/5.0` : "Değerlendirilmemiş"}
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Son Konum</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {courier.currentLatitude && courier.currentLongitude ? 
                          `${courier.currentLatitude.toFixed(6)}, ${courier.currentLongitude.toFixed(6)}` : 
                          "Konum bilgisi yok"}
                        {courier.lastLocationUpdate && (
                          <span className="text-xs text-gray-500 ml-2">
                            (Güncelleme: {formatDate(courier.lastLocationUpdate)})
                          </span>
                        )}
                      </dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Kayıt Tarihi</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {formatDate(courier.createdAt)}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Edit Form */}
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Kurye Bilgilerini Düzenle</h3>
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700">Araç Tipi</label>
                        <select
                          id="vehicleType"
                          name="vehicleType"
                          value={formData.vehicleType}
                          onChange={handleChange}
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="default-value">Seçiniz</option>
                          <option value="MOTORCYCLE">Motorsiklet</option>
                          <option value="CAR">Araba</option>
                          <option value="BICYCLE">Bisiklet</option>
                          <option value="WALKING">Yaya</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefon</label>
                        <input
                          type="tel"
                          name="phone"
                          id="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+90 XXX XXX XX XX"
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Durum</label>
                        <select
                          id="status"
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="ACTIVE">Aktif</option>
                          <option value="INACTIVE">Pasif</option>
                          <option value="PENDING">Beklemede</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={() => router.push("/admin/couriers")}
                        className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        İptal
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                          saving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                      >
                        {saving ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Kaydediliyor...
                          </>
                        ) : 'Kaydet'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
                <p className="text-red-500">Kurye bilgileri bulunamadı veya bir hata oluştu.</p>
                <button
                  type="button"
                  onClick={() => router.push('/admin/couriers')}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Kuryeler Listesine Dön
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 