import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from 'firebase/auth'
import { auth, db } from '../config/firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { message } from 'antd'

export interface UserProfile {
  uid: string
  email: string
  displayName?: string
  tier: 'basic' | 'premium' | 'enterprise'
  role: 'user' | 'premium_user' | 'admin'
  settings: {
    kis_api: {
      app_key: string
      account: string
      mock_mode: boolean
    }
    ai_config: {
      openai_key: string
      model: string
      risk_tolerance: number
      learning_enabled: boolean
    }
    notifications: {
      telegram: boolean
      email: boolean
      telegram_chat_id: string
    }
  }
  status: 'active' | 'inactive' | 'suspended'
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // 사용자 프로필 조회
  const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        const data = userDoc.data()
        return {
          uid,
          email: data.email || '',
          displayName: data.displayName || data.firstName + ' ' + data.lastName || '',
          tier: data.tier || 'basic',
          role: data.role || 'user',
          settings: data.settings || {
            kis_api: { app_key: '', account: '', mock_mode: true },
            ai_config: { openai_key: '', model: 'gpt-4o-mini', risk_tolerance: 0.5, learning_enabled: false },
            notifications: { telegram: false, email: true, telegram_chat_id: '' }
          },
          status: data.status || 'active',
          emailVerified: data.emailVerified || false,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        } as UserProfile
      }
      return null
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  // 프로필 새로고침
  const refreshProfile = async () => {
    if (user) {
      const profile = await fetchUserProfile(user.uid)
      setUserProfile(profile)
    }
  }

  // 로그인
  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const profile = await fetchUserProfile(userCredential.user.uid)
      
      if (!profile) {
        throw new Error('사용자 프로필을 찾을 수 없습니다.')
      }
      
      if (profile.status !== 'active') {
        await signOut(auth)
        throw new Error('계정이 비활성화되었습니다. 관리자에게 문의하세요.')
      }
      
      setUserProfile(profile)
      message.success(`안녕하세요, ${profile.displayName || profile.email}님!`)
      
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Firebase 에러 메시지 한국어 변환
      let errorMessage = '로그인에 실패했습니다.'
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = '등록되지 않은 이메일입니다.'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = '비밀번호가 올바르지 않습니다.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '이메일 형식이 올바르지 않습니다.'
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = '계정이 비활성화되었습니다.'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      message.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // 로그아웃
  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
      setUserProfile(null)
      message.success('로그아웃되었습니다.')
    } catch (error) {
      console.error('Logout error:', error)
      message.error('로그아웃 중 오류가 발생했습니다.')
    }
  }

  // Firebase 인증 상태 변화 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setLoading(true)
        
        if (firebaseUser) {
          setUser(firebaseUser)
          const profile = await fetchUserProfile(firebaseUser.uid)
          setUserProfile(profile)
        } else {
          setUser(null)
          setUserProfile(null)
        }
      } catch (error) {
        console.error('Auth state change error:', error)
        setUser(null)
        setUserProfile(null)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    isAuthenticated: !!user && !!userProfile,
    login,
    logout,
    refreshProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}