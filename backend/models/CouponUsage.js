const mongoose = require('mongoose');

const couponUsageSchema = new mongoose.Schema({
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  discountAmount: {
    type: Number,
    required: true,
    min: 0
  },
  finalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'applied', 'refunded', 'cancelled'],
    default: 'applied'
  },
  metadata: {
    discountType: String,
    discountValue: Number,
    couponName: String,
    couponCode: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CouponUsage', couponUsageSchema); 