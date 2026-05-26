'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Store, Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    } else {
      toast.success('เข้าสู่ระบบสำเร็จ!')
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-400/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-accent-400 rounded-2xl shadow-xl mb-4">
            <Store size={36} className="text-green-900" />
          </div>
          <h1 className="text-3xl font-bold text-white">ร้านค้าสหกรณ์</h1>
          <p className="text-green-300 mt-1">ระบบจัดการร้านค้าโรงเรียน</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">เข้าสู่ระบบ</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="อีเมล"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="teacher@school.ac.th"
              icon={<Mail size={18} />}
              required
            />
            <Input
              label="รหัสผ่าน"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock size={18} />}
              required
            />
            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </Button>
          </form>
        </div>

        <p className="text-center text-green-300 text-sm mt-6">
          ติดต่อผู้ดูแลระบบหากต้องการสร้างบัญชี
        </p>
      </div>
    </div>
  )
}
