// Enhanced Encryption Service - Christmas Trading
// AES-256-GCM 암호화를 사용한 API 키 보안

// Web Crypto API를 사용한 강화된 암호화
export class SecureEncryption {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12; // 96 bits for GCM
  private static readonly TAG_LENGTH = 16; // 128 bits for GCM
  
  // 마스터 키 생성 (실제 환경에서는 환경 변수나 안전한 키 저장소 사용)
  private static async getMasterKey(): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('christmas-trading-2025-master-key-secure'),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('christmas-trading-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // 데이터 암호화
  static async encrypt(plaintext: string): Promise<string> {
    try {
      const key = await this.getMasterKey();
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
      const plaintextBuffer = new TextEncoder().encode(plaintext);

      const encrypted = await crypto.subtle.encrypt(
        { name: this.ALGORITHM, iv: iv },
        key,
        plaintextBuffer
      );

      // IV와 암호화된 데이터를 결합하여 base64로 인코딩
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('암호화 실패:', error);
      throw new Error('데이터 암호화에 실패했습니다.');
    }
  }

  // 데이터 복호화
  static async decrypt(encryptedData: string): Promise<string> {
    try {
      const key = await this.getMasterKey();
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      // IV와 암호화된 데이터 분리
      const iv = combined.slice(0, this.IV_LENGTH);
      const encrypted = combined.slice(this.IV_LENGTH);

      const decrypted = await crypto.subtle.decrypt(
        { name: this.ALGORITHM, iv: iv },
        key,
        encrypted
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('복호화 실패:', error);
      throw new Error('데이터 복호화에 실패했습니다. API 키가 손상되었을 수 있습니다.');
    }
  }

  // 해시 생성 (무결성 검증용)
  static async createHash(data: string): Promise<string> {
    const buffer = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 무결성 검증
  static async verifyIntegrity(data: string, expectedHash: string): Promise<boolean> {
    try {
      const actualHash = await this.createHash(data);
      return actualHash === expectedHash;
    } catch (error) {
      console.error('무결성 검증 실패:', error);
      return false;
    }
  }
}

// 레거시 base64 암호화와의 호환성을 위한 유틸리티
export class LegacyEncryption {
  private static readonly LEGACY_KEY = 'christmas-trading-2025-secret-key';

  static encrypt(apiKey: string): string {
    return btoa(unescape(encodeURIComponent(apiKey + this.LEGACY_KEY)));
  }

  static decrypt(encryptedKey: string): string {
    try {
      const decoded = decodeURIComponent(escape(atob(encryptedKey)));
      return decoded.replace(this.LEGACY_KEY, '');
    } catch (error) {
      throw new Error('레거시 API 키 복호화에 실패했습니다.');
    }
  }

  // 레거시 키인지 확인 (새로운 암호화 방식과 구분)
  static isLegacyEncryption(encryptedData: string): boolean {
    try {
      // 레거시 방식으로 복호화 시도
      this.decrypt(encryptedData);
      return true;
    } catch {
      return false;
    }
  }
}

// 마이그레이션 유틸리티
export class EncryptionMigration {
  // 레거시 암호화를 새로운 암호화로 마이그레이션
  static async migrateLegacyKey(legacyEncryptedKey: string): Promise<string> {
    try {
      // 레거시 방식으로 복호화
      const plaintext = LegacyEncryption.decrypt(legacyEncryptedKey);
      
      // 새로운 방식으로 재암호화
      return await SecureEncryption.encrypt(plaintext);
    } catch (error) {
      console.error('암호화 마이그레이션 실패:', error);
      throw new Error('API 키 마이그레이션에 실패했습니다.');
    }
  }

  // 암호화 방식 감지 및 복호화
  static async smartDecrypt(encryptedData: string): Promise<string> {
    // 먼저 새로운 방식으로 시도
    try {
      return await SecureEncryption.decrypt(encryptedData);
    } catch {
      // 실패하면 레거시 방식으로 시도
      try {
        return LegacyEncryption.decrypt(encryptedData);
      } catch (error) {
        throw new Error('지원되지 않는 암호화 형식입니다.');
      }
    }
  }
}

// API 키 특수 보안 처리
export class ApiKeySecurityManager {
  // API 키 형식 검증
  static validateApiKeyFormat(apiKey: string): { isValid: boolean; error?: string } {
    if (!apiKey || typeof apiKey !== 'string') {
      return { isValid: false, error: 'API 키가 비어있습니다.' };
    }

    if (apiKey.length < 16) {
      return { isValid: false, error: 'API 키가 너무 짧습니다.' };
    }

    if (!/^[A-Za-z0-9]+$/.test(apiKey)) {
      return { isValid: false, error: 'API 키는 영문자와 숫자만 포함해야 합니다.' };
    }

    return { isValid: true };
  }

  // 민감한 정보 마스킹
  static maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) {
      return '***';
    }
    
    const firstPart = apiKey.substring(0, 4);
    const lastPart = apiKey.substring(apiKey.length - 4);
    const middleMask = '*'.repeat(Math.max(4, apiKey.length - 8));
    
    return `${firstPart}${middleMask}${lastPart}`;
  }

  // API 키 강도 평가
  static assessApiKeyStrength(apiKey: string): { 
    strength: 'weak' | 'medium' | 'strong'; 
    score: number; 
    recommendations: string[] 
  } {
    const recommendations: string[] = [];
    let score = 0;

    // 길이 검사
    if (apiKey.length >= 32) score += 30;
    else if (apiKey.length >= 24) score += 20;
    else if (apiKey.length >= 16) score += 10;
    else recommendations.push('API 키가 더 길어야 합니다 (권장: 32자 이상)');

    // 복잡성 검사
    if (/[A-Z]/.test(apiKey)) score += 20;
    else recommendations.push('대문자가 포함되어야 합니다');

    if (/[a-z]/.test(apiKey)) score += 20;
    else recommendations.push('소문자가 포함되어야 합니다');

    if (/[0-9]/.test(apiKey)) score += 20;
    else recommendations.push('숫자가 포함되어야 합니다');

    // 엔트로피 검사 (간단한 버전)
    const uniqueChars = new Set(apiKey).size;
    if (uniqueChars >= apiKey.length * 0.7) score += 10;
    else recommendations.push('더 다양한 문자를 사용해야 합니다');

    let strength: 'weak' | 'medium' | 'strong';
    if (score >= 80) strength = 'strong';
    else if (score >= 50) strength = 'medium';
    else strength = 'weak';

    return { strength, score, recommendations };
  }
}

export default {
  SecureEncryption,
  LegacyEncryption,
  EncryptionMigration,
  ApiKeySecurityManager
};