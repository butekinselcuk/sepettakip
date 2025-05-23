"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const DAYS_OF_WEEK = [
  { id: 0, name: 'Pazartesi' },
  { id: 1, name: 'Salı' },
  { id: 2, name: 'Çarşamba' },
  { id: 3, name: 'Perşembe' },
  { id: 4, name: 'Cuma' },
  { id: 5, name: 'Cumartesi' },
  { id: 6, name: 'Pazar' },
];

// Bir günün çalışma saatlerini tanımlayan bileşen
const DayHoursRow = ({
  day,
  startTime,
  endTime,
  isOpen,
  onChange,
}: {
  day: { id: number; name: string };
  startTime: string;
  endTime: string;
  isOpen: boolean;
  onChange: (dayId: number, field: string, value: string | boolean) => void;
}) => {
  return (
    <div className="grid grid-cols-12 gap-4 items-center mb-4 p-3 bg-gray-50 rounded-md">
      <div className="col-span-3">
        <span className="font-medium">{day.name}</span>
      </div>
      <div className="col-span-2">
        <div className="flex items-center">
          <input
            type="checkbox"
            id={`isOpen-${day.id}`}
            checked={isOpen}
            onChange={(e) => onChange(day.id, 'isOpen', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor={`isOpen-${day.id}`} className="ml-2 block text-sm text-gray-700">
            Açık
          </label>
        </div>
      </div>
      <div className="col-span-3">
        <input
          type="time"
          id={`startTime-${day.id}`}
          value={startTime}
          onChange={(e) => onChange(day.id, 'startTime', e.target.value)}
          disabled={!isOpen}
          className={`block w-full border-gray-300 rounded-md shadow-sm sm:text-sm ${
            !isOpen ? 'bg-gray-100 text-gray-500' : ''
          }`}
        />
      </div>
      <div className="col-span-1 text-center">-</div>
      <div className="col-span-3">
        <input
          type="time"
          id={`endTime-${day.id}`}
          value={endTime}
          onChange={(e) => onChange(day.id, 'endTime', e.target.value)}
          disabled={!isOpen}
          className={`block w-full border-gray-300 rounded-md shadow-sm sm:text-sm ${
            !isOpen ? 'bg-gray-100 text-gray-500' : ''
          }`}
        />
      </div>
    </div>
  );
};

export default function BusinessHoursForm() {
  // Varsayılan çalışma saatleri (tüm günler için 09:00-18:00, hafta sonu kapalı)
  const defaultHours = DAYS_OF_WEEK.map((day) => ({
    dayOfWeek: day.id,
    startTime: '09:00',
    endTime: '18:00',
    isOpen: day.id < 5, // Hafta içi açık, hafta sonu kapalı
  }));

  const [hoursData, setHoursData] = useState(defaultHours);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Çalışma saatlerini yükle
  useEffect(() => {
    const fetchHours = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Oturum bilgisi bulunamadı');
          return;
        }

        const response = await axios.get('/api/business/settings/hours', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.hours && response.data.hours.length > 0) {
          setHoursData(response.data.hours);
        }
      } catch (error) {
        console.error('Çalışma saatleri alınırken hata:', error);
        toast.error('Çalışma saatleri yüklenemedi');
      } finally {
        setLoadingData(false);
      }
    };

    fetchHours();
  }, []);

  const handleHoursChange = (dayId: number, field: string, value: string | boolean) => {
    setHoursData((prevData) =>
      prevData.map((day) =>
        day.dayOfWeek === dayId ? { ...day, [field]: value } : day
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Oturum bilgisi bulunamadı');
        setLoading(false);
        return;
      }

      // Saatlerin geçerli olduğunu kontrol et
      for (const day of hoursData) {
        if (day.isOpen) {
          const start = new Date(`2000-01-01T${day.startTime}`);
          const end = new Date(`2000-01-01T${day.endTime}`);

          if (end <= start) {
            toast.error(`${DAYS_OF_WEEK.find((d) => d.id === day.dayOfWeek)?.name}: Kapanış saati açılış saatinden sonra olmalıdır`);
            setLoading(false);
            return;
          }
        }
      }

      await axios.put('/api/business/settings/hours', { hours: hoursData }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success('Çalışma saatleri başarıyla güncellendi');
    } catch (error: any) {
      console.error('Çalışma saatleri güncellenirken hata:', error);

      const errorMessage =
        error.response?.data?.error || 'Çalışma saatleri güncellenirken bir hata oluştu';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Haftanın tüm günleri için saatleri kopyala
  const copyToAllDays = (sourceDayId: number) => {
    const sourceDay = hoursData.find((day) => day.dayOfWeek === sourceDayId);
    if (!sourceDay) return;

    setHoursData((prevData) =>
      prevData.map((day) => ({
        ...day,
        startTime: sourceDay.startTime,
        endTime: sourceDay.endTime,
      }))
    );

    toast.success('Saatler tüm günlere kopyalandı');
  };

  // Hafta içi günler için saatleri kopyala
  const copyToWeekdays = (sourceDayId: number) => {
    const sourceDay = hoursData.find((day) => day.dayOfWeek === sourceDayId);
    if (!sourceDay) return;

    setHoursData((prevData) =>
      prevData.map((day) => ({
        ...day,
        startTime: day.dayOfWeek < 5 ? sourceDay.startTime : day.startTime,
        endTime: day.dayOfWeek < 5 ? sourceDay.endTime : day.endTime,
      }))
    );

    toast.success('Saatler hafta içi günlere kopyalandı');
  };

  // Hafta sonu günler için saatleri kopyala
  const copyToWeekend = (sourceDayId: number) => {
    const sourceDay = hoursData.find((day) => day.dayOfWeek === sourceDayId);
    if (!sourceDay) return;

    setHoursData((prevData) =>
      prevData.map((day) => ({
        ...day,
        startTime: day.dayOfWeek >= 5 ? sourceDay.startTime : day.startTime,
        endTime: day.dayOfWeek >= 5 ? sourceDay.endTime : day.endTime,
      }))
    );

    toast.success('Saatler hafta sonu günlere kopyalandı');
  };

  if (loadingData) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-lg font-medium text-gray-900 mb-2">Çalışma Saatleri</h2>
      <p className="text-sm text-gray-500 mb-6">
        İşletmenizin çalışma saatlerini belirleyin. Kapalı günler için "Açık" seçeneğini kaldırın.
      </p>

      <div className="mb-6">
        {/* Gün başlıkları */}
        <div className="grid grid-cols-12 gap-4 items-center mb-2 px-3 py-1">
          <div className="col-span-3">
            <span className="text-sm font-medium text-gray-700">Gün</span>
          </div>
          <div className="col-span-2">
            <span className="text-sm font-medium text-gray-700">Durum</span>
          </div>
          <div className="col-span-3">
            <span className="text-sm font-medium text-gray-700">Açılış</span>
          </div>
          <div className="col-span-1"></div>
          <div className="col-span-3">
            <span className="text-sm font-medium text-gray-700">Kapanış</span>
          </div>
        </div>

        {/* Haftanın günleri */}
        {DAYS_OF_WEEK.map((day) => {
          const dayData = hoursData.find((h) => h.dayOfWeek === day.id) || {
            dayOfWeek: day.id,
            startTime: '09:00',
            endTime: '18:00',
            isOpen: day.id < 5,
          };

          return (
            <div key={day.id} className="relative group">
              <DayHoursRow
                day={day}
                startTime={dayData.startTime}
                endTime={dayData.endTime}
                isOpen={dayData.isOpen}
                onChange={handleHoursChange}
              />
              
              {/* Kopyalama düğmeleri (hover üzerinde görünür) */}
              <div className="absolute top-1/2 right-0 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex space-x-1 bg-white shadow-sm rounded-md p-1">
                  <button
                    type="button"
                    onClick={() => copyToAllDays(day.id)}
                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                    title="Tüm günlere kopyala"
                  >
                    Tümüne
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToWeekdays(day.id)}
                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                    title="Hafta içine kopyala"
                  >
                    Hafta içi
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToWeekend(day.id)}
                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                    title="Hafta sonuna kopyala"
                  >
                    Hafta sonu
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {loading ? 'Kaydediliyor...' : 'Saatleri Kaydet'}
        </button>
      </div>
    </form>
  );
} 