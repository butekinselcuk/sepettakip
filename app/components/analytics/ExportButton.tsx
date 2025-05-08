'use client';

import * as XLSX from 'xlsx';

interface ExportButtonProps {
  data: any[];
  filename: string;
  type: 'csv' | 'excel';
}

export default function ExportButton({ data, filename, type }: ExportButtonProps) {
  const exportData = () => {
    if (type === 'csv') {
      exportToCSV(data, filename);
    } else {
      exportToExcel(data, filename);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          typeof row[header] === 'string' ? `"${row[header]}"` : row[header]
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const exportToExcel = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  return (
    <button
      onClick={exportData}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
    >
      {type === 'csv' ? 'CSV olarak indir' : 'Excel olarak indir'}
    </button>
  );
} 