'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ReportTemplatesPage() {
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: 'Günlük Teslimat Performansı',
      description: 'Günlük teslimat performansı raporu. Teslimat sayıları, başarı oranları ve ortalama sürelerini içerir.',
      category: 'performance',
      previewImage: '/images/reports/daily-performance.png',
    },
    {
      id: 2,
      name: 'Haftalık Teslimat Özeti',
      description: 'Haftalık teslimat özeti raporu. Günlük karşılaştırma, trend ve tahminleri içerir.',
      category: 'summary',
      previewImage: '/images/reports/weekly-summary.png',
    },
    {
      id: 3,
      name: 'Kurye Performans Analizi',
      description: 'Kurye performans değerlendirme raporu. Kurye bazlı detaylı performans metrikleri, karşılaştırma ve önerileri içerir.',
      category: 'courier',
      previewImage: '/images/reports/courier-analysis.png',
    },
    {
      id: 4,
      name: 'Bölge Teslimat Analizi',
      description: 'Bölge bazlı teslimat analizi. Bölgelere göre teslimat sayıları, başarı oranları ve karşılaştırmaları içerir.',
      category: 'zone',
      previewImage: '/images/reports/zone-analysis.png',
    },
    {
      id: 5,
      name: 'Müşteri Memnuniyet Raporu',
      description: 'Müşteri memnuniyeti ve geri bildirim raporu. Memnuniyet skorları, geri bildirim analizi ve iyileştirme önerilerini içerir.',
      category: 'customer',
      previewImage: '/images/reports/customer-satisfaction.png',
    },
    {
      id: 6,
      name: 'Teslimat Süre Optimizasyonu',
      description: 'Teslimat süresi optimizasyon raporu. Teslimat sürelerinin analizi, darboğazlar ve optimizasyon önerilerini içerir.',
      category: 'optimization',
      previewImage: '/images/reports/delivery-time-optimization.png',
    },
    {
      id: 7,
      name: 'Sipariş Kaynak Analizi',
      description: 'Sipariş kaynak analizi raporu. Siparişlerin hangi platformlardan geldiğinin analizi ve trend değerlendirmelerini içerir.',
      category: 'source',
      previewImage: '/images/reports/order-source-analysis.png',
    },
    {
      id: 8,
      name: 'Aylık Mali Özet',
      description: 'Aylık mali özet raporu. Gelir, gider, kâr marjı ve tahminleri içerir.',
      category: 'financial',
      previewImage: '/images/reports/monthly-financial-summary.png',
    },
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const filteredTemplates = activeTab === 'all' 
    ? templates 
    : templates.filter(template => template.category === activeTab);

  const handleUseTemplate = (template) => {
    setSelectedTemplate(template);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Rapor Şablonları</h1>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="all">Tümü</TabsTrigger>
          <TabsTrigger value="performance">Performans</TabsTrigger>
          <TabsTrigger value="summary">Özet</TabsTrigger>
          <TabsTrigger value="courier">Kurye</TabsTrigger>
          <TabsTrigger value="zone">Bölge</TabsTrigger>
          <TabsTrigger value="customer">Müşteri</TabsTrigger>
          <TabsTrigger value="financial">Mali</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTemplates.map((template) => (
              <TemplateCard 
                key={template.id} 
                template={template} 
                onUse={handleUseTemplate} 
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="performance" className="mt-0">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTemplates.map((template) => (
              <TemplateCard 
                key={template.id} 
                template={template} 
                onUse={handleUseTemplate} 
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="summary" className="mt-0">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTemplates.map((template) => (
              <TemplateCard 
                key={template.id} 
                template={template} 
                onUse={handleUseTemplate} 
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="courier" className="mt-0">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTemplates.map((template) => (
              <TemplateCard 
                key={template.id} 
                template={template} 
                onUse={handleUseTemplate} 
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="zone" className="mt-0">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTemplates.map((template) => (
              <TemplateCard 
                key={template.id} 
                template={template} 
                onUse={handleUseTemplate} 
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="customer" className="mt-0">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTemplates.map((template) => (
              <TemplateCard 
                key={template.id} 
                template={template} 
                onUse={handleUseTemplate} 
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="financial" className="mt-0">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTemplates.map((template) => (
              <TemplateCard 
                key={template.id} 
                template={template} 
                onUse={handleUseTemplate} 
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {selectedTemplate && (
        <TemplateDialog 
          template={selectedTemplate} 
          onClose={() => setSelectedTemplate(null)} 
        />
      )}
    </div>
  );
}

function TemplateCard({ template, onUse }) {
  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="aspect-video bg-gray-100 relative">
        <div className="bg-gray-200 w-full h-full flex items-center justify-center text-sm text-gray-500">
          Şablon Önizleme
        </div>
        <div className="absolute top-2 right-2">
          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
            {template.category === 'performance' && 'Performans'}
            {template.category === 'summary' && 'Özet'}
            {template.category === 'courier' && 'Kurye'}
            {template.category === 'zone' && 'Bölge'}
            {template.category === 'customer' && 'Müşteri'}
            {template.category === 'optimization' && 'Optimizasyon'}
            {template.category === 'source' && 'Kaynak'}
            {template.category === 'financial' && 'Mali'}
          </span>
        </div>
      </div>
      <CardHeader>
        <CardTitle>{template.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 line-clamp-2">{template.description}</p>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button className="w-full" onClick={() => onUse(template)}>Şablonu Kullan</Button>
      </CardFooter>
    </Card>
  );
}

function TemplateDialog({ template, onClose }) {
  const [reportName, setReportName] = useState(`${template.name} Raporu`);
  
  const handleGenerate = () => {
    console.log(`Generating report: ${reportName} using template: ${template.id}`);
    // Navigate to report configuration page
    window.location.href = `/reports/export?template=${template.id}&name=${encodeURIComponent(reportName)}`;
  };
  
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <Label htmlFor="reportName">Rapor Adı</Label>
                <Input 
                  id="reportName" 
                  value={reportName} 
                  onChange={(e) => setReportName(e.target.value)} 
                />
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Şablon İçeriği</h3>
                <ScrollArea className="h-[200px] rounded border p-4">
                  <div className="space-y-2">
                    <p className="text-sm">Bu şablon aşağıdaki bölümleri içerir:</p>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Genel performans özeti</li>
                      <li>Teslimat metrikleri ve KPI'lar</li>
                      <li>Bölge bazlı dağılım</li>
                      <li>Kurye performans karşılaştırması</li>
                      <li>Zaman bazlı trend analizi</li>
                      <li>Müşteri memnuniyet skorları</li>
                      <li>İyileştirme önerileri</li>
                    </ul>
                    <p className="text-sm mt-4">Rapor PDF, Excel ve CSV formatlarında dışa aktarılabilir.</p>
                  </div>
                </ScrollArea>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Önizleme</h3>
              <div className="aspect-video bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500">
                Rapor Önizleme
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>İptal</Button>
          <Button onClick={handleGenerate}>Raporu Oluştur</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 