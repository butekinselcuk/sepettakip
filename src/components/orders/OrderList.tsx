import { useState, useEffect } from 'react'
import Link from 'next/link'
import { OrderStatus, Platform } from '@prisma/client'
import { useWebSocket } from '@/hooks/useWebSocket'

type Order = {
  id: string
  orderNumber: string
  status: OrderStatus
  platform: Platform
  customer: {
    name: string
  }
  totalAmount: number
  createdAt: string
}

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const ws = useWebSocket()

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders')
        const data = await response.json()
        setOrders(data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching orders:', error)
        setLoading(false)
      }
    }

    fetchOrders()

    // Subscribe to order updates
    ws.onOrderUpdate((update) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === update.orderId
            ? { ...order, status: update.status }
            : order
        )
      )
    })

    // Subscribe to platform sync updates
    ws.onPlatformSync((data) => {
      if (data.orders) {
        setOrders((prevOrders) => {
          const updatedOrders = [...prevOrders]
          data.orders.forEach((newOrder: Order) => {
            const index = updatedOrders.findIndex((o) => o.id === newOrder.id)
            if (index >= 0) {
              updatedOrders[index] = newOrder
            } else {
              updatedOrders.push(newOrder)
            }
          })
          return updatedOrders
        })
      }
    })
  }, [ws])

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
      case 'ACCEPTED':
        return 'bg-blue-50 text-blue-700 ring-blue-600/20'
      case 'PREPARING':
        return 'bg-purple-50 text-purple-700 ring-purple-600/20'
      case 'READY_FOR_PICKUP':
        return 'bg-orange-50 text-orange-700 ring-orange-600/20'
      case 'PICKED_UP':
        return 'bg-indigo-50 text-indigo-700 ring-indigo-600/20'
      case 'IN_TRANSIT':
        return 'bg-pink-50 text-pink-700 ring-pink-600/20'
      case 'DELIVERED':
        return 'bg-green-50 text-green-700 ring-green-600/20'
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 ring-red-600/20'
      default:
        return 'bg-gray-50 text-gray-700 ring-gray-600/20'
    }
  }

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 'Beklemede'
      case 'ACCEPTED':
        return 'Kabul Edildi'
      case 'PREPARING':
        return 'Hazırlanıyor'
      case 'READY_FOR_PICKUP':
        return 'Teslimata Hazır'
      case 'PICKED_UP':
        return 'Teslim Alındı'
      case 'IN_TRANSIT':
        return 'Yolda'
      case 'DELIVERED':
        return 'Teslim Edildi'
      case 'CANCELLED':
        return 'İptal Edildi'
      default:
        return status
    }
  }

  if (loading) {
    return <div>Yükleniyor...</div>
  }

  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                >
                  Sipariş No
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Müşteri
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Platform
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Tutar
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Durum
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Tarih
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                  <span className="sr-only">İşlemler</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                    {order.orderNumber}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {order.customer.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {order.platform}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    ₺{order.totalAmount.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Detay
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 