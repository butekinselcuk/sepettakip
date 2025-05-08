export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <section style={{ minHeight: '100vh', background: '#fff' }}>
      {children}
    </section>
  );
} 