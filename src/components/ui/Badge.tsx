interface BadgeProps {
  children: React.ReactNode
  variant?: 'green' | 'red' | 'yellow' | 'blue' | 'gray'
  size?: 'sm' | 'md'
}

export function Badge({ children, variant = 'gray', size = 'sm' }: BadgeProps) {
  const variants = {
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    blue: 'bg-blue-100 text-blue-700',
    gray: 'bg-gray-100 text-gray-700',
  }
  const sizes = { sm: 'px-2 py-0.5 text-xs', md: 'px-3 py-1 text-sm' }
  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  )
}
