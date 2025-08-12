import React from 'react'
import { User } from 'lucide-react'
import type { UserProfile } from '../hooks/useAuth'

interface AvatarProps {
  profile: UserProfile | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ profile, size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-xl'
  }

  const getInitials = (name: string | null) => {
    if (!name) return ''
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const baseClasses = `
    ${sizeClasses[size]} 
    rounded-full 
    flex 
    items-center 
    justify-center 
    font-medium 
    relative
    ${className}
  `

  if (profile?.avatar_url) {
    return (
      <div className={baseClasses}>
        <img
          src={profile.avatar_url}
          alt={profile.full_name || 'User avatar'}
          className="w-full h-full rounded-full object-cover"
        />
        {profile.is_guest && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 rounded-full border-2 border-white" />
        )}
      </div>
    )
  }

  if (profile?.full_name) {
    return (
      <div className={`${baseClasses} bg-indigo-500 text-white`}>
        {getInitials(profile.full_name)}
        {profile.is_guest && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 rounded-full border-2 border-white" />
        )}
      </div>
    )
  }

  return (
    <div className={`${baseClasses} bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300`}>
      <User className="w-1/2 h-1/2" />
      {profile?.is_guest && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 rounded-full border-2 border-white" />
      )}
    </div>
  )
}