/**
 * Christmas Trading Referral Reward Model
 * 초대 보상 시스템 모델
 */
const mongoose = require('mongoose');

const referralRewardSchema = new mongoose.Schema({
  // 초대자 정보
  inviterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '초대자 ID는 필수입니다.']
  },
  
  // 피초대자 정보
  inviteeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '피초대자 ID는 필수입니다.']
  },
  
  // 사용된 초대 코드
  referralCode: {
    type: String,
    required: [true, '초대 코드는 필수입니다.'],
    uppercase: true
  },
  
  // 보상 정보
  rewardType: {
    type: String,
    enum: ['free_extension', 'discount', 'bonus_credit'],
    default: 'free_extension'
  },
  rewardDays: {
    type: Number,
    default: 7,
    min: [1, '보상 일수는 1일 이상이어야 합니다.']
  },
  rewardValue: {
    type: Number,
    default: 0
  },
  
  // 보상 상태
  isClaimed: {
    type: Boolean,
    default: false
  },
  claimedAt: {
    type: Date,
    default: null
  },
  appliedAt: {
    type: Date,
    default: null
  },
  
  // 검증 정보
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  verificationMethod: {
    type: String,
    enum: ['automatic', 'manual', 'admin'],
    default: 'automatic'
  },
  
  // 메타데이터
  notes: {
    type: String,
    default: ''
  },
  metadata: {
    inviterMembershipAtInvite: String,
    inviteeMembershipAtSignup: String,
    ipAddress: String,
    userAgent: String
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 인덱스 설정
referralRewardSchema.index({ inviterId: 1 });
referralRewardSchema.index({ inviteeId: 1 });
referralRewardSchema.index({ referralCode: 1 });
referralRewardSchema.index({ isClaimed: 1 });
referralRewardSchema.index({ createdAt: -1 });

// 복합 인덱스 (중복 방지)
referralRewardSchema.index({ inviterId: 1, inviteeId: 1 }, { unique: true });

// Virtual fields
referralRewardSchema.virtual('rewardStatus').get(function() {
  if (!this.isVerified) return 'pending_verification';
  if (!this.isClaimed) return 'verified';
  if (!this.appliedAt) return 'claimed';
  return 'applied';
});

referralRewardSchema.virtual('daysSinceCreated').get(function() {
  const now = new Date();
  const diffTime = now - this.createdAt;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// 미들웨어
referralRewardSchema.pre('save', async function(next) {
  // 자동 검증 로직
  if (this.isNew && !this.isVerified) {
    const isValid = await this.validateReward();
    if (isValid) {
      this.isVerified = true;
      this.verifiedAt = new Date();
      this.verificationMethod = 'automatic';
    }
  }
  
  next();
});

referralRewardSchema.post('save', async function(doc) {
  // 자동 보상 적용
  if (doc.isVerified && !doc.isClaimed && doc.verificationMethod === 'automatic') {
    await doc.applyReward();
  }
});

// 인스턴스 메서드들
referralRewardSchema.methods = {
  // 보상 검증
  async validateReward() {
    try {
      const User = require('./User');
      const ReferralCode = require('./ReferralCode');
      
      // 초대자와 피초대자 조회
      const inviter = await User.findById(this.inviterId);
      const invitee = await User.findById(this.inviteeId);
      
      if (!inviter || !invitee) {
        this.notes = '초대자 또는 피초대자를 찾을 수 없습니다.';
        return false;
      }
      
      // 자가 초대 방지
      if (this.inviterId.toString() === this.inviteeId.toString()) {
        this.notes = '자가 초대는 허용되지 않습니다.';
        return false;
      }
      
      // 초대 코드 검증
      const referralCode = await ReferralCode.findOne({ 
        code: this.referralCode,
        userId: this.inviterId 
      });
      
      if (!referralCode) {
        this.notes = '유효하지 않은 초대 코드입니다.';
        return false;
      }
      
      // 피초대자의 이메일 인증 확인
      if (!invitee.isEmailVerified) {
        this.notes = '피초대자의 이메일 인증이 필요합니다.';
        return false;
      }
      
      // 중복 보상 방지
      const existingReward = await this.constructor.findOne({
        inviteeId: this.inviteeId,
        isClaimed: true
      });
      
      if (existingReward) {
        this.notes = '이미 다른 초대 보상을 받은 사용자입니다.';
        return false;
      }
      
      return true;
      
    } catch (error) {
      this.notes = `검증 중 오류 발생: ${error.message}`;
      return false;
    }
  },
  
  // 보상 적용
  async applyReward() {
    if (!this.isVerified) {
      throw new Error('검증되지 않은 보상은 적용할 수 없습니다.');
    }
    
    if (this.isClaimed) {
      throw new Error('이미 적용된 보상입니다.');
    }
    
    try {
      const User = require('./User');
      const inviter = await User.findById(this.inviterId);
      
      if (!inviter) {
        throw new Error('초대자를 찾을 수 없습니다.');
      }
      
      // 보상 유형에 따른 처리
      let success = false;
      
      switch (this.rewardType) {
        case 'free_extension':
          success = inviter.extendFreePeriod(this.rewardDays);
          if (success) {
            this.notes = `${this.rewardDays}일 무료 기간 연장 완료`;
          } else {
            this.notes = '최대 연장 기간(90일)을 초과했습니다.';
          }
          break;
          
        case 'discount':
          // 할인 쿠폰 생성 로직 (향후 구현)
          this.notes = '할인 혜택 적용 완료';
          success = true;
          break;
          
        case 'bonus_credit':
          // 보너스 크레딧 지급 로직 (향후 구현)
          this.notes = '보너스 크레딧 지급 완료';
          success = true;
          break;
          
        default:
          throw new Error('알 수 없는 보상 유형입니다.');
      }
      
      if (success) {
        this.isClaimed = true;
        this.claimedAt = new Date();
        this.appliedAt = new Date();
        
        await inviter.save();
        await this.save();
        
        // 초대 코드 통계 업데이트
        const ReferralCode = require('./ReferralCode');
        await ReferralCode.updateOne(
          { code: this.referralCode },
          { 
            $inc: { 
              successfulInvites: 1,
              totalRewardDays: this.rewardDays 
            }
          }
        );
        
        return true;
      }
      
      return false;
      
    } catch (error) {
      this.notes = `보상 적용 중 오류: ${error.message}`;
      await this.save();
      throw error;
    }
  },
  
  // 보상 취소
  async cancelReward(reason = '') {
    if (!this.isClaimed) {
      throw new Error('적용되지 않은 보상은 취소할 수 없습니다.');
    }
    
    try {
      const User = require('./User');
      const inviter = await User.findById(this.inviterId);
      
      if (inviter && this.rewardType === 'free_extension') {
        // 연장된 기간 되돌리기 (복잡한 로직이므로 신중하게 구현)
        // 여기서는 간단히 기록만 남김
        this.notes = `보상 취소됨: ${reason}`;
      }
      
      this.isClaimed = false;
      this.claimedAt = null;
      this.appliedAt = null;
      
      await this.save();
      return true;
      
    } catch (error) {
      throw new Error(`보상 취소 중 오류: ${error.message}`);
    }
  }
};

// 정적 메서드들
referralRewardSchema.statics = {
  // 사용자별 보상 내역
  async getUserRewards(userId, type = 'all') {
    const query = {};
    
    if (type === 'inviter') {
      query.inviterId = userId;
    } else if (type === 'invitee') {
      query.inviteeId = userId;
    } else {
      query.$or = [
        { inviterId: userId },
        { inviteeId: userId }
      ];
    }
    
    return await this.find(query)
      .populate('inviterId', 'firstName lastName email membershipType')
      .populate('inviteeId', 'firstName lastName email membershipType')
      .sort({ createdAt: -1 });
  },
  
  // 보상 통계
  async getRewardStats(period = 'all') {
    let matchStage = {};
    
    if (period === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      matchStage.createdAt = { $gte: today };
    } else if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchStage.createdAt = { $gte: weekAgo };
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchStage.createdAt = { $gte: monthAgo };
    }
    
    const stats = await this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRewards: { $sum: 1 },
          claimedRewards: {
            $sum: { $cond: [{ $eq: ['$isClaimed', true] }, 1, 0] }
          },
          pendingRewards: {
            $sum: { $cond: [{ $eq: ['$isClaimed', false] }, 1, 0] }
          },
          totalRewardDays: { $sum: '$rewardDays' },
          averageRewardDays: { $avg: '$rewardDays' }
        }
      }
    ]);
    
    return stats[0] || {
      totalRewards: 0,
      claimedRewards: 0,
      pendingRewards: 0,
      totalRewardDays: 0,
      averageRewardDays: 0
    };
  },
  
  // 검증이 필요한 보상 목록
  async getPendingVerification() {
    return await this.find({ isVerified: false })
      .populate('inviterId', 'firstName lastName email')
      .populate('inviteeId', 'firstName lastName email')
      .sort({ createdAt: 1 });
  },
  
  // 일일 보상 처리 (크론잡용)
  async processDailyRewards() {
    const pendingRewards = await this.find({
      isVerified: true,
      isClaimed: false,
      verificationMethod: 'automatic'
    }).limit(100); // 한 번에 처리할 개수 제한
    
    const results = {
      processed: 0,
      failed: 0,
      errors: []
    };
    
    for (const reward of pendingRewards) {
      try {
        await reward.applyReward();
        results.processed++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          rewardId: reward._id,
          error: error.message
        });
      }
    }
    
    return results;
  },
  
  // 최고 초대자 순위
  async getTopInviters(limit = 10) {
    return await this.aggregate([
      { $match: { isClaimed: true } },
      {
        $group: {
          _id: '$inviterId',
          totalInvites: { $sum: 1 },
          totalRewardDays: { $sum: '$rewardDays' }
        }
      },
      { $sort: { totalInvites: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          totalInvites: 1,
          totalRewardDays: 1,
          'user.firstName': 1,
          'user.lastName': 1,
          'user.email': 1,
          'user.membershipType': 1
        }
      }
    ]);
  }
};

module.exports = mongoose.model('ReferralReward', referralRewardSchema); 