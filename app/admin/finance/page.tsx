"use client";

import React from 'react';
import AdminFinancialDashboard from '@/app/components/admin/finance/AdminFinancialDashboard';

const AdminFinancePage = () => {
  return (
    <div className="container px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Finansal Rapor</h1>
        <div>
          <p className="text-gray-500">Platform genelinde finansal performansı analiz edin</p>
        </div>
      </div>
      
      <AdminFinancialDashboard />
    </div>
  );
};

export default AdminFinancePage; 