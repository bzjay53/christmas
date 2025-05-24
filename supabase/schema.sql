-- Christmas Trading Supabase Database Schema
-- MongoDB 모델을 PostgreSQL로 변환

-- 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 사용자 테이블 (Supabase Auth와 연동)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  
  -- 기본 정보
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  profile_image TEXT,
  
  -- 회원 등급 시스템
  membership_type TEXT NOT NULL DEFAULT 'free' CHECK (membership_type IN ('guest', 'free', 'premium', 'lifetime')),
  membership_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  membership_end_date TIMESTAMP WITH TIME ZONE,
  
  -- 신규 가입 7일 무료 체험
  free_trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- 거래 제한 관리
  daily_trade_count INTEGER DEFAULT 0,
  daily_trade_reset_date DATE DEFAULT CURRENT_DATE,
  
  -- 초대 시스템
  personal_referral_code TEXT UNIQUE,
  referred_by TEXT,
  total_extension_days INTEGER DEFAULT 0 CHECK (total_extension_days <= 90),
  
  -- API 키 (암호화된 형태로 저장)
  binance_api_key TEXT,
  binance_secret_key TEXT,
  upbit_access_key TEXT,
  upbit_secret_key TEXT,
  
  -- 한국투자증권 API 키
  kis_real_app_key TEXT,
  kis_real_app_secret TEXT,
  kis_real_account TEXT,
  kis_demo_app_key TEXT,
  kis_demo_app_secret TEXT,
  kis_demo_account TEXT,
  kis_mock_mode BOOLEAN DEFAULT TRUE,  -- true: 모의투자, false: 실전투자
  
  -- 알림 설정
  notification_email BOOLEAN DEFAULT TRUE,
  notification_telegram BOOLEAN DEFAULT FALSE,
  notification_push BOOLEAN DEFAULT TRUE,
  notification_trading_alerts BOOLEAN DEFAULT TRUE,
  notification_portfolio_updates BOOLEAN DEFAULT TRUE,
  
  -- 텔레그램 정보
  telegram_chat_id TEXT,
  telegram_username TEXT,
  
  -- 계정 상태
  is_email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_admin BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- 보안 관련
  login_attempts INTEGER DEFAULT 0 CHECK (login_attempts <= 5),
  lock_until TIMESTAMP WITH TIME ZONE,
  
  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 초대 코드 테이블
CREATE TABLE public.referral_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- 초대자 정보
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- 초대 코드 (8자리 고유 코드)
  code TEXT NOT NULL UNIQUE CHECK (LENGTH(code) = 8 AND code ~ '^[A-Z0-9]+$'),
  
  -- 초대 링크 URL
  invite_url TEXT NOT NULL,
  
  -- 사용 제한
  max_uses INTEGER DEFAULT 50 CHECK (max_uses >= 1),
  current_uses INTEGER DEFAULT 0 CHECK (current_uses >= 0),
  
  -- 만료 설정 (90일)
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days'),
  
  -- 활성 상태
  is_active BOOLEAN DEFAULT TRUE,
  
  -- 통계 정보
  successful_invites INTEGER DEFAULT 0,
  total_reward_days INTEGER DEFAULT 0,
  
  -- 메타데이터
  description TEXT DEFAULT '친구 초대 코드',
  tags TEXT[],
  
  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 초대 보상 테이블
CREATE TABLE public.referral_rewards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- 초대자 정보
  inviter_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- 피초대자 정보
  invitee_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- 사용된 초대 코드
  referral_code TEXT NOT NULL,
  
  -- 보상 정보
  reward_type TEXT DEFAULT 'free_extension' CHECK (reward_type IN ('free_extension', 'discount', 'bonus_credit')),
  reward_days INTEGER DEFAULT 7 CHECK (reward_days >= 1),
  reward_value NUMERIC DEFAULT 0,
  
  -- 보상 상태
  is_claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  applied_at TIMESTAMP WITH TIME ZONE,
  
  -- 검증 정보
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_method TEXT DEFAULT 'automatic' CHECK (verification_method IN ('automatic', 'manual', 'admin')),
  
  -- 메타데이터
  notes TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  
  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 중복 방지 (한 사용자당 하나의 보상만)
  UNIQUE(inviter_id, invitee_id)
);

