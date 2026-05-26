'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { Product, Student, Category } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Spinner, EmptyState } from '@/components/ui/Loading'
import { formatPrice } from '@/lib/utils'
import { Search, Plus, Minus, Trash2, ShoppingCart, User, CheckCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function POSPage() {
  const { profile } = useAuth()
  const { items, addItem, removeItem, updateQuantity, clearCart, total, itemCount } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchProduct, setSearchProduct] = useState('')
  const [loading, setLoading] = useState(true)
  const [studentSearch, setStudentSearch] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentLoading, setStudentLoading] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'debt'>('paid')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [studentPickerOpen, setStudentPickerOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [prodRes, catRes] = await Promise.all([
      supabase.from('products').select('*, categories(*)').eq('is_active', true).order('name'),
      supabase.from('categories').select('*').order('name'),
    ])
    setProducts(prodRes.data ?? [])
    setCategories(catRes.data ?? [])
    setLoading(false)
  }

  const searchStudents = useCallback(async (q: string) => {
    if (!q.trim()) { setStudents([]); return }
    setStudentLoading(true)
    const { data } = await supabase
      .from('students')
      .select('*')
      .or(`full_name.ilike.%${q}%,student_code.ilike.%${q}%,classroom.ilike.%${q}%`)
      .limit(10)
    setStudents(data ?? [])
    setStudentLoading(false)
  }, [supabase])

  useEffect(() => {
    const t = setTimeout(() => searchStudents(studentSearch), 300)
    return () => clearTimeout(t)
  }, [studentSearch, searchStudents])

  const filteredProducts = products.filter(p => {
    const matchCat = !selectedCategory || p.category_id === selectedCategory
    const matchSearch = !searchProduct || p.name.toLowerCase().includes(searchProduct.toLowerCase())
    return matchCat && matchSearch
  })

  async function handleCheckout() {
    if (!selectedStudent) { toast.error('กรุณาเลือกนักเรียน'); return }
    if (items.length === 0) { toast.error('ยังไม่มีสินค้าในตะกร้า'); return }
    setCheckoutLoading(true)
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        student_id: selectedStudent.id,
        seller_id: profile?.id,
        total_amount: total,
        payment_status: paymentStatus,
        paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error || !order) { toast.error('เกิดข้อผิดพลาด'); setCheckoutLoading(false); return }

    const orderItems = items.map(i => ({
      order_id: order.id,
      product_id: i.product.id,
      quantity: i.quantity,
      unit_price: i.product.price,
      subtotal: i.quantity * i.product.price,
    }))
    await supabase.from('order_items').insert(orderItems)

    toast.success(`บันทึกรายการสำเร็จ! ยอด ฿${formatPrice(total)}`)
    clearCart()
    setSelectedStudent(null)
    setCheckoutOpen(false)
    setCheckoutLoading(false)
  }

  return (
    <div className="flex h-screen lg:h-auto flex-col lg:flex-row gap-0 lg:gap-4 lg:p-4 overflow-hidden lg:overflow-visible">
      {/* Products Panel */}
      <div className="flex-1 flex flex-col min-h-0 bg-gray-50 lg:bg-transparent">
        <div className="p-4 pb-2 bg-white lg:bg-transparent border-b lg:border-0">
          <h1 className="text-lg font-bold text-gray-900 mb-3 hidden lg:block">ขายสินค้า</h1>
          <Input
            placeholder="ค้นหาสินค้า..."
            value={searchProduct}
            onChange={e => setSearchProduct(e.target.value)}
            icon={<Search size={18} />}
          />
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0
                ${!selectedCategory ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-primary-300'}`}
            >
              ทั้งหมด
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id === selectedCategory ? null : c.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0
                  ${selectedCategory === c.id ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-primary-300'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState icon={<ShoppingCart size={48} />} title="ไม่พบสินค้า" description="ลองเปลี่ยนคำค้นหาหรือหมวดหมู่" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map(product => {
                const cartItem = items.find(i => i.product.id === product.id)
                return (
                  <button
                    key={product.id}
                    onClick={() => addItem(product)}
                    className="bg-white rounded-2xl shadow-card border-2 border-transparent hover:border-primary-400 hover:shadow-card-hover transition-all p-4 text-left active:scale-95 relative group"
                  >
                    {cartItem && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-600 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-md">
                        {cartItem.quantity}
                      </div>
                    )}
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full aspect-square object-cover rounded-xl mb-3 bg-gray-100" />
                    ) : (
                      <div className="w-full aspect-square bg-primary-50 rounded-xl mb-3 flex items-center justify-center text-4xl">
                        🛍️
                      </div>
                    )}
                    <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{product.name}</p>
                    <p className="text-primary-600 font-bold mt-1 text-base">฿{formatPrice(product.price)}</p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="lg:w-80 xl:w-96 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col lg:rounded-2xl lg:shadow-card max-h-64 lg:max-h-none lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
        {/* Student Selector */}
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={() => setStudentPickerOpen(true)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
              ${selectedStudent ? 'border-primary-400 bg-primary-50' : 'border-dashed border-gray-300 hover:border-primary-400'}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
              ${selectedStudent ? 'bg-primary-600' : 'bg-gray-100'}`}>
              <User size={18} className={selectedStudent ? 'text-white' : 'text-gray-400'} />
            </div>
            {selectedStudent ? (
              <div>
                <p className="font-semibold text-gray-900 text-sm">{selectedStudent.full_name}</p>
                <p className="text-xs text-gray-500">{selectedStudent.classroom} · {selectedStudent.student_code}</p>
              </div>
            ) : (
              <p className="text-gray-400 text-sm font-medium">กดเพื่อเลือกนักเรียน</p>
            )}
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.length === 0 ? (
            <EmptyState icon={<ShoppingCart size={32} />} title="ยังไม่มีสินค้า" description="กดสินค้าเพื่อเพิ่มลงตะกร้า" />
          ) : (
            items.map(item => (
              <div key={item.product.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-500">฿{formatPrice(item.product.price)}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-7 h-7 bg-white rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 active:scale-90 transition-all">
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center hover:bg-primary-700 active:scale-90 transition-all">
                    <Plus size={14} className="text-white" />
                  </button>
                  <button onClick={() => removeItem(item.product.id)}
                    className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center hover:bg-red-100 active:scale-90 transition-all ml-1">
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-medium">{itemCount} รายการ</span>
            <span className="text-2xl font-bold text-gray-900">฿{formatPrice(total)}</span>
          </div>
          {items.length > 0 && (
            <Button
              onClick={() => setCheckoutOpen(true)}
              size="lg"
              className="w-full"
              disabled={!selectedStudent}
            >
              <ShoppingCart size={20} />
              ชำระเงิน
            </Button>
          )}
          {!selectedStudent && items.length > 0 && (
            <p className="text-xs text-center text-orange-500 font-medium">กรุณาเลือกนักเรียนก่อนชำระเงิน</p>
          )}
        </div>
      </div>

      {/* Student Picker Modal */}
      <Modal open={studentPickerOpen} onClose={() => setStudentPickerOpen(false)} title="ค้นหานักเรียน">
        <Input
          placeholder="ชื่อ, รหัสนักเรียน, ห้องเรียน..."
          value={studentSearch}
          onChange={e => setStudentSearch(e.target.value)}
          icon={<Search size={18} />}
          autoFocus
        />
        <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
          {studentLoading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : students.length === 0 && studentSearch ? (
            <EmptyState title="ไม่พบนักเรียน" description="ลองค้นหาด้วยชื่อหรือรหัสนักเรียน" />
          ) : (
            students.map(s => (
              <button
                key={s.id}
                onClick={() => { setSelectedStudent(s); setStudentPickerOpen(false); setStudentSearch('') }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 border-2 border-transparent hover:border-primary-200 transition-all text-left"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center font-bold text-primary-700 flex-shrink-0">
                  {s.full_name[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{s.full_name}</p>
                  <p className="text-xs text-gray-500">{s.classroom} · เลขที่ {s.student_number} · {s.student_code}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </Modal>

      {/* Checkout Modal */}
      <Modal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} title="ยืนยันการชำระเงิน">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-2">นักเรียน</p>
            <p className="font-bold text-gray-900">{selectedStudent?.full_name}</p>
            <p className="text-sm text-gray-500">{selectedStudent?.classroom}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2 max-h-40 overflow-y-auto">
            {items.map(i => (
              <div key={i.product.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{i.product.name} x{i.quantity}</span>
                <span className="font-semibold">฿{formatPrice(i.product.price * i.quantity)}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold text-base">
              <span>รวมทั้งหมด</span>
              <span className="text-primary-600">฿{formatPrice(total)}</span>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">สถานะการชำระเงิน</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentStatus('paid')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                  ${paymentStatus === 'paid' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <CheckCircle size={24} className={paymentStatus === 'paid' ? 'text-primary-600' : 'text-gray-300'} />
                <span className={`font-bold text-sm ${paymentStatus === 'paid' ? 'text-primary-700' : 'text-gray-500'}`}>จ่ายแล้ว</span>
              </button>
              <button
                onClick={() => setPaymentStatus('debt')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                  ${paymentStatus === 'debt' ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <Clock size={24} className={paymentStatus === 'debt' ? 'text-red-500' : 'text-gray-300'} />
                <span className={`font-bold text-sm ${paymentStatus === 'debt' ? 'text-red-600' : 'text-gray-500'}`}>ติดเงิน</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setCheckoutOpen(false)} size="lg">ยกเลิก</Button>
            <Button onClick={handleCheckout} loading={checkoutLoading} size="lg">บันทึก</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
