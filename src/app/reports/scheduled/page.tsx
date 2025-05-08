'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

export default function ScheduledReportsPage() {
  const [reports, setReports] = useState([
    {
      id: 1,
      name: 'Haftalık Performans Raporu',
      frequency: 'weekly',
      format: 'pdf',
      lastRun: '2023-05-01',
      nextRun: '2023-05-08',
      recipients: ['admin@sepettakip.com'],
      active: true,
    },
    {
      id: 2,
      name: 'Aylık Kurye Raporu',
      frequency: 'monthly',
      format: 'excel',
      lastRun: '2023-04-01',
      nextRun: '2023-05-01',
      recipients: ['kurye@sepettakip.com', 'yonetici@sepettakip.com'],
      active: true,
    },
    {
      id: 3,
      name: 'Günlük Bölge Raporu',
      frequency: 'daily',
      format: 'csv',
      lastRun: '2023-05-05',
      nextRun: '2023-05-06',
      recipients: ['bolge@sepettakip.com'],
      active: false,
    },
  ]);

  const [newReport, setNewReport] = useState({
    name: '',
    frequency: 'weekly',
    format: 'pdf',
    recipients: '',
    startDate: new Date(),
    active: true,
  });

  const handleAddReport = () => {
    const recipientsArray = newReport.recipients.split(',').map(email => email.trim());
    
    const report = {
      id: reports.length + 1,
      name: newReport.name,
      frequency: newReport.frequency,
      format: newReport.format,
      lastRun: '-',
      nextRun: format(newReport.startDate, 'yyyy-MM-dd'),
      recipients: recipientsArray,
      active: newReport.active,
    };
    
    setReports([...reports, report]);
    
    // Reset form
    setNewReport({
      name: '',
      frequency: 'weekly',
      format: 'pdf',
      recipients: '',
      startDate: new Date(),
      active: true,
    });
  };

  const handleToggleActive = (id) => {
    setReports(
      reports.map(report => 
        report.id === id ? { ...report, active: !report.active } : report
      )
    );
  };

  const handleDeleteReport = (id) => {
    setReports(reports.filter(report => report.id !== id));
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Planlanmış Raporlar</h1>

      <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Aktif Raporlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{reports.filter(r => r.active).length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Toplam Rapor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{reports.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Son Çalıştırılan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {reports.length > 0 
                ? format(new Date(Math.max(...reports.map(r => new Date(r.lastRun === '-' ? 0 : r.lastRun)))), 'dd.MM.yyyy')
                : '-'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 mb-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Yeni Rapor Planla</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Rapor Adı</label>
                  <Input
                    value={newReport.name}
                    onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                    placeholder="Rapor adı girin"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Sıklık</label>
                  <Select
                    value={newReport.frequency}
                    onValueChange={(value) => setNewReport({ ...newReport, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sıklık seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Günlük</SelectItem>
                      <SelectItem value="weekly">Haftalık</SelectItem>
                      <SelectItem value="monthly">Aylık</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Format</label>
                  <Select
                    value={newReport.format}
                    onValueChange={(value) => setNewReport({ ...newReport, format: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Format seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Alıcılar (virgülle ayırın)</label>
                  <Input
                    value={newReport.recipients}
                    onChange={(e) => setNewReport({ ...newReport, recipients: e.target.value })}
                    placeholder="ornek@mail.com, ornek2@mail.com"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Başlangıç Tarihi</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(newReport.startDate, 'PPP', { locale: tr })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newReport.startDate}
                        onSelect={(date) => setNewReport({ ...newReport, startDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={newReport.active}
                    onCheckedChange={(checked) => setNewReport({ ...newReport, active: checked })}
                  />
                  <label
                    htmlFor="active"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Aktif
                  </label>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleAddReport}>Raporu Planla</Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Planlanmış Raporlar</CardTitle>
              <CardDescription>Mevcut planlanmış raporları yönetin</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rapor Adı</TableHead>
                    <TableHead>Sıklık</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Son Çalıştırma</TableHead>
                    <TableHead>Sonraki Çalıştırma</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>
                        {report.frequency === 'daily' && 'Günlük'}
                        {report.frequency === 'weekly' && 'Haftalık'}
                        {report.frequency === 'monthly' && 'Aylık'}
                      </TableCell>
                      <TableCell>{report.format.toUpperCase()}</TableCell>
                      <TableCell>{report.lastRun}</TableCell>
                      <TableCell>{report.nextRun}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${report.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {report.active ? 'Aktif' : 'Pasif'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(report.id)}
                          >
                            {report.active ? 'Durdur' : 'Etkinleştir'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteReport(report.id)}
                          >
                            Sil
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 