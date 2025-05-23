"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { Download, RefreshCw, CreditCard, TrendingDown, Wallet, DollarSign } from 'lucide-react';

interface ChartDataItem {
  date: string;
  revenue: number;
  refunds: number;
  net: number;
}

interface FinancialSummary {
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  totalRevenue: number;
  totalRefunds: number;
  totalCancellationFees: number;
  netRevenue: number;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const FinancialDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Finans verilerini yükle
  const loadFinancialData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Query parametrelerini oluştur
      const params: Record<string, string> = { period };
      if (dateRange.from) params.startDate = dateRange.from.toISOString();
      if (dateRange.to) params.endDate = dateRange.to.toISOString();

      // API isteği
      const response = await axios.get('/api/business/finance/report', { params });
      const { report } = response.data;

      // Verileri güncelle
      setChartData(report.chartData);
      setSummary(report.summary);
    } catch (err: any) {
      console.error('Finansal veriler yüklenirken hata:', err);
      setError(err.response?.data?.error || 'Finansal veriler yüklenirken bir hata oluştu');
      toast.error('Finansal veriler yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Sayfa yüklendiğinde verileri yükle
  useEffect(() => {
    loadFinancialData();
  }, []);

  // Tarih aralığı veya periyot değiştiğinde verileri yeniden yükle
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      loadFinancialData();
    }
  }, [dateRange, period]);

  // Para birimini formatla
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Tarihi formatla
  const formatDate = (dateStr: string): string => {
    return format(new Date(dateStr), 'd MMM', { locale: tr });
  };

  const handleRefresh = () => {
    loadFinancialData();
    toast.success('Veriler yenilendi');
  };

  const handleExport = () => {
    // Excel veya PDF dosyası olarak dışa aktarma fonksiyonu
    toast.success('Rapor indiriliyor...');
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Finansal Rapor</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRefresh}>Yeniden Dene</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtreler */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Tarih aralığı seçin"
            className="w-full max-w-[340px]"
          />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full max-w-[250px]">
              <SelectValue placeholder="Periyot seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Günlük</SelectItem>
              <SelectItem value="week">Haftalık</SelectItem>
              <SelectItem value="month">Aylık</SelectItem>
              <SelectItem value="year">Yıllık</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 self-end md:self-auto">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Raporu İndir
          </Button>
        </div>
      </div>

      {/* Finansal Özet Kartları */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Toplam Gelir</CardDescription>
              <CardTitle className="text-2xl flex items-center">
                <DollarSign className="h-5 w-5 mr-1 text-green-500" />
                {formatCurrency(summary.totalRevenue)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {summary.deliveredOrders} başarılı sipariş
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Toplam İade</CardDescription>
              <CardTitle className="text-2xl flex items-center">
                <TrendingDown className="h-5 w-5 mr-1 text-red-500" />
                {formatCurrency(summary.totalRefunds)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {summary.refundedOrders} iade işlemi
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>İptal Ücretleri</CardDescription>
              <CardTitle className="text-2xl flex items-center">
                <CreditCard className="h-5 w-5 mr-1 text-blue-500" />
                {formatCurrency(summary.totalCancellationFees)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {summary.cancelledOrders} iptal edilmiş sipariş
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Net Gelir</CardDescription>
              <CardTitle className="text-2xl flex items-center">
                <Wallet className="h-5 w-5 mr-1 text-purple-500" />
                {formatCurrency(summary.netRevenue)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Toplam {summary.totalOrders} sipariş
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Finansal Grafik */}
      <Card>
        <CardHeader>
          <CardTitle>Gelir Analizi</CardTitle>
          <CardDescription>
            Gelir, iade ve net kazanç değerlerinin karşılaştırmalı grafiği
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-80">
              <p className="text-muted-foreground">Veriler yükleniyor...</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex justify-center items-center h-80">
              <p className="text-muted-foreground">Bu tarih aralığında veri bulunamadı</p>
            </div>
          ) : (
            <Tabs defaultValue="bar">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="bar">Çubuk Grafik</TabsTrigger>
                  <TabsTrigger value="line">Çizgi Grafik</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="bar" className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDate} />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="revenue" name="Gelir" fill="#22c55e" />
                    <Bar dataKey="refunds" name="İadeler" fill="#ef4444" />
                    <Bar dataKey="net" name="Net Kazanç" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="line" className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDate} />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="net" name="Net Kazanç" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialDashboard; 