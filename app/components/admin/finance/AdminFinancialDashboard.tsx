"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Building,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface FinancialMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  dailyRevenue: number;
  platformFees: number;
  businessPayouts: number;
  courierPayouts: number;
  averageOrderValue: number;
  revenueChangePercent: number;
  pendingPayouts: number;
  transactionCount: number;
}

const AdminFinancialDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    const fetchFinancialData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/admin/finance/metrics');
        
        if (!response.ok) {
          throw new Error('Finansal veriler yüklenirken hata oluştu.');
        }
        
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        console.error('Finansal veriler yüklenirken hata:', err);
        setError('Veriler yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFinancialData();
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="py-6">
              <div className="h-24 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-red-500">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-gray-500">
            <p>Finansal veri bulunamadı.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Toplam Gelir Kartı */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{metrics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Tüm zamanlar</p>
            <div className="flex items-center pt-1">
              {metrics.revenueChangePercent >= 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">%{metrics.revenueChangePercent}</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-red-500">%{Math.abs(metrics.revenueChangePercent)}</span>
                </>
              )}
              <span className="text-xs text-muted-foreground ml-1">önceki döneme göre</span>
            </div>
          </CardContent>
        </Card>

        {/* Platform Ücretleri Kartı */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Ücretleri</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{metrics.platformFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Platform gelirleri</p>
          </CardContent>
        </Card>

        {/* İşletme Ödemeleri Kartı */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">İşletme Ödemeleri</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{metrics.businessPayouts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">İşletmelere yapılan ödemeler</p>
          </CardContent>
        </Card>

        {/* Ortalama Sipariş Tutarı Kartı */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Sipariş</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{metrics.averageOrderValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Ortalama sipariş tutarı</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Özet</TabsTrigger>
          <TabsTrigger value="businesses">İşletmeler</TabsTrigger>
          <TabsTrigger value="payouts">Ödemeler</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Dönemsel Gelir Özeti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Günlük</h3>
                  <p className="text-xl font-bold">₺{metrics.dailyRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Haftalık</h3>
                  <p className="text-xl font-bold">₺{metrics.weeklyRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Aylık</h3>
                  <p className="text-xl font-bold">₺{metrics.monthlyRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="businesses" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>İşletme Finansal Metrikleri</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">İşletme detaylı finansal metrikleri bu sekmede gösterilecektir.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payouts" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ödeme Durumu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Bekleyen Ödemeler</h3>
                    <p className="text-xl font-bold">₺{metrics.pendingPayouts.toLocaleString()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">İşlem Sayısı</h3>
                    <p className="text-xl font-bold">{metrics.transactionCount}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFinancialDashboard; 