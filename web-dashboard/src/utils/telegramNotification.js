// 텔레그램 알림 시스템
class TelegramNotification {
  constructor() {
    this.botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
    this.chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`
    this.isEnabled = this.botToken && this.chatId
  }

  // 메시지 전송
  async sendMessage(text, options = {}) {
    if (!this.isEnabled) {
      console.warn('Telegram notification is not configured')
      return false
    }

    try {
      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          ...options
        })
      })

      const result = await response.json()
      
      if (!result.ok) {
        throw new Error(result.description || 'Failed to send telegram message')
      }

      return true
    } catch (error) {
      console.error('Telegram notification error:', error)
      return false
    }
  }

  // 거래 신호 알림
  async sendTradeSignal(signal) {
    const emoji = signal.side === 'BUY' ? '🟢' : '🔴'
    const action = signal.side === 'BUY' ? '매수' : '매도'
    
    const message = `
${emoji} <b>거래 신호 발생</b>

📊 <b>종목:</b> ${signal.symbol}
📈 <b>액션:</b> ${action}
💰 <b>가격:</b> ₩${signal.price?.toLocaleString()}
📦 <b>수량:</b> ${signal.quantity}주
⏰ <b>시간:</b> ${new Date().toLocaleString('ko-KR')}

🎯 <b>신뢰도:</b> ${signal.confidence || 'N/A'}%
📝 <b>사유:</b> ${signal.reason || '자동 신호'}
    `.trim()

    return await this.sendMessage(message)
  }

  // 거래 체결 알림
  async sendTradeExecution(trade) {
    const emoji = trade.side === 'BUY' ? '✅' : '💸'
    const action = trade.side === 'BUY' ? '매수' : '매도'
    const profitEmoji = trade.profit > 0 ? '📈' : trade.profit < 0 ? '📉' : '➖'
    
    const message = `
${emoji} <b>거래 체결 완료</b>

📊 <b>종목:</b> ${trade.symbol}
📈 <b>액션:</b> ${action}
💰 <b>체결가:</b> ₩${trade.price?.toLocaleString()}
📦 <b>수량:</b> ${trade.quantity}주
💵 <b>총액:</b> ₩${(trade.price * trade.quantity)?.toLocaleString()}

${trade.profit !== undefined ? `${profitEmoji} <b>손익:</b> ₩${trade.profit?.toLocaleString()}` : ''}
⏰ <b>체결시간:</b> ${new Date(trade.timestamp).toLocaleString('ko-KR')}
    `.trim()

    return await this.sendMessage(message)
  }

  // 포트폴리오 요약 알림
  async sendPortfolioSummary(portfolio) {
    const profitEmoji = portfolio.totalReturn >= 0 ? '📈' : '📉'
    const returnColor = portfolio.totalReturn >= 0 ? '🟢' : '🔴'
    
    const message = `
📊 <b>포트폴리오 요약</b>

💰 <b>총 자산:</b> ₩${portfolio.totalValue?.toLocaleString()}
${profitEmoji} <b>총 수익:</b> ${returnColor} ₩${portfolio.totalReturn?.toLocaleString()} (${portfolio.returnRate}%)
📈 <b>오늘 손익:</b> ₩${portfolio.dailyPnL?.toLocaleString()}
🎯 <b>승률:</b> ${portfolio.winRate}%
📦 <b>보유 종목:</b> ${portfolio.positions}개

⏰ <b>업데이트:</b> ${new Date().toLocaleString('ko-KR')}
    `.trim()

    return await this.sendMessage(message)
  }

  // 시스템 상태 알림
  async sendSystemStatus(status) {
    const statusEmoji = status.isHealthy ? '✅' : '⚠️'
    const apiEmoji = status.apiConnected ? '🟢' : '🔴'
    const strategyEmoji = status.strategyActive ? '🟢' : '🔴'
    
    const message = `
${statusEmoji} <b>시스템 상태 체크</b>

🔗 <b>API 연결:</b> ${apiEmoji} ${status.apiConnected ? '정상' : '연결 실패'}
🤖 <b>전략 상태:</b> ${strategyEmoji} ${status.strategyActive ? '활성' : '비활성'}
💾 <b>메모리 사용률:</b> ${status.memoryUsage || 'N/A'}%
⚡ <b>CPU 사용률:</b> ${status.cpuUsage || 'N/A'}%

⏰ <b>체크 시간:</b> ${new Date().toLocaleString('ko-KR')}
    `.trim()

    return await this.sendMessage(message)
  }

  // 배포 알림
  async sendDeploymentNotification(deployment) {
    const statusEmoji = deployment.success ? '🚀' : '❌'
    const status = deployment.success ? '성공' : '실패'
    
    const message = `
${statusEmoji} <b>배포 ${status}</b>

🌐 <b>환경:</b> ${deployment.environment || 'Production'}
📦 <b>버전:</b> ${deployment.version || 'Latest'}
🔗 <b>URL:</b> ${deployment.url || 'N/A'}
⏱️ <b>소요시간:</b> ${deployment.duration || 'N/A'}

${deployment.changes ? `📝 <b>변경사항:</b>\n${deployment.changes}` : ''}

⏰ <b>배포시간:</b> ${new Date().toLocaleString('ko-KR')}
    `.trim()

    return await this.sendMessage(message)
  }

  // 에러 알림
  async sendErrorAlert(error) {
    const message = `
❌ <b>시스템 오류 발생</b>

🚨 <b>오류:</b> ${error.message}
📍 <b>위치:</b> ${error.location || 'Unknown'}
🔍 <b>상세:</b> ${error.details || 'No details available'}

⏰ <b>발생시간:</b> ${new Date().toLocaleString('ko-KR')}

🔧 <b>조치사항:</b> 시스템 관리자에게 문의하세요.
    `.trim()

    return await this.sendMessage(message)
  }

  // 일일 리포트
  async sendDailyReport(report) {
    const profitEmoji = report.totalProfit >= 0 ? '📈' : '📉'
    const winRateEmoji = report.winRate >= 70 ? '🎯' : report.winRate >= 50 ? '⚡' : '⚠️'
    
    const message = `
📊 <b>일일 거래 리포트</b>

📅 <b>날짜:</b> ${new Date().toLocaleDateString('ko-KR')}

💰 <b>총 거래액:</b> ₩${report.totalVolume?.toLocaleString()}
${profitEmoji} <b>총 손익:</b> ₩${report.totalProfit?.toLocaleString()}
📈 <b>수익률:</b> ${report.returnRate}%

📊 <b>거래 통계:</b>
• 총 거래: ${report.totalTrades}회
• 성공: ${report.successfulTrades}회
• 실패: ${report.failedTrades}회
${winRateEmoji} • 승률: ${report.winRate}%

🏆 <b>최고 수익:</b> ₩${report.bestTrade?.toLocaleString()}
📉 <b>최대 손실:</b> ₩${report.worstTrade?.toLocaleString()}

⏰ <b>리포트 생성:</b> ${new Date().toLocaleString('ko-KR')}
    `.trim()

    return await this.sendMessage(message)
  }

  // 사용자 액션 알림
  async sendUserAction(action) {
    const actionEmojis = {
      login: '🔐',
      logout: '👋',
      signup: '🎉',
      upgrade: '⭐',
      api_setup: '🔧',
      settings_change: '⚙️'
    }

    const emoji = actionEmojis[action.type] || '📝'
    
    const message = `
${emoji} <b>사용자 액션</b>

👤 <b>사용자:</b> ${action.username}
📧 <b>이메일:</b> ${action.email}
🎯 <b>액션:</b> ${action.description}
🌐 <b>IP:</b> ${action.ip || 'Unknown'}

⏰ <b>시간:</b> ${new Date().toLocaleString('ko-KR')}
    `.trim()

    return await this.sendMessage(message)
  }

  // 테스트 메시지
  async sendTestMessage() {
    const message = `
🧪 <b>텔레그램 알림 테스트</b>

✅ 알림 시스템이 정상적으로 작동합니다!

🎄 Christmas Trading System
⏰ ${new Date().toLocaleString('ko-KR')}
    `.trim()

    return await this.sendMessage(message)
  }
}

// 싱글톤 인스턴스 생성
const telegramNotification = new TelegramNotification()

export default telegramNotification

// 편의 함수들
export const notifyTradeSignal = (signal) => telegramNotification.sendTradeSignal(signal)
export const notifyTradeExecution = (trade) => telegramNotification.sendTradeExecution(trade)
export const notifyPortfolioSummary = (portfolio) => telegramNotification.sendPortfolioSummary(portfolio)
export const notifySystemStatus = (status) => telegramNotification.sendSystemStatus(status)
export const notifyDeployment = (deployment) => telegramNotification.sendDeploymentNotification(deployment)
export const notifyError = (error) => telegramNotification.sendErrorAlert(error)
export const notifyDailyReport = (report) => telegramNotification.sendDailyReport(report)
export const notifyUserAction = (action) => telegramNotification.sendUserAction(action)
export const sendTestNotification = () => telegramNotification.sendTestMessage() 