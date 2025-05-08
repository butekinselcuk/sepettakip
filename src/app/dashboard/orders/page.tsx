import { Suspense } from 'react'
import OrderList from '@/components/orders/OrderList'
import OrderFilter from '@/components/orders/OrderFilter'

export default function OrdersPage() {
  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Siparişler</h1>
          <p className="mt-2 text-sm text-gray-700">
            Tüm siparişlerin listesi ve yönetimi
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Yeni Sipariş
          </button>
        </div>
      </div>

      <div className="mt-8">
        <OrderFilter />
      </div>

      <div className="mt-8">
        <Suspense fallback={<div>Yükleniyor...</div>}>
          <OrderList />
        </Suspense>
      </div>
    </div>
  )
} 