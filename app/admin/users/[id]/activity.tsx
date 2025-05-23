"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Search,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  ListFilter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";

// Etkinlik kayıt türü
interface ActivityLog {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  targetId?: string;
  targetType?: string;
  ip?: string;
  userAgent?: string;
  severity?: string;
  category?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  admin?: {
    id: string;
    user: {
      name: string;
      email: string;
    };
  };
  metadata?: any;
}

// API yanıt türü
interface ActivityLogResponse {
  logs: ActivityLog[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
  filters: {
    categories: string[];
    actions: string[];
    severities: string[];
  };
}

export default function UserActivityLogs({ params }: { params: { id: string } }) {
  const router = useRouter();
  const userId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ActivityLogResponse | null>(null);
  const [error, setError] = useState("");
  
  // Filtreler
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [actionType, setActionType] = useState("");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  
  // Etkinlik günlüğü kayıtlarını getir
  useEffect(() => {
    fetchActivityLogs();
  }, [userId, page, pageSize, actionType, category, severity, fromDate, toDate]);
  
  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      
      let url = `/api/admin/activity-log?userId=${userId}&page=${page}&limit=${pageSize}`;
      
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      if (actionType) {
        url += `&action=${encodeURIComponent(actionType)}`;
      }
      
      if (category) {
        url += `&category=${encodeURIComponent(category)}`;
      }
      
      if (severity) {
        url += `&severity=${encodeURIComponent(severity)}`;
      }
      
      if (fromDate) {
        url += `&fromDate=${encodeURIComponent(fromDate)}`;
      }
      
      if (toDate) {
        url += `&toDate=${encodeURIComponent(toDate)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/auth/login");
          return;
        }
        
        throw new Error("Etkinlik günlüğü kayıtları alınamadı");
      }
      
      const result: ActivityLogResponse = await response.json();
      setData(result);
    } catch (err) {
      console.error("Etkinlik günlüğü kayıtları alınırken hata:", err);
      setError("Etkinlik günlüğü kayıtları yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };
  
  // Arama işlemi
  const handleSearch = () => {
    setPage(1);
    fetchActivityLogs();
  };
  
  // Sayfa değiştirme
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  // Filtreleri temizleme
  const clearFilters = () => {
    setSearch("");
    setActionType("");
    setCategory("");
    setSeverity("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };
  
  // Önem derecesine göre renk belirleme
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-700";
      case "ERROR":
        return "bg-orange-100 text-orange-700";
      case "WARNING":
        return "bg-yellow-100 text-yellow-700";
      case "INFO":
      default:
        return "bg-blue-100 text-blue-700";
    }
  };
  
  // Önem derecesine göre ikon belirleme
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <ShieldAlert className="h-4 w-4" />;
      case "ERROR":
        return <AlertCircle className="h-4 w-4" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4" />;
      case "INFO":
      default:
        return <Info className="h-4 w-4" />;
    }
  };
  
  // İşlem tipine göre renk belirleme
  const getActionColor = (action: string) => {
    if (action.includes("CREATE")) return "bg-green-100 text-green-700";
    if (action.includes("UPDATE")) return "bg-blue-100 text-blue-700";
    if (action.includes("DELETE")) return "bg-red-100 text-red-700";
    if (action.includes("LOGIN")) return "bg-purple-100 text-purple-700";
    return "bg-gray-100 text-gray-700";
  };
  
  // Sekme içerikleri
  const renderTabContent = () => {
    if (loading) {
      return (
        <div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4 py-4 border-b">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="py-10 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-1">{error}</p>
          <p className="text-gray-500">Lütfen daha sonra tekrar deneyin veya yönetici ile iletişime geçin.</p>
          <Button onClick={fetchActivityLogs} className="mt-4">
            Yeniden Dene
          </Button>
        </div>
      );
    }
    
    if (!data || !data.logs || data.logs.length === 0) {
      return (
        <div className="py-10 text-center">
          <CheckCircle2 className="h-10 w-10 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-1">Etkinlik kaydı bulunamadı</p>
          <p className="text-gray-500">
            {Object.values({search, actionType, category, severity, fromDate, toDate}).some(Boolean)
              ? "Filtreleri değiştirerek tekrar deneyin."
              : "Bu kullanıcı için henüz etkinlik kaydı bulunmamaktadır."}
          </p>
          {Object.values({search, actionType, category, severity, fromDate, toDate}).some(Boolean) && (
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Filtreleri Temizle
            </Button>
          )}
        </div>
      );
    }
    
    return (
      <div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>İşlem</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Önem</TableHead>
                <TableHead>IP</TableHead>
                <TableHead className="text-right">Detaylar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant="outline" className={getActionColor(log.action)}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={log.description}>
                    {log.description}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          {formatDate(log.createdAt, "dd MMM yyyy")}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{formatDate(log.createdAt, "dd MMM yyyy HH:mm:ss")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getSeverityColor(log.severity || "INFO")}>
                      <span className="flex items-center">
                        {getSeverityIcon(log.severity || "INFO")}
                        <span className="ml-1">{log.severity || "INFO"}</span>
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.ip || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                    >
                      Detaylar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Sayfalama */}
        {data.pagination.totalPages > 0 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Toplam {data.pagination.total} kayıt, {data.pagination.currentPage}/{data.pagination.totalPages} sayfa
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from(
                { length: Math.min(5, data.pagination.totalPages) },
                (_, i) => {
                  let pageNum = 0;
                  
                  if (data.pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= data.pagination.totalPages - 2) {
                    pageNum = data.pagination.totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="icon"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                }
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(Math.min(data.pagination.totalPages, page + 1))}
                disabled={page === data.pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Ana komponent render işlemi
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Kullanıcı Etkinlik Günlüğü</CardTitle>
              <CardDescription>
                Kullanıcının sistem üzerindeki tüm etkinlikleri
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="text-xs h-8 px-2 gap-1" 
                onClick={() => setShowFilters(!showFilters)}
              >
                <ListFilter className="h-3.5 w-3.5" />
                {showFilters ? "Filtreleri Gizle" : "Filtrele"}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="text-xs h-8 px-2">
                    {pageSize} Kayıt
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {[10, 20, 50, 100].map((size) => (
                    <DropdownMenuItem 
                      key={size} 
                      onClick={() => {
                        setPageSize(size);
                        setPage(1);
                      }}
                    >
                      {size} Kayıt
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="outline" className="text-xs h-8 px-2" onClick={clearFilters}>
                Temizle
              </Button>
            </div>
          </div>
          
          {/* Filtreler */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <Label htmlFor="search-logs" className="text-xs">Arama</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="search-logs"
                    placeholder="Arama..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="action-type" className="text-xs">İşlem Tipi</Label>
                <Select
                  value={actionType}
                  onValueChange={setActionType}
                >
                  <SelectTrigger id="action-type">
                    <SelectValue placeholder="Tüm İşlemler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tüm İşlemler</SelectItem>
                    {data?.filters.actions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="category" className="text-xs">Kategori</Label>
                <Select
                  value={category}
                  onValueChange={setCategory}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Tüm Kategoriler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tüm Kategoriler</SelectItem>
                    {data?.filters.categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="severity" className="text-xs">Önem Derecesi</Label>
                <Select
                  value={severity}
                  onValueChange={setSeverity}
                >
                  <SelectTrigger id="severity">
                    <SelectValue placeholder="Tüm Önem Dereceleri" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tüm Önem Dereceleri</SelectItem>
                    {data?.filters.severities.map((sev) => (
                      <SelectItem key={sev} value={sev}>
                        {sev}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="from-date" className="text-xs">Başlangıç Tarihi</Label>
                <Input
                  id="from-date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="to-date" className="text-xs">Bitiş Tarihi</Label>
                <Input
                  id="to-date"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="list">Liste</TabsTrigger>
              {/* İleride eklenebilecek diğer sekmeler */}
            </TabsList>
            
            <TabsContent value="list">
              {renderTabContent()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Etkinlik detay modalı */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={(open: boolean) => !open && setSelectedLog(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Etkinlik Detayları</DialogTitle>
              <DialogDescription>
                Etkinlik kaydı hakkında detaylı bilgiler
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">İşlem:</Label>
                <div className="col-span-3">
                  <Badge variant="outline" className={getActionColor(selectedLog.action)}>
                    {selectedLog.action}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Açıklama:</Label>
                <p className="col-span-3">{selectedLog.description}</p>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Tarih/Saat:</Label>
                <p className="col-span-3">{formatDate(selectedLog.createdAt, "dd MMM yyyy HH:mm:ss")}</p>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Kategori:</Label>
                <p className="col-span-3">{selectedLog.category || "-"}</p>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Önem:</Label>
                <div className="col-span-3">
                  <Badge variant="outline" className={getSeverityColor(selectedLog.severity || "INFO")}>
                    <span className="flex items-center">
                      {getSeverityIcon(selectedLog.severity || "INFO")}
                      <span className="ml-1">{selectedLog.severity || "INFO"}</span>
                    </span>
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right font-medium">Kullanıcı:</Label>
                <div className="col-span-3">
                  {selectedLog.user ? (
                    <p>
                      {selectedLog.user.name} ({selectedLog.user.email})
                    </p>
                  ) : selectedLog.admin ? (
                    <p>
                      {selectedLog.admin.user.name} ({selectedLog.admin.user.email})
                    </p>
                  ) : (
                    <p>-</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">IP Adresi:</Label>
                <p className="col-span-3">{selectedLog.ip || "-"}</p>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Hedef Tipi:</Label>
                <p className="col-span-3">{selectedLog.targetType || "-"}</p>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Hedef ID:</Label>
                <p className="col-span-3">{selectedLog.targetId || "-"}</p>
              </div>
              
              {selectedLog.metadata && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right font-medium">Meta Veri:</Label>
                  <div className="col-span-3">
                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-32">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right font-medium">Kullanıcı Ajanı:</Label>
                <p className="col-span-3 text-xs break-words">
                  {selectedLog.userAgent || "-"}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => setSelectedLog(null)}
              >
                Kapat
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 