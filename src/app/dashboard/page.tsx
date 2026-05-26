'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Loading'
import { formatPrice, formatDate } from '@/lib/utils'
import {
  TrendingUp, ShoppingBag, AlertCircle, Users,
  BarChart2, Package, ArrowUpRight
} from 'lucide-react'
import { Order, Product } from '@/types'

interface Stats {
  todaySales: number
  todayOrders: number
  monthSales: number
  monthOrders: number
  totalDebt: number
  debtStudents: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [topProducts, setTopProducts] = useState<{ name: string; total_qty: number; total_sales: number }[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString()

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

    const [todayRes, monthRes, debtRes, topRes, recentRes] = await Promise.all([
      supabase.from('orders').select('total_amount').eq('payment_status', 'paid').gte('created_at', todayStr),
      supabase.from('orders').select('total_amount').eq('payment_status', 'paid').gte('created_at', monthStart),
      supabase.from('orders').select('total_amount, student_id').eq('payment_status', 'debt'),
      supabase.from('order_items').select('quantity, unit_price, products(name)').order('quantity', { ascending: false }).limit(5),
      supabase.from('orders').select('*, students(full_name, classroom)').order('created_at', { ascending: false }).limit(8),
    ])

    const debtStudents = new Set(debtRes.data?.map(o => o.student_id) ?? []).size

    setStats({
      todaySales: todayRes.data?.reduce((s, o) => s + o.total_amount, 0) ?? 0,
      todayOrders: todayRes.data?.length ?? 0,
      monthSales: monthRes.data?.reduce((s, o) => s + o.total_amount, 0) ?? 0,
      monthOrders: monthRes.data?.length ?? 0,
      totalDebt: debtRes.data?.reduce((s, o) => s + o.total_amount, 0) ?? 0,
      debtStudents,
    })

    // Aggregate top products
    const productMap: Record<string, { name: string; total_qty: number; total_sales: number }> = {}
    topRes.data?.forEach((item: any) => {
      const name = item.products?.name ?? 'ไม่ทราบ'
      if (!productMap[name]) productMap[name] = { name, total_qty: 0, total_sales: 0 }
      productMap[name].total_qty += item.quantity
      productMap[name].total_sales += item.quantity * item.unit_price
    })
    setTopProducts(Object.values(productMap).sort((a, b) => b.total_qty - a.total_qty))

    setRecentOrders((recentRes.data ?? []) as Order[])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <Spinner size="lg" />
      </div>
    )
  }

  const statCards = [
    {
      label: 'ยอดขายวันนี้',
      value: `฿${formatPrice(stats?.todaySales ?? 0)}`,
      sub: `${stats?.todayOrders ?? 0} รายการ`,
      icon: TrendingUp,
      color: 'bg-primary-500',
      light: 'bg-primary-50',
      text: 'text-primary-600',
    },
    {
      label: 'ยอดขายเดือนนี้',
      value: `฿${formatPrice(stats?.monthSales ?? 0)}`,
      sub: `${stats?.monthOrders ?? 0} รายการ`,
      icon: BarChart2,
      color: 'bg-blue-500',
      light: 'bg-blue-50',
      text: 'text-blue-600',
    },
    {
      label: 'ยอดค้างชำระ',
      value: `฿${formatPrice(stats?.totalDebt ?? 0)}`,
      sub: `${stats?.debtStudents ?? 0} คน`,
      icon: AlertCircle,
      color: 'bg-red-500',
      light: 'bg-red-50',
      text: 'text-red-600',
    },
  ]

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
        <p className="text-gray-500 text-sm mt-1">ภาพรวมร้านค้าสหกรณ์วันนี้</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map(s => (
          <Card key={s.label} className="flex items-center gap-4">
            <div className={`w-14 h-14 ${s.light} rounded-2xl flex items-center justify-center flex-shrink-0`}>
              <s.icon size={26} className={s.text} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 leading-tight">{s.value}</p>
              <p className={`text-xs font-medium ${s.text}`}>{s.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Package size={18} className="text-primary-600" />
              สินค้าขายดี
            </h2>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white
                    ${i === 0 ? 'bg-accent-500' : i === 1 ? 'bg-gray-400' : 'bg-gray-300'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">ขายไป {p.total_qty} ชิ้น</p>
                  </div>
                  <span className="text-sm font-bold text-primary-600">฿{formatPrice(p.total_sales)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Orders */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag size={18} className="text-primary-600" />
              รายการล่าสุด
            </h2>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">ยังไม่มีรายการ</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {(order as any).students?.full_name ?? '-'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {(order as any).students?.classroom} · {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">฿{formatPrice(order.total_amount)}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                      ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {order.payment_status === 'paid' ? 'จ่ายแล้ว' : 'ติดเงิน'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
