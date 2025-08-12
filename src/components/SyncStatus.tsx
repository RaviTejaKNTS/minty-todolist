import React from 'react'
import { motion } from 'framer-motion'
import { 
  Cloud, 
  CloudOff, 
  Loader2, 
  Check, 
  WifiOff,
  RefreshCw
} from 'lucide-react'
import { useSync } from '../hooks/useSync'
import { useAuth } from '../hooks/useAuth'

interface SyncStatusProps {
  className?: string
}

export function SyncStatus({ className = '' }: SyncStatusProps) {
  const { syncing, offline, lastSync } = useSync()
  const { isGuest } = useAuth()

  const getStatusIcon = () => {
    if (offline) return <WifiOff className="w-4 h-4" />
    if (syncing) return <Loader2 className="w-4 h-4 animate-spin" />
    if (isGuest) return <CloudOff className="w-4 h-4" />
    return <Cloud className="w-4 h-4" />
  }

  const getStatusText = () => {
    if (offline) return 'Offline'
    if (syncing) return 'Syncing...'
    if (isGuest) return 'Local only'
    if (lastSync) {
      const now = new Date()
      const diff = now.getTime() - lastSync.getTime()
      const minutes = Math.floor(diff / 60000)
      
      if (minutes < 1) return 'Just synced'
      if (minutes < 60) return `Synced ${minutes}m ago`
      
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `Synced ${hours}h ago`
      
      const days = Math.floor(hours / 24)
      return `Synced ${days}d ago`
    }
    return 'Synced'
  }

  const getStatusColor = () => {
    if (offline) return 'text-red-500'
    if (syncing) return 'text-blue-500'
    if (isGuest) return 'text-gray-500'
    return 'text-green-500'
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center space-x-2 text-sm ${getStatusColor()} ${className}`}
    >
      {getStatusIcon()}
      <span className="hidden sm:inline">{getStatusText()}</span>
    </motion.div>
  )
}