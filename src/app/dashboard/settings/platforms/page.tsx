import { PlatformSettings } from '@/components/settings/PlatformSettings'

export default function PlatformsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Platform Entegrasyonları</h1>
        <p className="mt-1 text-sm text-gray-500">
          Platform entegrasyonlarını yönetin ve API anahtarlarını yapılandırın.
        </p>
      </div>

      <PlatformSettings />
    </div>
  )
} 