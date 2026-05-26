'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Order } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Spinner, EmptyState } from '@/components/ui/Loading'
import { Badge } from '@/components/ui/Badge'
import { formatPrice, formatDate, exportToCSV, CLASSROOM_OPTIONS } from '@/lib/utils'
import { Search, History, Download, Eye, Filter } from 'lucide-react'
import { format } from 'date-fns'

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [classroom, setClassroom] = useState('')
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const supabase = createClient()

  useEffect(() => { loadOrders() }, [search, dateFrom, dateTo, classroom])

  async function loadOrders() {
    let query = supabase
      .from('orders')
      .select('*, students(*), users:seller_id(*), order_items(*, products(*))')
      .order('created_at', { ascending: false })
      .limit(200)

    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

    const { data } = await query
    let result = data ?? []

    if (search) {
      const q = search.toLowerCase()
      result = result.filter((o: any) =>
        o.students?.full_name?.toLowerCase().includes(q) ||
        o.students?.student_code?.toLowerCase().includes(q)
      )
    }
    if (classroom) {
      result = result.filter((o: any) => o.students?.classroom === classroom)
    }

    setOrders(result as Order[])
    setLoading(false)
  }

  function handleExport() {
    const data = orders.map((o: any) => ({
      วันที่: formatDate(o.created_at),
      ชื่อนักเรียน: o.students?.full_name ?? '',
      ห้องเรียน: o.students?.classroom ?? '',
      รหัสนักเรียน: o.students?.student_code ?? '',
      ยอดเงิน: o.total_amount,
      สถานะ: o.payment_status === 'paid' ? 'จ่ายแล้ว' : 'ติดเงิน',
      ผู้ขาย: o.users?.full_name ?? '',
    }))
    exportToCSV(data, `ประวัติการขาย_${format(new Date(), 'yyyy-MM-dd')}`)
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ประวัติการขาย</h1>
          <p className="text-gray-500 text-sm">{orders.length} รายการ</p>
        </div>
        <Button variant="secondary" onClick={handleExport}><Download size={18} />ส่งออก CSV</Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="ค้นหาชื่อหรือรหัสนักเรียน..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            icon={<Search size={16} />}
          />
          <Input type="date" label="" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="จากวันที่" />
          <Input type="date" label="" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="ถึงวันที่" />
          <select
            value={classroom}
            onChange={e => setClassroom(e.target.value)}
            className="rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:outline-none focus:border-primary-500 bg-white"
          >
            <option value="">ทุกห้องเรียน</option>
            {CLASSROOM_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : orders.length === 0 ? (
        <Card>
          <EmptyState icon={<History size={48} />} title="ไม่พบรายการ" description="ลองเปลี่ยนเงื่อนไขการค้นหา" />
        </Card>
      ) : (
        <div className="space-y-2">
          {orders.map((order: any) => (
            <Card key={order.id} padding="sm" className="hover:shadow-card-hover transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center font-bold text-primary-700 flex-shrink-0 text-sm">
                  {order.students?.full_name?.[0] ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{order.students?.full_name ?? 'ไม่ทราบ'}</p>
                  <p className="text-xs text-gray-400">{order.students?.classroom} · {formatDate(order.created_at)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-900">฿{formatPrice(order.total_amount)}</p>
                  <Badge variant={order.payment_status === 'paid' ? 'green' : 'red'}>
                    {order.payment_status === 'paid' ? 'จ่ายแล้ว' : 'ติดเงิน'}
                  </Badge>
                </div>
                <button
                  onClick={() => setDetailOrder(order)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Eye size={18} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal open={!!detailOrder} onClose={() => setDetailOrder(null)} title="รายละเอียดการซื้อ">
        {detailOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">นักเรียน</p>
                <p className="font-semibold">{(detailOrder as any).students?.full_name}</p>
                <p className="text-xs text-gray-500">{(detailOrder as any).students?.classroom}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">วันที่</p>
                <p className="font-semibold text-sm">{formatDate(detailOrder.created_at)}</p>
                <Badge variant={detailOrder.payment_status === 'paid' ? 'green' : 'red'} size="sm">
                  {detailOrder.payment_status === 'paid' ? 'จ่ายแล้ว' : 'ติดเงิน'}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-bold text-gray-700">รายการสินค้า</p>
              {((detailOrder as any).order_items ?? []).map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm bg-gray-50 px-3 py-2 rounded-lg">
                  <span className="text-gray-700">{item.products?.name} × {item.quantity}</span>
                  <span className="font-semibold">฿{formatPrice(item.subtotal)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>รวมทั้งหมด</span>
                <span className="text-primary-600">฿{formatPrice(detailOrder.total_amount)}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400">ผู้ขาย: {(detailOrder as any).users?.full_name ?? '-'}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
