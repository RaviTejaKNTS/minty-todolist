import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LogOut, 
  Mail, 
  Download, 
  User, 
  Settings,
  HelpCircle,
  Chrome,
  Smartphone
} from 'lucide-react'
import { Avatar } from './Avatar'
import { useAuth } from '../hooks/useAuth'

interface AuthMenuProps {
  className?: string
}

export function AuthMenu({ className = '' }: AuthMenuProps) {
  const { profile, isGuest, signInWithEmail, signInWithOAuth, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowEmailInput(false)
        setEmailSent(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    const result = await signInWithEmail(email.trim())
    setLoading(false)

    if (result.success) {
      setEmailSent(true)
    } else {
      alert(result.error || 'Failed to send magic link')
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setLoading(true)
    const result = await signInWithOAuth(provider)
    setLoading(false)

    if (!result.success) {
      alert(result.error || `Failed to sign in with ${provider}`)
    }
  }

  const handleExportData = () => {
    // Export user data as JSON
    const data = {
      boards: JSON.parse(localStorage.getItem(`tasksmint_data_${profile?.id}`) || '{}'),
      exported_at: new Date().toISOString(),
      user_id: profile?.id
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tasksmint-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label="User menu"
      >
        <Avatar profile={profile} size="sm" />
        {isGuest && (
          <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
            Guest
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
          >
            {isGuest ? (
              <div className="p-4">
                <div className="flex items-center space-x-3 mb-4">
                  <Avatar profile={profile} size="md" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Guest User</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Your data is saved locally
                    </p>
                  </div>
                </div>

                {!showEmailInput && !emailSent ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => handleOAuthSignIn('google')}
                      disabled={loading}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <Chrome className="w-4 h-4" />
                      <span>Continue with Google</span>
                    </button>

                    <button
                      onClick={() => handleOAuthSignIn('apple')}
                      disabled={loading}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Continue with Apple</span>
                    </button>

                    <button
                      onClick={() => setShowEmailInput(true)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Email Magic Link</span>
                    </button>

                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium mb-1">What is guest mode?</p>
                          <p className="text-xs">
                            Your tasks are saved locally on this device. Sign in to sync across devices and keep your data safe.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : showEmailInput && !emailSent ? (
                  <form onSubmit={handleEmailSignIn} className="space-y-3">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email address
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        required
                        autoFocus
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowEmailInput(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !email.trim()}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Sending...' : 'Send Link'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                      <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Check your email</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        We sent a magic link to {email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEmailSent(false)
                        setShowEmailInput(false)
                        setEmail('')
                      }}
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Try a different email
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-center space-x-3 mb-4">
                  <Avatar profile={profile} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {profile?.full_name || 'User'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {profile?.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Account Settings</span>
                  </button>

                  <button
                    onClick={handleExportData}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Data</span>
                  </button>

                  <hr className="my-2 border-gray-200 dark:border-gray-700" />

                  <button
                    onClick={signOut}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-red-600 dark:text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}