/**
 * Christmas Trading Referral Code Model
 * 친구 초대 시스템 모델
 */
const mongoose = require('mongoose');

const referralCodeSchema = new mongoose.Schema({
  // 초대자 정보
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '초대자 ID는 필수입니다.']
  },
  
  // 초대 코드 (8자리 고유 코드)
  code: {
    type: String,
    required: [true, '초대 코드는 필수입니다.'],
    unique: true,
    uppercase: true,
    length: [8, '초대 코드는 8자리여야 합니다.'],
    match: [/^[A-Z0-9]{8}$/, '초대 코드는 영문 대문자와 숫자만 포함해야 합니다.']
  },
  
  // 초대 링크 URL
  inviteUrl: {
    type: String,
    required: true
  },
  
  // 사용 제한
  maxUses: {
    type: Number,
    default: 50,
    min: [1, '최대 사용 횟수는 1회 이상이어야 합니다.']
  },
  currentUses: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // 만료 설정 (90일)
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 90);
      return expiryDate;
    }
  },
  
  // 활성 상태
  isActive: {
    type: Boolean,
    default: true
  },
  
  // 통계 정보
  successfulInvites: {
    type: Number,
    default: 0
  },
  totalRewardDays: {
    type: Number,
    default: 0
  },
  
  // 메타데이터
  description: {
    type: String,
    default: '친구 초대 코드'
  },
  tags: [{
    type: String,
    trim: true
  }]
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 인덱스 설정
referralCodeSchema.index({ code: 1 });
referralCodeSchema.index({ userId: 1 });
referralCodeSchema.index({ expiresAt: 1 });
referralCodeSchema.index({ isActive: 1 });

// Virtual fields
referralCodeSchema.virtual('isValid').get(function() {
  const now = new Date();
  return (
    this.isActive &&
    this.currentUses < this.maxUses &&
    now < this.expiresAt
  );
});

referralCodeSchema.virtual('remainingUses').get(function() {
  return Math.max(0, this.maxUses - this.currentUses);
});

referralCodeSchema.virtual('usagePercentage').get(function() {
  return this.maxUses > 0 ? (this.currentUses / this.maxUses) * 100 : 0;
});

