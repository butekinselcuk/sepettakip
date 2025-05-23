"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Trash, 
  User, 
  UserCog, 
  UserPlus,
  Users,
  Pause,
  Play,
  History,
  Shield
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';

// Kullanıcı türü
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    orders: number;
  };
}

// Sayfalama türü
interface Pagination {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

// API yanıt türü
interface ApiResponse {
  users: User[];
  pagination: Pagination;
}

// Toplu işlem geçmişi türü
interface BulkActionHistory {
  id: string;
  action: string;
  userIds: string[];
  timestamp: Date;
  affectedCount: number;
  canUndo: boolean; // Geri alınabilirlik durumu
}

// Toplu işlem payload türü
interface BulkActionPayload {
  userIds: string[];
  action: string;
  role?: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
  });
  
  // Filtreler
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  
  // Dialog durumları
  const [newUserDialog, setNewUserDialog] = useState(false);
  const [deleteUserDialog, setDeleteUserDialog] = useState(false);
  const [bulkActionDialog, setBulkActionDialog] = useState(false);
  const [bulkActionHistoryDialog, setBulkActionHistoryDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Çoklu seçim için state'ler
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [bulkActionRole, setBulkActionRole] = useState<string>("");
  const [bulkActionHistory, setBulkActionHistory] = useState<BulkActionHistory[]>([]);
  
  // Form state'leri
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "USER",
  });
  
  // Toast mesajı
  const [toastNotification, setToastNotification] = useState({
    show: false,
    message: "",
    type: "success" as "success" | "error",
  });

  // Kullanıcıları yükle
  useEffect(() => {
    // Oturum kontrolü yapalım ama sayfa yönlendirmesini fetchUsers'da ele alalım
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    
    // Token varsa rol kontrolü
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/auth/login');
        return;
      }
      
      const user = JSON.parse(userStr);
      if (user.role !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }
    } catch (e) {
      router.push('/auth/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    fetchUsers();
  }, [pagination.currentPage, role, status]);

  // Arama fonksiyonu
  const handleSearch = () => {
    setPagination({ ...pagination, currentPage: 1 });
    fetchUsers();
  };

  // Kullanıcıları getir
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      let url = `/api/admin/users?page=${pagination.currentPage}&limit=${pagination.limit}`;
      
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      if (role) {
        url += `&role=${encodeURIComponent(role)}`;
      }
      
      if (status) {
        url += `&status=${encodeURIComponent(status)}`;
      }
      
      // Token'ı al (headers için)
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        console.error("Token bulunamadı, giriş sayfasına yönlendiriliyor");
        router.push("/auth/login");
        return;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error("Yetkisiz erişim, giriş sayfasına yönlendiriliyor");
          // Token veya user bilgilerini temizle
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          router.push("/auth/login");
          return;
        }
        
        const errorText = await response.text();
        console.error("API hatası:", response.status, errorText);
        throw new Error("Kullanıcılar yüklenirken hata oluştu: " + errorText);
      }
      
      const data: ApiResponse = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
      // Seçili kullanıcıları sıfırla
      setSelectedUsers([]);
      setSelectAll(false);
    } catch (error) {
      console.error("Kullanıcılar yüklenirken hata:", error);
      showToast("Kullanıcılar yüklenirken hata oluştu", "error");
    } finally {
      setLoading(false);
    }
  };

  // Toast mesajı göster
  const showToast = (message: string, type: "success" | "error") => {
    setToastNotification({
      show: true,
      message,
      type,
    });
    
    // 3 saniye sonra toast'ı kaldır
    setTimeout(() => {
      setToastNotification({ ...toastNotification, show: false });
    }, 3000);
  };

  // Sayfa değiştirme
  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, currentPage: page });
  };

  // Form değişikliklerini işle
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUserForm({
      ...newUserForm,
      [e.target.name]: e.target.value,
    });
  };

  // Rol değişimini işle
  const handleRoleChange = (value: string) => {
    setNewUserForm({
      ...newUserForm,
      role: value,
    });
  };

  // Yeni kullanıcı oluştur
  const handleCreateUser = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        credentials: 'include', // Token cookie'sini isteğe dahil et
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUserForm),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Kullanıcı oluşturulurken hata");
      }
      
      setNewUserDialog(false);
      resetNewUserForm();
      showToast("Kullanıcı başarıyla oluşturuldu", "success");
      fetchUsers();
    } catch (error: unknown) {
      console.error("Kullanıcı oluşturulurken hata:", error);
      const errorMessage = error instanceof Error ? error.message : "Kullanıcı oluşturulurken hata";
      showToast(errorMessage, "error");
    }
  };

  // Kullanıcı silme işlemi
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
        credentials: 'include', // Token cookie'sini isteğe dahil et
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Kullanıcı silinirken hata");
      }
      
      setDeleteUserDialog(false);
      setSelectedUser(null);
      showToast("Kullanıcı başarıyla silindi", "success");
      fetchUsers();
    } catch (error: unknown) {
      console.error("Kullanıcı silinirken hata:", error);
      const errorMessage = error instanceof Error ? error.message : "Kullanıcı silinirken hata";
      showToast(errorMessage, "error");
    }
  };

  // Form resetleme
  const resetNewUserForm = () => {
    setNewUserForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "USER",
    });
  };

  // Rol rengini belirle
  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-700";
      case "USER":
        return "bg-blue-100 text-blue-700";
      case "BUSINESS":
        return "bg-orange-100 text-orange-700";
      case "COURIER":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Durum rengini belirle
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "INACTIVE":
        return "bg-yellow-100 text-yellow-700";
      case "SUSPENDED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };
  
  // Tek bir kullanıcı seçme/seçimi kaldırma
  const toggleUserSelection = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
      setSelectAll(false);
    } else {
      setSelectedUsers([...selectedUsers, userId]);
      if (selectedUsers.length + 1 === users.length) {
        setSelectAll(true);
      }
    }
  };
  
  // Tüm kullanıcıları seç/seçimi kaldır
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
      setSelectAll(false);
    } else {
      setSelectedUsers(users.map(user => user.id));
      setSelectAll(true);
    }
  };
  
  // Toplu işlem uygula
  const executeBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) {
      showToast("Lütfen bir işlem seçin ve en az bir kullanıcı seçin", "error");
      return;
    }
    
    try {
      let endpoint = '/api/admin/users/bulk';
      const payload: BulkActionPayload = {
        userIds: selectedUsers,
        action: bulkAction
      };
      
      // Rol değiştirme işlemi için rol bilgisini ekle
      if (bulkAction === 'CHANGE_ROLE' && bulkActionRole) {
        payload.role = bulkActionRole;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include', // Token cookie'sini isteğe dahil et
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Toplu işlem uygulanırken hata oluştu");
      }
      
      // İşlem geçmişine ekle
      const newAction: BulkActionHistory = {
        id: Date.now().toString(),
        action: bulkAction,
        userIds: selectedUsers,
        timestamp: new Date(),
        affectedCount: selectedUsers.length,
        canUndo: true
      };
      
      setBulkActionHistory([newAction, ...bulkActionHistory.slice(0, 9)]);
      
      // Dialog kapat, seçimleri temizle ve kullanıcıları yeniden getir
      setBulkActionDialog(false);
      setBulkAction("");
      setBulkActionRole("");
      setSelectedUsers([]);
      setSelectAll(false);
      
      showToast(`${selectedUsers.length} kullanıcı üzerinde işlem başarıyla uygulandı`, "success");
      fetchUsers();
    } catch (error: unknown) {
      console.error("Toplu işlem uygulanırken hata:", error);
      const errorMessage = error instanceof Error ? error.message : "Toplu işlem uygulanırken hata oluştu";
      showToast(errorMessage, "error");
    }
  };
  
  // İşlemi geri al
  const undoBulkAction = async (actionId: string) => {
    try {
      const action = bulkActionHistory.find(h => h.id === actionId);
      if (!action) {
        showToast("Bu işlem geri alınamaz", "error");
        return;
      }
      
      const response = await fetch('/api/admin/users/bulk/undo', {
        method: 'POST',
        credentials: 'include', // Token cookie'sini isteğe dahil et
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ actionId })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "İşlem geri alınırken hata oluştu");
      }
      
      // İşlemi geçmişten kaldır veya durumunu güncelle
      setBulkActionHistory(bulkActionHistory.map(h => 
        h.id === actionId ? { ...h, canUndo: false } : h
      ));
      
      showToast("İşlem başarıyla geri alındı", "success");
      fetchUsers();
    } catch (error: unknown) {
      console.error("İşlem geri alınırken hata:", error);
      const errorMessage = error instanceof Error ? error.message : "İşlem geri alınırken hata oluştu";
      showToast(errorMessage, "error");
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Kullanıcı Yönetimi</CardTitle>
              <CardDescription>
                Sistemdeki tüm kullanıcıları görüntüle ve yönet.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedUsers.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setBulkActionDialog(true)}
                      >
                        <UserCog className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Toplu İşlem</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setBulkActionHistoryDialog(true)}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>İşlem Geçmişi</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button onClick={() => setNewUserDialog(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Yeni Kullanıcı
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filtreler */}
          <div className="flex flex-col gap-4 mb-6 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Kullanıcı ara..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:w-2/5">
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tüm Roller</SelectItem>
                  <SelectItem value="USER">Kullanıcı</SelectItem>
                  <SelectItem value="ADMIN">Yönetici</SelectItem>
                  <SelectItem value="BUSINESS">İşletme</SelectItem>
                  <SelectItem value="COURIER">Kurye</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tüm Durumlar</SelectItem>
                  <SelectItem value="ACTIVE">Aktif</SelectItem>
                  <SelectItem value="INACTIVE">Pasif</SelectItem>
                  <SelectItem value="SUSPENDED">Askıya Alınmış</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="shrink-0" onClick={handleSearch}>
              Filtrele
            </Button>
          </div>
          
          {/* Kullanıcı tablosu */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox 
                      checked={selectAll}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Tüm kullanıcıları seç"
                    />
                  </TableHead>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                  <TableHead>Sipariş Sayısı</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Yükleniyor durumu
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 ml-auto rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : users.length > 0 ? (
                  // Kullanıcı listesi
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                          aria-label={`${user.name} kullanıcısını seç`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="bg-gray-100 rounded-full h-8 w-8 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt, "dd MMM yyyy")}</TableCell>
                      <TableCell>{user._count.orders}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Menüyü aç</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="z-50">
                            <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
                              <UserCog className="mr-2 h-4 w-4" />
                              <span>Düzenle</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}/activity`)}>
                              <History className="mr-2 h-4 w-4" />
                              <span>Etkinlik Günlüğü</span>
                            </DropdownMenuItem>
                            {user.status === 'ACTIVE' ? (
                              <DropdownMenuItem onClick={() => {
                                setSelectedUsers([user.id]);
                                setBulkAction('SUSPEND');
                                setBulkActionDialog(true);
                              }}>
                                <Pause className="mr-2 h-4 w-4" />
                                <span>Askıya Al</span>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => {
                                setSelectedUsers([user.id]);
                                setBulkAction('ACTIVATE');
                                setBulkActionDialog(true);
                              }}>
                                <Play className="mr-2 h-4 w-4" />
                                <span>Aktifleştir</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setSelectedUser(user);
                                setDeleteUserDialog(true);
                              }}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              <span>Sil</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  // Veri yok durumu
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                      Kullanıcı bulunamadı
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Sayfalama */}
          {pagination.totalPages > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Toplam {pagination.total} kullanıcı, {pagination.currentPage}/{pagination.totalPages} sayfa
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(Math.max(1, pagination.currentPage - 1))}
                  disabled={pagination.currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {/* Sayfa numaraları */}
                <div className="flex items-center">
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      let pageNum = 0;
                      
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.currentPage === pageNum ? "default" : "outline"}
                          size="icon"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Yeni kullanıcı oluşturma modalı */}
      <Dialog open={newUserDialog} onOpenChange={setNewUserDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Kullanıcı Oluştur</DialogTitle>
            <DialogDescription>
              Sisteme yeni bir kullanıcı eklemek için formu doldurun.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                İsim
              </Label>
              <Input
                id="name"
                name="name"
                value={newUserForm.name}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={newUserForm.email}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Telefon
              </Label>
              <Input
                id="phone"
                name="phone"
                value={newUserForm.phone}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Şifre
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={newUserForm.password}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Rol
              </Label>
              <Select
                value={newUserForm.role}
                onValueChange={handleRoleChange}
              >
                <SelectTrigger id="role" className="col-span-3">
                  <SelectValue placeholder="Rol seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Kullanıcı</SelectItem>
                  <SelectItem value="ADMIN">Yönetici</SelectItem>
                  <SelectItem value="BUSINESS">İşletme</SelectItem>
                  <SelectItem value="COURIER">Kurye</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewUserDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleCreateUser}>Oluştur</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Kullanıcı silme modalı */}
      <Dialog open={deleteUserDialog} onOpenChange={setDeleteUserDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kullanıcıyı Sil</DialogTitle>
            <DialogDescription>
              {selectedUser?.name} isimli kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteUserDialog(false)}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
            >
              Kullanıcıyı Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Toplu işlem modalı */}
      <Dialog open={bulkActionDialog} onOpenChange={setBulkActionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Toplu İşlem Uygula</DialogTitle>
            <DialogDescription>
              Seçili {selectedUsers.length} kullanıcı için bir işlem seçin.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bulk-action" className="text-right">
                İşlem
              </Label>
              <Select
                value={bulkAction}
                onValueChange={setBulkAction}
              >
                <SelectTrigger id="bulk-action" className="col-span-3">
                  <SelectValue placeholder="İşlem seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVATE">Aktifleştir</SelectItem>
                  <SelectItem value="SUSPEND">Askıya Al</SelectItem>
                  <SelectItem value="DELETE">Sil</SelectItem>
                  <SelectItem value="CHANGE_ROLE">Rol Değiştir</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {bulkAction === 'CHANGE_ROLE' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bulk-role" className="text-right">
                  Yeni Rol
                </Label>
                <Select
                  value={bulkActionRole}
                  onValueChange={setBulkActionRole}
                >
                  <SelectTrigger id="bulk-role" className="col-span-3">
                    <SelectValue placeholder="Rol seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Kullanıcı</SelectItem>
                    <SelectItem value="ADMIN">Yönetici</SelectItem>
                    <SelectItem value="BUSINESS">İşletme</SelectItem>
                    <SelectItem value="COURIER">Kurye</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkActionDialog(false)}
            >
              İptal
            </Button>
            <Button
              variant={bulkAction === 'DELETE' ? "destructive" : "default"}
              onClick={executeBulkAction}
              disabled={!bulkAction || (bulkAction === 'CHANGE_ROLE' && !bulkActionRole)}
            >
              {bulkAction === 'DELETE' ? 'Kullanıcıları Sil' : 'Uygula'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* İşlem geçmişi modalı */}
      <Dialog open={bulkActionHistoryDialog} onOpenChange={setBulkActionHistoryDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Toplu İşlem Geçmişi</DialogTitle>
            <DialogDescription>
              Son yapılan toplu işlemler ve bu işlemlerin durumları
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {bulkActionHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Henüz bir toplu işlem gerçekleştirilmemiş
              </p>
            ) : (
              <div className="space-y-4">
                {bulkActionHistory.map((action) => (
                  <div key={action.id} className="flex items-center justify-between border rounded-md p-3">
                    <div>
                      <p className="font-medium">
                        {action.action === 'ACTIVATE' && 'Aktifleştirme'}
                        {action.action === 'SUSPEND' && 'Askıya Alma'}
                        {action.action === 'DELETE' && 'Silme'}
                        {action.action === 'CHANGE_ROLE' && 'Rol Değiştirme'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {action.affectedCount} kullanıcı, {formatDate(action.timestamp.toString())}
                      </p>
                    </div>
                    
                    {action.canUndo && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => undoBulkAction(action.id)}
                      >
                        Geri Al
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setBulkActionHistoryDialog(false)}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 