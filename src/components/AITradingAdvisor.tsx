import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Brain, TrendingUp, DollarSign, Shield, Calendar, Sparkles } from 'lucide-react'

interface TradingAdvice {
  portfolio: string[]
  budget: number
  strategy: string
  advice: string
  recommendations: string[]
  riskLevel: string
  expectedReturn: string
  timestamp: string
}

const AITradingAdvisor: React.FC = () => {
  const [advice, setAdvice] = useState<TradingAdvice | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    portfolio: '',
    budget: 10000,
    strategy: 'balanced',
    market: 'global'
  })

  const generateAdvice = async () => {
    setLoading(true)
    try {
      const portfolioArray = formData.portfolio
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(s => s.length > 0)

      const response = await fetch('http://31.220.83.213/api/tools/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'christmas_trading_advice',
          arguments: {
            portfolio: portfolioArray,
            budget: formData.budget,
            strategy: formData.strategy,
            market: formData.market
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAdvice(data.result)
        toast.success('🎄 크리스마스 투자 조언을 받았습니다!')
      } else {
        toast.error('AI 분석에 실패했습니다.')
      }
    } catch (error) {
      toast.error('서버 연결에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const strategyOptions = [
    { value: 'conservative', label: '안전형', icon: '🛡️', description: '낮은 리스크, 안정적 수익' },
    { value: 'balanced', label: '균형형', icon: '⚖️', description: '중간 리스크, 적정 수익' },
    { value: 'aggressive', label: '공격형', icon: '🚀', description: '높은 리스크, 높은 수익' }
  ]

  return (
    <div className="christmas-ai-advisor">
      <div className="christmas-card-elegant mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Brain size={32} className="text-red-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">🎄 크리스마스 AI 투자 어드바이저</h2>
            <p className="text-gray-600">Gemini AI가 분석하는 크리스마스 시즌 투자 전략</p>
          </div>
        </div>

        {/* 입력 폼 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              현재 포트폴리오
            </label>
            <input
              type="text"
              value={formData.portfolio}
              onChange={(e) => setFormData({...formData, portfolio: e.target.value})}
              placeholder="AAPL, MSFT, 삼성전자, NVDA (쉼표로 구분)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              투자 예산 ($)
            </label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({...formData, budget: parseInt(e.target.value)})}
              min="1000"
              max="1000000"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* 시장 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            투자 시장
          </label>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[{value: 'global', label: '🌍 글로벌 (미국+한국)', desc: '해외주식 + 국내주식'}, {value: 'us', label: '🇺🇸 미국 시장', desc: 'NASDAQ, NYSE'}, {value: 'korea', label: '🇰🇷 한국 시장', desc: 'KOSPI, KOSDAQ'}, {value: 'asia', label: '🌏 아시아 시장', desc: '일본, 홍콩, 중국'}].map((market) => (
              <div
                key={market.value}
                onClick={() => setFormData({...formData, market: market.value})}
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  formData.market === market.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-800">{market.label}</div>
                <div className="text-xs text-gray-600">{market.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 투자 전략 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            투자 전략
          </label>
          <div className="grid grid-cols-3 gap-4">
            {strategyOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => setFormData({...formData, strategy: option.value})}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  formData.strategy === option.value
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">{option.icon}</div>
                  <div className="font-semibold text-gray-800">{option.label}</div>
                  <div className="text-xs text-gray-600 mt-1">{option.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI 분석 버튼 */}
        <button
          onClick={generateAdvice}
          disabled={loading}
          className="christmas-button-festive w-full flex items-center justify-center gap-3 text-lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              AI 분석 중...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              🎄 크리스마스 투자 분석 시작
            </>
          )}
        </button>
      </div>

      {/* AI 분석 결과 */}
      {advice && (
        <div className="christmas-card-elegant">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp size={24} className="text-green-600" />
            <h3 className="text-xl font-bold text-gray-800">AI 분석 결과</h3>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              신뢰도: 85%
            </span>
          </div>

          {/* 핵심 정보 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <DollarSign size={24} className="text-blue-600 mx-auto mb-2" />
              <div className="font-semibold text-blue-800">예산</div>
              <div className="text-lg">${advice.budget.toLocaleString()}</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Shield size={24} className="text-green-600 mx-auto mb-2" />
              <div className="font-semibold text-green-800">리스크</div>
              <div className="text-lg">{advice.riskLevel}</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <TrendingUp size={24} className="text-yellow-600 mx-auto mb-2" />
              <div className="font-semibold text-yellow-800">예상 수익률</div>
              <div className="text-lg">{advice.expectedReturn}</div>
            </div>
          </div>

          {/* 추천 종목 */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Sparkles size={16} />
              크리스마스 시즌 추천 종목
            </h4>
            <div className="flex flex-wrap gap-2">
              {advice.recommendations.map((stock, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                >
                  {stock}
                </span>
              ))}
            </div>
          </div>

          {/* 상세 분석 */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Brain size={16} />
              AI 상세 분석
            </h4>
            <div className="text-gray-700 whitespace-pre-line leading-relaxed">
              {advice.advice}
            </div>
          </div>

          {/* 분석 시간 */}
          <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
            <Calendar size={14} />
            분석 시간: {new Date(advice.timestamp).toLocaleString()}
          </div>
        </div>
      )}

      <style>{`
        .christmas-button-festive {
          background: linear-gradient(135deg, #dc2626, #16a34a);
          color: #fefefe;
          border-radius: 12px;
          padding: 16px 24px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          position: relative;
          overflow: hidden;
        }

        .christmas-button-festive:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.25);
        }

        .christmas-button-festive:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .christmas-card-elegant {
          background: #f8fafc;
          border-radius: 16px;
          padding: 24px;
          border: 2px solid transparent;
          background-image: linear-gradient(#f8fafc, #f8fafc), 
                            linear-gradient(45deg, #991b1b, #166534, #92400e);
          background-origin: border-box;
          background-clip: padding-box, border-box;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          position: relative;
          transition: transform 0.3s ease;
        }

        .christmas-card-elegant:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  )
}

export default AITradingAdvisor