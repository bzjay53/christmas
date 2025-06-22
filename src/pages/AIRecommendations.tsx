import { Brain, TrendingUp, Shield, Clock, Star, CheckCircle, Bot, Target } from 'lucide-react'

export function AIRecommendations() {
  const recommendations = [
    {
      id: 1,
      stock: 'AAPL',
      code: 'Apple Inc.',
      action: 'BUY',
      targetPrice: 195.00,
      currentPrice: 186.25,
      confidence: 94.2,
      expectedReturn: 4.7,
      timeframe: 'Short-term (1-2 weeks)',
      riskLevel: 'low',
      aiReason: 'Strong Q4 earnings momentum, iPhone 15 sales exceeding expectations, services revenue growth',
      factors: [
        'Q4 earnings beat expectations',
        'iPhone 15 Pro strong demand',
        'Services revenue up 16.3% YoY'
      ],
      safetyScore: 8.9,
      personalizedNote: 'Matches your conservative growth strategy with limited downside risk.'
    },
    {
      id: 2,
      stock: 'NVDA',
      code: 'NVIDIA Corp.',
      action: 'BUY',
      targetPrice: 450.00,
      currentPrice: 415.60,
      confidence: 96.8,
      expectedReturn: 8.3,
      timeframe: 'Medium-term (2-4 weeks)',
      riskLevel: 'medium',
      aiReason: 'AI semiconductor demand surge, data center growth, strong guidance for next quarter',
      factors: [
        'AI chip demand acceleration',
        'Data center revenue +206% YoY',
        'Strong Q1 2025 guidance'
      ],
      safetyScore: 8.5,
      personalizedNote: 'High-growth opportunity aligned with AI technology trends.'
    },
    {
      id: 3,
      stock: 'MSFT',
      code: 'Microsoft Corp.',
      action: 'HOLD',
      targetPrice: 345.00,
      currentPrice: 338.50,
      confidence: 87.3,
      expectedReturn: 1.9,
      timeframe: 'Long-term (1-3 months)',
      riskLevel: 'low',
      aiReason: 'Solid fundamentals but near-term headwinds in cloud growth, wait for better entry',
      factors: [
        'Azure cloud growth stabilizing',
        'Office 365 subscription growth',
        'AI integration momentum'
      ],
      safetyScore: 9.1,
      personalizedNote: 'Quality stock but current valuation suggests waiting for pullback.'
    },
    {
      id: 4,
      stock: 'TSLA',
      code: 'Tesla Inc.',
      action: 'SELL',
      targetPrice: 220.00,
      currentPrice: 245.75,
      confidence: 89.4,
      expectedReturn: -10.5,
      timeframe: 'Immediate',
      riskLevel: 'high',
      aiReason: 'EV market competition intensifying, margin pressure, execution risks on Cybertruck',
      factors: [
        'Increased EV competition',
        'Margin compression concerns',
        'Production challenges'
      ],
      safetyScore: 6.8,
      personalizedNote: 'Consider reducing position to limit downside risk exposure.'
    }
  ]

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY': return 'bg-green-600 text-white'
      case 'SELL': return 'bg-red-600 text-white'
      case 'HOLD': return 'bg-yellow-600 text-white'
      default: return 'bg-slate-600 text-white'
    }
  }

  return (
    <div className="space-y-6">
      {/* AI Status */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Brain className="w-12 h-12 text-blue-500" />
            <div>
              <h2 className="text-xl font-semibold text-white">AI Trading Engine</h2>
              <p className="text-slate-400">Real-time market analysis and personalized recommendations</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-500 font-medium">Active</span>
            </div>
            <p className="text-sm text-slate-400">Last updated: Just now</p>
          </div>
        </div>
      </div>

      {/* AI Insights Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 text-center">
          <Star className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
          <h3 className="font-semibold mb-2 text-white">Today's Recommendations</h3>
          <p className="text-2xl font-bold text-green-500">{recommendations.filter(r => r.action === 'BUY').length}</p>
          <p className="text-sm text-slate-400">Buy opportunities</p>
        </div>
        
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 text-center">
          <Shield className="w-8 h-8 text-green-500 mx-auto mb-3" />
          <h3 className="font-semibold mb-2 text-white">Average Safety Score</h3>
          <p className="text-2xl font-bold text-green-500">
            {(recommendations.reduce((sum, r) => sum + r.safetyScore, 0) / recommendations.length).toFixed(1)}/10
          </p>
          <p className="text-sm text-slate-400">Very Safe</p>
        </div>
        
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 text-center">
          <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-3" />
          <h3 className="font-semibold mb-2 text-white">Expected Returns</h3>
          <p className="text-2xl font-bold text-green-500">
            +{recommendations.filter(r => r.action === 'BUY').reduce((sum, r) => sum + r.expectedReturn, 0).toFixed(1)}%
          </p>
          <p className="text-sm text-slate-400">Buy recommendations avg</p>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-6">
        {recommendations.map((rec) => (
          <div key={rec.id} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{rec.stock}</h3>
                  <p className="text-slate-400 text-sm">{rec.code}</p>
                </div>
                <span className={`px-4 py-2 rounded-md text-sm font-semibold ${getActionColor(rec.action)}`}>
                  {rec.action}
                </span>
                <span className={`px-3 py-1 rounded-md text-xs font-medium border ${getRiskColor(rec.riskLevel)}`}>
                  {rec.riskLevel.charAt(0).toUpperCase() + rec.riskLevel.slice(1)} Risk
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">AI Confidence</p>
                <p className="text-2xl font-bold text-green-500">{rec.confidence}%</p>
              </div>
            </div>

            {/* Price Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
              <div>
                <p className="text-sm text-slate-400">Current Price</p>
                <p className="font-bold text-white">${rec.currentPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Target Price</p>
                <p className="font-bold text-white">${rec.targetPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Expected Return</p>
                <p className={`font-bold ${rec.expectedReturn > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {rec.expectedReturn > 0 ? '+' : ''}{rec.expectedReturn}%
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Timeframe</p>
                <p className="font-medium text-white">{rec.timeframe}</p>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="mb-4">
              <h4 className="font-semibold mb-2 flex items-center text-white">
                <Bot className="w-4 h-4 mr-2 text-blue-500" />
                AI Analysis
              </h4>
              <p className="text-slate-300 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">{rec.aiReason}</p>
            </div>

            {/* Key Factors */}
            <div className="mb-4">
              <h4 className="font-semibold mb-2 text-white">Key Factors</h4>
              <ul className="space-y-1">
                {rec.factors.map((factor, index) => (
                  <li key={index} className="flex items-center text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>

            {/* Safety Score */}
            <div className="mb-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-green-500 mr-2" />
                  <span className="font-semibold text-white">Safety Score: {rec.safetyScore}/10</span>
                </div>
                <div className="w-32 bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${rec.safetyScore * 10}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Personalized Note */}
            <div className="p-3 bg-yellow-500/10 rounded-lg mb-4 border border-yellow-500/20">
              <h4 className="font-semibold mb-2 text-yellow-400 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Personalized Insight
              </h4>
              <p className="text-yellow-300 text-sm">{rec.personalizedNote}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {rec.action === 'BUY' && (
                <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Place Buy Order
                </button>
              )}
              {rec.action === 'SELL' && (
                <button className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 mr-2 transform rotate-180" />
                  Place Sell Order
                </button>
              )}
              {rec.action === 'HOLD' && (
                <button className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition-colors flex items-center justify-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Add to Watchlist
                </button>
              )}
              <button className="bg-slate-700 text-white py-2 px-4 rounded-md hover:bg-slate-600 transition-colors">
                Detailed Analysis
              </button>
              <button className="bg-slate-700 text-white py-2 px-4 rounded-md hover:bg-slate-600 transition-colors">
                Set Alert
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* AI Learning Status */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center mb-4">
          <Brain className="w-6 h-6 text-blue-500 mr-3" />
          <h2 className="text-lg font-semibold text-white">AI Learning Status</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">152,847</p>
            <p className="text-sm text-slate-400">Patterns Analyzed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">94.2%</p>
            <p className="text-sm text-slate-400">Prediction Accuracy</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-500">24/7</p>
            <p className="text-sm text-slate-400">Real-time Monitoring</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-500">2.1%</p>
            <p className="text-sm text-slate-400">Average Drawdown</p>
          </div>
        </div>
      </div>
    </div>
  )
}