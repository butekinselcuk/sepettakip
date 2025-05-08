'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function MetricCard({ title, value, description, trend }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            <div className={`text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface DetailedMetricsProps {
  data: {
    totalDeliveries: number;
    successRate: number;
    averageDeliveryTime: number;
    customerSatisfaction: number;
    onTimeDeliveryRate: number;
    trends: {
      [key: string]: {
        value: number;
        isPositive: boolean;
      };
    };
  };
}

export default function DetailedMetrics({ data }: DetailedMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <MetricCard
        title="Toplam Teslimat"
        value={data.totalDeliveries}
        description="Son 30 gün"
        trend={data.trends.totalDeliveries}
      />
      <MetricCard
        title="Başarı Oranı"
        value={`${data.successRate}%`}
        description="Başarılı teslimatlar"
        trend={data.trends.successRate}
      />
      <MetricCard
        title="Ortalama Teslimat Süresi"
        value={`${data.averageDeliveryTime} dk`}
        description="Sipariş - Teslimat arası"
        trend={data.trends.averageDeliveryTime}
      />
      <MetricCard
        title="Müşteri Memnuniyeti"
        value={`${data.customerSatisfaction}/5`}
        description="Ortalama puanlama"
        trend={data.trends.customerSatisfaction}
      />
      <MetricCard
        title="Zamanında Teslimat"
        value={`${data.onTimeDeliveryRate}%`}
        description="Hedef sürede tamamlanan"
        trend={data.trends.onTimeDeliveryRate}
      />
    </div>
  );
} 