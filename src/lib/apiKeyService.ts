// API Key Management Service - Christmas Trading
// 사용자별 Binance API 키 관리 및 암호화

import { supabase } from './supabase';
import { SecureEncryption, EncryptionMigration, ApiKeySecurityManager } from './encryption';

// 강화된 암호화/복호화 유틸리티
export const encryptApiKey = async (apiKey: string): Promise<string> => {
  // API 키 형식 검증
  const validation = ApiKeySecurityManager.validateApiKeyFormat(apiKey);
  if (!validation.isValid) {
    throw new Error(validation.error || 'API 키 형식이 올바르지 않습니다.');
  }

  // AES-256-GCM 암호화 사용
  return await SecureEncryption.encrypt(apiKey);
};

export const decryptApiKey = async (encryptedKey: string): Promise<string> => {
  try {
    // 스마트 복호화 (새로운 방식 우선, 레거시 방식 호환)
    return await EncryptionMigration.smartDecrypt(encryptedKey);
  } catch (error) {
    console.error('API 키 복호화 실패:', error);
    throw new Error('API 키 복호화에 실패했습니다. API 키가 손상되었을 수 있습니다.');
  }
};

// 사용자 API 키 저장
export const saveUserApiKeys = async (
  userId: string,
  apiKey: string,
  secretKey: string
): Promise<{ success: boolean; error?: any; strength?: any }> => {
  try {
    console.log('🔧 saveUserApiKeys 함수 시작', { userId, apiKeyLength: apiKey?.length, secretKeyLength: secretKey?.length });
    
    if (!apiKey || !secretKey) {
      throw new Error('API 키와 시크릿 키가 모두 필요합니다.');
    }

    // API 키 강도 평가
    console.log('🔧 API 키 강도 평가 중...');
    const apiKeyStrength = ApiKeySecurityManager.assessApiKeyStrength(apiKey);
    const secretKeyStrength = ApiKeySecurityManager.assessApiKeyStrength(secretKey);
    console.log('🔧 강도 평가 완료', { apiKeyStrength: apiKeyStrength.strength, secretKeyStrength: secretKeyStrength.strength });

    // 약한 키에 대한 경고
    if (apiKeyStrength.strength === 'weak' || secretKeyStrength.strength === 'weak') {
      console.warn('약한 API 키가 감지되었습니다:', {
        apiKey: apiKeyStrength,
        secretKey: secretKeyStrength
      });
    }

    // API 키 암호화 (비동기 처리)
    console.log('🔧 API 키 암호화 시작...');
    const encryptedApiKey = await encryptApiKey(apiKey);
    const encryptedSecretKey = await encryptApiKey(secretKey);
    console.log('🔧 암호화 완료', { encryptedLength: encryptedApiKey.length });

    // 사용자 프로필 존재 여부 확인 및 생성
    console.log('🔧 사용자 프로필 확인 중...');
    const { data: existingProfile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      // 프로필이 존재하지 않으면 생성
      console.log('🔧 프로필이 없습니다. 새로 생성합니다...');
      const { error: createError } = await supabase
        .from('users')
        .insert({
          id: userId,
          membership_type: 'FREE_TRIAL',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (createError) {
        console.error('🔧 프로필 생성 실패:', createError);
        return { success: false, error: createError };
      }
      console.log('✅ 프로필 생성 완료');
    } else if (profileError) {
      console.error('🔧 프로필 조회 오류:', profileError);
      return { success: false, error: profileError };
    } else {
      console.log('✅ 기존 프로필 확인 완료');
    }

    // Supabase에 저장 (실제 테이블 구조에 맞춰 컬럼명 확인)
    console.log('🔧 Supabase에 저장 시작...', { userId });
    const updateData = {
      // 실제 테이블 구조에 맞는 컬럼명 사용
      binance_api_key: encryptedApiKey, // 또는 binance_api_key_encrypted
      binance_secret_key: encryptedSecretKey, // 또는 binance_secret_key_encrypted
      updated_at: new Date().toISOString()
    };
    console.log('🔧 업데이트할 데이터:', Object.keys(updateData));
    
    // 타임아웃 추가하여 무한 대기 방지
    const updatePromise = supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Supabase 저장 타임아웃 (10초)')), 10000)
    );
    
    const { error } = await Promise.race([updatePromise, timeoutPromise]) as any;
    
    console.log('🔧 Supabase 저장 결과:', { error });

    if (error) {
      console.error('API 키 저장 실패:', error);
      return { success: false, error };
    }

    console.log('✅ 사용자 API 키 저장 완료:', userId);
    return { 
      success: true, 
      strength: {
        apiKey: apiKeyStrength,
        secretKey: secretKeyStrength
      }
    };

  } catch (error) {
    console.error('API 키 저장 중 오류:', error);
    return { success: false, error };
  }
};

// 사용자 API 키 조회
export const getUserApiKeys = async (
  userId: string
): Promise<{ apiKey?: string; secretKey?: string; error?: any }> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('binance_api_key, binance_secret_key')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('API 키 조회 실패:', error);
      return { error: error || 'API 키를 찾을 수 없습니다.' };
    }

    if (!data.binance_api_key || !data.binance_secret_key) {
      return { error: 'API 키가 설정되지 않았습니다.' };
    }

    // API 키 복호화 (비동기 처리)
    const apiKey = await decryptApiKey(data.binance_api_key);
    const secretKey = await decryptApiKey(data.binance_secret_key);

    return { apiKey, secretKey };

  } catch (error) {
    console.error('API 키 조회 중 오류:', error);
    return { error: '사용자 API 키 조회에 실패했습니다.' };
  }
};

