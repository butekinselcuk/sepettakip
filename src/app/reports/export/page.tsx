'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { AlertCircle, FileSpreadsheet, FilePdf, Download, Settings, Mail } from 'lucide-react';

export default function ExportReportPage() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');
  const reportNameParam = searchParams.get('name');
  
  const [reportName, setReportName] = useState(reportNameParam || 'Yeni Rapor');
  const [dateRange, setDateRange] = useState({ from: new Date(), to: new Date() });
  const [exportFormat, setExportFormat] = useState('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeTables, setIncludeTables] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');

  const performExport = () => {
    setIsExporting(true);
    setExportStatus('Rapor hazırlanıyor...');
    
    // Simüle edilmiş dışa aktarma süreci
    setTimeout(() => {
      setExportStatus('Veriler toplanıyor...');
      
      setTimeout(() => {
        setExportStatus('Rapor oluşturuluyor...');
        
        setTimeout(() => {
          setExportStatus('Tamamlandı!');
          setIsExporting(false);
          
          // Gerçek uygulamada burada dosya indirme işlemi yapılır
          console.log(`Dışa aktarıldı: ${reportName}.${exportFormat}`);
          console.log('Seçenekler:', { 
            includeCharts,
            includeTables,
            includeRecommendations,
            emailRecipients: sendEmail ? emailRecipients.split(',').map(e => e.trim()) : []
          });
          
          if (sendEmail && emailRecipients) {
            console.log(`E-posta gönderildi: ${emailRecipients}`);
          }
        }, 1500);
      }, 1500);
    }, 1500);
  };

  useEffect(() => {
    if (templateId) {
      console.log(`Şablon ID: ${templateId} yükleniyor...`);
      // Gerçek uygulamada burada şablon bilgileri API'den alınır
    }
  }, [templateId]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">
        Rapor Dışa Aktarma
        {templateId && <span className="text-lg text-gray-500 ml-2">/ Şablon #{templateId}</span>}
      </h1>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Rapor Yapılandırması</CardTitle>
              <CardDescription>Raporunuzu özelleştirin ve dışa aktarın</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="reportName">Rapor Adı</Label>
                <Input
                  id="reportName"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Başlangıç Tarihi</Label>
                  <Input
                    type="date"
                    value={dateRange.from.toISOString().split('T')[0]}
                    onChange={(e) => setDateRange({ ...dateRange, from: new Date(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Bitiş Tarihi</Label>
                  <Input
                    type="date"
                    value={dateRange.to.toISOString().split('T')[0]}
                    onChange={(e) => setDateRange({ ...dateRange, to: new Date(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label>Dışa Aktarma Formatı</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Format seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Tabs defaultValue="content" className="mt-4">
                <TabsList className="mb-4">
                  <TabsTrigger value="content">İçerik</TabsTrigger>
                  <TabsTrigger value="delivery">Teslimat</TabsTrigger>
                  <TabsTrigger value="advanced">Gelişmiş</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeCharts"
                        checked={includeCharts}
                        onCheckedChange={setIncludeCharts}
                      />
                      <Label
                        htmlFor="includeCharts"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Grafikleri dahil et
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeTables"
                        checked={includeTables}
                        onCheckedChange={setIncludeTables}
                      />
                      <Label
                        htmlFor="includeTables"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Tabloları dahil et
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeRecommendations"
                        checked={includeRecommendations}
                        onCheckedChange={setIncludeRecommendations}
                      />
                      <Label
                        htmlFor="includeRecommendations"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Önerileri dahil et
                      </Label>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="delivery">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sendEmail"
                        checked={sendEmail}
                        onCheckedChange={setSendEmail}
                      />
                      <Label
                        htmlFor="sendEmail"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        E-posta ile gönder
                      </Label>
                    </div>
                    
                    {sendEmail && (
                      <div>
                        <Label htmlFor="emailRecipients">Alıcılar (virgülle ayırın)</Label>
                        <Input
                          id="emailRecipients"
                          value={emailRecipients}
                          onChange={(e) => setEmailRecipients(e.target.value)}
                          placeholder="ornek@mail.com, ornek2@mail.com"
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">Gelişmiş ayarlar, raporunuzun biçimlendirmesini ve veri filtreleme seçeneklerini özelleştirmenize olanak tanır.</p>
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" size="sm" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Filtreleme Seçenekleri
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Tasarım Ayarları
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => window.history.back()}>Geri Dön</Button>
              <Button onClick={performExport} disabled={isExporting}>
                {isExporting ? 'İşleniyor...' : 'Raporu Dışa Aktar'}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Önizleme</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <div className="w-full aspect-[3/4] bg-gray-100 rounded flex items-center justify-center mb-4">
                {exportFormat === 'pdf' && (
                  <FilePdf className="h-16 w-16 text-red-500" />
                )}
                {exportFormat === 'excel' && (
                  <FileSpreadsheet className="h-16 w-16 text-green-500" />
                )}
                {exportFormat === 'csv' && (
                  <FileSpreadsheet className="h-16 w-16 text-blue-500" />
                )}
              </div>
              <div className="text-center">
                <p className="font-medium">{reportName}</p>
                <p className="text-sm text-gray-500">
                  {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              {isExporting ? (
                <div className="w-full">
                  <p className="text-sm text-center mb-2">{exportStatus}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full animate-pulse w-full"></div>
                  </div>
                </div>
              ) : exportStatus === 'Tamamlandı!' ? (
                <Button variant="outline" className="w-full flex items-center justify-center">
                  <Download className="mr-2 h-4 w-4" />
                  İndir: {reportName}.{exportFormat}
                </Button>
              ) : (
                <div className="text-center w-full text-sm text-gray-500">
                  <AlertCircle className="h-4 w-4 mx-auto mb-1" />
                  <p>Rapor henüz oluşturulmadı</p>
                </div>
              )}
              
              {sendEmail && exportStatus === 'Tamamlandı!' && (
                <Button variant="outline" className="w-full mt-2 flex items-center justify-center">
                  <Mail className="mr-2 h-4 w-4" />
                  E-posta ile Gönder
                </Button>
              )}
            </CardFooter>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Hızlı Ayarlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setDateRange({ from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), to: new Date() })}>
                  Son 7 gün
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setDateRange({ from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() })}>
                  Son 30 gün
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => { setIncludeCharts(true); setIncludeTables(true); setIncludeRecommendations(true); }}>
                  Tüm içeriği dahil et
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => { setIncludeCharts(true); setIncludeTables(false); setIncludeRecommendations(false); }}>
                  Sadece grafikler
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 