import { TrendingUp, DollarSign, Shield, Brain } from 'lucide-react'

export function Dashboard() {
  // Mock data
  const portfolioValue = 1250000
  const dailyPnL = 15250
  const dailyPnLPercent = 1.24
  const winRate = 99.2
  const maxLoss = 0.3
  const safetyLevel = 9.8

  const mockRecommendations = [
    {
      id: 1,
      stock: '삼성전자',
      action: '매수',
      confidence: 98.5,
      expectedReturn: 2.1,
      riskLevel: 'ultra-low',
      reason: 'AI 패턴 분석: 반도체 업황 개선 신호 감지'
    },
    {
      id: 2,
      stock: 'SK하이닉스',
      action: '매수',
      confidence: 97.8,
      expectedReturn: 1.8,
      riskLevel: 'low',
      reason: '메모리 수요 증가 예상, 기술적 지표 상승 신호'
    },
    {
      id: 3,
      stock: 'LG에너지솔루션',
      action: '관망',
      confidence: 89.2,
      expectedReturn: 0.8,
      riskLevel: 'medium',
      reason: '배터리 시장 변동성 증가, 관망 권장'
    }
  ]

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'ultra-low': return 'bg-risk-ultra-low text-green-800'
      case 'low': return 'bg-risk-low text-green-700'
      case 'medium': return 'bg-risk-medium text-yellow-700'
      case 'high': return 'bg-risk-high text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="title-hero mb-2">🎄 나의 크리스마스 투자 현황</h1>
          <p className="text-secondary">안전하고 따뜻한 투자 여정을 함께하세요</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="christmas-card card-portfolio hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary text-sm">총 포트폴리오 가치</p>
                <p className="text-2xl font-bold text-data">₩{portfolioValue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-christmas-gold" />
            </div>
          </div>

          <div className="christmas-card card-profit hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary text-sm">오늘 수익</p>
                <p className="text-2xl font-bold text-profit flex items-center">
                  ₩{dailyPnL.toLocaleString()}
                  <TrendingUp className="w-5 h-5 ml-2" />
                </p>
                <p className="text-profit text-sm">+{dailyPnLPercent}%</p>
              </div>
            </div>
          </div>

          <div className="christmas-card card-trading hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary text-sm">승률</p>
                <p className="text-2xl font-bold text-christmas-gold">{winRate}%</p>
                <p className="text-xs text-secondary">목표: 99%+</p>
              </div>
              <Brain className="w-8 h-8 text-christmas-gold sparkle" />
            </div>
          </div>

          <div className="christmas-card card-ai hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary text-sm">안전도</p>
                <p className="text-2xl font-bold text-christmas-green">{safetyLevel}/10</p>
                <p className="text-xs text-secondary">최대손실: {maxLoss}%</p>
              </div>
              <Shield className="w-8 h-8 text-christmas-green" />
            </div>
          </div>
        </div>

        {/* Safety Status */}
        <div className="christmas-card mb-8 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center mb-4">
            <Shield className="w-6 h-6 text-christmas-green mr-3" />
            <h2 className="title-card">7단계 안전장치 상태</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { name: '리스크 분석', status: '정상', color: 'green' },
              { name: '포지션 관리', status: '정상', color: 'green' },
              { name: '손실 제한', status: '정상', color: 'green' },
              { name: '시장 모니터링', status: '정상', color: 'green' },
              { name: '자동 청산', status: '대기', color: 'blue' },
              { name: '비상 중단', status: '대기', color: 'blue' },
              { name: '알림 시스템', status: '정상', color: 'green' }
            ].map((safety, index) => (
              <div key={index} className="text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                  safety.color === 'green' ? 'bg-green-500' : 'bg-blue-500'
                }`}></div>
                <p className="text-xs font-medium">{safety.name}</p>
                <p className="text-xs text-secondary">{safety.status}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="christmas-card">
          <div className="flex items-center mb-6">
            <Brain className="w-6 h-6 text-christmas-green mr-3 sparkle" />
            <h2 className="title-card">🎁 AI 맞춤 추천</h2>
          </div>
          
          <div className="space-y-4">
            {mockRecommendations.map((rec) => (
              <div key={rec.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-lg">{rec.stock}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      rec.action === '매수' ? 'bg-christmas-light-green text-christmas-dark-green' :
                      rec.action === '매도' ? 'bg-christmas-light-red text-christmas-dark-red' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {rec.action}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getRiskColor(rec.riskLevel)}`}>
                      {rec.riskLevel === 'ultra-low' ? '초저위험' :
                       rec.riskLevel === 'low' ? '저위험' :
                       rec.riskLevel === 'medium' ? '중위험' : '고위험'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-secondary">신뢰도</p>
                    <p className="font-bold text-christmas-green">{rec.confidence}%</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-secondary text-sm">{rec.reason}</p>
                  <div className="text-right">
                    <p className="text-sm text-secondary">예상 수익률</p>
                    <p className="font-bold text-profit">+{rec.expectedReturn}%</p>
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-3">
                  <button className="btn-christmas-primary">
                    {rec.action} 실행
                  </button>
                  <button className="btn-christmas-secondary">
                    상세 분석
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}