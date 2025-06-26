// 🎄 Christmas Trading - Live Stocks Chart
// Supabase 데이터와 연동된 실시간 주식 차트

import React, { useRef, useEffect, useState } from 'react'
import Chart from 'chart.js/auto'
import { getAllStocks, subscribeToStocks, startDataSimulation, type Stock } from '../../lib/stocksService'

const LiveStocksChart: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)
  const [stocks, setStocks] = useState<Stock[]>([])
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [marketStatus, setMarketStatus] = useState<any>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // 기존 차트 제거
    if (chartRef.current) {
      chartRef.current.destroy()
    }

    // 초기 데이터 로드
    const loadData = async () => {
      const { data } = await getAllStocks()
      if (data) {
        setStocks(data)
        setLastUpdate(new Date().toLocaleTimeString())
        createChart(data)
      }
    }

    loadData()

    // 실시간 구독 (Supabase가 있으면 사용, 없으면 시뮬레이션)
    const subscription = subscribeToStocks((updatedStocks) => {
      setStocks(updatedStocks)
      setLastUpdate(new Date().toLocaleTimeString())
      if (chartRef.current) {
        updateChart(updatedStocks)
      }
    })

    // Mock 데이터 시뮬레이션 시작 (시장시간 고려)
    const simulationInterval = startDataSimulation(
      (updatedStocks) => {
        setStocks(updatedStocks)
        setLastUpdate(new Date().toLocaleTimeString())
        if (chartRef.current) {
          updateChart(updatedStocks)
        }
      },
      (status) => {
        setMarketStatus(status)
      }
    )

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
      subscription.unsubscribe()
      clearInterval(simulationInterval)
    }
  }, [])

  const createChart = (stockData: Stock[]) => {
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
        labels: stockData.map(stock => stock.name),
        datasets: [{
          label: '현재가 (원)',
          data: stockData.map(stock => stock.current_price),
          backgroundColor: stockData.map((_, index) => colors[index % colors.length] + '20'),
          borderColor: stockData.map((_, index) => colors[index % colors.length]),
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
            text: `📊 실시간 주식 현황 (${lastUpdate})`,
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
                return new Intl.NumberFormat('ko-KR').format(value as number) + '원'
              }
            }
          }
        }
      }
    })

    console.log('📈 실시간 주식 차트 생성 완료')
  }

  const updateChart = (stockData: Stock[]) => {
    if (!chartRef.current) return

    chartRef.current.data.datasets[0].data = stockData.map(stock => stock.current_price)
    chartRef.current.options.plugins!.title!.text = `📊 실시간 주식 현황 (${lastUpdate})`
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
            🎄 크리스마스 트레이딩 - 실시간 주식
          </h3>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            📊 {stocks.length}개 종목 | 🔄 {lastUpdate}
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
                💡 실제 거래시간: 평일 09:00-15:30
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

export default LiveStocksChart