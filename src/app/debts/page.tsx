'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner, EmptyState } from '@/components/ui/Loading'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { formatPrice, formatDate } from '@/lib/utils'
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

interface DebtOrder {
  id: string
  total_amount: number
  created_at: string
  payment_status: string
  order_items: { quantity: number; unit_price: number; products: { name: string } }[]
}

interface StudentDebt {
  id: string
  full_name: string
  classroom: string
  student_number: number
  orders: DebtOrder[]
  total: number
}

export default function DebtsPage() {
  const [debtors, setDebtors] = useState<StudentDebt[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [payOrderId, setPayOrderId] = useState<string | null>(null)
  const [payStudentId, setPayStudentId] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const supabase = createClient()

  useEffect(() => { loadDebts() }, [])

  async function loadDebts() {
    const { data } = await supabase
      .from('orders')
      .select('*, students(*), order_items(*, products(name))')
      .eq('payment_status', 'debt')
      .order('created_at', { ascending: false })

    const map: Record<string, StudentDebt> = {}
    ;(data ?? []).forEach((o: any) => {
      const sid = o.student_id
      if (!map[sid]) {
        map[sid] = { ...o.students, orders: [], total: 0 }
      }
      map[sid].orders.push(o)
      map[sid].total += o.total_amount
    })

    setDebtors(Object.values(map).sort((a, b) => b.total - a.total))
    setLoading(false)
  }

  async function payOrder(orderId: string) {
    setPaying(true)
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', orderId)
    if (error) { toast.error('เกิดข้อผิดพลาด') }
    else { toast.success('ชำระเงินสำเร็จ!') }
    setPaying(false)
    setPayOrderId(null)
    loadDebts()
  }

  async function payAllStudent(studentId: string) {
    setPaying(true)
    const studentDebts = debtors.find(d => d.id === studentId)
    if (!studentDebts) { setPaying(false); return }
    const ids = studentDebts.orders.map(o => o.id)
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
      .in('id', ids)
    if (error) { toast.error('เกิดข้อผิดพลาด') }
    else { toast.success(`ชำระครบ ฿${formatPrice(studentDebts.total)} สำเร็จ!`) }
    setPaying(false)
    setPayStudentId(null)
    setExpanded(null)
    loadDebts()
  }

  const totalDebt = debtors.reduce((s, d) => s + d.total, 0)

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ติดเงิน</h1>
        <p className="text-gray-500 text-sm">{debtors.length} คน · ยอดรวม ฿{formatPrice(totalDebt)}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">นักเรียนติดเงิน</p>
            <p className="text-2xl font-bold text-red-600">{debtors.length} คน</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
            <span className="text-orange-500 font-bold text-lg">฿</span>
          </div>
          <div>
            <p className="text-sm text-gray-500">ยอดค้างรวม</p>
            <p className="text-2xl font-bold text-orange-600">฿{formatPrice(totalDebt)}</p>
          </div>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : debtors.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CheckCircle size={48} className="text-green-400" />}
            title="ไม่มีนักเรียนติดเงิน"
            description="ยอดเยี่ยม! นักเรียนชำระเงินครบทุกคนแล้ว"
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {debtors.map(d => (
            <Card key={d.id} padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center font-bold text-red-600 flex-shrink-0">
                  {d.full_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{d.full_name}</p>
                  <p className="text-xs text-gray-500">{d.classroom} · {d.orders.length} รายการ</p>
                </div>
                <div className="text-right flex-shrink-0 mr-2">
                  <p className="font-bold text-red-600">฿{formatPrice(d.total)}</p>
                  <Badge variant="red">{d.orders.length} รายการ</Badge>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" onClick={() => setPayStudentId(d.id)}>
                    <CheckCircle size={15} />จ่ายครบ
                  </Button>
                  <button
                    onClick={() => setExpanded(expanded === d.id ? null : d.id)}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    {expanded === d.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {expanded === d.id && (
                <div className="mt-4 space-y-2 border-t pt-4">
                  {d.orders.map(order => (
                    <div key={order.id} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                        <Button size="sm" variant="secondary" onClick={() => setPayOrderId(order.id)}>
                          <CheckCircle size={14} />ชำระ
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {order.order_items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-600">{item.products.name} × {item.quantity}</span>
                            <span className="text-gray-700 font-medium">฿{formatPrice(item.unit_price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between font-bold text-sm border-t mt-2 pt-2">
                        <span>รวม</span>
                        <span className="text-primary-600">฿{formatPrice(order.total_amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!payOrderId}
        onClose={() => setPayOrderId(null)}
        onConfirm={() => payOrderId && payOrder(payOrderId)}
        title="ยืนยันการชำระเงิน"
        message="ต้องการบันทึกว่าชำระเงินรายการนี้แล้วใช่ไหม?"
        confirmLabel="ยืนยันชำระ"
        loading={paying}
      />

      <ConfirmDialog
        open={!!payStudentId}
        onClose={() => setPayStudentId(null)}
        onConfirm={() => payStudentId && payAllStudent(payStudentId)}
        title="ชำระเงินทั้งหมด"
        message={`ต้องการบันทึกว่าชำระเงินครบทุกรายการของนักเรียนคนนี้แล้วใช่ไหม?`}
        confirmLabel="ยืนยันชำระทั้งหมด"
        loading={paying}
      />
    </div>
  )
}
