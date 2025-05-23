"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { AlertCircle, FileSpreadsheet, FilePdf, FileText, Check, X, Save, ChevronDownIcon, ChevronRightIcon, DownloadIcon, FilePlus, Clock, MailIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/app/components/ui/use-toast';

// Rapor veri kaynakları
const DATA_SOURCES = [
  { id: 'orders', label: 'Siparişler' },
  { id: 'couriers', label: 'Kuryeler' },
  { id: 'businesses', label: 'İşletmeler' },
  { id: 'customers', label: 'Müşteriler' },
  { id: 'deliveries', label: 'Teslimatlar' },
];

// Rapor formatları
const REPORT_FORMATS = [
  { id: 'excel', label: 'Excel (.xlsx)', icon: FileSpreadsheet },
  { id: 'pdf', label: 'PDF (.pdf)', icon: FilePlus },
  { id: 'csv', label: 'CSV (.csv)', icon: FileSpreadsheet },
];

// Rapor sütunları (veri kaynağına göre)
const REPORT_COLUMNS = {
  orders: [
    { id: 'id', label: 'Sipariş ID' },
    { id: 'createdAt', label: 'Sipariş Tarihi' },
    { id: 'status', label: 'Durum' },
    { id: 'total', label: 'Toplam Tutar' },
    { id: 'items', label: 'Ürün Sayısı' },
    { id: 'customer', label: 'Müşteri' },
    { id: 'business', label: 'İşletme' },
    { id: 'courier', label: 'Kurye' },
    { id: 'deliveryAddress', label: 'Teslimat Adresi' },
    { id: 'deliveryTime', label: 'Teslimat Süresi' },
    { id: 'paymentMethod', label: 'Ödeme Yöntemi' },
  ],
  couriers: [
    { id: 'id', label: 'Kurye ID' },
    { id: 'name', label: 'Ad Soyad' },
    { id: 'email', label: 'E-posta' },
    { id: 'phone', label: 'Telefon' },
    { id: 'region', label: 'Bölge' },
    { id: 'deliveryCount', label: 'Teslimat Sayısı' },
    { id: 'avgDeliveryTime', label: 'Ortalama Teslimat Süresi' },
    { id: 'rating', label: 'Puanlama' },
    { id: 'earnings', label: 'Kazanç' },
    { id: 'status', label: 'Durum' },
  ],
  businesses: [
    { id: 'id', label: 'İşletme ID' },
    { id: 'name', label: 'İşletme Adı' },
    { id: 'category', label: 'Kategori' },
    { id: 'address', label: 'Adres' },
    { id: 'phone', label: 'Telefon' },
    { id: 'email', label: 'E-posta' },
    { id: 'orderCount', label: 'Sipariş Sayısı' },
    { id: 'revenue', label: 'Ciro' },
    { id: 'rating', label: 'Puanlama' },
    { id: 'createdAt', label: 'Kayıt Tarihi' },
  ],
  customers: [
    { id: 'id', label: 'Müşteri ID' },
    { id: 'name', label: 'Ad Soyad' },
    { id: 'email', label: 'E-posta' },
    { id: 'phone', label: 'Telefon' },
    { id: 'address', label: 'Adres' },
    { id: 'orderCount', label: 'Sipariş Sayısı' },
    { id: 'totalSpent', label: 'Toplam Harcama' },
    { id: 'createdAt', label: 'Kayıt Tarihi' },
    { id: 'lastOrderAt', label: 'Son Sipariş Tarihi' },
  ],
  deliveries: [
    { id: 'id', label: 'Teslimat ID' },
    { id: 'orderId', label: 'Sipariş ID' },
    { id: 'courierId', label: 'Kurye ID' },
    { id: 'startTime', label: 'Başlangıç Zamanı' },
    { id: 'endTime', label: 'Bitiş Zamanı' },
    { id: 'duration', label: 'Süre' },
    { id: 'distance', label: 'Mesafe' },
    { id: 'status', label: 'Durum' },
    { id: 'customerRating', label: 'Müşteri Puanı' },
    { id: 'businessRating', label: 'İşletme Puanı' },
  ],
};

interface ReportGeneratorProps {
  defaultDataSource?: string;
  defaultFormat?: string;
  onReportGenerated?: (reportId: string) => void;
}

