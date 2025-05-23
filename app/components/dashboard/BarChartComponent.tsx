import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartComponentProps {
  labels: string[];
  values: number[];
  height?: number;
  horizontal?: boolean;
  colors?: string[];
}

const BarChartComponent: React.FC<BarChartComponentProps> = ({ 
  labels, 
  values, 
  height = 300,
  horizontal = false,
  colors = ['rgba(59, 130, 246, 0.8)'] // Default blue color
}) => {
  // Ensure we have enough colors by repeating the provided colors if necessary
  const extendedColors = Array.from({ length: values.length }, (_, i) => 
    colors[i % colors.length]
  );

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: extendedColors,
        borderColor: extendedColors.map(color => color.replace('0.8', '1')),
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    indexAxis: horizontal ? 'y' as const : 'x' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw as number;
            return `${value}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default BarChartComponent; 