// 사용자 API 키 삭제
export const deleteUserApiKeys = async (
  userId: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        binance_api_key: null,
        binance_secret_key: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('API 키 삭제 실패:', error);
      return { success: false, error };
    }

    console.log('✅ 사용자 API 키 삭제 완료:', userId);
    return { success: true };

  } catch (error) {
    console.error('API 키 삭제 중 오류:', error);
    return { success: false, error };
  }
};

// API 키 유효성 검증
export const validateUserApiKeys = async (
  userId: string
): Promise<{ isValid: boolean; error?: any; permissions?: string[] }> => {
  try {
    const { apiKey, secretKey, error } = await getUserApiKeys(userId);
    
    if (error || !apiKey || !secretKey) {
      return { isValid: false, error: error || 'API 키가 설정되지 않았습니다.' };
    }

    // API 키 형식 검증 (강화된 검증)
    const apiKeyValidation = ApiKeySecurityManager.validateApiKeyFormat(apiKey);
    const secretKeyValidation = ApiKeySecurityManager.validateApiKeyFormat(secretKey);

    if (!apiKeyValidation.isValid) {
      return { isValid: false, error: `API 키 오류: ${apiKeyValidation.error}` };
    }

    if (!secretKeyValidation.isValid) {
      return { isValid: false, error: `시크릿 키 오류: ${secretKeyValidation.error}` };
    }

    // TODO: 실제 Binance API를 호출하여 키 유효성 검증
    // 현재는 형식 검증만 수행

    // 유효성 검증 시간 업데이트
    await supabase
      .from('users')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', userId);

    return { 
      isValid: true, 
      permissions: ['SPOT'] // 기본 SPOT 거래 권한
    };

  } catch (error) {
    console.error('API 키 검증 중 오류:', error);
    return { isValid: false, error: 'API 키 검증에 실패했습니다.' };
  }
};

// 사용자별 Binance API 설정 상태 확인
export const getUserApiStatus = async (
  userId: string
): Promise<{ 
  hasApiKeys: boolean; 
  isActive: boolean; 
  lastVerified?: string; 
  permissions?: string[];
  error?: any;
}> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('binance_api_key, binance_secret_key, updated_at')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return { 
        hasApiKeys: false, 
        isActive: false, 
        error: error || 'API 상태를 확인할 수 없습니다.' 
      };
    }

    const hasApiKeys = !!(data.binance_api_key && data.binance_secret_key);
    
    return {
      hasApiKeys,
      isActive: hasApiKeys,
      lastVerified: data.updated_at,
      permissions: ['SPOT']
    };

  } catch (error) {
    console.error('API 상태 확인 중 오류:', error);
    return { 
      hasApiKeys: false, 
      isActive: false, 
      error: 'API 상태 확인에 실패했습니다.' 
    };
  }
};

export default {
  saveUserApiKeys,
  getUserApiKeys,
  deleteUserApiKeys,
  validateUserApiKeys,
  getUserApiStatus,
  encryptApiKey,
  decryptApiKey
};