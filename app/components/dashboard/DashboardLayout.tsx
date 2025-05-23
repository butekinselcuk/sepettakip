import React from 'react';
import { useSession } from 'next-auth/react';
import AdminDashboard from '@/app/admin/dashboard/page';
import BusinessDashboard from '@/app/business/dashboard/page';
import CourierDashboard from '@/app/courier/dashboard/page';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface DashboardLayoutProps {
  defaultRole?: 'ADMIN' | 'BUSINESS' | 'COURIER' | 'CUSTOMER';
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ defaultRole }) => {
  const { data: session, status } = useSession();
  
  if (status === 'loading') {
    return <DashboardSkeleton />;
  }
  
  if (!session || !session.user) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erişim Hatası</AlertTitle>
        <AlertDescription>
          Bu sayfayı görüntülemek için giriş yapmalısınız.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Kullanıcı rolü veya varsayılan rol
  const role = session.user.role || defaultRole;
  
  if (!role) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Rol Bulunamadı</AlertTitle>
        <AlertDescription>
          Kullanıcı rolünüz tanımlanmamış. Lütfen yönetici ile iletişime geçin.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Role göre dashboard göster
  switch (role) {
    case 'ADMIN':
      return <AdminDashboard />;
      
    case 'BUSINESS':
      return <BusinessDashboard />;
      
    case 'COURIER':
      return <CourierDashboard />;
      
    default:
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Dashboard Bulunamadı</AlertTitle>
          <AlertDescription>
            {role} rolü için uygun bir dashboard bulunamadı.
          </AlertDescription>
        </Alert>
      );
  }
};

const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-4 w-2/4" />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
      
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
};

export default DashboardLayout; 