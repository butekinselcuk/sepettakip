"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/layouts/AdminLayout";
import axios, { AxiosError } from "axios";
import { useToast } from "@/app/components/ui/use-toast";

// Status türleri için string literal tip
type CourierStatus = "ACTIVE" | "INACTIVE" | "PENDING";
type VehicleType = "MOTORCYCLE" | "CAR" | "BICYCLE" | "WALKING" | "" | "default-value";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CourierFormData {
  userId: string;
  vehicleType: string;
  phone: string;
  status: CourierStatus;
}

export default function AddCourier() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [formData, setFormData] = useState<CourierFormData>({
    userId: "",
    vehicleType: "",
    phone: "",
    status: "ACTIVE",
  });

  // Fetch users with COURIER role without a courier profile
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        setError("");
        const token = localStorage.getItem("token");
        
        if (!token) {
          router.push("/auth/login");
          return;
        }

        // API çağrısı: COURIER rolündeki kullanıcıları getir
        const response = await axios.get<{users: User[]}>("/api/users?role=COURIER&withoutProfile=true", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setUsers(response.data?.users || []);
      } catch (err) {
        setError("Kurye olabilecek kullanıcılar yüklenirken bir hata oluştu.");
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'status' ? value as CourierStatus : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId) {
      setError("Lütfen bir kullanıcı seçin.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/auth/login");
        return;
      }

      // API call to create courier
      const response = await axios.post("/api/couriers", 
        formData,
        {
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.status === 201 || response.status === 200) {
        toast({
          title: "Başarılı",
          description: "Kurye başarıyla oluşturuldu!"
        } as any);
        router.push("/admin/couriers");
      }
    } catch (err) {
      const error = err as AxiosError;
      if (error.response?.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
        setError((error.response.data as any).error);
      } else {
        setError("Kurye oluşturulurken bir hata oluştu.");
      }
      
      toast({
        title: "Hata",
        description: "Kurye oluşturulurken bir hata oluştu."
      } as any);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Yeni Kurye Ekle</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Kurye Bilgileri</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Yeni bir kurye oluşturmak için gerekli bilgileri giriniz.</p>
              </div>
              
              {error && (
                <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md mx-6">
                  {error}
                </div>
              )}

              <div className="border-t border-gray-200">
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="userId" className="block text-sm font-medium text-gray-700">Kurye Kullanıcısı</label>
                      <select
                        id="userId"
                        name="userId"
                        value={formData.userId}
                        onChange={handleChange}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      >
                        <option value="">Kullanıcı seçin</option>
                        {loadingUsers ? (
                          <option disabled>Yükleniyor...</option>
                        ) : (
                          users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </option>
                          ))
                        )}
                      </select>
                      {users.length === 0 && !loadingUsers && (
                        <p className="mt-1 text-sm text-red-500">Kullanıcı bulunamadı. Lütfen önce COURIER rolüne sahip kullanıcı oluşturun.</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700">Araç Tipi</label>
                      <select
                        id="vehicleType"
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleChange}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">Seçiniz</option>
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
                  
                  <div className="mt-6 flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => router.push("/admin/couriers")}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {saving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Oluşturuluyor...
                        </>
                      ) : 'Kurye Oluştur'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 