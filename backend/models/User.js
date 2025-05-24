/**
 * Christmas Trading User Model
 * 회원 등급 및 이벤트 시스템을 포함한 사용자 모델
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  // 기본 정보
  email: {
    type: String,
    required: [true, '이메일은 필수입니다.'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '올바른 이메일 형식이 아닙니다.']
  },
  password: {
    type: String,
    required: [true, '비밀번호는 필수입니다.'],
    minlength: [6, '비밀번호는 최소 6자 이상이어야 합니다.']
  },
  firstName: {
    type: String,
    required: [true, '이름은 필수입니다.'],
    trim: true,
    maxlength: [50, '이름은 50자를 초과할 수 없습니다.']
  },
  lastName: {
    type: String,
    required: [true, '성은 필수입니다.'],
    trim: true,
    maxlength: [50, '성은 50자를 초과할 수 없습니다.']
  },
  profileImage: {
    type: String,
    default: null
  },

  // 회원 등급 시스템
  membershipType: {
    type: String,
    enum: ['guest', 'free', 'premium', 'lifetime'],
    default: 'free'
  },
  membershipStartDate: {
    type: Date,
    default: Date.now
  },
  membershipEndDate: {
    type: Date,
    default: null
  },
  
  // 신규 가입 7일 무료 체험
  freeTrialEndDate: {
    type: Date,
    default: function() {
      // 가입일로부터 7일 후
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      return sevenDaysLater;
    }
  },

  // 거래 제한 관리
  dailyTradeCount: {
    type: Number,
    default: 0
  },
  dailyTradeResetDate: {
    type: Date,
    default: function() {
      return new Date().toDateString();
    }
  },
  
  // 초대 시스템
  personalReferralCode: {
    type: String,
    unique: true,
    sparse: true, // null 값 허용하면서 unique 유지
    uppercase: true
  },
  referredBy: {
    type: String, // 초대 코드
    default: null
  },
  totalExtensionDays: {
    type: Number,
    default: 0,
    max: [90, '최대 연장 가능 기간은 90일입니다.']
  },

  // API 및 거래 설정
  apiKeys: {
    binance: {
      apiKey: { type: String, default: null },
      secretKey: { type: String, default: null },
      isEncrypted: { type: Boolean, default: true }
    },
    upbit: {
      accessKey: { type: String, default: null },
      secretKey: { type: String, default: null },
      isEncrypted: { type: Boolean, default: true }
    }
  },
  
  // 알림 설정
  notificationSettings: {
    email: { type: Boolean, default: true },
    telegram: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
    tradingAlerts: { type: Boolean, default: true },
    portfolioUpdates: { type: Boolean, default: true }
  },

  // 텔레그램 정보
  telegramChatId: {
    type: String,
    default: null
  },
  telegramUsername: {
    type: String,
    default: null
  },

  // 계정 상태
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  
  // 보안 관련
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  loginAttempts: {
    type: Number,
    default: 0,
    max: 5
  },
  lockUntil: Date

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 인덱스 설정
userSchema.index({ email: 1 });
userSchema.index({ personalReferralCode: 1 }, { sparse: true });
userSchema.index({ membershipType: 1 });
userSchema.index({ createdAt: -1 });

// Virtual fields
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('isInFreeTrial').get(function() {
  return new Date() < this.freeTrialEndDate;
});

userSchema.virtual('membershipStatus').get(function() {
  const now = new Date();
  
  if (this.membershipType === 'lifetime') {
    return 'active';
  }
  
  if (this.membershipType === 'free') {
    return this.isInFreeTrial ? 'trial' : 'limited';
  }
  
  if (this.membershipType === 'premium') {
    return this.membershipEndDate && now < this.membershipEndDate ? 'active' : 'expired';
  }
  
  return 'inactive';
});

// 비밀번호 해시화 미들웨어
userSchema.pre('save', async function(next) {
  // 비밀번호가 변경되지 않았다면 스킵
  if (!this.isModified('password')) return next();
  
  try {
    // 비밀번호 해시화
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 개인 초대 코드 생성 미들웨어
userSchema.pre('save', function(next) {
  if (this.isNew && !this.personalReferralCode) {
    this.personalReferralCode = this.generateReferralCode();
  }
  next();
});

// 인스턴스 메서드들
userSchema.methods = {
  // 비밀번호 확인
  async comparePassword(candidatePassword) {
    try {
      return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
      throw new Error('비밀번호 확인 중 오류가 발생했습니다.');
    }
  },

  // 초대 코드 생성
  generateReferralCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  },

  // 무료 체험 기간 연장
  extendFreePeriod(days) {
    if (this.totalExtensionDays + days <= 90) {
      const currentEndDate = this.freeTrialEndDate || new Date();
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + days);
      
      this.freeTrialEndDate = newEndDate;
      this.totalExtensionDays += days;
      
      return true;
    }
    return false;
  },

  // 오늘 거래 횟수 확인
  getTodayTradeCount() {
    const today = new Date().toDateString();
    if (this.dailyTradeResetDate !== today) {
      this.dailyTradeCount = 0;
      this.dailyTradeResetDate = today;
    }
    return this.dailyTradeCount;
  },

  // 거래 기록
  recordTrade() {
    const today = new Date().toDateString();
    if (this.dailyTradeResetDate !== today) {
      this.dailyTradeCount = 0;
      this.dailyTradeResetDate = today;
    }
    this.dailyTradeCount += 1;
  },

  // 거래 가능 여부 확인
  canMakeTrade(tradeType = 'demo') {
    // 비활성 계정은 거래 불가
    if (!this.isActive) {
      return {
        allowed: false,
        reason: '비활성화된 계정입니다.'
      };
    }

    // 라이프타임, 프리미엄 회원은 무제한
    if (['lifetime', 'premium'].includes(this.membershipType)) {
      return { allowed: true };
    }

    // 무료 회원 제한
    if (this.membershipType === 'free') {
      // 무료 체험 기간 중이면 무제한
      if (this.isInFreeTrial) {
        return { allowed: true };
      }

      // 실전 거래는 유료 회원만
      if (tradeType === 'real') {
        return {
          allowed: false,
          reason: '실전 거래는 유료 회원만 이용 가능합니다.',
          upgradeRequired: true
        };
      }

      // 일일 거래 제한 (2회)
      const todayTrades = this.getTodayTradeCount();
      if (todayTrades >= 2) {
        return {
          allowed: false,
          reason: '일일 거래 횟수를 초과했습니다. (2회/일)',
          upgradeRequired: true
        };
      }
    }

    return { allowed: true };
  },

  // API 키 암호화
  encryptApiKey(apiKey) {
    const algorithm = 'aes-256-cbc';
    const key = process.env.ENCRYPTION_KEY || 'christmas_default_key_32chars';
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  },

  // API 키 복호화
  decryptApiKey(encryptedApiKey) {
    const algorithm = 'aes-256-cbc';
    const key = process.env.ENCRYPTION_KEY || 'christmas_default_key_32chars';
    
    const parts = encryptedApiKey.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  },

  // 이메일 인증 토큰 생성
  generateEmailVerificationToken() {
    const token = crypto.randomBytes(32).toString('hex');
    this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24시간
    return token;
  },

  // 비밀번호 재설정 토큰 생성
  generatePasswordResetToken() {
    const token = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10분
    return token;
  },

  // JSON 변환시 민감한 정보 제외
  toJSON() {
    const user = this.toObject();
    delete user.password;
    delete user.emailVerificationToken;
    delete user.passwordResetToken;
    delete user.loginAttempts;
    delete user.lockUntil;
    
    // API 키 마스킹
    if (user.apiKeys) {
      Object.keys(user.apiKeys).forEach(exchange => {
        if (user.apiKeys[exchange].apiKey) {
          user.apiKeys[exchange].apiKey = user.apiKeys[exchange].apiKey.replace(/.(?=.{4})/g, '*');
        }
        if (user.apiKeys[exchange].secretKey) {
          user.apiKeys[exchange].secretKey = '***ENCRYPTED***';
        }
      });
    }
    
    return user;
  }
};

// 정적 메서드들
userSchema.statics = {
  // 이메일로 사용자 찾기
  async findByEmail(email) {
    return await this.findOne({ email: email.toLowerCase() });
  },

  // 초대 코드로 사용자 찾기
  async findByReferralCode(code) {
    return await this.findOne({ personalReferralCode: code.toUpperCase() });
  },

  // 회원 등급별 통계
  async getMembershipStats() {
    return await this.aggregate([
      {
        $group: {
          _id: '$membershipType',
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$isActive', true] }, 1, 0]
            }
          }
        }
      }
    ]);
  },

  // 월별 가입자 통계
  async getMonthlySignupStats(year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);
    
    return await this.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
  }
};

module.exports = mongoose.model('User', userSchema); 