import React from 'react';
import { Metadata } from 'next';
import Header from '@/app/components/common/Header';
import FinancialDashboard from '@/app/components/business/finance/FinancialDashboard';

export const metadata: Metadata = {
  title: 'Finansal Rapor | Sepet İşletme Paneli',
  description: 'Finansal durumunuzu görüntüleyin ve raporlar oluşturun'
};

const FinancePage = () => {
  return (
    <div className="container py-8 space-y-6">
      <Header 
        title="Finansal Rapor" 
        subtitle="Mali durumunuzu takip edin ve finansal raporlar oluşturun"
      />
      <FinancialDashboard />
    </div>
  );
};

export default FinancePage; 