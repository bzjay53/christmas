import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { LoginModal } from '../components/auth/LoginModal';

// 사용자 프로필 타입 정의
export interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  membership_type: string;
  subscription_tier: string; // membership_type의 매핑된 값
  membership_start_date: string | null;
  membership_end_date: string | null;
  free_trial_end_date: string | null;
  created_at: string;
  updated_at: string;
  // 추가 필드들 (스키마에 맞춰)
  display_name?: string | null;
  portfolio_balance_usdt?: number;
  available_cash_usdt?: number;
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
  showLoginModal: () => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 멤버십 타입 매핑 함수
const mapMembershipToSubscriptionTier = (membershipType: string): string => {
  switch (membershipType) {
    case 'FREE_TRIAL':
      return 'free';
    case 'BASIC':
      return 'basic';
    case 'PREMIUM':
      return 'premium';
    case 'VIP':
      return 'vip';
    default:
      return 'free';
  }
};

// 멤버십 타입별 권한 설정
const MEMBERSHIP_PERMISSIONS = {
  FREE_TRIAL: {
    features: ['mockTrading', 'basicCharts'],
    maxDailyTrades: 5,
    maxOrderAmount: 100,
    realTimeData: false,
    aiRecommendations: false
  },
  BASIC: {
    features: ['mockTrading', 'realTrading', 'basicCharts', 'realTimeData'],
    maxDailyTrades: 20,
    maxOrderAmount: 1000,
    realTimeData: true,
    aiRecommendations: true
  },
  PREMIUM: {
    features: ['mockTrading', 'realTrading', 'basicCharts', 'realTimeData', 'aiTrading', 'advancedCharts'],
    maxDailyTrades: 100,
    maxOrderAmount: 10000,
    realTimeData: true,
    aiRecommendations: true,
    aiTrading: true
  },
  VIP: {
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
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // 사용자 프로필 조회
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // 프로필이 없으면 기본 프로필 생성
        console.log('프로필이 없습니다. 기본 프로필을 생성합니다...');
        const defaultProfile = await createDefaultProfile({ id: userId, email: '' } as User);
        return defaultProfile;
      } else if (error) {
        console.error('프로필 조회 실패:', error);
        return null;
      }

      // subscription_tier 매핑 추가
      const profile = data as UserProfile;
      profile.subscription_tier = mapMembershipToSubscriptionTier(profile.membership_type);
      profile.display_name = profile.first_name || profile.last_name || null;
      profile.portfolio_balance_usdt = profile.portfolio_balance_usdt || 0;
      profile.available_cash_usdt = profile.available_cash_usdt || 1000;

      return profile;
    } catch (error) {
      console.error('프로필 조회 에러:', error);
      return null;
    }
  };

  // 기본 프로필 생성
  const createDefaultProfile = async (user: User): Promise<UserProfile | null> => {
    try {
      console.log('기본 프로필 생성 시도:', user.email);
      
      const defaultProfile = {
        id: user.id,
        email: user.email!,
        first_name: user.user_metadata?.first_name || null,
        last_name: user.user_metadata?.last_name || null,
        membership_type: 'FREE_TRIAL',
        free_trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 체험
      };

      const { data, error } = await supabase
        .from('users')
        .insert([defaultProfile])
        .select()
        .single();

      if (error) {
        console.error('기본 프로필 생성 실패:', error);
        return null;
      }

      console.log('기본 프로필 생성 완료:', data.email);
      // subscription_tier 매핑 추가
      const profile = data as UserProfile;
      profile.subscription_tier = mapMembershipToSubscriptionTier(profile.membership_type);
      profile.display_name = profile.first_name || profile.last_name || null;
      profile.portfolio_balance_usdt = profile.portfolio_balance_usdt || 0;
      profile.available_cash_usdt = profile.available_cash_usdt || 1000;
      
      setProfile(profile);
      return profile;
    } catch (error) {
      console.error('기본 프로필 생성 중 오류:', error);
      return null;
    }
  };

  // 세션 초기화
  useEffect(() => {
    let isMounted = true; // 컴포넌트 언마운트 방지
    
    // 현재 세션 확인
    const initializeAuth = async () => {
      try {
        console.log('세션 초기화 시작');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('세션 확인 오류:', error);
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            console.log('기존 세션 발견:', session.user.email);
            // 프로필 로드 시도
            try {
              const userProfile = await fetchUserProfile(session.user.id);
              if (isMounted) {
                setProfile(userProfile);
                console.log('초기 프로필 로드 완료');
              }
            } catch (profileError) {
              console.error('초기 프로필 로드 실패:', profileError);
            }
          }
          
          setLoading(false);
          console.log('세션 초기화 완료');
        }
      } catch (error) {
        console.error('세션 초기화 예외:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user && event === 'SIGNED_IN') {
          // 로그인 시에만 프로필 로드
          try {
            const userProfile = await fetchUserProfile(session.user.id);
            if (isMounted) {
              setProfile(userProfile);
              console.log('상태 변경 시 프로필 로드 완료');
            }
          } catch (profileError) {
            console.error('상태 변경 시 프로필 로드 실패:', profileError);
          }
        } else if (!session?.user) {
          // 로그아웃 시 프로필 클리어
          if (isMounted) {
            setProfile(null);
          }
        }
        
        if (isMounted && event !== 'TOKEN_REFRESHED') {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
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
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: data.user.email!,
              first_name: displayName || null,
              membership_type: 'FREE_TRIAL',
              free_trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 체험
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
    setLoading(true);
    try {
      console.log('로그인 시도:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('로그인 에러:', error);
        setLoading(false);
        return { error };
      }

      if (data.user) {
        console.log('로그인 성공:', data.user.email);
        
        // 사용자 정보 즉시 설정
        setUser(data.user);
        setSession(data.session);
        
        // 프로필 로드 (백그라운드에서 실행)
        try {
          const userProfile = await fetchUserProfile(data.user.id);
          if (userProfile) {
            setProfile(userProfile);
            console.log('프로필 로드 완료:', userProfile.email);
          } else {
            console.warn('프로필 로드 실패 - 기본 프로필 생성 시도');
            // 프로필이 없으면 기본 프로필 생성
            await createDefaultProfile(data.user);
          }
        } catch (profileError) {
          console.error('프로필 로드 중 오류:', profileError);
          // 프로필 로드 실패해도 로그인은 성공으로 처리
        }
        
        // 로그인 완료 처리
        setLoading(false);
        console.log('로그인 프로세스 완료');
      }

      return { error: null };
    } catch (error) {
      console.error('로그인 예외:', error);
      setLoading(false);
      return { error: error as AuthError };
    }
  };

  // 로그아웃
  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('로그아웃 에러:', error);
        throw error;
      }
      
      // 상태 즉시 클리어
      setUser(null);
      setProfile(null);
      setSession(null);
      setIsLoginModalOpen(false);
      
      console.log('로그아웃 완료');
    } catch (error) {
      console.error('로그아웃 예외:', error);
      // 강제로 상태 클리어
      setUser(null);
      setProfile(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  // 프로필 업데이트
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('users')
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

    const membershipPermissions = MEMBERSHIP_PERMISSIONS[profile.membership_type as keyof typeof MEMBERSHIP_PERMISSIONS];
    if (!membershipPermissions) return false;

    return membershipPermissions.features.includes(feature) || membershipPermissions.features.includes('all');
  };

  // 로그인 모달 표시
  const showLoginModal = () => {
    setIsLoginModalOpen(true);
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
    showLoginModal,
    isLoginModalOpen,
    setIsLoginModalOpen,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
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