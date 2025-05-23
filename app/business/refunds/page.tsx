import React from 'react';
import { Metadata } from 'next';
import Header from '@/app/components/common/Header';
import RefundRequestList from '@/app/components/business/refunds/RefundRequestList';
import CancellationRequestList from '@/app/components/business/refunds/CancellationRequestList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: 'İade ve İptal Talepleri | Sepet İşletme Paneli',
  description: 'Müşterilerinizden gelen iade ve iptal taleplerini yönetin'
};

const RefundsPage = () => {
  return (
    <div className="container py-8 space-y-6">
      <Header 
        title="İade ve İptal Talepleri" 
        subtitle="Müşterilerinizden gelen talepleri değerlendirin ve yanıtlayın"
      />
      
      <Tabs defaultValue="refunds" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="refunds">İade Talepleri</TabsTrigger>
          <TabsTrigger value="cancellations">İptal Talepleri</TabsTrigger>
        </TabsList>
        
        <TabsContent value="refunds">
          <RefundRequestList />
        </TabsContent>
        
        <TabsContent value="cancellations">
          <CancellationRequestList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RefundsPage; 