import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  loading?: boolean;
}

export default function StatCard({ title, value, icon, color = '#f5f5f5', loading }: StatCardProps) {
  return (
    <div style={{
      background: color,
      borderRadius: 12,
      padding: 20,
      minWidth: 180,
      minHeight: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      position: 'relative',
    }}>
      <div style={{ fontSize: 16, color: '#888', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && <span style={{ fontSize: 24 }}>{icon}</span>}
        {title}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: '#222' }}>
        {loading ? <span style={{ fontSize: 18, color: '#aaa' }}>Yükleniyor...</span> : value}
      </div>
    </div>
  );
} 