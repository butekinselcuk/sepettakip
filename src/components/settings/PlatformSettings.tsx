import { useState } from 'react'
import { Platform } from '@prisma/client'

interface PlatformConfig {
  id: string
  name: string
  apiKey: string
  isEnabled: boolean
  lastSync: string | null
}

export function PlatformSettings() {
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([
    {
      id: 'yemeksepeti',
      name: 'Yemeksepeti',
      apiKey: '',
      isEnabled: false,
      lastSync: null,
    },
    {
      id: 'getir',
      name: 'Getir',
      apiKey: '',
      isEnabled: false,
      lastSync: null,
    },
    {
      id: 'trendyol',
      name: 'Trendyol',
      apiKey: '',
      isEnabled: false,
      lastSync: null,
    },
  ])

  const handleApiKeyChange = (platformId: string, apiKey: string) => {
    setPlatforms((prev) =>
      prev.map((p) =>
        p.id === platformId ? { ...p, apiKey } : p
      )
    )
  }

  const handleTogglePlatform = (platformId: string) => {
    setPlatforms((prev) =>
      prev.map((p) =>
        p.id === platformId ? { ...p, isEnabled: !p.isEnabled } : p
      )
    )
  }

  const handleSave = async (platformId: string) => {
    const platform = platforms.find((p) => p.id === platformId)
    if (!platform) return

    try {
      const response = await fetch('/api/settings/platforms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platformId,
          apiKey: platform.apiKey,
          isEnabled: platform.isEnabled,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save platform settings')
      }

      // Show success message
      alert('Platform ayarları kaydedildi')
    } catch (error) {
      console.error('Error saving platform settings:', error)
      alert('Platform ayarları kaydedilirken bir hata oluştu')
    }
  }

  const handleSync = async (platformId: string) => {
    try {
      const response = await fetch(`/api/platforms?action=sync&platform=${platformId}`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Failed to sync platform')
      }

      const data = await response.json()
      
      // Update last sync time
      setPlatforms((prev) =>
        prev.map((p) =>
          p.id === platformId
            ? { ...p, lastSync: new Date().toISOString() }
            : p
        )
      )

      alert(`${data.count} sipariş senkronize edildi`)
    } catch (error) {
      console.error('Error syncing platform:', error)
      alert('Platform senkronizasyonu sırasında bir hata oluştu')
    }
  }

  return (
    <div className="space-y-6">
      {platforms.map((platform) => (
        <div
          key={platform.id}
          className="bg-white shadow sm:rounded-lg"
        >
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {platform.name}
                </h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>
                    {platform.lastSync
                      ? `Son senkronizasyon: ${new Date(
                          platform.lastSync
                        ).toLocaleString()}`
                      : 'Henüz senkronize edilmedi'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={platform.isEnabled}
                    onChange={() => handleTogglePlatform(platform.id)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    Aktif
                  </span>
                </label>
              </div>
            </div>
            <div className="mt-5">
              <label
                htmlFor={`api-key-${platform.id}`}
                className="block text-sm font-medium text-gray-700"
              >
                API Anahtarı
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="password"
                  name={`api-key-${platform.id}`}
                  id={`api-key-${platform.id}`}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={platform.apiKey}
                  onChange={(e) =>
                    handleApiKeyChange(platform.id, e.target.value)
                  }
                />
              </div>
            </div>
            <div className="mt-5 flex space-x-3">
              <button
                type="button"
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={() => handleSave(platform.id)}
              >
                Kaydet
              </button>
              <button
                type="button"
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={() => handleSync(platform.id)}
              >
                Senkronize Et
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 