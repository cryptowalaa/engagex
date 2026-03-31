'use client'

interface YellowTickProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

export function YellowTick({ size = 'md', className = '' }: YellowTickProps) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <span 
      className={`inline-flex items-center justify-center ${sizeClasses[size]} bg-[#FFAD1F] rounded-full text-white ${className}`}
      title="Official Verified Brand"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full p-[2px]">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
    </span>
  )
}

// With label version
export function YellowVerifiedBadge({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const textSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm'
  }

  return (
    <span className="inline-flex items-center gap-1" title="Official Verified Brand">
      <YellowTick size={size} />
      <span className={`${textSizes[size]} text-[#FFAD1F] font-semibold`}>
        Official
      </span>
    </span>
  )
}
