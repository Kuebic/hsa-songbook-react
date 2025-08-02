import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700/50 transition-colors duration-200', className)}>
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
  blue: 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  green: 'bg-green-50 hover:bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-300 dark:border-green-800', 
  purple: 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  orange: 'bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
}

const textColorClasses = {
  blue: 'text-blue-600 dark:text-blue-400',
  green: 'text-green-600 dark:text-green-400',
  purple: 'text-purple-600 dark:text-purple-400', 
  orange: 'text-orange-600 dark:text-orange-400',
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