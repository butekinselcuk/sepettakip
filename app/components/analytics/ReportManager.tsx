import { useState } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Label } from '@/components/ui/label';

interface ReportManagerProps {
  onGenerateReport: (type: string, recipients: string[], schedule?: any) => Promise<void>;
}

const reportTypes = [
  { id: 'dailyPerformance', name: 'Günlük Performans Raporu' },
  { id: 'weeklyTrend', name: 'Haftalık Trend Raporu' },
  { id: 'monthlySummary', name: 'Aylık Özet Rapor' },
  { id: 'zoneBased', name: 'Bölge Bazlı Performans Raporu' },
  { id: 'courierPerformance', name: 'Kurye Performans Raporu' },
];

const scheduleFrequencies = [
  { id: 'daily', name: 'Günlük' },
  { id: 'weekly', name: 'Haftalık' },
  { id: 'monthly', name: 'Aylık' },
];

export default function ReportManager({ onGenerateReport }: ReportManagerProps) {
  const [reportType, setReportType] = useState('');
  const [recipients, setRecipients] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [schedule, setSchedule] = useState({
    frequency: 'daily',
    time: '09:00',
    day: 1,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const recipientList = recipients.split(',').map(email => email.trim());
    if (isScheduled) {
      await onGenerateReport(reportType, recipientList, schedule);
    } else {
      await onGenerateReport(reportType, recipientList);
    }
  };

  return (
    <div className="border rounded p-4 bg-white shadow">
      <h2 className="text-lg font-bold mb-2">Rapor Yönetimi</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="reportType" className="block font-medium">Rapor Tipi</label>
          <select id="reportType" value={reportType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReportType(e.target.value)} className="w-full border rounded px-2 py-1">
            <option value="">Rapor tipi seçin</option>
            {reportTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="recipients" className="block font-medium">Alıcılar (virgülle ayırın)</label>
          <input
            id="recipients"
            value={recipients}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecipients(e.target.value)}
            placeholder="ornek@email.com, ornek2@email.com"
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isScheduled}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsScheduled(e.target.checked)}
            />
            <span>Zamanlanmış Rapor</span>
          </label>
        </div>
        {isScheduled && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="frequency" className="block font-medium">Sıklık</label>
              <select
                id="frequency"
                value={schedule.frequency}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSchedule({ ...schedule, frequency: e.target.value })}
                className="w-full border rounded px-2 py-1"
              >
                {scheduleFrequencies.map(freq => (
                  <option key={freq.id} value={freq.id}>{freq.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="time" className="block font-medium">Saat</label>
              <input
                id="time"
                type="time"
                value={schedule.time}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSchedule({ ...schedule, time: e.target.value })}
                className="w-full border rounded px-2 py-1"
              />
            </div>
            {(schedule.frequency === 'weekly' || schedule.frequency === 'monthly') && (
              <div className="space-y-2">
                <label htmlFor="day" className="block font-medium">
                  {schedule.frequency === 'weekly' ? 'Gün (0-6)' : 'Gün (1-31)'}
                </label>
                <input
                  id="day"
                  type="number"
                  min={schedule.frequency === 'weekly' ? 0 : 1}
                  max={schedule.frequency === 'weekly' ? 6 : 31}
                  value={schedule.day}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSchedule({ ...schedule, day: parseInt(e.target.value) })}
                  className="w-full border rounded px-2 py-1"
                />
              </div>
            )}
          </div>
        )}
        <button type="submit" className="w-full bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 transition-colors">
          {isScheduled ? 'Zamanlanmış Rapor Oluştur' : 'Rapor Oluştur'}
        </button>
      </form>
    </div>
  );
} 