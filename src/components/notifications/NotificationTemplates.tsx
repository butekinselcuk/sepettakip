import { useState, useEffect } from 'react'
import { NotificationType } from '@/lib/notifications'
import { NotificationTemplate } from '@/lib/notificationTemplates'

type TemplateFormData = Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>

export default function NotificationTemplates() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null)
  const [formData, setFormData] = useState<TemplateFormData>({
    type: 'ORDER_ASSIGNED',
    name: '',
    description: '',
    variables: [],
    translations: {
      tr: { title: '', message: '' },
      en: { title: '', message: '' },
    },
    defaultLanguage: 'tr',
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/notifications/templates')
      if (!response.ok) throw new Error('Şablonlar getirilemedi')
      const data = await response.json()
      setTemplates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingTemplate
        ? '/api/notifications/templates'
        : '/api/notifications/templates'
      const method = editingTemplate ? 'PATCH' : 'POST'
      const body = editingTemplate
        ? { id: editingTemplate.id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error('Şablon kaydedilemedi')
      await fetchTemplates()
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu şablonu silmek istediğinizden emin misiniz?')) return

    try {
      const response = await fetch('/api/notifications/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) throw new Error('Şablon silinemedi')
      await fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    }
  }

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template)
    setFormData({
      type: template.type,
      name: template.name,
      description: template.description,
      variables: template.variables,
      translations: template.translations,
      defaultLanguage: template.defaultLanguage,
    })
  }

  const resetForm = () => {
    setEditingTemplate(null)
    setFormData({
      type: 'ORDER_ASSIGNED',
      name: '',
      description: '',
      variables: [],
      translations: {
        tr: { title: '', message: '' },
        en: { title: '', message: '' },
      },
      defaultLanguage: 'tr',
    })
  }

  const addVariable = () => {
    setFormData((prev) => ({
      ...prev,
      variables: [
        ...prev.variables,
        { name: '', description: '', required: false },
      ],
    }))
  }

  const updateVariable = (index: number, field: keyof typeof formData.variables[0], value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      variables: prev.variables.map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      ),
    }))
  }

  const removeVariable = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index),
    }))
  }

  if (loading) return <div>Yükleniyor...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">
        {editingTemplate ? 'Şablon Düzenle' : 'Yeni Şablon Oluştur'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Şablon Tipi
          </label>
          <select
            value={formData.type}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, type: e.target.value as NotificationType }))
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="ORDER_ASSIGNED">Sipariş Atama</option>
            <option value="ORDER_STATUS_CHANGED">Sipariş Durumu Değişikliği</option>
            <option value="ZONE_BOUNDARY_ALERT">Bölge Sınırı Uyarısı</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Şablon Adı
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Açıklama
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Değişkenler
          </label>
          <div className="mt-2 space-y-2">
            {formData.variables.map((variable, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={variable.name}
                  onChange={(e) => updateVariable(index, 'name', e.target.value)}
                  placeholder="Değişken Adı"
                  className="block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={variable.description}
                  onChange={(e) => updateVariable(index, 'description', e.target.value)}
                  placeholder="Açıklama"
                  className="block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={variable.required}
                    onChange={(e) => updateVariable(index, 'required', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Zorunlu</span>
                </label>
                <button
                  type="button"
                  onClick={() => removeVariable(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Sil
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addVariable}
              className="text-blue-600 hover:text-blue-800"
            >
              + Değişken Ekle
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Çeviriler
          </label>
          <div className="mt-2 space-y-4">
            {Object.entries(formData.translations).map(([lang, translation]) => (
              <div key={lang} className="space-y-2">
                <h3 className="text-lg font-medium">{lang.toUpperCase()}</h3>
                <input
                  type="text"
                  value={translation.title}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      translations: {
                        ...prev.translations,
                        [lang]: { ...translation, title: e.target.value },
                      },
                    }))
                  }
                  placeholder="Başlık"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <textarea
                  value={translation.message}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      translations: {
                        ...prev.translations,
                        [lang]: { ...translation, message: e.target.value },
                      },
                    }))
                  }
                  placeholder="Mesaj"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Varsayılan Dil
          </label>
          <select
            value={formData.defaultLanguage}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, defaultLanguage: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={resetForm}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {editingTemplate ? 'Güncelle' : 'Oluştur'}
          </button>
        </div>
      </form>

      <div className="mt-8">
        <h3 className="text-lg font-medium">Mevcut Şablonlar</h3>
        <div className="mt-4 space-y-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-medium">{template.name}</h4>
                  <p className="text-sm text-gray-500">{template.description}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(template)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Sil
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  Tip: {template.type}
                </p>
                <p className="text-sm text-gray-600">
                  Değişkenler: {template.variables.map((v) => v.name).join(', ')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 