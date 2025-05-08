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

interface DeliveryStatsData {
  date: string;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageDeliveryTime: number;
  peakHours: {
    hour: number;
    count: number;
  }[];
}

export default function DeliveryStats() {
  const [statsData, setStatsData] = useState<DeliveryStatsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        const response = await fetch('/api/analytics/delivery-stats');
        const data = await response.json();
        setStatsData(data);
      } catch (error) {
        console.error('Error fetching delivery stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatsData();
  }, []);

  if (loading) {
    return <div>Loading delivery statistics...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Teslimat İstatistikleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="totalDeliveries" 
                  fill="#8884d8" 
                  name="Toplam Teslimat" 
                />
                <Bar 
                  dataKey="successfulDeliveries" 
                  fill="#82ca9d" 
                  name="Başarılı Teslimat" 
                />
                <Bar 
                  dataKey="failedDeliveries" 
                  fill="#ff8042" 
                  name="Başarısız Teslimat" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 