-- 쿠폰 테이블
CREATE TABLE public.coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- 쿠폰 기본 정보
  code TEXT NOT NULL UNIQUE CHECK (LENGTH(code) BETWEEN 6 AND 20),
  name TEXT NOT NULL CHECK (LENGTH(name) <= 100),
  description TEXT CHECK (LENGTH(description) <= 500),
  
  -- 쿠폰 유형
  coupon_type TEXT NOT NULL CHECK (coupon_type IN (
    'subscription_discount',
    'commission_discount', 
    'free_trial_extension',
    'premium_upgrade',
    'lifetime_discount'
  )),
  
  -- 할인 유형 및 값
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_period')),
  discount_value NUMERIC NOT NULL CHECK (discount_value >= 0),
  
  -- 구매 조건
  min_purchase_amount NUMERIC DEFAULT 0 CHECK (min_purchase_amount >= 0),
  max_discount_amount NUMERIC CHECK (max_discount_amount >= 0),
  
  -- 사용 제한
  usage_limit INTEGER CHECK (usage_limit >= 1),
  used_count INTEGER DEFAULT 0 CHECK (used_count >= 0),
  user_usage_limit INTEGER DEFAULT 1 CHECK (user_usage_limit >= 1),
  
  -- 유효 기간
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL CHECK (end_date > start_date),
  
  -- 대상 제한
  target_membership TEXT[] DEFAULT '{}',
  target_users UUID[],
  excluded_users UUID[],
  
  -- 상태 관리
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT TRUE,
  
  -- 생성자 정보
  created_by UUID REFERENCES public.users(id) NOT NULL,
  
  -- 통계 정보
  total_savings NUMERIC DEFAULT 0,
  
  -- 메타데이터
  tags TEXT[],
  priority INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  
  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 쿠폰 사용 이력 테이블
CREATE TABLE public.coupon_usages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  original_amount NUMERIC NOT NULL CHECK (original_amount >= 0),
  discount_amount NUMERIC NOT NULL CHECK (discount_amount >= 0),
  final_amount NUMERIC NOT NULL CHECK (final_amount >= 0),
  
  status TEXT DEFAULT 'applied' CHECK (status IN ('pending', 'applied', 'refunded', 'cancelled')),
  
  metadata JSONB DEFAULT '{}',
  
  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 거래 기록 테이블 (확장용)
CREATE TABLE public.trade_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- 거래 정보
  trade_type TEXT NOT NULL CHECK (trade_type IN ('demo', 'real')),
  action TEXT NOT NULL CHECK (action IN ('buy', 'sell')),
  symbol TEXT NOT NULL,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  price NUMERIC NOT NULL CHECK (price > 0),
  
  -- 수수료 정보
  commission NUMERIC DEFAULT 0 CHECK (commission >= 0),
  commission_rate NUMERIC DEFAULT 0 CHECK (commission_rate >= 0),
  
  -- 거래 결과
  profit_loss NUMERIC DEFAULT 0,
  success BOOLEAN DEFAULT TRUE,
  
  -- 메타데이터
  exchange TEXT,
  strategy TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_membership_type ON public.users(membership_type);
CREATE INDEX idx_users_referral_code ON public.users(personal_referral_code);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);

CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX idx_referral_codes_user_id ON public.referral_codes(user_id);
CREATE INDEX idx_referral_codes_expires_at ON public.referral_codes(expires_at);
CREATE INDEX idx_referral_codes_is_active ON public.referral_codes(is_active);

CREATE INDEX idx_referral_rewards_inviter_id ON public.referral_rewards(inviter_id);
CREATE INDEX idx_referral_rewards_invitee_id ON public.referral_rewards(invitee_id);
CREATE INDEX idx_referral_rewards_referral_code ON public.referral_rewards(referral_code);
CREATE INDEX idx_referral_rewards_created_at ON public.referral_rewards(created_at DESC);

CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_coupon_type ON public.coupons(coupon_type);
CREATE INDEX idx_coupons_is_active ON public.coupons(is_active);
CREATE INDEX idx_coupons_start_end_date ON public.coupons(start_date, end_date);
CREATE INDEX idx_coupons_created_by ON public.coupons(created_by);

CREATE INDEX idx_coupon_usages_coupon_id ON public.coupon_usages(coupon_id);
CREATE INDEX idx_coupon_usages_user_id ON public.coupon_usages(user_id);
CREATE INDEX idx_coupon_usages_created_at ON public.coupon_usages(created_at DESC);

CREATE INDEX idx_trade_records_user_id ON public.trade_records(user_id);
CREATE INDEX idx_trade_records_trade_type ON public.trade_records(trade_type);
CREATE INDEX idx_trade_records_symbol ON public.trade_records(symbol);
CREATE INDEX idx_trade_records_created_at ON public.trade_records(created_at DESC);

-- Row Level Security (RLS) 정책 설정

-- 사용자 테이블 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 정보만 조회/수정 가능
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 관리자는 모든 사용자 정보 조회 가능
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- 초대 코드 테이블 RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referral codes" ON public.referral_codes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own referral codes" ON public.referral_codes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own referral codes" ON public.referral_codes
  FOR UPDATE USING (user_id = auth.uid());

-- 초대 보상 테이블 RLS
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their referral rewards" ON public.referral_rewards
  FOR SELECT USING (inviter_id = auth.uid() OR invitee_id = auth.uid());

CREATE POLICY "System can insert referral rewards" ON public.referral_rewards
  FOR INSERT WITH CHECK (TRUE); -- 시스템에서 자동 생성

-- 쿠폰 테이블 RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 활성화된 공개 쿠폰은 모든 사용자가 조회 가능
CREATE POLICY "Anyone can view active public coupons" ON public.coupons
  FOR SELECT USING (is_active = TRUE AND is_public = TRUE);

-- 관리자는 모든 쿠폰 관리 가능
CREATE POLICY "Admins can manage all coupons" ON public.coupons
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- 쿠폰 사용 이력 RLS
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own coupon usage" ON public.coupon_usages
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own coupon usage" ON public.coupon_usages
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 거래 기록 RLS
ALTER TABLE public.trade_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trades" ON public.trade_records
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own trades" ON public.trade_records
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.referral_codes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.referral_rewards FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.coupon_usages FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.trade_records FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 사용자 가입시 초대 코드 자동 생성 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
BEGIN
  -- 8자리 고유 초대 코드 생성
  LOOP
    new_code := UPPER(
      SUBSTRING(
        REPLACE(
          REPLACE(
            REPLACE(encode(gen_random_bytes(6), 'base64'), '/', ''), 
            '+', ''
          ), 
          '=', ''
        ), 
        1, 8
      )
    );
    
    -- 중복 확인
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE personal_referral_code = new_code) 
       AND NOT EXISTS (SELECT 1 FROM public.referral_codes WHERE code = new_code) THEN
      EXIT;
    END IF;
  END LOOP;
  
  -- 초대 코드 설정
  NEW.personal_referral_code = new_code;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자 테이블에 트리거 적용
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 초대 코드 테이블 자동 생성 함수
CREATE OR REPLACE FUNCTION public.create_referral_code_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.referral_codes (
    user_id,
    code,
    invite_url,
    description
  ) VALUES (
    NEW.id,
    NEW.personal_referral_code,
    CONCAT('https://christmas-trading.netlify.app/signup?ref=', NEW.personal_referral_code),
    CONCAT(NEW.first_name, '님의 초대 코드')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자 생성 후 초대 코드 테이블 자동 생성
CREATE TRIGGER after_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.create_referral_code_for_user();

-- 권한 설정
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- anon 사용자는 제한적 접근만
GRANT SELECT ON public.coupons TO anon;
GRANT SELECT ON public.referral_codes TO anon; 