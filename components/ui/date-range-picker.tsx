'use client';

import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { forwardRef } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from './button';
import { Calendar } from './calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const DateRangePicker = forwardRef<HTMLDivElement, DateRangePickerProps>(
  ({ value, onChange, className }, ref) => {
    return (
      <div ref={ref} className={cn('grid gap-2', className)}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !value && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value?.from ? (
                value.to ? (
                  <>
                    {format(value.from, 'd LLL y', { locale: tr })} -{' '}
                    {format(value.to, 'd LLL y', { locale: tr })}
                  </>
                ) : (
                  format(value.from, 'd LLL y', { locale: tr })
                )
              ) : (
                <span>Tarih aralığı seçin</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={value?.from}
              selected={value}
              onSelect={onChange}
              numberOfMonths={2}
              locale={tr}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);
DateRangePicker.displayName = 'DateRangePicker';

export { DateRangePicker }; 