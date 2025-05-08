import { reportService } from './reportService';
import { reportTemplates } from './reportTemplates';
import { ReportData } from './reportService';

interface ScheduledReport {
  id: string;
  type: keyof typeof reportTemplates;
  recipients: string[];
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:mm format
    day?: number; // 0-6 for weekly, 1-31 for monthly
  };
  lastSent?: Date;
  nextRun?: Date;
}

class ScheduledReportsService {
  private scheduledReports: ScheduledReport[] = [];

  async addScheduledReport(report: ScheduledReport): Promise<void> {
    this.scheduledReports.push(report);
    await this.scheduleNextRun(report);
  }

  async removeScheduledReport(id: string): Promise<void> {
    this.scheduledReports = this.scheduledReports.filter(r => r.id !== id);
  }

  async updateScheduledReport(id: string, updates: Partial<ScheduledReport>): Promise<void> {
    const report = this.scheduledReports.find(r => r.id === id);
    if (report) {
      Object.assign(report, updates);
      await this.scheduleNextRun(report);
    }
  }

  private async scheduleNextRun(report: ScheduledReport): Promise<void> {
    const now = new Date();
    const [hours, minutes] = report.schedule.time.split(':').map(Number);
    
    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    if (nextRun <= now) {
      switch (report.schedule.frequency) {
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          nextRun.setDate(nextRun.getDate() + (7 - nextRun.getDay() + (report.schedule.day || 0)) % 7);
          break;
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + 1);
          nextRun.setDate(report.schedule.day || 1);
          break;
      }
    }

    report.nextRun = nextRun;
  }

  async processScheduledReports(): Promise<void> {
    const now = new Date();
    const dueReports = this.scheduledReports.filter(r => r.nextRun && r.nextRun <= now);

    for (const report of dueReports) {
      try {
        // Mock data - gerçek uygulamada veritabanından alınacak
        const mockData: ReportData = {
          title: '',
          date: now.toISOString(),
          metrics: {
            totalDeliveries: 0,
            activeCouriers: 0,
            averageDeliveryTime: 0,
            successRate: 0,
          },
          zoneStats: [],
          courierStats: [],
        };

        // Rapor şablonunu uygula
        const reportData = reportTemplates[report.type](mockData);

        // Raporu oluştur ve gönder
        await reportService.generateAndSendReport(reportData, report.recipients);

        // Son gönderim tarihini güncelle
        report.lastSent = now;
        await this.scheduleNextRun(report);
      } catch (error) {
        console.error(`Error processing scheduled report ${report.id}:`, error);
      }
    }
  }
}

export const scheduledReportsService = new ScheduledReportsService(); 