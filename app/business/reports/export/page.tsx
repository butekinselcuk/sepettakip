"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

type ReportType = 'ORDERS' | 'DELIVERIES' | 'REVENUE' | 'USERS';
type ReportFormat = 'PDF' | 'CSV' | 'EXCEL';

export default function ExportReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Form değerleri
  const [reportType, setReportType] = useState<ReportType>('ORDERS');
  const [reportFormat, setReportFormat] = useState<ReportFormat>('PDF');
  const [region, setRegion] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - (30 * 24 * 60 * 60 * 1000))); // 30 gün önce
  const [endDate, setEndDate] = useState<Date>(new Date()); // bugün
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(true);
  
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
  }, [router]);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      // API'ye gönderilecek veri
      const exportData = {
        type: reportType,
        format: reportFormat,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        filters: {
          region: region || undefined
        },
        options: {
          includeCharts,
          includeSummary,
          includeRawData
        }
      };
      
      // API isteği
      const response = await fetch('/api/business/reports/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exportData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Rapor oluşturulurken bir hata oluştu');
      }
      
      const data = await response.json();
      
      // Başarılı işlem sonrası kullanıcıyı bilgilendir
      toast.success('Rapor dışa aktarma işlemi başlatıldı! Tamamlandığında bildirim alacaksınız.');
      
      // Eğer indirme URL'si hemen döndüyse, kullanıcıya indirme bağlantısı göster
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      } else {
        // İşlem arkaplanda devam ediyorsa raporlar sayfasına yönlendir
        setTimeout(() => {
          router.push('/business/reports');
        }, 2000);
      }
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        toast.error(err.message);
      } else {
        setError('Beklenmeyen bir hata oluştu');
        toast.error('Beklenmeyen bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <div className="flex justify-center items-center h-screen">Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/business/reports')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
          <h1 className="text-2xl font-bold">Rapor Dışa Aktar</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Rapor Dışa Aktarma</CardTitle>
            <CardDescription>
              Dışa aktarmak istediğiniz rapor türünü, zaman aralığını ve formatı seçin.
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleExport}>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="reportType">Rapor Türü</Label>
                  <Select 
                    value={reportType} 
                    onValueChange={(value) => setReportType(value as ReportType)}
                  >
                    <SelectTrigger id="reportType">
                      <SelectValue placeholder="Rapor türü seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ORDERS">Siparişler</SelectItem>
                      <SelectItem value="DELIVERIES">Teslimatlar</SelectItem>
                      <SelectItem value="REVENUE">Gelir Analizi</SelectItem>
                      <SelectItem value="USERS">Müşteri Analizi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reportFormat">Rapor Formatı</Label>
                  <Select 
                    value={reportFormat} 
                    onValueChange={(value) => setReportFormat(value as ReportFormat)}
                  >
                    <SelectTrigger id="reportFormat">
                      <SelectValue placeholder="Format seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="CSV">CSV</SelectItem>
                      <SelectItem value="EXCEL">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'PP', { locale: tr }) : 'Tarih seçin'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">Bitiş Tarihi</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'PP', { locale: tr }) : 'Tarih seçin'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => date && setEndDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="region">Bölge (Opsiyonel)</Label>
                  <Input
                    id="region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Tüm bölgeler"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <Label>Rapor İçeriği</Label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includeCharts" 
                    checked={includeCharts} 
                    onCheckedChange={(checked) => setIncludeCharts(checked === true)}
                  />
                  <label
                    htmlFor="includeCharts"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Grafikler ve Görseller
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includeSummary" 
                    checked={includeSummary} 
                    onCheckedChange={(checked) => setIncludeSummary(checked === true)}
                  />
                  <label
                    htmlFor="includeSummary"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Özet Bilgiler
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includeRawData" 
                    checked={includeRawData} 
                    onCheckedChange={(checked) => setIncludeRawData(checked === true)}
                  />
                  <label
                    htmlFor="includeRawData"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Ham Veri Tablosu
                  </label>
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    İşleniyor...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Raporu Dışa Aktar
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
} 