export function ReportGenerator({ 
  defaultDataSource = 'orders',
  defaultFormat = 'excel',
  onReportGenerated
}: ReportGeneratorProps) {
  // State yönetimi
  const [dataSource, setDataSource] = useState(defaultDataSource);
  const [format, setFormat] = useState(defaultFormat);
  const [reportTitle, setReportTitle] = useState('');
  const [startDate, setStartDate] = useState<Date>(addDays(new Date(), -30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [includeTotals, setIncludeTotals] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduleEmail, setScheduleEmail] = useState(false);
  const [emailFrequency, setEmailFrequency] = useState('never');
  const [generatedReportId, setGeneratedReportId] = useState<string | null>(null);
  
  const router = useRouter();
  
  // Veri kaynağı değiştiğinde sütunları sıfırla
  useEffect(() => {
    // Veri kaynağı için varsayılan sütunları seç
    if (REPORT_COLUMNS[dataSource]) {
      setSelectedColumns(REPORT_COLUMNS[dataSource].map(col => col.id));
    } else {
      setSelectedColumns([]);
    }
    
    // Filtreleri sıfırla
    setFilters({});
  }, [dataSource]);
  
  // Rapor başlığı oluştur
  useEffect(() => {
    const sourceName = DATA_SOURCES.find(s => s.id === dataSource)?.label || 'Rapor';
    const dateStr = format(new Date(), 'dd MMMM yyyy', { locale: tr });
    setReportTitle(`${sourceName} Raporu - ${dateStr}`);
  }, [dataSource]);
  
  // Sütun seçimini toggle
  const toggleColumn = (columnId: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };
  
  // Filtre değerini güncelle
  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Raporu oluştur
  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: reportTitle,
          dataSource,
          format,
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          columns: selectedColumns,
          filters,
          options: {
            includeTotals,
            includeCharts,
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error('Rapor oluşturulurken bir hata oluştu');
      }
      
      const data = await response.json();
      
      toast({ title: 'Başarılı', description: 'Rapor başarıyla oluşturuldu' });
      setGeneratedReportId(data.reportId);
      
      if (onReportGenerated) {
        onReportGenerated(data.reportId);
      }
      
      return data.reportId;
    } catch (error) {
      toast({ title: 'Hata', description: 'Rapor oluşturulurken bir hata oluştu' });
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Raporu indir
  const downloadReport = async () => {
    const reportId = await generateReport();
    if (!reportId) return;
    
    try {
      const response = await fetch(`/api/admin/reports/download/${reportId}`);
      
      if (!response.ok) {
        throw new Error('Rapor indirilemedi');
      }
      
      // Dosyayı indir
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${reportTitle}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: 'Başarılı', description: 'Rapor indiriliyor' });
    } catch (error) {
      toast({ title: 'Hata', description: 'Rapor indirilirken bir hata oluştu' });
      console.error(error);
    }
  };
  
  // Zamanlanmış rapor olarak kaydet
  const saveAsScheduled = async () => {
    if (!scheduleEmail || emailFrequency === 'never') {
      toast({ title: 'Hata', description: 'Lütfen bir gönderim sıklığı seçin' });
      return;
    }
    
    try {
      const reportId = await generateReport();
      if (!reportId) return;
      
      const response = await fetch('/api/admin/reports/scheduled', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          title: reportTitle,
          frequency: emailFrequency,
          recipients: [], // TODO: Alıcıları seçme ekranı eklenebilir
          nextRunAt: new Date().toISOString(),
          isEnabled: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Zamanlanmış rapor kaydedilemedi');
      }
      
      toast({ title: 'Başarılı', description: 'Zamanlanmış rapor başarıyla kaydedildi' });
    } catch (error) {
      toast({ title: 'Hata', description: 'Zamanlanmış rapor kaydedilirken bir hata oluştu' });
      console.error(error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Rapor Oluştur</CardTitle>
        <CardDescription>
          Veri kaynağını, formatı ve filtreleri seçerek özelleştirilmiş raporlar oluşturun.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="source" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="source">Veri Kaynağı</TabsTrigger>
            <TabsTrigger value="columns">Sütunlar</TabsTrigger>
            <TabsTrigger value="filters">Filtreler</TabsTrigger>
          </TabsList>
          
          {/* 1. Veri Kaynağı Sekmesi */}
          <TabsContent value="source" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="report-title">Rapor Başlığı</Label>
                <Input
                  id="report-title"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Rapor başlığı girin"
                />
              </div>
              
              <div>
                <Label htmlFor="data-source">Veri Kaynağı</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {DATA_SOURCES.map((source) => (
                    <div
                      key={source.id}
                      className={`border rounded-md p-3 cursor-pointer ${
                        dataSource === source.id 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:border-gray-400'
                      }`}
                      onClick={() => setDataSource(source.id)}
                    >
                      <div className="font-medium">{source.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="format">Rapor Formatı</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {REPORT_FORMATS.map((reportFormat) => {
                    const Icon = reportFormat.icon;
                    return (
                      <div
                        key={reportFormat.id}
                        className={`border rounded-md p-3 cursor-pointer flex items-center gap-2 ${
                          format === reportFormat.id 
                            ? 'bg-primary/10 border-primary' 
                            : 'hover:border-gray-400'
                        }`}
                        onClick={() => setFormat(reportFormat.id)}
                      >
                        <Icon className="h-4 w-4" />
                        <div className="font-medium">{reportFormat.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Başlangıç Tarihi</Label>
                  <DatePicker
                    date={startDate}
                    setDate={setStartDate}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label>Bitiş Tarihi</Label>
                  <DatePicker
                    date={endDate}
                    setDate={setEndDate}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-totals"
                    checked={includeTotals}
                    onCheckedChange={(checked) => setIncludeTotals(checked === true)}
                  />
                  <Label htmlFor="include-totals">Toplamları dahil et</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-charts"
                    checked={includeCharts}
                    onCheckedChange={(checked) => setIncludeCharts(checked === true)}
                  />
                  <Label htmlFor="include-charts">Grafikleri dahil et</Label>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* 2. Sütunlar Sekmesi */}
          <TabsContent value="columns" className="space-y-4">
            <div className="flex justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                {selectedColumns.length} / {REPORT_COLUMNS[dataSource as keyof typeof REPORT_COLUMNS].length} sütun seçildi
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedColumns([])}
                >
                  Temizle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedColumns(REPORT_COLUMNS[dataSource as keyof typeof REPORT_COLUMNS].map(c => c.id))}
                >
                  Tümünü Seç
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {REPORT_COLUMNS[dataSource as keyof typeof REPORT_COLUMNS].map((column) => (
                <div key={column.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`column-${column.id}`}
                    checked={selectedColumns.includes(column.id)}
                    onCheckedChange={() => toggleColumn(column.id)}
                  />
                  <Label htmlFor={`column-${column.id}`}>{column.label}</Label>
                </div>
              ))}
            </div>
          </TabsContent>
          
          {/* 3. Filtreler Sekmesi */}
          <TabsContent value="filters" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              {dataSource === 'orders' && (
                <AccordionItem value="order-status">
                  <AccordionTrigger>Sipariş Durumu</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-2">
                      {['PENDING', 'PROCESSING', 'PREPARING', 'READY', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'].map(status => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox
                            id={`status-${status}`}
                            checked={filters.status === status}
                            onCheckedChange={(checked) => {
                              if (checked) updateFilter('status', status);
                              else {
                                const { status, ...rest } = filters;
                                setFilters(rest);
                              }
                            }}
                          />
                          <Label htmlFor={`status-${status}`}>{status}</Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {(dataSource === 'businesses' || dataSource === 'orders') && (
                <AccordionItem value="business-type">
                  <AccordionTrigger>İşletme Türü</AccordionTrigger>
                  <AccordionContent>
                    <Select
                      value={filters.businessType || ''}
                      onValueChange={(value) => updateFilter('businessType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="İşletme türü seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tümü</SelectItem>
                        <SelectItem value="RESTAURANT">Restoran</SelectItem>
                        <SelectItem value="CAFE">Kafe</SelectItem>
                        <SelectItem value="MARKET">Market</SelectItem>
                        <SelectItem value="PHARMACY">Eczane</SelectItem>
                        <SelectItem value="OTHER">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              <AccordionItem value="custom-filters">
                <AccordionTrigger>Özel Filtreler</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="min-price">Minimum Tutar</Label>
                      <Input
                        id="min-price"
                        type="number"
                        value={filters.minPrice || ''}
                        onChange={(e) => updateFilter('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-price">Maksimum Tutar</Label>
                      <Input
                        id="max-price"
                        type="number"
                        value={filters.maxPrice || ''}
                        onChange={(e) => updateFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="1000.00"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 border-t pt-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="scheduleEmail" 
              checked={scheduleEmail} 
              onCheckedChange={setScheduleEmail}
            />
            <Label htmlFor="scheduleEmail">Zamanlanmış rapor olarak e-posta ile gönder</Label>
          </div>
          
          {scheduleEmail && (
            <div className="mt-4 pl-6">
              <Label>Gönderim Sıklığı</Label>
              <Select 
                value={emailFrequency} 
                onValueChange={setEmailFrequency}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Gönderim sıklığı seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Seçiniz</SelectItem>
                  <SelectItem value="daily">Günlük</SelectItem>
                  <SelectItem value="weekly">Haftalık</SelectItem>
                  <SelectItem value="monthly">Aylık</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          İptal
        </Button>
        
        <div className="flex space-x-2">
          {scheduleEmail && (
            <Button 
              variant="outline" 
              onClick={saveAsScheduled}
              disabled={isGenerating || emailFrequency === 'never'}
            >
              <MailIcon className="mr-2 h-4 w-4" />
              Zamanlanmış Olarak Kaydet
            </Button>
          )}
          
          <Button 
            onClick={downloadReport}
            disabled={isGenerating || selectedColumns.length === 0}
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            Raporu İndir
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
} 