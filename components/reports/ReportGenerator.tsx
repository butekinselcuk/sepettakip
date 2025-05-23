"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileDown, FileText, Filter, RefreshCw } from 'lucide-react';

interface ReportGeneratorProps {
  reportTypes?: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  onGenerate?: (reportType: string, filters: any) => Promise<void>;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  reportTypes = [
    { id: 'orders', name: 'Sipariş Raporu', description: 'Tüm siparişlerin detaylı raporu' },
    { id: 'customers', name: 'Müşteri Raporu', description: 'Müşteri bazlı analiz raporu' },
    { id: 'finances', name: 'Finans Raporu', description: 'Gelir ve gider raporu' },
    { id: 'couriers', name: 'Kurye Performans Raporu', description: 'Kuryelerin performans raporu' }
  ],
  onGenerate
}) => {
  const [selectedReportType, setSelectedReportType] = useState<string>("");
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [formatType, setFormatType] = useState<string>("excel");

  const handleGenerate = async () => {
    if (!selectedReportType) return;

    setLoading(true);
    try {
      await onGenerate?.(selectedReportType, {
        dateRange,
        format: formatType
      });
    } catch (error) {
      console.error("Rapor oluşturma hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rapor Oluştur</CardTitle>
        <CardDescription>
          Oluşturmak istediğiniz rapor türünü ve parametrelerini seçin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="report-type">Rapor Türü</Label>
          <Select 
            value={selectedReportType} 
            onValueChange={setSelectedReportType}
          >
            <SelectTrigger id="report-type">
              <SelectValue placeholder="Rapor türü seçin" />
            </SelectTrigger>
            <SelectContent>
              {reportTypes.map(type => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedReportType && (
            <p className="text-xs text-muted-foreground">
              {reportTypes.find(t => t.id === selectedReportType)?.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Başlangıç Tarihi</Label>
            <Input 
              id="start-date" 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">Bitiş Tarihi</Label>
            <Input 
              id="end-date" 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="format-type">Dosya Formatı</Label>
          <Select 
            value={formatType} 
            onValueChange={setFormatType}
          >
            <SelectTrigger id="format-type">
              <SelectValue placeholder="Format seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excel">Excel (.xlsx)</SelectItem>
              <SelectItem value="csv">CSV (.csv)</SelectItem>
              <SelectItem value="pdf">PDF (.pdf)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" type="button" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Gelişmiş Filtreler
        </Button>
        <Button 
          onClick={handleGenerate} 
          disabled={!selectedReportType || loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              İşleniyor...
            </>
          ) : (
            <>
              <FileDown className="h-4 w-4" />
              Rapor Oluştur
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}; 