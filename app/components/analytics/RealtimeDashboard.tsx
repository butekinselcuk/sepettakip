'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWebSocket } from '@/hooks/useWebSocket';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface DeliveryMetrics {
  activeCouriers: number;
  activeDeliveries: number;
  completedToday: number;
  averageDeliveryTime: number;
}

interface RealtimeMetrics extends DeliveryMetrics {
  deliveryTrend: {
    time: string;
    count: number;
  }[];
}

const INITIAL_METRICS: RealtimeMetrics = {
  activeCouriers: 0,
  activeDeliveries: 0,
  completedToday: 0,
  averageDeliveryTime: 0,
  deliveryTrend: []
};

export default function RealtimeDashboard() {
  const [metrics, setMetrics] = useState<RealtimeMetrics>(INITIAL_METRICS);
  const { isConnected, error, addMessageHandler } = useWebSocket('ws://localhost:3001');

  useEffect(() => {
    const removeHandler = addMessageHandler((message) => {
      if (message.type === 'delivery_update') {
        updateDeliveryMetrics(message.data as DeliveryMetrics);
      }
    });

    return () => removeHandler();
  }, [addMessageHandler]);

  const updateDeliveryMetrics = (data: DeliveryMetrics) => {
    setMetrics((prev) => {
      const now = new Date().toLocaleTimeString();
      const newTrend = [...prev.deliveryTrend, { time: now, count: data.activeDeliveries }];
      if (newTrend.length > 10) newTrend.shift();

      return {
        ...prev,
        ...data,
        deliveryTrend: newTrend
      };
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Aktif Kuryeler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.activeCouriers}</div>
          <div className="text-xs text-muted-foreground">
            {isConnected ? 'Canlı' : error || 'Bağlantı kesik'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aktif Teslimatlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.activeDeliveries}</div>
          <div className="text-xs text-muted-foreground">Devam eden teslimatlar</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bugün Tamamlanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.completedToday}</div>
          <div className="text-xs text-muted-foreground">Başarılı teslimatlar</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ort. Teslimat Süresi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.averageDeliveryTime} dk</div>
          <div className="text-xs text-muted-foreground">Tamamlanan teslimatlar</div>
        </CardContent>
      </Card>

      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Teslimat Trendi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.deliveryTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 