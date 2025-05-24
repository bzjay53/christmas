/**
 * Christmas Trading Coupon Model
 * 쿠폰 시스템 모델
 */
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  // 쿠폰 기본 정보
  code: {
    type: String,
    required: [true, '쿠폰 코드는 필수입니다.'],
    unique: true,
    uppercase: true,
    minlength: [6, '쿠폰 코드는 최소 6자 이상이어야 합니다.'],
    maxlength: [20, '쿠폰 코드는 최대 20자까지 가능합니다.']
  },
  name: {
    type: String,
    required: [true, '쿠폰 이름은 필수입니다.'],
    trim: true,
    maxlength: [100, '쿠폰 이름은 100자를 초과할 수 없습니다.']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, '쿠폰 설명은 500자를 초과할 수 없습니다.']
  },
  
  // 쿠폰 유형
  couponType: {
    type: String,
    enum: [
      'subscription_discount',    // 구독료 할인
      'commission_discount',      // 수수료 할인
      'free_trial_extension',     // 무료 체험 연장
      'premium_upgrade',          // 프리미엄 업그레이드
      'lifetime_discount'         // 라이프타임 할인
    ],
    required: [true, '쿠폰 유형은 필수입니다.']
  },
  
  // 할인 유형 및 값
  discountType: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'free_period'],
    required: [true, '할인 유형은 필수입니다.']
  },
  discountValue: {
    type: Number,
    required: [true, '할인 값은 필수입니다.'],
    min: [0, '할인 값은 0 이상이어야 합니다.']
  },
  
  // 구매 조건
  minPurchaseAmount: {
    type: Number,
    default: 0,
    min: [0, '최소 구매 금액은 0 이상이어야 합니다.']
  },
  maxDiscountAmount: {
    type: Number,
    default: null,
    min: [0, '최대 할인 금액은 0 이상이어야 합니다.']
  },
  
  // 사용 제한
  usageLimit: {
    type: Number,
    default: null, // null이면 무제한
    min: [1, '사용 제한은 1 이상이어야 합니다.']
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  userUsageLimit: {
    type: Number,
    default: 1, // 사용자당 사용 가능 횟수
    min: [1, '사용자별 사용 제한은 1 이상이어야 합니다.']
  },
  
  // 유효 기간
  startDate: {
    type: Date,
    required: [true, '시작 날짜는 필수입니다.']
  },
  endDate: {
    type: Date,
    required: [true, '종료 날짜는 필수입니다.']
  },
  
  // 대상 제한
  targetMembership: [{
    type: String,
    enum: ['free', 'premium', 'lifetime']
  }],
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  excludedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // 상태 관리
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // 생성자 정보
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '생성자 정보는 필수입니다.']
  },
  
  // 통계 정보
  totalSavings: {
    type: Number,
    default: 0
  },
  
  // 메타데이터
  tags: [{
    type: String,
    trim: true
  }],
  priority: {
    type: Number,
    default: 0 // 높을수록 우선순위 높음
  },
  notes: {
    type: String,
    default: ''
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 인덱스 설정
couponSchema.index({ code: 1 });
couponSchema.index({ couponType: 1 });
couponSchema.index({ isActive: 1 });
couponSchema.index({ startDate: 1, endDate: 1 });
couponSchema.index({ createdBy: 1 });

// Virtual fields
couponSchema.virtual('isValid').get(function() {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.startDate &&
    now <= this.endDate &&
    (this.usageLimit === null || this.usedCount < this.usageLimit)
  );
});

couponSchema.virtual('remainingUses').get(function() {
  if (this.usageLimit === null) return '무제한';
  return Math.max(0, this.usageLimit - this.usedCount);
});

couponSchema.virtual('usagePercentage').get(function() {
  if (this.usageLimit === null) return 0;
  return this.usageLimit > 0 ? (this.usedCount / this.usageLimit) * 100 : 0;
});

couponSchema.virtual('status').get(function() {
  const now = new Date();
  
  if (!this.isActive) return 'inactive';
  if (now < this.startDate) return 'scheduled';
  if (now > this.endDate) return 'expired';
  if (this.usageLimit && this.usedCount >= this.usageLimit) return 'depleted';
  return 'active';
});