referralCodeSchema.virtual('daysUntilExpiry').get(function() {
  const now = new Date();
  const diffTime = this.expiresAt - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// 미들웨어
referralCodeSchema.pre('save', function(next) {
  // 초대 URL 자동 생성
  if (!this.inviteUrl) {
    const baseUrl = process.env.CLIENT_URL || 'https://christmas-trading.com';
    this.inviteUrl = `${baseUrl}/signup?ref=${this.code}`;
  }
  next();
});

// 인스턴스 메서드들
referralCodeSchema.methods = {
  // 코드 유효성 검사
  validate() {
    const now = new Date();
    
    if (!this.isActive) {
      return {
        valid: false,
        reason: '비활성화된 초대 코드입니다.'
      };
    }
    
    if (this.currentUses >= this.maxUses) {
      return {
        valid: false,
        reason: '초대 코드 사용 한도를 초과했습니다.'
      };
    }
    
    if (now >= this.expiresAt) {
      return {
        valid: false,
        reason: '만료된 초대 코드입니다.'
      };
    }
    
    return {
      valid: true,
      remainingUses: this.remainingUses,
      daysUntilExpiry: this.daysUntilExpiry
    };
  },
  
  // 초대 코드 사용 기록
  async use(inviteeId) {
    if (!this.isValid) {
      throw new Error('유효하지 않은 초대 코드입니다.');
    }
    
    // 사용 횟수 증가
    this.currentUses += 1;
    
    // 초대 기록 생성
    const ReferralReward = require('./ReferralReward');
    const reward = new ReferralReward({
      inviterId: this.userId,
      inviteeId: inviteeId,
      referralCode: this.code,
      rewardDays: 7
    });
    
    await reward.save();
    await this.save();
    
    return reward;
  },
  
  // 보상 적용
  async applyReward(rewardDays = 7) {
    const User = require('./User');
    const inviter = await User.findById(this.userId);
    
    if (inviter) {
      const success = inviter.extendFreePeriod(rewardDays);
      if (success) {
        this.successfulInvites += 1;
        this.totalRewardDays += rewardDays;
        await inviter.save();
        await this.save();
        return true;
      }
    }
    
    return false;
  },
  
  // 초대 통계
  async getStatistics() {
    const ReferralReward = require('./ReferralReward');
    
    const stats = await ReferralReward.aggregate([
      { $match: { referralCode: this.code } },
      {
        $group: {
          _id: null,
          totalInvites: { $sum: 1 },
          totalRewardDays: { $sum: '$rewardDays' },
          successfulInvites: {
            $sum: { $cond: [{ $eq: ['$isClaimed', true] }, 1, 0] }
          }
        }
      }
    ]);
    
    return {
      code: this.code,
      totalInvites: stats[0]?.totalInvites || 0,
      successfulInvites: stats[0]?.successfulInvites || 0,
      totalRewardDays: stats[0]?.totalRewardDays || 0,
      currentUses: this.currentUses,
      maxUses: this.maxUses,
      isValid: this.isValid,
      daysUntilExpiry: this.daysUntilExpiry
    };
  }
};

// 정적 메서드들
referralCodeSchema.statics = {
  // 코드 생성
  generateCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  },
  
  // 고유 코드 생성 (중복 방지)
  async generateUniqueCode() {
    let code;
    let existing;
    
    do {
      code = this.generateCode();
      existing = await this.findOne({ code });
    } while (existing);
    
    return code;
  },
  
  // 사용자의 초대 코드 조회
  async findByUserId(userId) {
    return await this.findOne({ 
      userId, 
      isActive: true 
    }).populate('userId', 'firstName lastName email membershipType');
  },
  
  // 코드로 조회 (유효성 포함)
  async findValidCode(code) {
    const referralCode = await this.findOne({ 
      code: code.toUpperCase(),
      isActive: true
    }).populate('userId', 'firstName lastName email membershipType');
    
    if (!referralCode) {
      return null;
    }
    
    const validation = referralCode.validate();
    if (!validation.valid) {
      return null;
    }
    
    return referralCode;
  },
  
  // 만료된 코드 정리
  async cleanupExpiredCodes() {
    const now = new Date();
    const result = await this.updateMany(
      { 
        expiresAt: { $lt: now },
        isActive: true 
      },
      { 
        isActive: false 
      }
    );
    
    return result.modifiedCount;
  },
  
  // 사용자별 초대 통계
  async getUserReferralStats(userId) {
    const referralCode = await this.findByUserId(userId);
    if (!referralCode) {
      return null;
    }
    
    return await referralCode.getStatistics();
  },
  
  // 전체 초대 통계
  async getGlobalStats() {
    const stats = await this.aggregate([
      {
        $group: {
          _id: null,
          totalCodes: { $sum: 1 },
          activeCodes: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          totalUses: { $sum: '$currentUses' },
          totalSuccessfulInvites: { $sum: '$successfulInvites' },
          totalRewardDays: { $sum: '$totalRewardDays' }
        }
      }
    ]);
    
    const validCodes = await this.countDocuments({
      isActive: true,
      expiresAt: { $gt: new Date() }
    });
    
    return {
      totalCodes: stats[0]?.totalCodes || 0,
      activeCodes: stats[0]?.activeCodes || 0,
      validCodes,
      totalUses: stats[0]?.totalUses || 0,
      totalSuccessfulInvites: stats[0]?.totalSuccessfulInvites || 0,
      totalRewardDays: stats[0]?.totalRewardDays || 0
    };
  }
};

module.exports = mongoose.model('ReferralCode', referralCodeSchema); 