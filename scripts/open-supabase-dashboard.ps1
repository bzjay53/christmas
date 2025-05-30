# Supabase 대시보드 자동 열기 및 테이블 생성 가이드
# Christmas Trading 프로젝트용

Write-Host "🎄 Christmas Trading - Supabase 테이블 생성 가이드" -ForegroundColor Green
Write-Host "============================================================"

# 1. 현재 테이블 상태 확인
Write-Host "`n📊 1. 현재 테이블 상태 확인 중..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/setup/check-tables" -Method Get
    
    if ($response.success) {
        Write-Host "✅ 테이블 상태 확인 완료" -ForegroundColor Green
        
        $tables = $response.data.tables
        Write-Host "`n📋 테이블 상태:" -ForegroundColor Cyan
        Write-Host "- users 테이블: $(if($tables.users.exists) {'✅ 존재'} else {'❌ 없음'})"
        Write-Host "- coupons 테이블: $(if($tables.coupons.exists) {'✅ 존재'} else {'❌ 없음'})"
        Write-Host "- trading_orders 테이블: $(if($tables.trading_orders.exists) {'✅ 존재'} else {'❌ 없음'})"
        
        if ($response.data.allTablesExist) {
            Write-Host "`n🎉 모든 테이블이 이미 존재합니다!" -ForegroundColor Green
            Write-Host "테이블 생성이 필요하지 않습니다." -ForegroundColor Green
            exit 0
        } else {
            Write-Host "`n⚠️  일부 테이블이 누락되었습니다." -ForegroundColor Yellow
            Write-Host "누락된 테이블: $($response.data.summary.missing)개" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ 백엔드 서버에 연결할 수 없습니다." -ForegroundColor Red
    Write-Host "서버가 실행 중인지 확인해주세요: http://localhost:8000" -ForegroundColor Red
}

# 2. Supabase 대시보드 열기
Write-Host "`n🌐 2. Supabase 대시보드 열기..." -ForegroundColor Yellow
$supabaseUrl = "https://supabase.com/dashboard/project/qehzzsxzjijfzqkysazc"

try {
    Start-Process $supabaseUrl
    Write-Host "✅ 웹 브라우저에서 Supabase 대시보드가 열렸습니다." -ForegroundColor Green
} catch {
    Write-Host "❌ 브라우저 열기 실패. 수동으로 접속해주세요:" -ForegroundColor Red
    Write-Host $supabaseUrl -ForegroundColor Cyan
}

# 3. SQL 스크립트 제공
Write-Host "`n📝 3. 테이블 생성 SQL 스크립트" -ForegroundColor Yellow
Write-Host "========================================"

Write-Host "`n🔧 다음 단계를 따라주세요:" -ForegroundColor Cyan
Write-Host "1. 웹 브라우저에서 Supabase 대시보드에 로그인"
Write-Host "2. 왼쪽 메뉴에서 'SQL Editor' 클릭"
Write-Host "3. 'New query' 버튼 클릭"
Write-Host "4. 아래 SQL을 복사하여 붙여넣기 후 실행"

Write-Host "`n📋 A. coupons 테이블 생성 SQL:" -ForegroundColor Green
$couponsSQL = @"
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_discount_amount DECIMAL(10,2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
"@
Write-Host $couponsSQL -ForegroundColor White

Write-Host "`n📋 B. trading_orders 테이블 생성 SQL:" -ForegroundColor Green
$ordersSQL = @"
CREATE TABLE IF NOT EXISTS trading_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id VARCHAR(100) UNIQUE NOT NULL,
  stock_code VARCHAR(20) NOT NULL,
  stock_name VARCHAR(100),
  order_type VARCHAR(10) NOT NULL CHECK (order_type IN ('buy', 'sell')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(12,2) NOT NULL CHECK (price > 0),
  total_amount DECIMAL(15,2) NOT NULL CHECK (total_amount > 0),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'cancelled')),
  kis_order_id VARCHAR(100),
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
"@
Write-Host $ordersSQL -ForegroundColor White

Write-Host "`n📋 C. 기본 쿠폰 데이터 삽입 SQL (선택사항):" -ForegroundColor Green
$sampleDataSQL = @"
INSERT INTO coupons (code, name, description, discount_type, discount_value, valid_from, valid_until) VALUES
('WELCOME10', '신규 가입 10% 할인', '신규 회원 가입 시 10% 할인 쿠폰', 'percentage', 10.00, NOW(), NOW() + INTERVAL '1 year'),
('FIRST5000', '첫 거래 5000원 할인', '첫 거래 시 5000원 할인', 'fixed', 5000.00, NOW(), NOW() + INTERVAL '6 months'),
('VIP20', 'VIP 회원 20% 할인', 'VIP 등급 회원 전용 20% 할인', 'percentage', 20.00, NOW(), NOW() + INTERVAL '1 year')
ON CONFLICT (code) DO NOTHING;
"@
Write-Host $sampleDataSQL -ForegroundColor White

# 4. 완료 후 확인
Write-Host "`n✅ 4. 완료 후 확인" -ForegroundColor Yellow
Write-Host "테이블 생성 완료 후 다음 명령어로 확인:" -ForegroundColor Cyan
Write-Host "Invoke-RestMethod -Uri 'http://localhost:8000/api/setup/check-tables' -Method Get" -ForegroundColor White

Write-Host "`n🎉 테이블 생성이 완료되면 백엔드 API 테스트를 진행할 수 있습니다!" -ForegroundColor Green
Write-Host "============================================================" 