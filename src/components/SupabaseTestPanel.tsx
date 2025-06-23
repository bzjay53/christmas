// 🎄 Christmas Trading - Supabase Test Panel
// 데이터베이스 연동 테스트용 컴포넌트

import { useState, useEffect } from 'react'
import { getAllStocks, subscribeToStocks, type Stock } from '../lib/stocksService'

const SupabaseTestPanel: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  useEffect(() => {
    // 초기 데이터 로드
    const loadStocks = async () => {
      try {
        setLoading(true)
        const { data, error } = await getAllStocks()
        
        if (error) {
          setError(`데이터 조회 실패: ${error.message || JSON.stringify(error)}`)
          console.error('Stocks loading error:', error)
        } else if (data) {
          setStocks(data)
          setError(null)
          setLastUpdate(new Date().toLocaleTimeString())
          console.log('✅ 주식 데이터 로드 성공:', data)
        }
      } catch (err) {
        setError(`예외 발생: ${err}`)
        console.error('Exception loading stocks:', err)
      } finally {
        setLoading(false)
      }
    }

    loadStocks()

    // 실시간 구독 설정
    const subscription = subscribeToStocks((updatedStocks) => {
      setStocks(updatedStocks)
      setLastUpdate(new Date().toLocaleTimeString())
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="bg-green-50 border border-green-200 rounded p-4 m-4">
        <h3 className="text-green-800 font-bold mb-2">🔄 Supabase 데이터 로딩 중...</h3>
        <p className="text-green-600">주식 데이터를 가져오고 있습니다.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 m-4">
        <h3 className="text-red-800 font-bold mb-2">❌ Supabase 연결 테스트 실패</h3>
        <p className="text-red-600 text-sm">{error}</p>
        <p className="text-red-500 text-xs mt-2">
          💡 Supabase에서 stocks 테이블이 생성되었는지 확인해주세요.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded p-4 m-4">
      <h3 className="text-blue-800 font-bold mb-3">
        ✅ Supabase 데이터베이스 연결 성공!
      </h3>
      
      <div className="mb-3">
        <span className="text-blue-600 text-sm">
          📊 총 {stocks.length}개 종목 | 마지막 업데이트: {lastUpdate}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {stocks.map((stock) => (
          <div key={stock.symbol} className="bg-white border rounded p-3">
            <div className="font-bold text-gray-800">{stock.name}</div>
            <div className="text-sm text-gray-600">{stock.symbol}</div>
            <div className="text-lg font-bold text-blue-600">
              ₩{stock.current_price?.toLocaleString()}
            </div>
            <div className={`text-sm ${
              stock.price_change >= 0 ? 'text-red-500' : 'text-blue-500'
            }`}>
              {stock.price_change >= 0 ? '+' : ''}{stock.price_change?.toLocaleString()} 
              ({stock.price_change_percent}%)
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-blue-500">
        🔄 실시간 업데이트 활성화됨 | Market: {stocks[0]?.market || 'N/A'}
      </div>
    </div>
  )
}

export default SupabaseTestPanel