'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Student } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { Spinner, EmptyState } from '@/components/ui/Loading'
import { CLASSROOM_OPTIONS } from '@/lib/utils'
import { Search, Plus, Edit2, Trash2, Users } from 'lucide-react'
import toast from 'react-hot-toast'

const defaultForm = { full_name: '', student_code: '', classroom: '', student_number: '' }

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [filtered, setFiltered] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  useEffect(() => { loadStudents() }, [])

  useEffect(() => {
    if (!search.trim()) { setFiltered(students); return }
    const q = search.toLowerCase()
    setFiltered(students.filter(s =>
      s.full_name.toLowerCase().includes(q) ||
      s.student_code.toLowerCase().includes(q) ||
      s.classroom.toLowerCase().includes(q)
    ))
  }, [search, students])

  async function loadStudents() {
    const { data } = await supabase.from('students').select('*').order('classroom').order('student_number')
    setStudents(data ?? [])
    setFiltered(data ?? [])
    setLoading(false)
  }

  function openAdd() {
    setEditStudent(null)
    setForm(defaultForm)
    setModalOpen(true)
  }

  function openEdit(s: Student) {
    setEditStudent(s)
    setForm({ full_name: s.full_name, student_code: s.student_code, classroom: s.classroom, student_number: String(s.student_number) })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.full_name || !form.student_code || !form.classroom || !form.student_number) {
      toast.error('กรุณากรอกข้อมูลให้ครบ')
      return
    }
    setSaving(true)
    const payload = { ...form, student_number: parseInt(form.student_number) }
    if (editStudent) {
      const { error } = await supabase.from('students').update(payload).eq('id', editStudent.id)
      if (error) { toast.error('เกิดข้อผิดพลาด'); setSaving(false); return }
      toast.success('แก้ไขข้อมูลสำเร็จ')
    } else {
      const { error } = await supabase.from('students').insert(payload)
      if (error) { toast.error('เกิดข้อผิดพลาด'); setSaving(false); return }
      toast.success('เพิ่มนักเรียนสำเร็จ')
    }
    setModalOpen(false)
    setSaving(false)
    loadStudents()
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    await supabase.from('students').delete().eq('id', deleteId)
    toast.success('ลบนักเรียนสำเร็จ')
    setDeleteId(null)
    setDeleting(false)
    loadStudents()
  }

  // Group by classroom
  const grouped = filtered.reduce<Record<string, Student[]>>((acc, s) => {
    acc[s.classroom] = acc[s.classroom] ?? []
    acc[s.classroom].push(s)
    return acc
  }, {})

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">นักเรียน</h1>
          <p className="text-gray-500 text-sm">ทั้งหมด {students.length} คน</p>
        </div>
        <Button onClick={openAdd} size="lg"><Plus size={20} />เพิ่มนักเรียน</Button>
      </div>

      <Input
        placeholder="ค้นหาชื่อ, รหัส, ห้องเรียน..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        icon={<Search size={18} />}
      />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<Users size={48} />} title="ไม่พบนักเรียน" description="กดปุ่มเพิ่มนักเรียนเพื่อเริ่มต้น" />
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort().map(([classroom, studs]) => (
            <div key={classroom}>
              <h2 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                <span className="bg-primary-600 text-white px-3 py-1 rounded-full">{classroom}</span>
                <span className="text-gray-400">{studs.length} คน</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {studs.map(s => (
                  <Card key={s.id} padding="sm" className="flex items-center gap-3 hover:shadow-card-hover transition-shadow">
                    <div className="w-11 h-11 bg-primary-100 rounded-xl flex items-center justify-center font-bold text-primary-700 text-lg flex-shrink-0">
                      {s.full_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{s.full_name}</p>
                      <p className="text-xs text-gray-500">เลขที่ {s.student_number} · {s.student_code}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => setDeleteId(s.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editStudent ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียน'}>
        <div className="space-y-4">
          <Input
            label="ชื่อ-นามสกุล"
            value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
            placeholder="เช่น สมชาย ใจดี"
          />
          <Input
            label="รหัสนักเรียน"
            value={form.student_code}
            onChange={e => setForm(f => ({ ...f, student_code: e.target.value }))}
            placeholder="เช่น 65001"
          />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">ห้องเรียน</label>
            <select
              value={form.classroom}
              onChange={e => setForm(f => ({ ...f, classroom: e.target.value }))}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:outline-none focus:border-primary-500 transition-colors bg-white"
            >
              <option value="">เลือกห้องเรียน</option>
              {CLASSROOM_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input
            label="เลขที่"
            type="number"
            value={form.student_number}
            onChange={e => setForm(f => ({ ...f, student_number: e.target.value }))}
            placeholder="เช่น 1"
            min="1"
          />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSave} loading={saving}>บันทึก</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="ลบนักเรียน"
        message="ต้องการลบข้อมูลนักเรียนนี้ใช่ไหม? ข้อมูลจะถูกลบถาวร"
        confirmLabel="ลบเลย"
        loading={deleting}
      />
    </div>
  )
}
