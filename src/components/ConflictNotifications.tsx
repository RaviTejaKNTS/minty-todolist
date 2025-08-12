import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, Undo } from 'lucide-react'
import type { ConflictNotification } from '../hooks/useSync'

interface ConflictNotificationsProps {
  conflicts: ConflictNotification[]
  onDismiss: (conflictId: string) => void
  className?: string
}

export function ConflictNotifications({ 
  conflicts, 
  onDismiss, 
  className = '' 
}: ConflictNotificationsProps) {
  if (conflicts.length === 0) return null

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-2 ${className}`}>
      <AnimatePresence>
        {conflicts.map((conflict) => (
          <motion.div
            key={conflict.id}
            initial={{ opacity: 0, x: 300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.9 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-800 rounded-lg shadow-lg p-4 max-w-sm"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Sync Conflict Resolved
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {conflict.message}
                </p>
                <div className="flex items-center space-x-2 mt-3">
                  <button
                    onClick={() => onDismiss(conflict.id)}
                    className="text-xs text-orange-600 dark:text-orange-400 hover:underline flex items-center space-x-1"
                  >
                    <span>Dismiss</span>
                  </button>
                  <span className="text-xs text-gray-400">•</span>
                  <button
                    onClick={() => {
                      // TODO: Implement undo functionality
                      onDismiss(conflict.id)
                    }}
                    className="text-xs text-orange-600 dark:text-orange-400 hover:underline flex items-center space-x-1"
                  >
                    <Undo className="w-3 h-3" />
                    <span>Undo</span>
                  </button>
                </div>
              </div>
              <button
                onClick={() => onDismiss(conflict.id)}
                className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}