# Christmas Trading Project Rules

## 🎯 Project Principles

### 1. MVP First Principle
- **Simplicity is key**: Working basic features over complex functionality
- **Incremental improvement**: MVP → Feature addition → Optimization order
- **Fast feedback**: Deliver working version every week

### 2. Pragmatic Technology Choices
- **Proven technologies**: Stable and well-documented tech over bleeding edge
- **Minimal learning curve**: Technologies team can quickly adopt
- **Maintainability**: Code that's easy to modify 6 months later

## 🏗️ Architecture Rules

### System Configuration
- **Frontend**: React 18 + Vite (Netlify deployment)
- **Backend**: Python FastAPI (Lightweight Docker)
- **Database**: Supabase PostgreSQL
- **Environment**: Ubuntu 22.04 LTS + Docker v28.2.2

### Resource Constraints
- **Memory limit**: Total Docker services under 1GB
- **CPU usage**: Maintain under 30% during normal operation
- **Disk usage**: Entire project under 5GB

## 💰 Trading System Rules

### Core Principles
1. **Minimize losses**: Loss prevention over profit maximization
2. **AI learning enhancement**: Every trade result becomes learning data
3. **Collision prevention**: Absolutely no price conflicts from simultaneous trading

### Trading Constraints
- **Same stock trading interval**: Minimum 10 seconds between trades
- **Daily trading frequency**: Maximum 20 trades per stock
- **Stop loss**: Auto-sell at -2%
- **Take profit**: Consider partial sell at +5%

### AI Learning Rules
- **Failure pattern learning**: Analyze situations and causes of losing trades
- **Success pattern reinforcement**: Learn conditions and timing of profitable trades
- **Personalization**: Learn individual user trading tendencies and custom strategies
- **Model updates**: Weekly performance analysis and strategy adjustment

## 🛡️ Security and Safety Rules

### API Key Management
- **Environment variables**: All API keys managed via .env files
- **GitHub security**: Never commit .env files
- **Key rotation**: Immediately rotate keys on suspicious activity

### Data Security
- **Personal information**: Collect minimal user information only
- **Trading data**: Store encrypted
- **Log management**: Prohibit logging sensitive information

## 🔄 Development Process Rules

### Git Rules
- **Branch strategy**: main(production) → develop(development) → feature/(functionality)
- **Commit messages**: Use prefixes: `feat:`, `fix:`, `docs:`, `refactor:`
- **Pre-push check**: Complete local testing before push

### Code Quality
- **Documentation**: Comment complex logic
- **Function size**: Keep functions under 50 lines
- **Variable naming**: Clear and understandable names

## 📊 Monitoring Rules

### System Monitoring
- **Health checks**: Service status check every 5 minutes
- **Resource monitoring**: Real-time memory/CPU usage tracking
- **Error logging**: Immediate Telegram alerts for all errors

### Trading Monitoring
- **Real-time alerts**: Immediate Telegram notification on trade execution
- **Daily reports**: Daily profit/loss report at 6 PM
- **Weekly analysis**: Weekly AI learning performance analysis report

## 🚨 Risk Management Rules

### Emergency Response
- **Trading halt**: Auto-stop on rapid market fluctuations
- **Loss limits**: Daily loss limit set at -10%
- **Manual intervention**: Manual trading halt available anytime

### Exception Handling
- **API failures**: Switch to standby mode on KIS API failure
- **Network issues**: Retry logic on connection failures
- **Data errors**: Halt trading on incorrect data detection

## 📈 Performance Measurement Rules

### Success Metrics
- **Technical performance**: System uptime 99%+
- **Profit target**: Monthly average +3%+
- **AI growth**: Weekly success rate improvement 1%+
- **Stability**: Zero trading collisions

### Failure Criteria
- **Consecutive losses**: 3 consecutive days of negative returns
- **System failures**: Service downtime over 1 hour
- **AI regression**: 2 consecutive weeks of success rate decline

## 🔧 Deployment and Operations Rules

### Deployment Process
1. **Local testing**: Thorough local testing after feature completion
2. **Staging**: Merge to develop branch and validate in test environment
3. **Production deployment**: Docker redeploy after main branch merge
4. **Rollback readiness**: Immediate rollback to previous version on issues

### Operational Rules
- **Zero downtime**: No trading service interruption during deployment
- **Backups**: Automated daily database backups
- **Log retention**: Keep all logs for 30 days

## 🎯 Priority Rules

### Development Priorities
1. **Core trading functionality**: Basic buy/sell operations
2. **AI learning system**: Learn from failures and improve strategies
3. **Collision prevention**: Trading queue and distributed processing
4. **Monitoring**: Telegram alerts and dashboard

### Feature Addition Criteria
- **Immediate profit improvement**: Direct profit enhancement features first
- **Risk reduction**: Loss prevention features priority
- **User convenience**: Monitoring and notification features
- **Scalability**: Multi-user, multi-stock support

These rules may be adjusted during project progress based on circumstances. The core focus is building a **simple, stable, and profitable system**.