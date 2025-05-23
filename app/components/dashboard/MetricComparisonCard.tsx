import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface MetricComparisonCardProps {
  title: string;
  currentValue: number;
  previousValue: number;
  unit?: string;
  description?: string;
  formatValue?: (value: number) => string;
  positiveIsBetter?: boolean;
  icon?: React.ReactNode;
}

const MetricComparisonCard: React.FC<MetricComparisonCardProps> = ({
  title,
  currentValue,
  previousValue,
  unit = '',
  description,
  formatValue,
  positiveIsBetter = true,
  icon
}) => {
  // Değerleri formatlama
  const formatMetricValue = (value: number): string => {
    if (formatValue) {
      return formatValue(value);
    }
    
    return `${value.toLocaleString()}${unit}`;
  };
  
  // Değişim hesaplama
  const calculateChange = (): { value: number, isIncrease: boolean, text: string } => {
    if (previousValue === 0) {
      return {
        value: 100,
        isIncrease: true,
        text: 'yeni'
      };
    }
    
    const diff = currentValue - previousValue;
    const percentChange = (diff / previousValue) * 100;
    
    return {
      value: Math.abs(percentChange),
      isIncrease: diff >= 0,
      text: diff >= 0 ? 'artış' : 'azalış'
    };
  };
  
  const change = calculateChange();
  
  // Değişimin olumlu mu olumsuz mu olduğunu belirle
  const isPositiveChange = (positiveIsBetter && change.isIncrease) || (!positiveIsBetter && !change.isIncrease);
  
  // Hedef tamamlama hesaplama (karşılaştırmalı grafik için)
  const calculateCompletion = (): number => {
    const max = Math.max(currentValue, previousValue);
    return max > 0 ? (currentValue / max) * 100 : 0;
  };
  
  const completion = calculateCompletion();
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-2xl font-bold">{formatMetricValue(currentValue)}</div>
            
            <div className="flex items-center mt-1 text-sm">
              <div className={`flex items-center ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
                {change.isIncrease ? (
                  <ArrowUp className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDown className="h-4 w-4 mr-1" />
                )}
                <span>{change.value.toFixed(1)}% {change.text}</span>
              </div>
              <span className="text-muted-foreground ml-2">önceki döneme göre</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Mevcut: {formatMetricValue(currentValue)}</span>
              <span>Önceki: {formatMetricValue(previousValue)}</span>
            </div>
            <Progress value={completion} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricComparisonCard; 