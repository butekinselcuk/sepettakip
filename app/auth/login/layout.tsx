import { AUTH_METADATA } from '@/app/metadata';
import { Metadata } from 'next';

export const metadata: Metadata = AUTH_METADATA;

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 