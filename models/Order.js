import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  customer: {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    city: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
      default: 'EG',
    },
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: String,
    price: Number,
    priceEGP: Number,
    priceSAR: Number,
    qty: {
      type: Number,
      required: true,
      min: 1,
    },
  }],
  pricing: {
    totalEGP: {
      type: Number,
      required: true,
      default: function() {
        return this.totalLocal || 0;
      },
    },
    totalSAR: {
      type: Number,
    },
    totalLocal: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'EGP',
    },
    exchangeRate: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  payment: {
    method: {
      type: String,
      enum: ['cash_on_delivery', 'kashier'],
      default: 'cash_on_delivery',
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    kashierSessionId: String,
    kashierTransactionId: String,
    kashierCurrency: String,
    kashierAmount: Number,
    paidAt: Date,
  },
  status: {
    type: String,
    enum: ['new', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'new',
  },
  idempotencyKey: {
    type: String,
    required: true,
    unique: true,
  },
  notes: String,
}, {
  timestamps: true,
});

// Indexes for faster queries (removed duplicate orderId index)
orderSchema.index({ 'customer.phone': 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
