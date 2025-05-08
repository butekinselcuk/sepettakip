import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ChartType = 'line' | 'bar' | 'area' | 'pie';

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface ChartConfig {
  type: ChartType;
  title: string;
  dataKey: string;
  color: string;
  showLegend?: boolean;
  showGrid?: boolean;
  stacked?: boolean;
}

interface CustomizableChartProps {
  data: ChartData[];
  config: ChartConfig;
  height?: number;
}

const CHART_COMPONENTS = {
  line: { Chart: LineChart, Element: Line },
  bar: { Chart: BarChart, Element: Bar },
  area: { Chart: AreaChart, Element: Area },
  pie: { Chart: PieChart, Element: Pie }
};

export default function CustomizableChart({ data, config, height = 300 }: CustomizableChartProps) {
  const { type, title, dataKey, color, showLegend = true, showGrid = true, stacked = false } = config;
  const { Chart, Element } = CHART_COMPONENTS[type];

  const chartContent = useMemo(() => {
    if (type === 'pie') {
      return (
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill={color}
          label
        />
      );
    }

    return (
      <>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        {showLegend && <Legend />}
        <Element
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          fill={type === 'area' || type === 'bar' ? color : undefined}
          stackId={stacked ? 'stack' : undefined}
        />
      </>
    );
  }, [type, dataKey, color, showLegend, showGrid, stacked, data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer>
            <Chart data={type === 'pie' ? data : data}>
              {chartContent}
            </Chart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 