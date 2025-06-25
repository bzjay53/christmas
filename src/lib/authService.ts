// 🔐 Supabase Auth 서비스
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData extends LoginCredentials {
  displayName?: string;
}

// 로그인
export const signIn = async (credentials: LoginCredentials) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      console.error('🔐 로그인 실패:', error.message);
      return { success: false, error: error.message };
    }

    console.log('🔐 ✅ 로그인 성공:', data.user?.email);
    return { 
      success: true, 
      user: {
        id: data.user!.id,
        email: data.user!.email!,
        displayName: data.user!.user_metadata?.display_name
      } as AuthUser
    };
  } catch (err) {
    console.error('🔐 로그인 에러:', err);
    return { success: false, error: '로그인 중 오류가 발생했습니다.' };
  }
};

// 회원가입
export const signUp = async (signUpData: SignUpData) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: signUpData.email,
      password: signUpData.password,
      options: {
        data: {
          display_name: signUpData.displayName || signUpData.email.split('@')[0]
        }
      }
    });

    if (error) {
      console.error('🔐 회원가입 실패:', error.message);
      return { success: false, error: error.message };
    }

    console.log('🔐 ✅ 회원가입 성공:', data.user?.email);
    return { 
      success: true, 
      user: data.user ? {
        id: data.user.id,
        email: data.user.email!,
        displayName: data.user.user_metadata?.display_name
      } as AuthUser : null
    };
  } catch (err) {
    console.error('🔐 회원가입 에러:', err);
    return { success: false, error: '회원가입 중 오류가 발생했습니다.' };
  }
};

// 로그아웃
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('🔐 로그아웃 실패:', error.message);
      return { success: false, error: error.message };
    }

    console.log('🔐 ✅ 로그아웃 성공');
    return { success: true };
  } catch (err) {
    console.error('🔐 로그아웃 에러:', err);
    return { success: false, error: '로그아웃 중 오류가 발생했습니다.' };
  }
};

// 현재 사용자 정보 가져오기
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      displayName: user.user_metadata?.display_name
    };
  } catch (err) {
    console.error('🔐 사용자 정보 조회 에러:', err);
    return null;
  }
};

// 세션 상태 변화 감지
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      callback({
        id: session.user.id,
        email: session.user.email!,
        displayName: session.user.user_metadata?.display_name
      });
    } else {
      callback(null);
    }
  });
};