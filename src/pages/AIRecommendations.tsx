import { Brain, TrendingUp, Shield, Clock, Star, CheckCircle } from 'lucide-react'

export function AIRecommendations() {
  const recommendations = [
    {
      id: 1,
      stock: '삼성전자',
      code: '005930',
      action: '매수',
      targetPrice: 75000,
      currentPrice: 71200,
      confidence: 98.5,
      expectedReturn: 5.3,
      timeframe: '단기 (1-2주)',
      riskLevel: 'ultra-low',
      aiReason: 'AI 패턴 분석: 반도체 업황 개선 신호 감지, 기술적 지표 상승 패턴',
      factors: [
        '메모리 반도체 수요 증가',
        '파운드리 사업 성장세',
        '기술적 지표: RSI 55, MACD 상승'
      ],
      safetyScore: 9.8,
      personalizedNote: '귀하의 보수적 투자 성향에 적합한 안전한 추천입니다.'
    },
    {
      id: 2,
      stock: 'POSCO홀딩스',
      code: '005490',
      action: '매수',
      targetPrice: 520000,
      currentPrice: 485000,
      confidence: 96.2,
      expectedReturn: 7.2,
      timeframe: '중기 (2-4주)',
      riskLevel: 'low',
      aiReason: '철강 업종 회복 신호, 중국 경기 부양책 영향으로 원자재 수요 증가 예상',
      factors: [
        '중국 인프라 투자 확대',
        '국내 건설업 회복세',
        '원자재 가격 상승 모멘텀'
      ],
      safetyScore: 9.5,
      personalizedNote: '중장기 가치투자 관점에서 매력적인 종목입니다.'
    },
    {
      id: 3,
      stock: 'LG에너지솔루션',
      code: '373220',
      action: '관망',
      targetPrice: 450000,
      currentPrice: 435000,
      confidence: 89.2,
      expectedReturn: 3.4,
      timeframe: '장기 (1-3개월)',
      riskLevel: 'medium',
      aiReason: '배터리 시장 성장성은 우수하나 단기 변동성 존재, 관망 후 진입점 모색',
      factors: [
        '전기차 시장 성장',
        '미국 IRA 법안 수혜',
        '단기 실적 변동성 우려'
      ],
      safetyScore: 8.7,
      personalizedNote: '현재 시점보다는 추가 하락 시 매수를 권장합니다.'
    },
    {
      id: 4,
      stock: '카카오',
      code: '035720',
      action: '매도',
      targetPrice: 45000,
      currentPrice: 48500,
      confidence: 91.8,
      expectedReturn: -7.2,
      timeframe: '즉시',
      riskLevel: 'high',
      aiReason: '플랫폼 규제 리스크 증가, 광고 시장 둔화로 실적 악화 우려',
      factors: [
        '플랫폼 규제 강화',
        '광고 수익 감소',
        '기술적 지표 약화'
      ],
      safetyScore: 6.2,
      personalizedNote: '손실 제한을 위해 조기 매도를 권장합니다.'
    }
  ]

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'ultra-low': return 'bg-risk-ultra-low text-green-800 border-green-300'
      case 'low': return 'bg-risk-low text-green-700 border-green-400'
      case 'medium': return 'bg-risk-medium text-yellow-700 border-yellow-400'
      case 'high': return 'bg-risk-high text-orange-700 border-orange-400'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case '매수': return 'bg-christmas-light-green text-christmas-dark-green border-christmas-green'
      case '매도': return 'bg-christmas-light-red text-christmas-dark-red border-christmas-red'
      case '관망': return 'bg-gray-100 text-gray-700 border-gray-400'
      default: return 'bg-gray-100 text-gray-700 border-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="title-hero mb-2">🧠 AI 맞춤 투자 추천</h1>
          <p className="text-secondary">인공지능이 분석한 개인화된 투자 기회를 확인하세요</p>
        </div>

        {/* AI Status */}
        <div className="christmas-card card-ai mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Brain className="w-12 h-12 text-blue-600 sparkle" />
              <div>
                <h2 className="title-card">크리스마스 AI 분석 엔진</h2>
                <p className="text-secondary">실시간 시장 데이터와 개인 투자 성향을 분석 중</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-600 font-medium">활성</span>
              </div>
              <p className="text-sm text-secondary">마지막 업데이트: 방금 전</p>
            </div>
          </div>
        </div>

        {/* AI Insights Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="christmas-card text-center hover-lift">
            <Star className="w-8 h-8 text-christmas-gold mx-auto mb-3 gold-sparkle" />
            <h3 className="font-semibold mb-2">오늘의 추천</h3>
            <p className="text-2xl font-bold text-christmas-green">{recommendations.filter(r => r.action === '매수').length}개</p>
            <p className="text-sm text-secondary">매수 기회</p>
          </div>
          
          <div className="christmas-card text-center hover-lift">
            <Shield className="w-8 h-8 text-christmas-green mx-auto mb-3" />
            <h3 className="font-semibold mb-2">평균 안전도</h3>
            <p className="text-2xl font-bold text-christmas-green">
              {(recommendations.reduce((sum, r) => sum + r.safetyScore, 0) / recommendations.length).toFixed(1)}/10
            </p>
            <p className="text-sm text-secondary">매우 안전</p>
          </div>
          
          <div className="christmas-card text-center hover-lift">
            <TrendingUp className="w-8 h-8 text-christmas-gold mx-auto mb-3" />
            <h3 className="font-semibold mb-2">예상 수익률</h3>
            <p className="text-2xl font-bold text-profit">
              +{recommendations.filter(r => r.action === '매수').reduce((sum, r) => sum + r.expectedReturn, 0).toFixed(1)}%
            </p>
            <p className="text-sm text-secondary">매수 추천 평균</p>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="space-y-6">
          {recommendations.map((rec) => (
            <div key={rec.id} className="christmas-card hover-lift">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="text-xl font-bold">{rec.stock}</h3>
                    <p className="text-secondary text-sm">{rec.code}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getActionColor(rec.action)}`}>
                    {rec.action}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(rec.riskLevel)}`}>
                    {rec.riskLevel === 'ultra-low' ? '초저위험' :
                     rec.riskLevel === 'low' ? '저위험' :
                     rec.riskLevel === 'medium' ? '중위험' : '고위험'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-secondary">AI 신뢰도</p>
                  <p className="text-2xl font-bold text-christmas-green">{rec.confidence}%</p>
                </div>
              </div>

              {/* Price Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-secondary">현재가</p>
                  <p className="font-bold text-data">₩{rec.currentPrice.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary">목표가</p>
                  <p className="font-bold text-data">₩{rec.targetPrice.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary">예상 수익률</p>
                  <p className={`font-bold ${rec.expectedReturn > 0 ? 'text-profit' : 'text-loss'}`}>
                    {rec.expectedReturn > 0 ? '+' : ''}{rec.expectedReturn}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-secondary">투자 기간</p>
                  <p className="font-medium">{rec.timeframe}</p>
                </div>
              </div>

              {/* AI Analysis */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2 flex items-center">
                  <Brain className="w-4 h-4 mr-2 text-blue-600" />
                  AI 분석 결과
                </h4>
                <p className="text-secondary bg-blue-50 p-3 rounded-lg">{rec.aiReason}</p>
              </div>

              {/* Key Factors */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">주요 고려 요인</h4>
                <ul className="space-y-1">
                  {rec.factors.map((factor, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-christmas-green mr-2" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Safety Score */}
              <div className="mb-4 p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-christmas-green mr-2" />
                    <span className="font-semibold">안전도 점수: {rec.safetyScore}/10</span>
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-christmas-green h-2 rounded-full"
                      style={{ width: `${rec.safetyScore * 10}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Personalized Note */}
              <div className="p-3 bg-yellow-50 rounded-lg mb-4">
                <h4 className="font-semibold mb-2 text-yellow-800 flex items-center">
                  <Star className="w-4 h-4 mr-2" />
                  개인화 메시지
                </h4>
                <p className="text-yellow-700 text-sm">{rec.personalizedNote}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                {rec.action === '매수' && (
                  <button className="btn-christmas-primary flex-1">
                    <TrendingUp className="w-4 h-4" />
                    매수 주문
                  </button>
                )}
                {rec.action === '매도' && (
                  <button className="btn-christmas-danger flex-1">
                    <TrendingUp className="w-4 h-4 transform rotate-180" />
                    매도 주문
                  </button>
                )}
                {rec.action === '관망' && (
                  <button className="btn-christmas-secondary flex-1">
                    <Clock className="w-4 h-4" />
                    관심종목 추가
                  </button>
                )}
                <button className="btn-christmas-secondary">
                  상세 분석
                </button>
                <button className="btn-christmas-secondary">
                  알림 설정
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* AI Learning Status */}
        <div className="christmas-card mt-8 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center mb-4">
            <Brain className="w-6 h-6 text-blue-600 mr-3 sparkle" />
            <h2 className="title-card">AI 학습 현황</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">152,847</p>
              <p className="text-sm text-secondary">분석된 패턴</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">99.2%</p>
              <p className="text-sm text-secondary">예측 정확도</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">24/7</p>
              <p className="text-sm text-secondary">실시간 모니터링</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">0.3%</p>
              <p className="text-sm text-secondary">평균 손실률</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}