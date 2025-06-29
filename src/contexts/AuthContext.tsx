import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// 사용자 프로필 타입 정의
export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  role: 'admin' | 'premium' | 'basic' | 'free';
  subscription_tier: 'free' | 'basic' | 'premium' | 'vip';
  portfolio_balance_usdt: number;
  available_cash_usdt: number;
  kyc_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
}

// 인증 컨텍스트 타입
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  hasPermission: (feature: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 구독 티어별 권한 설정
const SUBSCRIPTION_PERMISSIONS = {
  free: {
    features: ['mockTrading', 'basicCharts'],
    maxDailyTrades: 5,
    maxOrderAmount: 100,
    realTimeData: false,
    aiRecommendations: false
  },
  basic: {
    features: ['mockTrading', 'realTrading', 'basicCharts', 'realTimeData'],
    maxDailyTrades: 20,
    maxOrderAmount: 1000,
    realTimeData: true,
    aiRecommendations: true
  },
  premium: {
    features: ['mockTrading', 'realTrading', 'basicCharts', 'realTimeData', 'aiTrading', 'advancedCharts'],
    maxDailyTrades: 100,
    maxOrderAmount: 10000,
    realTimeData: true,
    aiRecommendations: true,
    aiTrading: true
  },
  vip: {
    features: ['all'],
    maxDailyTrades: 1000,
    maxOrderAmount: 100000,
    realTimeData: true,
    aiRecommendations: true,
    aiTrading: true,
    personalizedAI: true,
    prioritySupport: true
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // 사용자 프로필 조회
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('프로필 조회 실패:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('프로필 조회 에러:', error);
      return null;
    }
  };

  // 세션 초기화
  useEffect(() => {
    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id).then(setProfile);
      }
      setLoading(false);
    });

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id);
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // 회원가입
  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          }
        }
      });

      if (!error && data.user) {
        // 프로필 생성
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email: data.user.email!,
              display_name: displayName || null,
              role: 'basic',
              subscription_tier: 'free',
              portfolio_balance_usdt: 0,
              available_cash_usdt: 1000, // 신규 가입자 체험용 1000 USDT
              kyc_status: 'pending',
            }
          ]);

        if (profileError) {
          console.error('프로필 생성 실패:', profileError);
        }
      }

      return { error };
    } catch (error) {
      console.error('회원가입 에러:', error);
      return { error: error as AuthError };
    }
  };

  // 로그인
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error) {
      console.error('로그인 에러:', error);
      return { error: error as AuthError };
    }
  };

  // 로그아웃
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('로그아웃 에러:', error);
    }
  };

  // 프로필 업데이트
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (!error && profile) {
        setProfile({ ...profile, ...updates });
      }

      return { error };
    } catch (error) {
      console.error('프로필 업데이트 에러:', error);
      return { error };
    }
  };

  // 권한 확인
  const hasPermission = (feature: string): boolean => {
    if (!profile) return false;

    const tierPermissions = SUBSCRIPTION_PERMISSIONS[profile.subscription_tier];
    if (!tierPermissions) return false;

    return tierPermissions.features.includes(feature) || tierPermissions.features.includes('all');
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 커스텀 훅
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 권한 확인 훅
export function usePermission(feature: string) {
  const { hasPermission } = useAuth();
  return hasPermission(feature);
}

export default AuthContext;