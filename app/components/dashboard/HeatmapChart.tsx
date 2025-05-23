import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface HeatmapProps {
  title: string;
  description?: string;
  data: number[][];
  xLabels: string[];
  yLabels: string[];
  colorRange?: string[];
  maxValue?: number;
}

const HeatmapChart: React.FC<HeatmapProps> = ({
  title,
  description,
  data,
  xLabels,
  yLabels,
  colorRange = ['#f3f4f6', '#60a5fa', '#2563eb', '#1e40af', '#1e3a8a'],
  maxValue
}) => {
  // Veri aralığını belirle
  const calculateMaxValue = (): number => {
    if (maxValue !== undefined) return maxValue;
    
    let max = 0;
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        if (data[i][j] > max) {
          max = data[i][j];
        }
      }
    }
    return max === 0 ? 1 : max; // 0'a bölünmemesi için
  };
  
  const max = calculateMaxValue();
  
  // Renk hesaplaması
  const getColor = (value: number): string => {
    // Değer yok ise ilk rengi döndür
    if (value === 0) return colorRange[0];
    
    // Değeri 0-1 aralığına normalize et
    const normalized = Math.min(value / max, 1);
    
    // Renk aralığında pozisyonu hesapla
    const position = normalized * (colorRange.length - 1);
    const index = Math.floor(position);
    
    // Son renk index'ini aşmaması için kontrol
    if (index >= colorRange.length - 1) return colorRange[colorRange.length - 1];
    
    // İki renk arasında interpolasyon
    const remainder = position - index;
    const color1 = hexToRgb(colorRange[index]);
    const color2 = hexToRgb(colorRange[index + 1]);
    
    if (!color1 || !color2) return colorRange[index];
    
    const r = Math.round(color1.r + remainder * (color2.r - color1.r));
    const g = Math.round(color1.g + remainder * (color2.g - color1.g));
    const b = Math.round(color1.b + remainder * (color2.b - color1.b));
    
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  // HEX renk kodunu RGB'ye çevirme
  const hexToRgb = (hex: string) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const formattedHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(formattedHex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          <div className="overflow-x-auto">
            <div className="flex items-center mb-2">
              <div className="w-20" /> {/* Boşluk - y ekseni etiketleri için */}
              <div className="flex-1 flex">
                {xLabels.map((label, index) => (
                  <div 
                    key={index} 
                    className="flex-1 text-center text-xs font-medium"
                    style={{ minWidth: '30px' }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
            
            {yLabels.map((yLabel, yIndex) => (
              <div key={yIndex} className="flex items-center mb-1">
                <div className="w-20 text-xs font-medium pr-2 text-right">
                  {yLabel}
                </div>
                <div className="flex-1 flex">
                  {data[yIndex].map((value, xIndex) => (
                    <div
                      key={xIndex}
                      className="flex-1 aspect-square rounded-sm flex items-center justify-center"
                      style={{ 
                        backgroundColor: getColor(value),
                        minWidth: '30px',
                        minHeight: '30px'
                      }}
                      title={`${yLabel} / ${xLabels[xIndex]}: ${value}`}
                    >
                      <span className="text-xs font-semibold" style={{ 
                        color: value > max * 0.5 ? 'white' : 'black',
                        opacity: value > 0 ? 1 : 0.3
                      }}>
                        {value > 0 ? value : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Renk skalası */}
          <div className="mt-4 flex items-center justify-end">
            <span className="text-xs mr-2">0</span>
            <div className="h-2 w-40 rounded-full" style={{
              background: `linear-gradient(to right, ${colorRange.join(', ')})`
            }} />
            <span className="text-xs ml-2">{max}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeatmapChart; 