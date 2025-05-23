import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kayıt Ol | Sepet Takip',
  description: 'Sepet Takip uygulamasına kayıt olun',
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 