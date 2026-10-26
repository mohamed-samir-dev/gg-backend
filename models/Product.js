import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: [true, 'اسم المنتج مطلوب'],
    trim: true,
  },
  nameEn: {
    type: String,
    required: [true, 'الاسم الإنجليزي مطلوب'],
    trim: true,
  },
  formula: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: [true, 'السعر مطلوب'],
    min: 0,
  },
  priceEGP: {
    type: Number,
    min: 0,
    default: function() {
      return this && this.price !== undefined ? this.price : 0;
    },
  },
  priceSAR: {
    type: Number,
    min: 0,
  },
  currency: {
    type: String,
    default: 'EGP',
  },
  isPriceVerified: {
    type: Boolean,
    default: true,
  },
  weight: {
    type: String,
    required: true,
  },
  tag: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '#38694c',
  },
  description: {
    type: String,
    required: true,
  },
  spec: {
    type: String,
    required: true,
  },
  image: {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
  },
  stock: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const Product = mongoose.model('Product', productSchema);

export default Product;
