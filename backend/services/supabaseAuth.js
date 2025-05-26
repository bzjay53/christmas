/**
 * Christmas Trading Supabase Authentication Service
 * Supabase를 사용한 사용자 인증 및 관리
 */
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class SupabaseAuthService {
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://qehzzsxzjijfzqkysazc.supabase.co';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaHp6c3h6amlqZnpxa3lzYXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNTgxMTQsImV4cCI6MjA2MzYzNDExNH0.zjrrUaVajb9fV1NRwzA_RMy3-r3Lpww9Uen-cZYXDuE';
    
    console.log('🔧 Supabase 초기화:', { 
      url: supabaseUrl, 
      keyLength: supabaseKey ? supabaseKey.length : 0 
    });
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // 사용자 회원가입
  async signup(userData) {
    try {
      const { firstName, lastName, email, password, referralCode } = userData;

      // 이메일 중복 확인
      const existingUser = await this.findUserByEmail(email);
      if (existingUser) {
        throw new Error('이미 사용 중인 이메일입니다.');
      }

      // 비밀번호 해시화
      const hashedPassword = await bcrypt.hash(password, 12);

      // 사용자 데이터 준비
      const newUser = {
        email: email.toLowerCase(),
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        membership_type: 'free',
        is_active: true,
        is_email_verified: false,
        free_trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
        referred_by: referralCode || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Supabase에 사용자 생성
      const { data, error } = await this.supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (error) {
        throw new Error(`회원가입 실패: ${error.message}`);
      }

      return this.sanitizeUser(data);
    } catch (error) {
      console.error('Supabase 회원가입 오류:', error);
      throw error;
    }
  }

  // 사용자 로그인
  async login(email, password) {
    try {
      // 사용자 조회
      const user = await this.findUserByEmail(email);
      if (!user) {
        throw new Error('이메일 또는 비밀번호가 잘못되었습니다.');
      }

      // 비밀번호 확인
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        // 로그인 실패 횟수 증가
        await this.incrementLoginAttempts(user.id);
        throw new Error('이메일 또는 비밀번호가 잘못되었습니다.');
      }

      // 로그인 성공 처리
      await this.resetLoginAttempts(user.id);
      await this.updateLastLogin(user.id);

      // JWT 토큰 생성
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'christmas_default_secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return {
        token,
        user: this.sanitizeUser(user)
      };
    } catch (error) {
      console.error('Supabase 로그인 오류:', error);
      throw error;
    }
  }

  // 이메일로 사용자 찾기
  async findUserByEmail(email) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(`사용자 조회 실패: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('사용자 조회 오류:', error);
      return null;
    }
  }

  // ID로 사용자 찾기
  async findUserById(userId) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`사용자 조회 실패: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('사용자 조회 오류:', error);
      return null;
    }
  }

  // 로그인 실패 횟수 증가
  async incrementLoginAttempts(userId) {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({
          login_attempts: this.supabase.rpc('increment_login_attempts', { user_id: userId }),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('로그인 실패 횟수 업데이트 오류:', error);
      }
    } catch (error) {
      console.error('로그인 실패 처리 오류:', error);
    }
  }

  // 로그인 실패 횟수 초기화
  async resetLoginAttempts(userId) {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({
          login_attempts: 0,
          lock_until: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('로그인 실패 초기화 오류:', error);
      }
    } catch (error) {
      console.error('로그인 실패 초기화 처리 오류:', error);
    }
  }

  // 마지막 로그인 시간 업데이트
  async updateLastLogin(userId) {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('마지막 로그인 업데이트 오류:', error);
      }
    } catch (error) {
      console.error('마지막 로그인 처리 오류:', error);
    }
  }

  // 사용자 정보 정리 (민감한 정보 제거)
  sanitizeUser(user) {
    if (!user) return null;

    const sanitized = { ...user };
    delete sanitized.password;
    delete sanitized.email_verification_token;
    delete sanitized.password_reset_token;
    delete sanitized.login_attempts;
    delete sanitized.lock_until;

    return sanitized;
  }

  // JWT 토큰 검증
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'christmas_default_secret');
      const user = await this.findUserById(decoded.userId);
      
      if (!user || !user.is_active) {
        throw new Error('유효하지 않은 토큰입니다.');
      }

      return this.sanitizeUser(user);
    } catch (error) {
      console.error('토큰 검증 오류:', error);
      throw new Error('유효하지 않은 토큰입니다.');
    }
  }

  // 데이터베이스 연결 상태 확인
  async checkConnection() {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('count(*)')
        .limit(1);

      if (error) {
        throw new Error(`Supabase 연결 실패: ${error.message}`);
      }

      return {
        connected: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Supabase 연결 확인 오류:', error);
      return {
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new SupabaseAuthService(); 