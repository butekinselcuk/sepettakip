"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/components/layouts/AdminLayout";
import axios from "axios";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function UserEdit({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    password: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        if (!token) {
          router.push("/auth/login");
          return;
        }

        // API çağrısı
        const response = await axios.get(`/api/users/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.status === 200) {
          const userData = response.data;
          setUser(userData);
          setFormData({
            name: userData.name,
            email: userData.email,
            role: userData.role,
            password: "",
          });
        } else {
          setError("Kullanıcı bilgileri alınamadı");
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Kullanıcı getirme hatası:", err);
        setError("Kullanıcı bilgileri yüklenirken bir hata oluştu.");
        setLoading(false);
      }
    };

    fetchUser();
  }, [params.id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/auth/login");
        return;
      }

      // API çağrısı
      const response = await axios.put(`/api/users/${params.id}`, formData, {
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        alert("Kullanıcı başarıyla güncellendi!");
        router.push("/admin/users");
      } else {
        throw new Error("Kullanıcı güncellenirken bir hata oluştu");
      }
    } catch (err) {
      console.error("Kullanıcı güncelleme hatası:", err);
      setError("Kullanıcı güncellenirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Kullanıcı Düzenle</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : user ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Kullanıcı Bilgileri</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Kullanıcı bilgilerini düzenleyebilirsiniz.</p>
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
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">İsim</label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-posta</label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">Rol</label>
                        <select
                          name="role"
                          id="role"
                          value={formData.role}
                          onChange={handleChange}
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="ADMIN">Yönetici</option>
                          <option value="BUSINESS">İşletme</option>
                          <option value="COURIER">Kurye</option>
                          <option value="CUSTOMER">Müşteri</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                          Şifre <span className="text-gray-400">(Değiştirmek istemiyorsanız boş bırakın)</span>
                        </label>
                        <input
                          type="password"
                          name="password"
                          id="password"
                          value={formData.password}
                          onChange={handleChange}
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6 flex items-center justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => router.push("/admin/users")}
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
                            Kaydediliyor...
                          </>
                        ) : 'Kaydet'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-red-500">Kullanıcı bulunamadı.</p>
                <button
                  onClick={() => router.push("/admin/users")}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Kullanıcı Listesine Dön
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 