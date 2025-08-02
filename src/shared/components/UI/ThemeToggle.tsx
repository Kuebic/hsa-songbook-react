/**
 * @file ThemeToggle.tsx
 * @description Theme toggle component with sun/moon icons for switching between light and dark modes
 */

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../utils/cn';

interface ThemeToggleProps {
  /** Custom CSS classes */
  className?: string;
  /** Size of the toggle button */
  size?: 'sm' | 'md' | 'lg';
  /** Show label text */
  showLabel?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12'
};

const iconSizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6'
};

export function ThemeToggle({ 
  className, 
  size = 'md',
  showLabel = false 
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const handleClick = () => {
    // Cycle through themes: light -> dark -> system -> light
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getLabel = () => {
    if (theme === 'system') {
      return `System (${resolvedTheme})`;
    }
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'relative inline-flex items-center justify-center',
        'rounded-lg transition-all duration-200',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'dark:focus:ring-offset-gray-900',
        sizeClasses[size],
        className
      )}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} theme`}
      title={`Current: ${getLabel()}`}
    >
      {/* Sun icon - visible in light mode */}
      <svg
        className={cn(
          'absolute transition-all duration-300',
          iconSizeClasses[size],
          resolvedTheme === 'light' 
            ? 'rotate-0 scale-100 opacity-100' 
            : 'rotate-90 scale-0 opacity-0',
          'text-amber-500'
        )}
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
          clipRule="evenodd"
        />
      </svg>

      {/* Moon icon - visible in dark mode */}
      <svg
        className={cn(
          'absolute transition-all duration-300',
          iconSizeClasses[size],
          resolvedTheme === 'dark' 
            ? 'rotate-0 scale-100 opacity-100' 
            : '-rotate-90 scale-0 opacity-0',
          'text-blue-300'
        )}
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
          clipRule="evenodd"
        />
      </svg>

      {/* System indicator - small dot when in system mode */}
      {theme === 'system' && (
        <div className={cn(
          'absolute bottom-0 right-0 w-2 h-2 rounded-full',
          'bg-green-500 dark:bg-green-400',
          'border-2 border-white dark:border-gray-900'
        )} />
      )}

      {/* Label text */}
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {getLabel()}
        </span>
      )}
    </button>
  );
}