couponSchema.virtual('daysUntilExpiry').get(function() {
  const now = new Date();
  const diffTime = this.endDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// 인스턴스 메서드들
couponSchema.methods = {
  // 쿠폰 유효성 검증
  validateForUser(userId, purchaseAmount = 0) {
    const now = new Date();
    
    // 기본 유효성 검사
    if (!this.isActive) {
      return {
        valid: false,
        reason: '비활성화된 쿠폰입니다.'
      };
    }
    
    if (now < this.startDate) {
      return {
        valid: false,
        reason: '아직 사용할 수 없는 쿠폰입니다.'
      };
    }
    
    if (now > this.endDate) {
      return {
        valid: false,
        reason: '만료된 쿠폰입니다.'
      };
    }
    
    if (this.usageLimit && this.usedCount >= this.usageLimit) {
      return {
        valid: false,
        reason: '쿠폰 사용 한도를 초과했습니다.'
      };
    }
    
    // 최소 구매 금액 확인
    if (purchaseAmount < this.minPurchaseAmount) {
      return {
        valid: false,
        reason: `최소 구매 금액 ${this.minPurchaseAmount.toLocaleString()}원 이상이어야 합니다.`
      };
    }
    
    // 대상 사용자 확인
    if (this.targetUsers.length > 0) {
      const isTargetUser = this.targetUsers.some(id => id.toString() === userId.toString());
      if (!isTargetUser) {
        return {
          valid: false,
          reason: '이 쿠폰을 사용할 수 있는 대상이 아닙니다.'
        };
      }
    }
    
    // 제외 사용자 확인
    if (this.excludedUsers.length > 0) {
      const isExcludedUser = this.excludedUsers.some(id => id.toString() === userId.toString());
      if (isExcludedUser) {
        return {
          valid: false,
          reason: '이 쿠폰을 사용할 수 없는 사용자입니다.'
        };
      }
    }
    
    return { valid: true };
  },
  
  // 할인 금액 계산
  calculateDiscount(purchaseAmount, user = null) {
    const validation = this.validateForUser(user?._id, purchaseAmount);
    if (!validation.valid) {
      return {
        originalAmount: purchaseAmount,
        discountAmount: 0,
        finalAmount: purchaseAmount,
        error: validation.reason
      };
    }
    
    let discountAmount = 0;
    
    switch (this.discountType) {
      case 'percentage':
        discountAmount = purchaseAmount * (this.discountValue / 100);
        if (this.maxDiscountAmount) {
          discountAmount = Math.min(discountAmount, this.maxDiscountAmount);
        }
        break;
        
      case 'fixed_amount':
        discountAmount = Math.min(this.discountValue, purchaseAmount);
        break;
        
      case 'free_period':
        // 무료 기간 제공시 전액 할인
        discountAmount = purchaseAmount;
        break;
        
      default:
        discountAmount = 0;
    }
    
    const finalAmount = Math.max(0, purchaseAmount - discountAmount);
    
    return {
      originalAmount: purchaseAmount,
      discountAmount: Math.round(discountAmount),
      finalAmount: Math.round(finalAmount),
      discountType: this.discountType,
      discountValue: this.discountValue
    };
  },
  
  // 쿠폰 사용 처리
  async use(userId, purchaseAmount = 0) {
    const CouponUsage = require('./CouponUsage');
    
    // 유효성 검증
    const validation = this.validateForUser(userId, purchaseAmount);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }
    
    // 사용자별 사용 횟수 확인
    const userUsageCount = await CouponUsage.countDocuments({
      couponId: this._id,
      userId: userId
    });
    
    if (userUsageCount >= this.userUsageLimit) {
      throw new Error('사용자별 쿠폰 사용 한도를 초과했습니다.');
    }
    
    // 할인 계산
    const discountResult = this.calculateDiscount(purchaseAmount);
    
    // 사용 기록 생성
    const usage = new CouponUsage({
      couponId: this._id,
      userId: userId,
      originalAmount: purchaseAmount,
      discountAmount: discountResult.discountAmount,
      finalAmount: discountResult.finalAmount,
      metadata: {
        discountType: this.discountType,
        discountValue: this.discountValue
      }
    });
    
    await usage.save();
    
    // 사용 횟수 증가 및 총 절약 금액 업데이트
    this.usedCount += 1;
    this.totalSavings += discountResult.discountAmount;
    await this.save();
    
    return {
      usage,
      discount: discountResult
    };
  },
  
  // 쿠폰 복제
  duplicate(newCode, createdBy) {
    const duplicatedCoupon = new this.constructor({
      code: newCode,
      name: `${this.name} (복사본)`,
      description: this.description,
      couponType: this.couponType,
      discountType: this.discountType,
      discountValue: this.discountValue,
      minPurchaseAmount: this.minPurchaseAmount,
      maxDiscountAmount: this.maxDiscountAmount,
      usageLimit: this.usageLimit,
      userUsageLimit: this.userUsageLimit,
      startDate: this.startDate,
      endDate: this.endDate,
      targetMembership: this.targetMembership,
      targetUsers: this.targetUsers,
      excludedUsers: this.excludedUsers,
      isActive: false, // 기본적으로 비활성화
      isPublic: this.isPublic,
      createdBy: createdBy,
      tags: this.tags,
      priority: this.priority
    });
    
    return duplicatedCoupon;
  }
};

// 정적 메서드들
couponSchema.statics = {
  // 쿠폰 코드 생성
  generateCode(length = 12) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  },
  
  // 고유 쿠폰 코드 생성
  async generateUniqueCode(length = 12) {
    let code;
    let existing;
    
    do {
      code = this.generateCode(length);
      existing = await this.findOne({ code });
    } while (existing);
    
    return code;
  },
  
  // 코드로 쿠폰 조회
  async findByCode(code) {
    return await this.findOne({ 
      code: code.toUpperCase(),
      isActive: true 
    }).populate('createdBy', 'firstName lastName email');
  },
  
  // 사용자가 사용 가능한 쿠폰 목록
  async getAvailableForUser(userId, membershipType = 'free') {
    const now = new Date();
    
    const query = {
      isActive: true,
      isPublic: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { usageLimit: null },
        { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
      ]
    };
    
    // 회원 등급 필터
    if (membershipType) {
      query.$and = [
        {
          $or: [
            { targetMembership: { $size: 0 } },
            { targetMembership: membershipType }
          ]
        }
      ];
    }
    
    // 제외 사용자 필터
    query.excludedUsers = { $ne: userId };
    
    return await this.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ priority: -1, createdAt: -1 });
  },
  
  // 만료된 쿠폰 정리
  async cleanupExpired() {
    const now = new Date();
    const result = await this.updateMany(
      { 
        endDate: { $lt: now },
        isActive: true 
      },
      { 
        isActive: false 
      }
    );
    
    return result.modifiedCount;
  },
  
  // 쿠폰 통계
  async getStats(period = 'all') {
    let matchStage = { isActive: true };
    
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
          totalCoupons: { $sum: 1 },
          activeCoupons: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          totalUsed: { $sum: '$usedCount' },
          totalSavings: { $sum: '$totalSavings' },
          avgUsagePerCoupon: { $avg: '$usedCount' }
        }
      }
    ]);
    
    const typeStats = await this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$couponType',
          count: { $sum: 1 },
          totalUsed: { $sum: '$usedCount' },
          totalSavings: { $sum: '$totalSavings' }
        }
      }
    ]);
    
    return {
      overall: stats[0] || {
        totalCoupons: 0,
        activeCoupons: 0,
        totalUsed: 0,
        totalSavings: 0,
        avgUsagePerCoupon: 0
      },
      byType: typeStats
    };
  },
  
  // 인기 쿠폰 순위
  async getPopularCoupons(limit = 10) {
    return await this.find({ isActive: true })
      .sort({ usedCount: -1, totalSavings: -1 })
      .limit(limit)
      .populate('createdBy', 'firstName lastName');
  }
};

module.exports = mongoose.model('Coupon', couponSchema); 