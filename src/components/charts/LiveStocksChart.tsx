// 🎄 Christmas Trading - Live Crypto Chart
// Supabase 데이터와 연동된 실시간 암호화폐 차트

import React, { useRef, useEffect, useState } from 'react'
import Chart from 'chart.js/auto'
import { getAllCryptos, subscribeToCryptos, startDataSimulation, subscribeToRealTimeCryptos, type Crypto } from '../../lib/stocksService'

const LiveCryptoChart: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)
  const [cryptos, setCryptos] = useState<Crypto[]>([])
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [marketStatus, setMarketStatus] = useState<{ isOpen: boolean; statusMessage: string } | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  useEffect(() => {
    if (!canvasRef.current) return

    // 기존 차트 제거
    if (chartRef.current) {
      chartRef.current.destroy()
    }

    // 초기 데이터 로드
    const loadData = async () => {
      const { data } = await getAllCryptos()
      if (data) {
        setCryptos(data)
        setLastUpdate(new Date().toLocaleTimeString())
        createChart(data)
      }
    }

    loadData()

    // 환경변수로 실제 WebSocket 사용 여부 결정
    const hasRealAPIKeys = import.meta.env.VITE_BINANCE_API_KEY && 
                          import.meta.env.VITE_BINANCE_SECRET_KEY &&
                          !import.meta.env.VITE_BINANCE_API_KEY.includes('placeholder')
    const useRealWebSocket = import.meta.env.VITE_ENABLE_MOCK_DATA !== 'true' && hasRealAPIKeys

    let websocketConnection: { disconnect?: () => void; subscription?: any; simulationInterval?: NodeJS.Timeout } | null = null

    if (useRealWebSocket) {
      // 실제 바이낸스 WebSocket 사용
      console.log('🔌 바이낸스 실시간 WebSocket 연결 시작...')
      setConnectionStatus('connecting')
      
      websocketConnection = subscribeToRealTimeCryptos((updatedCryptos) => {
        setCryptos(updatedCryptos)
        setLastUpdate(new Date().toLocaleTimeString())
        setConnectionStatus('connected')
        setMarketStatus({ isOpen: true, statusMessage: '🟢 실시간 바이낸스 연결됨' })
        
        if (chartRef.current) {
          updateChart(updatedCryptos)
        }
      })
    } else {
      // Mock 시뮬레이션 사용 (기존 방식)
      console.log('📊 Mock 데이터 시뮬레이션 시작...')
      setConnectionStatus('connected')
      
      // Supabase 구독 (fallback)
      const subscription = subscribeToCryptos((updatedCryptos) => {
        setCryptos(updatedCryptos)
        setLastUpdate(new Date().toLocaleTimeString())
        if (chartRef.current) {
          updateChart(updatedCryptos)
        }
      })

      // Mock 데이터 시뮬레이션 시작 (시장시간 고려)
      const simulationInterval = startDataSimulation(
        (updatedCryptos) => {
          setCryptos(updatedCryptos)
          setLastUpdate(new Date().toLocaleTimeString())
          if (chartRef.current) {
            updateChart(updatedCryptos)
          }
        },
        (status) => {
          setMarketStatus(status)
        }
      )
      
      websocketConnection = { subscription, simulationInterval }
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
      
      // 연결 타입에 따른 정리
      if (useRealWebSocket && websocketConnection) {
        console.log('🔌 바이낸스 WebSocket 연결 해제')
        websocketConnection.disconnect()
      } else if (websocketConnection) {
        // Mock 모드 정리
        if (websocketConnection.subscription) {
          websocketConnection.subscription.unsubscribe()
        }
        if (websocketConnection.simulationInterval) {
          clearInterval(websocketConnection.simulationInterval)
        }
      }
      
      setConnectionStatus('disconnected')
    }
  }, [])

  const createChart = (cryptoData: Crypto[]) => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext('2d')!
    
    // 주식별 색상 매핑
    const colors = [
      '#10B981', // 녹색
      '#3B82F6', // 파랑
      '#F59E0B', // 주황
      '#EF4444', // 빨강
      '#8B5CF6', // 보라
      '#06B6D4', // 시안
      '#F97316', // 오렌지
      '#84CC16'  // 라임
    ]

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: cryptoData.map(crypto => crypto.name),
        datasets: [{
          label: '현재가 (USDT)',
          data: cryptoData.map(crypto => crypto.current_price),
          backgroundColor: cryptoData.map((_, index) => colors[index % colors.length] + '20'),
          borderColor: cryptoData.map((_, index) => colors[index % colors.length]),
          borderWidth: 2,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 500,
          easing: 'easeInOutQuart'
        },
        plugins: {
          title: {
            display: true,
            text: `📊 실시간 암호화폐 현황 (${lastUpdate})`,
            font: { size: 16, weight: 'bold' },
            color: '#1F2937'
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: function(value) {
                return '$' + new Intl.NumberFormat('en-US').format(value as number)
              }
            }
          }
        }
      }
    })

    console.log('📈 실시간 암호화폐 차트 생성 완료')
  }

  const updateChart = (cryptoData: Crypto[]) => {
    if (!chartRef.current) return

    chartRef.current.data.datasets[0].data = cryptoData.map(crypto => crypto.current_price)
    chartRef.current.options.plugins!.title!.text = `📊 실시간 암호화폐 현황 (${lastUpdate})`
    chartRef.current.update('none') // 애니메이션 없이 즉시 업데이트

    console.log('📈 차트 데이터 업데이트 완료')
  }

  return (
    <div className="rounded-lg shadow-lg p-6 mb-6" style={{ 
      background: 'var(--bg-panel)', 
      border: '1px solid var(--border-primary)' 
    }}>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            🎄 크리스마스 트레이딩 - 실시간 암호화폐
          </h3>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <span className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 
              'bg-red-500'
            }`}></span>
            <span>
              {connectionStatus === 'connected' ? '🔌 연결됨' : 
               connectionStatus === 'connecting' ? '⏳ 연결 중' : 
               '❌ 연결 끊김'}
            </span>
            <span>📊 {cryptos.length}개 코인 | 🔄 {lastUpdate}</span>
          </div>
        </div>
        
        {marketStatus && (
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-1 rounded text-xs font-medium" style={{
              backgroundColor: marketStatus.isOpen ? 'var(--christmas-green-bg)' : 'var(--bg-card)',
              color: marketStatus.isOpen ? 'var(--christmas-green)' : 'var(--text-muted)',
              border: `1px solid ${marketStatus.isOpen ? 'var(--christmas-green)' : 'var(--border-secondary)'}`
            }}>
              {marketStatus.statusMessage}
            </span>
            {!marketStatus.isOpen && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                💡 암호화폐 시장: 24시간 연중무휴
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="relative h-64">
        <canvas ref={canvasRef} className="w-full h-full"></canvas>
      </div>
    </div>
  )
}

export default LiveCryptoChart