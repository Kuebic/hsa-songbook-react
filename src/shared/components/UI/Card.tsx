import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('bg-white p-6 rounded-lg shadow', className)}>
      {children}
    </div>
  )
}

interface FeatureCardProps {
  title: string
  description: string
  to?: string
  color: 'blue' | 'green' | 'purple' | 'orange'
  children: ReactNode
}

const colorClasses = {
  blue: 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200',
  green: 'bg-green-50 hover:bg-green-100 text-green-800 border-green-200', 
  purple: 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200',
  orange: 'bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200',
}

const textColorClasses = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  purple: 'text-purple-600', 
  orange: 'text-orange-600',
}

export function FeatureCard({ title, description, color, children }: FeatureCardProps) {
  return (
    <div
      className={cn(
        'block p-4 rounded-lg border transition-colors',
        colorClasses[color]
      )}
    >
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className={cn('text-sm', textColorClasses[color])}>
        {description}
      </p>
      {children}
    </div>
  )
}