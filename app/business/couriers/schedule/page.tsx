"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Courier tipi tanımı
interface Courier {
  id: number;
  name: string;
  phone: string;
  active: boolean;
  rating: number;
}

// Schedule tipi tanımı
interface Schedule {
  [date: string]: {
    [courierId: number]: string[];
  };
}

const CourierSchedulePage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [schedule, setSchedule] = useState<Schedule>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCourier, setSelectedCourier] = useState<number | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');

  const timeSlots = [
    '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
    '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00',
    '20:00-21:00', '21:00-22:00'
  ];

  // Mock courier data
  const mockCouriers: Courier[] = [
    { id: 1, name: 'Ali Yılmaz', phone: '555-123-4567', active: true, rating: 4.8 },
    { id: 2, name: 'Ayşe Demir', phone: '555-765-4321', active: true, rating: 4.5 },
    { id: 3, name: 'Mehmet Kaya', phone: '555-987-6543', active: false, rating: 4.2 },
    { id: 4, name: 'Zeynep Şahin', phone: '555-246-8135', active: true, rating: 4.9 },
    { id: 5, name: 'Emre Yıldız', phone: '555-369-2580', active: true, rating: 4.6 },
  ];

  // Mock schedule data
  const mockSchedule: Schedule = {
    '2023-10-22': {
      1: ['09:00-10:00', '13:00-14:00', '18:00-19:00'],
      2: ['10:00-11:00', '14:00-15:00', '19:00-20:00'],
      3: [],
      4: ['08:00-09:00', '12:00-13:00', '17:00-18:00'],
      5: ['11:00-12:00', '15:00-16:00', '20:00-21:00'],
    },
    '2023-10-23': {
      1: ['10:00-11:00', '14:00-15:00', '19:00-20:00'],
      2: ['09:00-10:00', '13:00-14:00', '18:00-19:00'],
      3: ['11:00-12:00', '15:00-16:00', '20:00-21:00'],
      4: ['08:00-09:00', '12:00-13:00', '17:00-18:00'],
      5: [],
    },
  };

  // Fetch couriers and schedule
  useEffect(() => {
    // Simulate API fetch
    const fetchData = async () => {
      try {
        // In a real application, these would be API calls
        // const couriersResponse = await axios.get('/api/business/couriers');
        // const scheduleResponse = await axios.get('/api/business/couriers/schedule');
        
        // Using mock data for now
        setCouriers(mockCouriers);
        setSchedule(mockSchedule);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Veri yüklenirken bir hata oluştu.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const handleSelectDate = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setSelectedTimeSlot(null);
    }
  };

  const handleSelectCourier = (courierId: string | number) => {
    setSelectedCourier(typeof courierId === 'string' ? parseInt(courierId as string) : courierId as number);
    setSelectedTimeSlot(null);
  };

  const handleSelectTimeSlot = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
  };

  const handleAssignTimeSlot = async () => {
    if (!selectedCourier || !selectedTimeSlot) {
      toast.error('Lütfen bir kurye ve zaman dilimi seçin.');
      return;
    }

    try {
      setLoading(true);
      
      // In a real application, this would be an API call
      // await axios.post('/api/business/couriers/schedule', {
      //   courierId: selectedCourier,
      //   date: formatDate(selectedDate),
      //   timeSlot: selectedTimeSlot
      // });
      
      // Update local state to simulate API response
      const dateStr = formatDate(selectedDate);
      const updatedSchedule = { ...schedule };
      
      if (!updatedSchedule[dateStr]) {
        updatedSchedule[dateStr] = {};
      }
      
      if (!updatedSchedule[dateStr][selectedCourier]) {
        updatedSchedule[dateStr][selectedCourier] = [];
      }
      
      if (!updatedSchedule[dateStr][selectedCourier].includes(selectedTimeSlot)) {
        updatedSchedule[dateStr][selectedCourier].push(selectedTimeSlot);
      }
      
      setSchedule(updatedSchedule);
      setLoading(false);
      toast.success('Zaman dilimi başarıyla atandı.');
    } catch (error) {
      console.error('Error assigning time slot:', error);
      toast.error('Zaman dilimi atanırken bir hata oluştu.');
      setLoading(false);
    }
  };

  const handleRemoveTimeSlot = async () => {
    if (!selectedCourier || !selectedTimeSlot) {
      toast.error('Lütfen bir kurye ve zaman dilimi seçin.');
      return;
    }

    try {
      setLoading(true);
      
      // In a real application, this would be an API call
      // await axios.delete('/api/business/couriers/schedule', {
      //   data: {
      //     courierId: selectedCourier,
      //     date: formatDate(selectedDate),
      //     timeSlot: selectedTimeSlot
      //   }
      // });
      
      // Update local state to simulate API response
      const dateStr = formatDate(selectedDate);
      const updatedSchedule = { ...schedule };
      
      if (updatedSchedule[dateStr] && updatedSchedule[dateStr][selectedCourier]) {
        updatedSchedule[dateStr][selectedCourier] = updatedSchedule[dateStr][selectedCourier].filter(
          slot => slot !== selectedTimeSlot
        );
      }
      
      setSchedule(updatedSchedule);
      setLoading(false);
      toast.success('Zaman dilimi başarıyla kaldırıldı.');
    } catch (error) {
      console.error('Error removing time slot:', error);
      toast.error('Zaman dilimi kaldırılırken bir hata oluştu.');
      setLoading(false);
    }
  };

  const isTimeSlotAssigned = (courierId: number, timeSlot: string): boolean => {
    const dateStr = formatDate(selectedDate);
    return !!schedule[dateStr] && 
           !!schedule[dateStr][courierId] && 
           schedule[dateStr][courierId].includes(timeSlot);
  };

  if (loading) {
    // Basit yükleme indikatörü
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="ml-2">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Header title="Kurye Zamanlaması" subtitle="Kuryelerinizin çalışma programını yönetin" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Tarih Seçin</CardTitle>
            <CardDescription>Programlamak istediğiniz tarihi seçin</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelectDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Kurye Seçin</CardTitle>
            <CardDescription>Programlamak istediğiniz kuryeyi seçin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {couriers.map((courier) => (
                <div 
                  key={courier.id}
                  className={`p-3 border rounded-md cursor-pointer flex justify-between items-center ${
                    selectedCourier === courier.id ? 'bg-primary/10 border-primary' : ''
                  }`}
                  onClick={() => handleSelectCourier(courier.id)}
                >
                  <div>
                    <div className="font-medium">{courier.name}</div>
                    <div className="text-sm text-muted-foreground">{courier.phone}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm">★ {courier.rating}</div>
                    <Badge variant={courier.active ? "success" : "destructive"}>
                      {courier.active ? "Aktif" : "Pasif"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Zaman Dilimi</CardTitle>
            <CardDescription>Çalışma saatlerini belirleyin</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="assign" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="assign">Ata</TabsTrigger>
                <TabsTrigger value="view">Görüntüle</TabsTrigger>
              </TabsList>
              <TabsContent value="assign" className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map((slot) => (
                    <div
                      key={slot}
                      className={`p-2 border rounded text-center cursor-pointer ${
                        selectedTimeSlot === slot ? 'bg-primary text-primary-foreground' : ''
                      } ${selectedCourier && isTimeSlotAssigned(selectedCourier, slot) ? 'bg-green-100 border-green-500' : ''}`}
                      onClick={() => handleSelectTimeSlot(slot)}
                    >
                      {slot}
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button
                    onClick={handleAssignTimeSlot}
                    disabled={!selectedCourier || !selectedTimeSlot}
                    className="flex-1"
                  >
                    Zaman Dilimi Ata
                  </Button>
                  <Button
                    onClick={handleRemoveTimeSlot}
                    disabled={!selectedCourier || !selectedTimeSlot || (selectedCourier && selectedTimeSlot && !isTimeSlotAssigned(selectedCourier, selectedTimeSlot))}
                    variant="destructive"
                    className="flex-1"
                  >
                    Kaldır
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="view">
                <div className="space-y-2">
                  {selectedCourier ? (
                    <>
                      <h3 className="font-medium">
                        {couriers.find(c => c.id === selectedCourier)?.name} - {selectedDate.toLocaleDateString('tr-TR')}
                      </h3>
                      <div className="border rounded-md p-3">
                        {schedule[formatDate(selectedDate)] && 
                         schedule[formatDate(selectedDate)][selectedCourier] &&
                         schedule[formatDate(selectedDate)][selectedCourier].length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {schedule[formatDate(selectedDate)][selectedCourier].map((slot) => (
                              <div key={slot} className="p-2 bg-green-100 border border-green-500 rounded text-center">
                                {slot}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center py-2 text-muted-foreground">Bu tarih için atanmış zaman dilimi yok</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-center py-4 text-muted-foreground">Lütfen bir kurye seçin</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Günlük Program Görünümü</CardTitle>
              <CardDescription>Seçili tarih için tüm kuryelerin programı</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant={view === 'calendar' ? 'default' : 'outline'}
                onClick={() => setView('calendar')}
                size="sm"
              >
                Takvim
              </Button>
              <Button 
                variant={view === 'list' ? 'default' : 'outline'}
                onClick={() => setView('list')}
                size="sm"
              >
                Liste
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {view === 'calendar' ? (
            <div className="border rounded-md overflow-hidden">
              <div className="grid grid-cols-15 border-b bg-muted">
                <div className="p-2 font-medium border-r">Kurye</div>
                {timeSlots.map(slot => (
                  <div key={slot} className="p-2 text-center text-xs font-medium border-r">{slot}</div>
                ))}
              </div>
              {couriers.map(courier => (
                <div key={courier.id} className="grid grid-cols-15 border-b last:border-b-0">
                  <div className="p-2 font-medium border-r bg-muted">{courier.name}</div>
                  {timeSlots.map(slot => {
                    const isAssigned = isTimeSlotAssigned(courier.id, slot);
                    return (
                      <div 
                        key={slot} 
                        className={`p-2 text-center border-r ${isAssigned ? 'bg-green-100' : ''}`}
                      >
                        {isAssigned && '✓'}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {couriers.map(courier => {
                const assignedSlots = schedule[formatDate(selectedDate)] && 
                                    schedule[formatDate(selectedDate)][courier.id] ? 
                                    schedule[formatDate(selectedDate)][courier.id] : [];
                return (
                  <div key={courier.id} className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">{courier.name}</h3>
                    {assignedSlots.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {assignedSlots.map(slot => (
                          <Badge key={slot} variant="outline" className="bg-green-100">
                            {slot}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Bu tarih için atanmış zaman dilimi yok</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push('/business/couriers')}>
            Kuryeler Sayfasına Dön
          </Button>
          <Button onClick={() => {
            toast.success('Program kaydedildi');
          }}>
            Değişiklikleri Kaydet
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CourierSchedulePage; 