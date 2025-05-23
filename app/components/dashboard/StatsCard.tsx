import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isIncrease: boolean;
    text: string;
  };
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">{value}</div>
        {description && (
          <div className="flex items-center text-xs text-muted-foreground">
            {description}
            {trend && (
              <div className={`flex items-center ml-2 ${trend.isIncrease ? 'text-green-500' : 'text-red-500'}`}>
                {trend.isIncrease ? (
                  <ArrowUp className="h-3 w-3 mr-0.5" />
                ) : (
                  <ArrowDown className="h-3 w-3 mr-0.5" />
                )}
                <span>{trend.value.toFixed(1)}% {trend.text}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard; 