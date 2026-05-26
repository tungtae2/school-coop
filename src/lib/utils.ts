import { format, isToday, isThisMonth } from 'date-fns'
import { th } from 'date-fns/locale'

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'd MMM yyyy HH:mm', { locale: th })
}

export function formatDateShort(dateStr: string): string {
  return format(new Date(dateStr), 'd MMM yyyy', { locale: th })
}

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h]
        const str = val == null ? '' : String(val)
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
      }).join(',')
    ),
  ].join('\n')
  const bom = '\uFEFF'
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export const CLASSROOM_OPTIONS = [
  'ป.1/1','ป.1/2','ป.1/3',
  'ป.2/1','ป.2/2','ป.2/3',
  'ป.3/1','ป.3/2','ป.3/3',
  'ป.4/1','ป.4/2','ป.4/3',
  'ป.5/1','ป.5/2','ป.5/3',
  'ป.6/1','ป.6/2','ป.6/3',
  'ม.1/1','ม.1/2','ม.1/3',
  'ม.2/1','ม.2/2','ม.2/3',
  'ม.3/1','ม.3/2','ม.3/3',
  'ม.4/1','ม.4/2','ม.4/3',
  'ม.5/1','ม.5/2','ม.5/3',
  'ม.6/1','ม.6/2','ม.6/3',
]
