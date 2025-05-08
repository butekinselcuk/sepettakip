'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { BarChart, PieChart, LineChart } from '@/components/charts';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('performance');
  const [dateRange, setDateRange] = useState({ from: new Date(), to: new Date() });
  const [exportFormat, setExportFormat] = useState('pdf');

  const handleExport = () => {
    console.log(`Exporting ${reportType} report in ${exportFormat} format`);
    // API call to export report
  };

  const handleSchedule = () => {
    console.log(`Scheduling ${reportType} report`);
    // Navigate to schedule page
    window.location.href = '/reports/scheduled';
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Raporlama Merkezi</h1>
      
      <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Toplam Teslimat</CardTitle>
            <CardDescription>Son 30 gün</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">1,248</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Başarılı Teslimatlar</CardTitle>
            <CardDescription>Son 30 gün</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-500">1,189</div>
            <div className="text-sm text-green-500">%95.3 başarı oranı</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Ortalama Teslimat Süresi</CardTitle>
            <CardDescription>Son 30 gün</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">24 dk</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 mb-8 grid-cols-1 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Rapor Ayarları</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Rapor Türü</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Rapor türü seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="performance">Performans Raporu</SelectItem>
                      <SelectItem value="courier">Kurye Raporu</SelectItem>
                      <SelectItem value="zone">Bölge Raporu</SelectItem>
                      <SelectItem value="custom">Özel Rapor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Başlangıç Tarihi</label>
                  <DatePicker 
                    date={dateRange.from} 
                    setDate={(date) => setDateRange({...dateRange, from: date})} 
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Bitiş Tarihi</label>
                  <DatePicker 
                    date={dateRange.to} 
                    setDate={(date) => setDateRange({...dateRange, to: date})} 
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Dışa Aktarma Formatı</label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Format seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button className="w-full" onClick={handleExport}>Raporu Dışa Aktar</Button>
              <Button className="w-full" variant="outline" onClick={handleSchedule}>Raporu Planla</Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="lg:col-span-3">
          <Tabs defaultValue="performance">
            <TabsList className="mb-4">
              <TabsTrigger value="performance">Performans</TabsTrigger>
              <TabsTrigger value="courier">Kurye</TabsTrigger>
              <TabsTrigger value="zone">Bölge</TabsTrigger>
              <TabsTrigger value="trend">Trend</TabsTrigger>
            </TabsList>
            
            <TabsContent value="performance">
              <Card>
                <CardHeader>
                  <CardTitle>Performans Metrikleri</CardTitle>
                  <CardDescription>Son 30 günün teslimat performansı</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <BarChart
                      data={[
                        { name: 'Paz', değer: 120 },
                        { name: 'Pzt', değer: 85 },
                        { name: 'Sal', değer: 92 },
                        { name: 'Çar', değer: 105 },
                        { name: 'Per', değer: 115 },
                        { name: 'Cum', değer: 135 },
                        { name: 'Cmt', değer: 145 },
                      ]}
                      xKey="name"
                      yKey="değer"
                      title="Günlük Teslimat Sayısı"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="courier">
              <Card>
                <CardHeader>
                  <CardTitle>Kurye Performansı</CardTitle>
                  <CardDescription>En iyi performans gösteren kuryeler</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <BarChart
                      data={[
                        { name: 'Ahmet K.', değer: 97 },
                        { name: 'Mehmet Y.', değer: 96 },
                        { name: 'Ayşe D.', değer: 94 },
                        { name: 'Mustafa B.', değer: 92 },
                        { name: 'Zeynep A.', değer: 90 },
                      ]}
                      xKey="name"
                      yKey="değer"
                      title="Kurye Performans Puanı"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="zone">
              <Card>
                <CardHeader>
                  <CardTitle>Bölge Dağılımı</CardTitle>
                  <CardDescription>Teslimatların bölgelere göre dağılımı</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <PieChart
                      data={[
                        { name: 'Kadıköy', değer: 35 },
                        { name: 'Beşiktaş', değer: 25 },
                        { name: 'Şişli', değer: 20 },
                        { name: 'Beyoğlu', değer: 15 },
                        { name: 'Diğer', değer: 5 },
                      ]}
                      nameKey="name"
                      valueKey="değer"
                      title="Teslimat Bölge Dağılımı"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="trend">
              <Card>
                <CardHeader>
                  <CardTitle>Teslimat Trendleri</CardTitle>
                  <CardDescription>Aylık teslimat trendleri</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <LineChart
                      data={[
                        { ay: 'Oca', değer: 940 },
                        { ay: 'Şub', değer: 1020 },
                        { ay: 'Mar', değer: 1080 },
                        { ay: 'Nis', değer: 1125 },
                        { ay: 'May', değer: 1248 },
                      ]}
                      xKey="ay"
                      yKey="değer"
                      title="Aylık Teslimat Sayısı"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Şablon Raporlar</CardTitle>
            <CardDescription>Hazır rapor şablonları</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center" onClick={() => window.location.href = '/reports/templates'}>
                <span className="text-lg mb-2">Günlük Performans</span>
                <span className="text-sm text-muted-foreground">Günlük teslimat performansı</span>
              </Button>
              
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center" onClick={() => window.location.href = '/reports/templates'}>
                <span className="text-lg mb-2">Haftalık Özet</span>
                <span className="text-sm text-muted-foreground">Haftalık teslimat özeti</span>
              </Button>
              
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center" onClick={() => window.location.href = '/reports/templates'}>
                <span className="text-lg mb-2">Kurye Analizi</span>
                <span className="text-sm text-muted-foreground">Detaylı kurye performans analizi</span>
              </Button>
              
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center" onClick={() => window.location.href = '/reports/templates'}>
                <span className="text-lg mb-2">Bölge Raporu</span>
                <span className="text-sm text-muted-foreground">Bölge bazlı teslimat raporu</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Geçici bileşenler (gerçek projelerde ayrı dosyalarda olmalı)
function BarChart({ data, xKey, yKey, title }) {
  return <div className="w-full h-full bg-gray-100 flex items-center justify-center">{title}: Bar Chart Placeholder</div>;
}

function PieChart({ data, nameKey, valueKey, title }) {
  return <div className="w-full h-full bg-gray-100 flex items-center justify-center">{title}: Pie Chart Placeholder</div>;
}

function LineChart({ data, xKey, yKey, title }) {
  return <div className="w-full h-full bg-gray-100 flex items-center justify-center">{title}: Line Chart Placeholder</div>;
}

function DatePicker({ date, setDate }) {
  return (
    <div className="relative">
      <input 
        type="date" 
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={date.toISOString().split('T')[0]}
        onChange={(e) => setDate(new Date(e.target.value))}
      />
    </div>
  );
} 