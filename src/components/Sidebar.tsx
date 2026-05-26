'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard, ShoppingCart, Users, Package,
  History, AlertCircle, LogOut, Store, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'แดชบอร์ด' },
  { href: '/pos', icon: ShoppingCart, label: 'ขายสินค้า' },
  { href: '/students', icon: Users, label: 'นักเรียน' },
  { href: '/products', icon: Package, label: 'สินค้า', adminOnly: true },
  { href: '/history', icon: History, label: 'ประวัติการขาย' },
  { href: '/debts', icon: AlertCircle, label: 'ติดเงิน' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
    toast.success('ออกจากระบบแล้ว')
  }

  const filteredNav = navItems.filter(item => !item.adminOnly || profile?.role === 'admin')

  const NavContent = () => (
    <>
      <div className="p-5 border-b border-green-700/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-400 rounded-xl flex items-center justify-center">
            <Store size={22} className="text-green-900" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">ร้านค้าสหกรณ์</p>
            <p className="text-green-300 text-xs">โรงเรียน</p>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1">
        <nav className="space-y-1">
          {filteredNav.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all
                  ${active
                    ? 'bg-white/15 text-white shadow-inner'
                    : 'text-green-200 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <Icon size={20} />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-green-700/30">
        <div className="px-4 py-3 mb-2">
          <p className="text-white font-semibold text-sm truncate">{profile?.full_name}</p>
          <p className="text-green-300 text-xs">
            {profile?.role === 'admin' ? '🔑 ผู้ดูแลระบบ' : '👤 ครู'}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-green-200 hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
        >
          <LogOut size={18} />
          ออกจากระบบ
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-primary-700 text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <Store size={20} className="text-accent-400" />
          <span className="font-bold">ร้านค้าสหกรณ์</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1.5 rounded-lg hover:bg-white/10">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div className={`
        lg:hidden fixed top-0 left-0 bottom-0 z-40 w-64 bg-gradient-to-b from-primary-800 to-primary-900 flex flex-col
        transform transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <NavContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-64 bg-gradient-to-b from-primary-800 to-primary-900 flex-col fixed inset-y-0 left-0 z-30">
        <NavContent />
      </div>
    </>
  )
}
