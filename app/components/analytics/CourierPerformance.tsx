'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface CourierComparisonData {
  courierId: string;
  courierName: string;
  totalDeliveries: number;
  averageDeliveryTime: number;
  customerRating: number;
  onTimeDeliveryRate: number;
}

export default function CourierPerformance() {
  const [data, setData] = useState<CourierComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/courier-performance');
        if (!response.ok) throw new Error('API error');
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError('Kurye performans verisi alınamadı.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Kurye Karşılaştırma Grafiği</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="courierName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalDeliveries" fill="#8884d8" name="Toplam Teslimat" />
                <Bar dataKey="averageDeliveryTime" fill="#82ca9d" name="Ort. Teslimat Süresi (dk)" />
                <Bar dataKey="customerRating" fill="#ffc658" name="Müşteri Puanı" />
                <Bar dataKey="onTimeDeliveryRate" fill="#ff7300" name="Zamanında Teslimat (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 