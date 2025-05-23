"use client";

import React from 'react';
import PolicyManagement from '@/app/components/business/policies/PolicyManagement';
import BusinessLayout from "@/app/components/layouts/BusinessLayout";
import Header from '@/app/components/common/Header';

export default function BusinessPoliciesPage() {
  return (
    <BusinessLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <Header title="İade ve İptal Politikaları" />
          <h1 className="text-2xl font-semibold text-gray-900">Politika Yönetimi</h1>
          <p className="mt-1 text-sm text-gray-600">
            İade ve iptal işlemleri için kuralları ve politikaları yönetin
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          <PolicyManagement />
        </div>
      </div>
    </BusinessLayout>
  );
} 