export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <section style={{ minHeight: '100vh', background: '#f9f9f9' }}>
      {children}
    </section>
  );
} 