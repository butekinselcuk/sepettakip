import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { redirect } from 'next/navigation';
import Header from '@/components/settings/Header';
import GeneralSettingsForm from '@/components/settings/GeneralSettingsForm';
import DeliverySettingsForm from '@/components/settings/DeliverySettingsForm';
import BusinessHoursForm from '@/components/settings/BusinessHoursForm';
import MediaUploadForm from '@/components/settings/MediaUploadForm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export default async function BusinessSettingsPage() {
  // Kullanıcı oturumunu kontrol et
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return redirect('/login?callbackUrl=/business/settings');
  }
  
  // Kullanıcının işletme olup olmadığını kontrol et
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { business: true }
  });
  
  if (!user || user.role !== 'BUSINESS' || !user.business) {
    return redirect('/login?callbackUrl=/business/settings');
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <Header businessName={user.business.name} />
      
      <div className="bg-white shadow rounded-lg">
        <Tabs defaultValue="general" className="w-full">
          <div className="border-b px-6 py-3">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <TabsTrigger value="general" className="data-[state=active]:font-semibold">
                Genel Bilgiler
              </TabsTrigger>
              <TabsTrigger value="hours" className="data-[state=active]:font-semibold">
                Çalışma Saatleri
              </TabsTrigger>
              <TabsTrigger value="delivery" className="data-[state=active]:font-semibold">
                Teslimat Ayarları
              </TabsTrigger>
              <TabsTrigger value="media" className="data-[state=active]:font-semibold">
                Görsel Yönetimi
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="p-6">
            <TabsContent value="general">
              <GeneralSettingsForm initialData={user.business} />
            </TabsContent>
            
            <TabsContent value="hours">
              <BusinessHoursForm />
            </TabsContent>
            
            <TabsContent value="delivery">
              <DeliverySettingsForm />
            </TabsContent>
            
            <TabsContent value="media">
              <MediaUploadForm />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
} 