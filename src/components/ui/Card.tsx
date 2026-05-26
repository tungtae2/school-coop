import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg'
}

export function Card({ children, className = '', padding = 'md', ...props }: CardProps) {
  const paddings = { sm: 'p-3', md: 'p-5', lg: 'p-6' }
  return (
    <div
      className={`bg-white rounded-2xl shadow-card border border-gray-100 ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
