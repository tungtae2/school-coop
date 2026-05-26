'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Product, Category } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { Spinner, EmptyState } from '@/components/ui/Loading'
import { Badge } from '@/components/ui/Badge'
import { formatPrice } from '@/lib/utils'
import { Search, Plus, Edit2, Trash2, Package, Image, Tag } from 'lucide-react'
import toast from 'react-hot-toast'

const defaultForm = { name: '', price: '', category_id: '', is_active: true }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filtered, setFiltered] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [catName, setCatName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (!search.trim()) { setFiltered(products); return }
    const q = search.toLowerCase()
    setFiltered(products.filter(p => p.name.toLowerCase().includes(q)))
  }, [search, products])

  async function loadData() {
    const [prodRes, catRes] = await Promise.all([
      supabase.from('products').select('*, categories(*)').order('name'),
      supabase.from('categories').select('*').order('name'),
    ])
    setProducts(prodRes.data ?? [])
    setFiltered(prodRes.data ?? [])
    setCategories(catRes.data ?? [])
    setLoading(false)
  }

  function openAdd() {
    setEditProduct(null)
    setForm(defaultForm)
    setImageFile(null)
    setImagePreview(null)
    setModalOpen(true)
  }

  function openEdit(p: Product) {
    setEditProduct(p)
    setForm({ name: p.name, price: String(p.price), category_id: p.category_id ?? '', is_active: p.is_active })
    setImagePreview(p.image_url)
    setImageFile(null)
    setModalOpen(true)
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!form.name || !form.price) { toast.error('กรุณากรอกชื่อและราคา'); return }
    setSaving(true)
    let imageUrl = editProduct?.image_url ?? null

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `products/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('images').upload(path, imageFile)
      if (!upErr) {
        const { data } = supabase.storage.from('images').getPublicUrl(path)
        imageUrl = data.publicUrl
      }
    }

    const payload = {
      name: form.name,
      price: parseFloat(form.price),
      category_id: form.category_id || null,
      is_active: form.is_active,
      image_url: imageUrl,
    }

    if (editProduct) {
      const { error } = await supabase.from('products').update(payload).eq('id', editProduct.id)
      if (error) { toast.error('เกิดข้อผิดพลาด'); setSaving(false); return }
      toast.success('แก้ไขสินค้าสำเร็จ')
    } else {
      const { error } = await supabase.from('products').insert({ ...payload, stock: 0 })
      if (error) { toast.error('เกิดข้อผิดพลาด'); setSaving(false); return }
      toast.success('เพิ่มสินค้าสำเร็จ')
    }

    setModalOpen(false)
    setSaving(false)
    loadData()
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    await supabase.from('products').delete().eq('id', deleteId)
    toast.success('ลบสินค้าสำเร็จ')
    setDeleteId(null)
    setDeleting(false)
    loadData()
  }

  async function handleAddCategory() {
    if (!catName.trim()) return
    const { error } = await supabase.from('categories').insert({ name: catName, color: '#16a34a' })
    if (error) { toast.error('เกิดข้อผิดพลาด'); return }
    toast.success('เพิ่มหมวดหมู่สำเร็จ')
    setCatName('')
    setCatModalOpen(false)
    loadData()
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการสินค้า</h1>
          <p className="text-gray-500 text-sm">ทั้งหมด {products.length} รายการ</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setCatModalOpen(true)} size="lg">
            <Tag size={18} />หมวดหมู่
          </Button>
          <Button onClick={openAdd} size="lg"><Plus size={20} />เพิ่มสินค้า</Button>
        </div>
      </div>

      <Input
        placeholder="ค้นหาสินค้า..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        icon={<Search size={18} />}
      />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<Package size={48} />} title="ไม่พบสินค้า" description="กดปุ่มเพิ่มสินค้าเพื่อเริ่มต้น" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => (
            <Card key={p.id} padding="sm" className="hover:shadow-card-hover transition-shadow">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-full h-36 object-cover rounded-xl mb-3 bg-gray-100" />
              ) : (
                <div className="w-full h-36 bg-primary-50 rounded-xl mb-3 flex items-center justify-center text-5xl">🛍️</div>
              )}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-gray-900 leading-tight">{p.name}</p>
                  <Badge variant={p.is_active ? 'green' : 'gray'}>{p.is_active ? 'เปิด' : 'ปิด'}</Badge>
                </div>
                {p.category && (
                  <Badge variant="blue">{p.category.name}</Badge>
                )}
                <p className="text-primary-600 font-bold text-lg">฿{formatPrice(p.price)}</p>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => openEdit(p)} className="flex-1 py-2 rounded-xl bg-primary-50 text-primary-700 text-sm font-semibold hover:bg-primary-100 transition-colors flex items-center justify-center gap-1.5">
                    <Edit2 size={15} />แก้ไข
                  </button>
                  <button onClick={() => setDeleteId(p.id)} className="py-2 px-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Product Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">รูปภาพสินค้า</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-primary-400 transition-colors text-center"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="" className="w-full h-32 object-cover rounded-lg" />
              ) : (
                <div className="py-4">
                  <Image size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">กดเพื่ออัปโหลดรูปภาพ</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          <Input label="ชื่อสินค้า" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="เช่น ขนมปัง" />
          <Input label="ราคา (บาท)" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" min="0" step="0.5" />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">หมวดหมู่</label>
            <select
              value={form.category_id}
              onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:outline-none focus:border-primary-500 bg-white"
            >
              <option value="">ไม่ระบุหมวดหมู่</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="isActive" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-5 h-5 accent-primary-600 rounded" />
            <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">เปิดขายสินค้า</label>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSave} loading={saving}>บันทึก</Button>
          </div>
        </div>
      </Modal>

      {/* Category Modal */}
      <Modal open={catModalOpen} onClose={() => setCatModalOpen(false)} title="จัดการหมวดหมู่" size="sm">
        <div className="space-y-4">
          <div className="space-y-2">
            {categories.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="font-medium text-gray-900">{c.name}</span>
                <button
                  onClick={async () => { await supabase.from('categories').delete().eq('id', c.id); loadData() }}
                  className="text-red-400 hover:text-red-600"
                ><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={catName} onChange={e => setCatName(e.target.value)} placeholder="ชื่อหมวดหมู่ใหม่" />
            <Button onClick={handleAddCategory}><Plus size={18} /></Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="ลบสินค้า"
        message="ต้องการลบสินค้านี้ใช่ไหม?"
        confirmLabel="ลบเลย"
        loading={deleting}
      />
    </div>
  )
}
