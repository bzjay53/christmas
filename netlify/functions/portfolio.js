const { createClient } = require('@supabase/supabase-js')

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  }

  // CORS preflight 요청 처리
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  try {
    const { httpMethod, path, body, queryStringParameters } = event

    switch (httpMethod) {
      case 'GET':
        // 포트폴리오 데이터 조회
        if (path.includes('/portfolio/summary')) {
          const { data, error } = await supabase
            .from('portfolio_summary')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)

          if (error) {
            throw error
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              data: data[0] || {
                totalValue: 10150000,
                totalReturn: 150000,
                returnRate: 1.5,
                dailyPnL: 25000,
                positions: 3,
                winRate: 100.0,
                lastUpdated: new Date().toISOString()
              }
            })
          }
        }

        if (path.includes('/portfolio/positions')) {
          const { data, error } = await supabase
            .from('positions')
            .select('*')
            .eq('is_active', true)

          if (error) {
            throw error
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              data: data || []
            })
          }
        }

        if (path.includes('/portfolio/history')) {
          const { data, error } = await supabase
            .from('portfolio_history')
            .select('*')
            .order('timestamp', { ascending: true })
            .limit(100)

          if (error) {
            throw error
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              data: data || []
            })
          }
        }
        break

      case 'POST':
        // 포트폴리오 업데이트
        if (path.includes('/portfolio/update')) {
          const updateData = JSON.parse(body)
          
          const { data, error } = await supabase
            .from('portfolio_summary')
            .insert([{
              ...updateData,
              created_at: new Date().toISOString()
            }])

          if (error) {
            throw error
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: '포트폴리오가 업데이트되었습니다.',
              data
            })
          }
        }
        break

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Method not allowed'
          })
        }
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Endpoint not found'
      })
    }

  } catch (error) {
    console.error('Portfolio API Error:', error)
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message
      })
    }
  }
} 