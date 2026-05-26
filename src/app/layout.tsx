import type { Metadata } from 'next'
import { Sarabun } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'
import { Toaster } from 'react-hot-toast'

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sarabun',
})

export const metadata: Metadata = {
  title: 'ระบบร้านค้าสหกรณ์โรงเรียน',
  description: 'ระบบจัดการร้านค้าสหกรณ์โรงเรียน',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`${sarabun.variable} font-sans bg-gray-50 text-gray-900`}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { fontFamily: 'Sarabun, sans-serif', fontSize: '14px' },
              success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
