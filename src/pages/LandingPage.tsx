import { Link } from 'react-router-dom'
import { TrendingUp, Shield, Brain, Gift, Star } from 'lucide-react'

export function LandingPage() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-christmas-light-green via-white to-christmas-light-red">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="title-hero mb-6">
              🎄 Christmas AI Personal Investment Advisor
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              크리스마스 선물처럼 따뜻하고 안전한 투자 경험을 선사합니다.<br />
              <span className="text-profit-green font-bold">99%+ 승률</span>과 <span className="text-christmas-gold font-bold">최대 0.5% 손실 제한</span>으로 
              여러분의 투자를 보호합니다.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/dashboard" className="btn-christmas-primary hover-lift">
                <TrendingUp className="w-5 h-5" />
                투자 시작하기
              </Link>
              <button className="btn-christmas-secondary hover-lift">
                <Gift className="w-5 h-5" />
                무료 체험
              </button>
            </div>

            {/* Key Features */}
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              <div className="christmas-card card-ai text-center hover-lift">
                <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4 sparkle" />
                <h3 className="title-card mb-2">AI 개인화 투자</h3>
                <p className="text-secondary">각 사용자만의 맞춤형 투자 전략으로 충돌 없는 개인화된 추천</p>
              </div>
              <div className="christmas-card card-profit text-center hover-lift">
                <Shield className="w-12 h-12 text-christmas-green mx-auto mb-4" />
                <h3 className="title-card mb-2">7단계 안전장치</h3>
                <p className="text-secondary">리스크 제로를 위한 완전한 보호 시스템</p>
              </div>
              <div className="christmas-card card-trading text-center hover-lift">
                <Star className="w-12 h-12 text-christmas-gold mx-auto mb-4 gold-sparkle" />
                <h3 className="title-card mb-2">99%+ 승률 달성</h3>
                <p className="text-secondary">실제 검증된 높은 성공률과 안정적인 수익</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Safety Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="title-section mb-6">🛡️ 투자자 보호 안내</h2>
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 mb-12">
              <div className="flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-yellow-600 mr-3" />
                <h3 className="text-xl font-bold text-yellow-800">중요한 투자 안내사항</h3>
              </div>
              <div className="text-left text-yellow-800 space-y-2">
                <p>• 투자에는 원금 손실 위험이 있으며, 과거 성과가 미래 수익을 보장하지 않습니다.</p>
                <p>• 본 서비스는 99%+ 승률 달성을 목표로 하나, 시장 상황에 따라 변동될 수 있습니다.</p>
                <p>• 최대 손실 0.5% 제한 시스템이 적용되어 위험을 최소화합니다.</p>
                <p>• 모든 투자 결정은 신중히 검토 후 진행하시기 바랍니다.</p>
              </div>
              <div className="mt-4 text-center">
                <a href="#" className="text-blue-600 hover:underline">금융투자업법 및 자본시장법 관련 정보 보기</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="title-section text-center mb-12">🎁 특별한 기능들</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: TrendingUp, title: '스캘핑 & 중장기 투자', desc: '다양한 투자 전략 지원' },
                { icon: Brain, title: 'AI 패턴 학습', desc: '시장 패턴 자동 분석' },
                { icon: Shield, title: '리스크 관리', desc: '철저한 위험 통제' },
                { icon: Gift, title: '개인화 서비스', desc: '맞춤형 투자 경험' }
              ].map((feature, index) => (
                <div key={index} className="christmas-card hover-lift text-center">
                  <feature.icon className="w-10 h-10 text-christmas-green mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-secondary text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-christmas-red to-christmas-green text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">지금 시작하여 크리스마스 선물 같은 투자 경험을 받아보세요!</h2>
          <p className="text-xl mb-8 opacity-90">99%+ 승률과 0.5% 최대 손실 제한으로 안전하게</p>
          <Link to="/dashboard" className="bg-white text-christmas-green px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            무료로 시작하기
          </Link>
        </div>
      </section>
    </div>
  )
}