/**
 * Christmas Trading Database Setup Routes
 * 데이터베이스 테이블 생성 및 초기화 API
 */
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Supabase 클라이언트 설정
const supabaseUrl = process.env.SUPABASE_URL || 'https://qehzzsxzjijfzqkysazc.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaHp6c3h6amlqZnpxa3lzYXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNTgxMTQsImV4cCI6MjA2MzYzNDExNH0.zjrrUaVajb9fV1NRwzA_RMy3-r3Lpww9Uen-cZYXDuE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 테이블 상태 확인
router.get('/check-tables', async (req, res) => {
  try {
    console.log('🔍 테이블 상태 확인 중...');
    
    const tableStatus = {};
    
    // users 테이블 확인
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      tableStatus.users = {
        exists: !usersError,
        error: usersError?.message || null,
        count: usersData ? usersData.length : 0
      };
    } catch (error) {
      tableStatus.users = { exists: false, error: error.message, count: 0 };
    }
    
    // coupons 테이블 확인
    try {
      const { data: couponsData, error: couponsError } = await supabase
        .from('coupons')
        .select('count')
        .limit(1);
      
      tableStatus.coupons = {
        exists: !couponsError,
        error: couponsError?.message || null,
        count: couponsData ? couponsData.length : 0
      };
    } catch (error) {
      tableStatus.coupons = { exists: false, error: error.message, count: 0 };
    }
    
    // trading_orders 테이블 확인
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('trading_orders')
        .select('count')
        .limit(1);
      
      tableStatus.trading_orders = {
        exists: !ordersError,
        error: ordersError?.message || null,
        count: ordersData ? ordersData.length : 0
      };
    } catch (error) {
      tableStatus.trading_orders = { exists: false, error: error.message, count: 0 };
    }
    
    // 전체 상태 요약
    const allTablesExist = tableStatus.users.exists && 
                          tableStatus.coupons.exists && 
                          tableStatus.trading_orders.exists;
    
    res.json({
      success: true,
      message: '테이블 상태 확인 완료',
      data: {
        allTablesExist,
        tables: tableStatus,
        summary: {
          total: 3,
          existing: Object.values(tableStatus).filter(t => t.exists).length,
          missing: Object.values(tableStatus).filter(t => !t.exists).length
        }
      }
    });
    
  } catch (error) {
    console.error('❌ 테이블 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: 'Database Check Error',
      message: '테이블 상태 확인 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 테이블 생성 가이드 제공
router.get('/create-tables-guide', async (req, res) => {
  try {
    const guide = {
      title: 'Supabase 테이블 생성 가이드',
      description: 'Christmas Trading 프로젝트에 필요한 테이블들을 생성하는 방법',
      steps: [
        {
          step: 1,
          title: 'Supabase 대시보드 접속',
          description: 'https://supabase.com/dashboard 에서 프로젝트 선택'
        },
        {
          step: 2,
          title: 'SQL Editor 열기',
          description: '왼쪽 메뉴에서 SQL Editor 클릭 후 New query 선택'
        },
        {
          step: 3,
          title: 'SQL 실행',
          description: '아래 SQL 코드를 복사하여 실행'
        }
      ],
      sql: {
        coupons: `CREATE TABLE IF NOT EXISTS coupons (
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
);`,
        trading_orders: `CREATE TABLE IF NOT EXISTS trading_orders (
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
);`,
        sample_data: `INSERT INTO coupons (code, name, description, discount_type, discount_value, valid_from, valid_until) VALUES
('WELCOME10', '신규 가입 10% 할인', '신규 회원 가입 시 10% 할인 쿠폰', 'percentage', 10.00, NOW(), NOW() + INTERVAL '1 year'),
('FIRST5000', '첫 거래 5000원 할인', '첫 거래 시 5000원 할인', 'fixed', 5000.00, NOW(), NOW() + INTERVAL '6 months'),
('VIP20', 'VIP 회원 20% 할인', 'VIP 등급 회원 전용 20% 할인', 'percentage', 20.00, NOW(), NOW() + INTERVAL '1 year')
ON CONFLICT (code) DO NOTHING;`
      }
    };
    
    res.json({
      success: true,
      message: '테이블 생성 가이드',
      data: guide
    });
    
  } catch (error) {
    console.error('❌ 가이드 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: 'Guide Generation Error',
      message: '가이드 생성 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 데이터베이스 연결 테스트
router.get('/test-connection', async (req, res) => {
  try {
    console.log('🔌 Supabase 연결 테스트 중...');
    
    // 간단한 쿼리로 연결 테스트
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      message: 'Supabase 연결 성공',
      data: {
        connected: true,
        timestamp: new Date().toISOString(),
        supabaseUrl: supabaseUrl,
        testResult: data
      }
    });
    
  } catch (error) {
    console.error('❌ 연결 테스트 실패:', error);
    res.status(500).json({
      success: false,
      error: 'Connection Test Failed',
      message: 'Supabase 연결 테스트에 실패했습니다.',
      details: error.message
    });
  }
});

// 🚨 AI 테이블 스키마 자동 수정 API
router.post('/fix-ai-tables', async (req, res) => {
  try {
    console.log('🔧 AI 테이블 스키마 자동 수정 시작...');
    
    const fixQueries = [
      // 1. ai_learning_data 테이블 컬럼 추가
      `ALTER TABLE ai_learning_data ADD COLUMN IF NOT EXISTS strategy_type VARCHAR(50) DEFAULT 'traditional'`,
      `ALTER TABLE ai_learning_data ADD COLUMN IF NOT EXISTS learning_phase VARCHAR(20) DEFAULT 'training'`,
      `ALTER TABLE ai_learning_data ADD COLUMN IF NOT EXISTS feedback_score INTEGER`,
      `ALTER TABLE ai_learning_data ADD COLUMN IF NOT EXISTS user_feedback TEXT`,
      `ALTER TABLE ai_learning_data ADD COLUMN IF NOT EXISTS model_version VARCHAR(20) DEFAULT 'v1.0'`,
      `ALTER TABLE ai_learning_data ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(5,4)`,
      `ALTER TABLE ai_learning_data ADD COLUMN IF NOT EXISTS reasoning TEXT`,
      
      // 2. ai_strategy_performance 테이블 컬럼 추가
      `ALTER TABLE ai_strategy_performance ADD COLUMN IF NOT EXISTS strategy_type VARCHAR(50) DEFAULT 'traditional'`,
      `ALTER TABLE ai_strategy_performance ADD COLUMN IF NOT EXISTS strategy_version VARCHAR(20) DEFAULT 'v1.0'`,
      `ALTER TABLE ai_strategy_performance ADD COLUMN IF NOT EXISTS learning_iterations INTEGER DEFAULT 0`,
      `ALTER TABLE ai_strategy_performance ADD COLUMN IF NOT EXISTS model_accuracy DECIMAL(5,4) DEFAULT 0.0`,
      `ALTER TABLE ai_strategy_performance ADD COLUMN IF NOT EXISTS prediction_confidence DECIMAL(5,4) DEFAULT 0.0`,
      `ALTER TABLE ai_strategy_performance ADD COLUMN IF NOT EXISTS max_position_size DECIMAL(5,4) DEFAULT 0.1`,
      `ALTER TABLE ai_strategy_performance ADD COLUMN IF NOT EXISTS current_drawdown DECIMAL(5,4) DEFAULT 0.0`,
      `ALTER TABLE ai_strategy_performance ADD COLUMN IF NOT EXISTS risk_adjusted_return DECIMAL(5,4) DEFAULT 0.0`,
      `ALTER TABLE ai_strategy_performance ADD COLUMN IF NOT EXISTS evaluation_period_start TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE ai_strategy_performance ADD COLUMN IF NOT EXISTS evaluation_period_end TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE ai_strategy_performance ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
      
      // 3. 기존 NULL 데이터 업데이트
      `UPDATE ai_learning_data SET strategy_type = 'traditional' WHERE strategy_type IS NULL`,
      `UPDATE ai_learning_data SET learning_phase = 'training' WHERE learning_phase IS NULL`,
      `UPDATE ai_learning_data SET model_version = 'v1.0' WHERE model_version IS NULL`,
      `UPDATE ai_strategy_performance SET strategy_type = 'traditional' WHERE strategy_type IS NULL`,
      `UPDATE ai_strategy_performance SET strategy_version = 'v1.0' WHERE strategy_version IS NULL`,
      
      // 4. 인덱스 추가
      `CREATE INDEX IF NOT EXISTS idx_ai_learning_data_strategy_type ON ai_learning_data(strategy_type)`,
      `CREATE INDEX IF NOT EXISTS idx_ai_learning_data_learning_phase ON ai_learning_data(learning_phase)`,
      `CREATE INDEX IF NOT EXISTS idx_ai_strategy_performance_strategy_type ON ai_strategy_performance(strategy_type)`,
      `CREATE INDEX IF NOT EXISTS idx_ai_learning_data_user_strategy ON ai_learning_data(user_id, strategy_type, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_ai_strategy_performance_user_strategy ON ai_strategy_performance(user_id, strategy_type, last_updated DESC)`
    ];
    
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const [index, query] of fixQueries.entries()) {
      try {
        console.log(`🔧 실행 중 (${index + 1}/${fixQueries.length}): ${query.substring(0, 50)}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: query 
        });
        
        if (error) {
          console.error(`❌ 쿼리 실행 실패: ${error.message}`);
          results.push({
            query: query.substring(0, 100) + '...',
            status: 'failed',
            error: error.message
          });
          errorCount++;
        } else {
          console.log(`✅ 쿼리 실행 성공`);
          results.push({
            query: query.substring(0, 100) + '...',
            status: 'success'
          });
          successCount++;
        }
      } catch (err) {
        console.error(`❌ 쿼리 실행 예외: ${err.message}`);
        results.push({
          query: query.substring(0, 100) + '...',
          status: 'failed',
          error: err.message
        });
        errorCount++;
      }
    }
    
    // 최종 테이블 구조 확인
    let finalStructure = null;
    try {
      const { data: structureData } = await supabase
        .from('information_schema.columns')
        .select('table_name, column_name, data_type, is_nullable, column_default')
        .in('table_name', ['ai_learning_data', 'ai_strategy_performance'])
        .eq('table_schema', 'public')
        .order('table_name, ordinal_position');
      
      finalStructure = structureData;
    } catch (err) {
      console.warn('테이블 구조 확인 실패:', err.message);
    }
    
    const summary = {
      totalQueries: fixQueries.length,
      successCount,
      errorCount,
      success: errorCount === 0,
      message: errorCount === 0 
        ? '🎉 AI 테이블 스키마 수정이 완료되었습니다!' 
        : `⚠️ ${successCount}개 성공, ${errorCount}개 실패`
    };
    
    console.log('🔧 AI 테이블 스키마 수정 완료:', summary);
    
    res.json({
      success: summary.success,
      data: {
        summary,
        results,
        finalStructure
      },
      message: summary.message
    });
    
  } catch (error) {
    console.error('❌ AI 테이블 스키마 수정 실패:', error);
    res.status(500).json({
      success: false,
      error: 'AI 테이블 스키마 수정 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 🔍 AI 테이블 현재 상태 확인 API
router.get('/ai-tables-status', async (req, res) => {
  try {
    console.log('🔍 AI 테이블 상태 확인 중...');
    
    // 테이블 존재 여부 확인
    const { data: tablesData } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['ai_learning_data', 'ai_strategy_performance']);
    
    const existingTables = tablesData?.map(t => t.table_name) || [];
    
    // 각 테이블 컬럼 구조 확인
    const tableStructures = {};
    const requiredColumns = {
      ai_learning_data: [
        'id', 'user_id', 'symbol', 'timeframe', 'market_data', 'action', 
        'strategy_type', 'learning_phase', 'confidence_score', 'reasoning',
        'entry_price', 'exit_price', 'profit_loss', 'success', 'model_version',
        'feedback_score', 'user_feedback', 'created_at', 'updated_at'
      ],
      ai_strategy_performance: [
        'id', 'user_id', 'strategy_name', 'strategy_type', 'strategy_version',
        'total_trades', 'winning_trades', 'losing_trades', 'win_rate',
        'total_profit_loss', 'max_drawdown', 'sharpe_ratio', 'daily_return',
        'weekly_return', 'monthly_return', 'learning_iterations', 
        'model_accuracy', 'prediction_confidence', 'max_position_size',
        'current_drawdown', 'risk_adjusted_return', 'evaluation_period_start',
        'evaluation_period_end', 'last_updated', 'created_at'
      ]
    };
    
    for (const tableName of existingTables) {
      const { data: columnsData } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');
      
      const existingColumns = columnsData?.map(c => c.column_name) || [];
      const missingColumns = requiredColumns[tableName]?.filter(
        col => !existingColumns.includes(col)
      ) || [];
      
      tableStructures[tableName] = {
        exists: true,
        totalColumns: existingColumns.length,
        requiredColumns: requiredColumns[tableName]?.length || 0,
        missingColumns,
        needsFix: missingColumns.length > 0,
        columns: columnsData
      };
    }
    
    // 누락된 테이블 확인
    const missingTables = Object.keys(requiredColumns).filter(
      table => !existingTables.includes(table)
    );
    
    // 데이터 개수 확인
    const dataCounts = {};
    for (const tableName of existingTables) {
      try {
        const { count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        dataCounts[tableName] = count || 0;
      } catch (err) {
        dataCounts[tableName] = 'error';
      }
    }
    
    const summary = {
      totalTablesRequired: Object.keys(requiredColumns).length,
      existingTables: existingTables.length,
      missingTables,
      needsSchemaFix: Object.values(tableStructures).some(t => t.needsFix),
      dataCounts
    };
    
    res.json({
      success: true,
      data: {
        summary,
        tableStructures,
        missingTables
      },
      message: summary.needsSchemaFix 
        ? '⚠️ AI 테이블 스키마 수정이 필요합니다.'
        : '✅ AI 테이블 스키마가 정상입니다.'
    });
    
  } catch (error) {
    console.error('❌ AI 테이블 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: 'AI 테이블 상태 확인 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

module.exports = router; 