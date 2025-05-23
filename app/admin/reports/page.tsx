"use client";

import React, { useState, useEffect } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { ReportGenerator } from '@/components/reports/ReportGenerator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/app/components/ui/use-toast';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table';
import { formatDistance } from 'date-fns';
import { tr } from 'date-fns/locale';
import { DownloadIcon, ClockIcon, FileIcon, RefreshCw, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Tablo için tip tanımlaması
type ColumnDef<T> = {
  accessorKey?: string;
  id?: string;
  header: string | React.ReactNode;
  cell: (props: { row: { getValue: (key: string) => any; original: T } }) => React.ReactNode;
};

// Raporlar için sütun yapısı
type Report = {
  id: string;
  title: string;
  dataSource: string;
  format: string;
  createdAt: string;
  updatedAt: string;
  filePath: string;
};

// Zamanlanmış raporlar için sütun yapısı
type ScheduledReport = {
  id: string;
  title: string;
  dataSource: string;
  format: string;
  frequency: string;
  nextRunAt: string;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  isEnabled: boolean;
};

export default function ReportsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('generate');
  const [reports, setReports] = useState<Report[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Raporları yükle
  const loadReports = async () => {
    setIsLoading(true);
    try {
      // localStorage'dan token'ı al
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        toast({
          title: 'Hata',
          description: 'Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.',
          type: 'error'
        } as any);
        setIsLoading(false);
        return;
      }
      
      const response = await fetch('/api/admin/reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load reports');
      }
      
      const data = await response.json();
      setReports(data.data);
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Raporlar yüklenirken bir hata oluştu',
        type: 'error'
      } as any);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Zamanlanmış raporları yükle
  const loadScheduledReports = async () => {
    setIsLoading(true);
    try {
      // localStorage'dan token'ı al
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        toast({
          title: 'Hata',
          description: 'Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.',
          type: 'error'
        } as any);
        setIsLoading(false);
        return;
      }
      
      const response = await fetch('/api/admin/reports/scheduled', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load scheduled reports');
      }
      
      const data = await response.json();
      setScheduledReports(data.data);
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Zamanlanmış raporlar yüklenirken bir hata oluştu',
        type: 'error'
      } as any);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sayfa yüklendiğinde raporları getir
  useEffect(() => {
    if (activeTab === 'reports') {
      loadReports();
    } else if (activeTab === 'scheduled') {
      loadScheduledReports();
    }
  }, [activeTab]);
  
  // Rapor indirme işlemi
  const downloadReport = async (reportId: string) => {
    try {
      window.open(`/api/admin/reports/download/${reportId}`, '_blank');
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Rapor indirilirken bir hata oluştu',
        type: 'error'
      } as any);
    }
  };
  
  // Rapor silme işlemi
  const deleteReport = async (reportId: string) => {
    if (!confirm('Bu raporu silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/reports?id=${reportId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete report');
      }
      
      toast({
        title: 'Başarılı',
        description: 'Rapor başarıyla silindi',
        type: 'success'
      } as any);
      
      // Tabloyu güncelle
      loadReports();
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Rapor silinirken bir hata oluştu',
        type: 'error'
      } as any);
    }
  };
  
  // Zamanlanmış rapor silme işlemi
  const deleteScheduledReport = async (reportId: string) => {
    if (!confirm('Bu zamanlanmış raporu silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/reports/scheduled?id=${reportId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete scheduled report');
      }
      
      toast({
        title: 'Başarılı',
        description: 'Zamanlanmış rapor başarıyla silindi',
        type: 'success'
      } as any);
      
      // Tabloyu güncelle
      loadScheduledReports();
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Zamanlanmış rapor silinirken bir hata oluştu',
        type: 'error'
      } as any);
    }
  };
  
  // Zamanlanmış rapor durumunu değiştir
  const toggleScheduledReportStatus = async (reportId: string, isEnabled: boolean) => {
    try {
      const response = await fetch('/api/admin/reports/scheduled', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: reportId,
          isEnabled: !isEnabled,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update scheduled report status');
      }
      
      toast({
        title: 'Başarılı',
        description: `Zamanlanmış rapor ${!isEnabled ? 'etkinleştirildi' : 'devre dışı bırakıldı'}`,
        type: 'success'
      } as any);
      
      // Tabloyu güncelle
      loadScheduledReports();
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Zamanlanmış rapor durumu güncellenirken bir hata oluştu',
        type: 'error'
      } as any);
    }
  };
  
  // Zamanlanmış raporları hemen çalıştır
  const runScheduledReportsNow = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/reports/scheduled/run', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to run scheduled reports');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Başarılı',
        description: `${data.reportsRun} zamanlanmış rapor işlendi. ${data.successCount} başarılı, ${data.errorCount} hatalı.`,
        type: 'success'
      } as any);
      
      // Tabloyu güncelle
      loadScheduledReports();
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Zamanlanmış raporlar çalıştırılırken bir hata oluştu',
        type: 'error'
      } as any);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Tablo sütunları - Raporlar
  const reportColumns: ColumnDef<Report>[] = [
    {
      accessorKey: 'title',
      header: 'Rapor Adı',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileIcon size={16} className="text-muted-foreground" />
          <span className="font-medium">{row.getValue('title')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'dataSource',
      header: 'Veri Kaynağı',
      cell: ({ row }) => {
        const dataSource = row.getValue('dataSource') as string;
        const dataSourceMap: Record<string, string> = {
          orders: 'Siparişler',
          couriers: 'Kuryeler',
          businesses: 'İşletmeler',
          customers: 'Müşteriler',
          deliveries: 'Teslimatlar',
        };
        
        return <span>{dataSourceMap[dataSource] || dataSource}</span>;
      },
    },
    {
      accessorKey: 'format',
      header: 'Format',
      cell: ({ row }) => {
        const format = row.getValue('format') as string;
        const formatColors: Record<string, string> = {
          excel: 'bg-green-100 text-green-800',
          pdf: 'bg-red-100 text-red-800',
          csv: 'bg-blue-100 text-blue-800',
        };
        
        return (
          <Badge className={formatColors[format] || ''}>
            {format.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Oluşturulma Tarihi',
      cell: ({ row }) => {
        const createdAt = new Date(row.getValue('createdAt'));
        return (
          <div className="flex flex-col">
            <span>{createdAt.toLocaleDateString('tr-TR')}</span>
            <span className="text-xs text-muted-foreground">
              {createdAt.toLocaleTimeString('tr-TR')}
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'İşlemler',
      cell: ({ row }) => {
        const report = row.original;
        return (
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => downloadReport(report.id)}
              title="İndir"
            >
              <DownloadIcon size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => deleteReport(report.id)}
              title="Sil"
            >
              <Trash2 size={16} className="text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ];
  
  // Tablo sütunları - Zamanlanmış Raporlar
  const scheduledReportColumns: ColumnDef<ScheduledReport>[] = [
    {
      accessorKey: 'title',
      header: 'Rapor Adı',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ClockIcon size={16} className="text-muted-foreground" />
          <span className="font-medium">{row.getValue('title')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'frequency',
      header: 'Sıklık',
      cell: ({ row }) => {
        const frequency = row.getValue('frequency') as string;
        const frequencyMap: Record<string, string> = {
          daily: 'Günlük',
          weekly: 'Haftalık',
          monthly: 'Aylık',
        };
        
        return <span>{frequencyMap[frequency] || frequency}</span>;
      },
    },
    {
      accessorKey: 'nextRunAt',
      header: 'Sonraki Çalışma',
      cell: ({ row }) => {
        const nextRunAt = new Date(row.getValue('nextRunAt'));
        const now = new Date();
        
        return (
          <div className="flex flex-col">
            <span>{nextRunAt.toLocaleDateString('tr-TR')}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistance(nextRunAt, now, { addSuffix: true, locale: tr })}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'lastRunStatus',
      header: 'Son Durum',
      cell: ({ row }) => {
        const status = row.getValue('lastRunStatus') as string;
        const lastRunAt = row.original.lastRunAt 
          ? new Date(row.original.lastRunAt) 
          : null;
        
        if (!status) {
          return <span className="text-muted-foreground">Henüz çalıştırılmadı</span>;
        }
        
        return (
          <div className="flex items-center gap-2">
            {status === 'SUCCESS' ? (
              <CheckCircle size={16} className="text-green-500" />
            ) : (
              <XCircle size={16} className="text-red-500" />
            )}
            <span>
              {status === 'SUCCESS' ? 'Başarılı' : 'Hata'}
              {lastRunAt && (
                <span className="text-xs block text-muted-foreground">
                  {lastRunAt.toLocaleDateString('tr-TR')} {lastRunAt.toLocaleTimeString('tr-TR')}
                </span>
              )}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'isEnabled',
      header: 'Durum',
      cell: ({ row }) => {
        const isEnabled = row.getValue('isEnabled') as boolean;
        
        return (
          <Badge className={isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {isEnabled ? 'Aktif' : 'Pasif'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'İşlemler',
      cell: ({ row }) => {
        const report = row.original;
        return (
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => toggleScheduledReportStatus(report.id, report.isEnabled)}
              title={report.isEnabled ? 'Devre Dışı Bırak' : 'Etkinleştir'}
            >
              {report.isEnabled ? (
                <XCircle size={16} className="text-destructive" />
              ) : (
                <CheckCircle size={16} className="text-green-500" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => deleteScheduledReport(report.id)}
              title="Sil"
            >
              <Trash2 size={16} className="text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ];
  
  return (
    <div className="container py-6">
      <AdminPageHeader
        title="Raporlar"
        description="Raporlar oluşturun, zamanlanmış raporlar yönetin ve mevcut raporlara erişin."
      />
      
      <Tabs 
        defaultValue="generate" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="mt-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Rapor Oluştur</TabsTrigger>
          <TabsTrigger value="reports">Raporlar</TabsTrigger>
          <TabsTrigger value="scheduled">Zamanlanmış Raporlar</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate" className="mt-6">
          <ReportGenerator
            onGenerate={async () => {
              toast({
                title: 'Başarılı',
                description: 'Rapor başarıyla oluşturuldu.',
                type: 'success'
              } as any);
              // Tabloyu güncelle
              loadReports();
              return Promise.resolve();
            }}
          />
        </TabsContent>
        
        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Raporlar</CardTitle>
              <CardDescription>
                Oluşturulmuş tüm raporları görüntüleyin ve indirin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rapor Adı</TableHead>
                    <TableHead>Veri Kaynağı</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Oluşturulma Tarihi</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5}>Yükleniyor...</TableCell>
                    </TableRow>
                  ) : reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>Henüz oluşturulmuş rapor bulunmuyor.</TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report: Report) => (
                      <TableRow key={report.id}>
                        <TableCell>{report.title}</TableCell>
                        <TableCell>{report.dataSource}</TableCell>
                        <TableCell>{report.format}</TableCell>
                        <TableCell>{new Date(report.createdAt).toLocaleString('tr-TR')}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => downloadReport(report.id)}
                              title="İndir"
                            >
                              <DownloadIcon size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => deleteReport(report.id)}
                              title="Sil"
                            >
                              <Trash2 size={16} className="text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="scheduled" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Zamanlanmış Raporlar</CardTitle>
                <CardDescription>
                  Otomatik olarak çalışacak zamanlanmış raporları yönetin.
                </CardDescription>
              </div>
              <Button
                onClick={runScheduledReportsNow}
                disabled={isLoading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Şimdi Çalıştır
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rapor Adı</TableHead>
                    <TableHead>Sıklık</TableHead>
                    <TableHead>Sonraki Çalışma</TableHead>
                    <TableHead>Son Durum</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6}>Yükleniyor...</TableCell>
                    </TableRow>
                  ) : scheduledReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>Henüz zamanlanmış rapor bulunmuyor.</TableCell>
                    </TableRow>
                  ) : (
                    scheduledReports.map((report: ScheduledReport) => (
                      <TableRow key={report.id}>
                        <TableCell>{report.title}</TableCell>
                        <TableCell>{report.frequency}</TableCell>
                        <TableCell>{new Date(report.nextRunAt).toLocaleString('tr-TR')}</TableCell>
                        <TableCell>{report.lastRunStatus ? report.lastRunStatus : 'Henüz çalıştırılmadı'}</TableCell>
                        <TableCell>{report.isEnabled ? 'Aktif' : 'Pasif'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => toggleScheduledReportStatus(report.id, report.isEnabled)}
                              title={report.isEnabled ? 'Devre Dışı Bırak' : 'Etkinleştir'}
                            >
                              {report.isEnabled ? (
                                <XCircle size={16} className="text-destructive" />
                              ) : (
                                <CheckCircle size={16} className="text-green-500" />
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => deleteScheduledReport(report.id)}
                              title="Sil"
                            >
                              <Trash2 size={16} className="text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 