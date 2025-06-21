import { TrendingUp, PieChart, DollarSign } from 'lucide-react'

export function Portfolio() {
  // Mock portfolio data
  const holdings = [
    {
      symbol: '삼성전자',
      name: 'Samsung Electronics',
      quantity: 50,
      avgPrice: 68000,
      currentPrice: 71200,
      totalValue: 3560000,
      pnl: 160000,
      pnlPercent: 4.7,
      allocation: 28.5
    },
    {
      symbol: 'SK하이닉스',
      name: 'SK Hynix',
      quantity: 25,
      avgPrice: 124000,
      currentPrice: 128500,
      totalValue: 3212500,
      pnl: 112500,
      pnlPercent: 3.6,
      allocation: 25.7
    },
    {
      symbol: 'NAVER',
      name: 'Naver Corporation',
      quantity: 15,
      avgPrice: 185000,
      currentPrice: 192000,
      totalValue: 2880000,
      pnl: 105000,
      pnlPercent: 3.8,
      allocation: 23.0
    },
    {
      symbol: 'LG에너지솔루션',
      name: 'LG Energy Solution',
      quantity: 8,
      avgPrice: 420000,
      currentPrice: 435000,
      totalValue: 3480000,
      pnl: 120000,
      pnlPercent: 3.6,
      allocation: 22.8
    }
  ]

  const totalValue = holdings.reduce((sum, holding) => sum + holding.totalValue, 0)
  const totalPnL = holdings.reduce((sum, holding) => sum + holding.pnl, 0)
  const totalPnLPercent = (totalPnL / (totalValue - totalPnL)) * 100

  const performanceData = [
    { date: '2024-06-17', value: 11800000 },
    { date: '2024-06-18', value: 12050000 },
    { date: '2024-06-19', value: 12180000 },
    { date: '2024-06-20', value: 12320000 },
    { date: '2024-06-21', value: 12500000 }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="title-hero mb-2">📊 나의 크리스마스 포트폴리오</h1>
          <p className="text-secondary">안전하고 균형잡힌 투자 현황을 확인하세요</p>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="christmas-card card-portfolio hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary text-sm">총 포트폴리오 가치</p>
                <p className="text-3xl font-bold text-data">₩{totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-christmas-gold" />
            </div>
          </div>

          <div className="christmas-card card-profit hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary text-sm">총 수익/손실</p>
                <p className="text-3xl font-bold text-profit flex items-center">
                  ₩{totalPnL.toLocaleString()}
                  <TrendingUp className="w-6 h-6 ml-2" />
                </p>
                <p className="text-profit text-sm">+{totalPnLPercent.toFixed(2)}%</p>
              </div>
            </div>
          </div>

          <div className="christmas-card card-ai hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary text-sm">보유 종목 수</p>
                <p className="text-3xl font-bold text-christmas-green">{holdings.length}</p>
                <p className="text-xs text-secondary">다변화 지수: 우수</p>
              </div>
              <PieChart className="w-8 h-8 text-christmas-green" />
            </div>
          </div>
        </div>

        {/* Performance Chart Area */}
        <div className="christmas-card mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="title-card">📈 성과 추이</h2>
            <div className="flex space-x-2">
              <button className="text-sm px-3 py-1 bg-christmas-light-green text-christmas-dark-green rounded">1주</button>
              <button className="text-sm px-3 py-1 text-gray-600 hover:bg-gray-100 rounded">1개월</button>
              <button className="text-sm px-3 py-1 text-gray-600 hover:bg-gray-100 rounded">3개월</button>
            </div>
          </div>
          
          {/* Simple Chart Representation */}
          <div className="h-64 bg-gradient-to-t from-christmas-light-green to-white rounded-lg flex items-end justify-around p-4">
            {performanceData.map((data, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className="bg-christmas-green rounded-t w-8 transition-all duration-500 hover:bg-christmas-dark-green"
                  style={{ height: `${(data.value / 13000000) * 200}px` }}
                ></div>
                <p className="text-xs text-secondary mt-2">{data.date.split('-')[2]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Holdings Table */}
        <div className="christmas-card">
          <h2 className="title-card mb-6">🎁 보유 종목</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 font-semibold text-gray-700">종목</th>
                  <th className="text-right py-3 font-semibold text-gray-700">수량</th>
                  <th className="text-right py-3 font-semibold text-gray-700">평균단가</th>
                  <th className="text-right py-3 font-semibold text-gray-700">현재가</th>
                  <th className="text-right py-3 font-semibold text-gray-700">평가금액</th>
                  <th className="text-right py-3 font-semibold text-gray-700">손익</th>
                  <th className="text-right py-3 font-semibold text-gray-700">비중</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4">
                      <div>
                        <div className="font-semibold">{holding.symbol}</div>
                        <div className="text-sm text-secondary">{holding.name}</div>
                      </div>
                    </td>
                    <td className="text-right py-4 text-data">{holding.quantity.toLocaleString()}</td>
                    <td className="text-right py-4 text-data">₩{holding.avgPrice.toLocaleString()}</td>
                    <td className="text-right py-4 text-data">₩{holding.currentPrice.toLocaleString()}</td>
                    <td className="text-right py-4 text-data font-semibold">₩{holding.totalValue.toLocaleString()}</td>
                    <td className="text-right py-4">
                      <div className="text-profit font-semibold">
                        ₩{holding.pnl.toLocaleString()}
                      </div>
                      <div className="text-profit text-sm">
                        +{holding.pnlPercent}%
                      </div>
                    </td>
                    <td className="text-right py-4">
                      <div className="text-data font-semibold">{holding.allocation}%</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Portfolio Allocation */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-semibold mb-4">포트폴리오 배분</h3>
            <div className="space-y-3">
              {holdings.map((holding, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-24 text-sm font-medium">{holding.symbol}</div>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-christmas-green h-2 rounded-full transition-all duration-500"
                        style={{ width: `${holding.allocation}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm font-medium">{holding.allocation}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}