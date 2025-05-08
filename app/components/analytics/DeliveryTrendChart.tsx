import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export type DeliveryTrendData = {
  date: string;
  totalDeliveries: number;
  completedDeliveries: number;
  averageDeliveryTime: number;
};

interface DeliveryTrendChartProps {
  data: DeliveryTrendData[];
  loading?: boolean;
}

const DeliveryTrendChart: React.FC<DeliveryTrendChartProps> = ({ data, loading }) => {
  return (
    <div style={{ width: '100%', height: 350 }}>
      <h3>Teslimat Trendleri</h3>
      {loading ? (
        <div>Yükleniyor...</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" label={{ value: 'Teslimat', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Ortalama Süre (dk)', angle: 90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="totalDeliveries" name="Toplam Teslimat" stroke="#8884d8" activeDot={{ r: 8 }} />
            <Line yAxisId="left" type="monotone" dataKey="completedDeliveries" name="Tamamlanan Teslimat" stroke="#82ca9d" />
            <Line yAxisId="right" type="monotone" dataKey="averageDeliveryTime" name="Ortalama Süre (dk)" stroke="#ff7300" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default DeliveryTrendChart; 