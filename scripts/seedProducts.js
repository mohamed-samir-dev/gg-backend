import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const products = [
  {
    id: 1,
    name: 'جرين جرو المتوازن',
    nameEn: 'BALANCED NUTRITION',
    formula: 'NPK 20-20-20',
    category: 'أسمدة مركبة',
    price: 1000,
    priceSAR: 1000,
    priceEGP: 1000,
    currency: 'SAR',
    isPriceVerified: true,
    weight: '25 كجم',
    tag: 'اختيار الموسم',
    color: '#38694c',
    description: 'تركيبة متوازنة تجمع العناصر الأساسية ضمن برنامج تغذية المحاصيل.',
    spec: 'نيتروجين 20% · فوسفور 20% · بوتاسيوم 20%',
    image: {
      url: '/fertilizer.png',
      publicId: 'fertilizer-1'
    },
    stock: 100,
    isActive: true,
  },
  {
    id: 2,
    name: 'أورجانيك بلس',
    nameEn: 'ORGANIC MATTER',
    formula: 'ORGANIC PLUS',
    category: 'أسمدة عضوية',
    price: 500,
    priceSAR: 500,
    priceEGP: 500,
    currency: 'SAR',
    isPriceVerified: true,
    weight: '20 كجم',
    tag: 'عضوي',
    color: '#876746',
    description: 'سماد عضوي لإضافته إلى خطتك للعناية بالتربة والمحاصيل.',
    spec: 'مادة عضوية',
    image: {
      url: '/two.webp',
      publicId: 'fertilizer-2'
    },
    stock: 150,
    isActive: true,
  },
  {
    id: 3,
    name: 'بوتاسيوم باور',
    nameEn: 'FRUIT & FLOWER',
    formula: 'NPK 12-12-36',
    category: 'أسمدة مركبة',
    price: 1800,
    priceSAR: 1800,
    priceEGP: 1800,
    currency: 'SAR',
    isPriceVerified: true,
    weight: '25 كجم',
    tag: 'تغذية متخصصة',
    color: '#a77b35',
    description: 'تركيبة عالية البوتاسيوم ضمن مجموعة تغذية مرحلة الإثمار.',
    spec: 'نيتروجين 12% · فوسفور 12% · بوتاسيوم 36%',
    image: {
      url: '/three.webp',
      publicId: 'fertilizer-3'
    },
    stock: 80,
    isActive: true,
  },
  {
    id: 4,
    name: 'هيوميك روت',
    nameEn: 'ROOT CARE',
    formula: 'HUMIC ACID',
    category: 'محسنات تربة',
    price: 1500,
    priceSAR: 1500,
    priceEGP: 1500,
    currency: 'SAR',
    isPriceVerified: true,
    weight: '10 كجم',
    tag: 'عناية بالجذور',
    color: '#624a37',
    description: 'محسن تربة ضمن مجموعة جرين لاين للعناية بمنطقة الجذور.',
    spec: 'أحماض هيوميك',
    image: {
      url: '/four.webp',
      publicId: 'fertilizer-4'
    },
    stock: 60,
    isActive: true,
  },
  {
    id: 5,
    name: 'كالسيوم برو',
    nameEn: 'CALCIUM COMPLEX',
    formula: 'CALCIUM + B',
    category: 'عناصر صغرى',
    price: 2500,
    priceSAR: 2500,
    priceEGP: 2500,
    currency: 'SAR',
    isPriceVerified: true,
    weight: '20 لتر',
    tag: 'تركيبة سائلة',
    color: '#476d87',
    description: 'مزيج من الكالسيوم والبورون للتغذية الزراعية المتخصصة.',
    spec: 'كالسيوم + بورون',
    image: {
      url: '/five.webp',
      publicId: 'fertilizer-5'
    },
    stock: 40,
    isActive: true,
  },
  {
    id: 6,
    name: 'جرين ماكس الاحترافي',
    nameEn: 'PROFESSIONAL SERIES',
    formula: 'NPK 15-5-30',
    category: 'أسمدة مركبة',
    price: 3500,
    priceSAR: 3500,
    priceEGP: 3500,
    currency: 'SAR',
    isPriceVerified: true,
    weight: '50 كجم',
    tag: 'عبوة المزارع',
    color: '#344b42',
    description: 'عبوة كبيرة من الأسمدة المركبة لمتطلبات المزارع.',
    spec: 'نيتروجين 15% · فوسفور 5% · بوتاسيوم 30%',
    image: {
      url: '/six.webp',
      publicId: 'fertilizer-6'
    },
    stock: 30,
    isActive: true,
  },
  {
    id: 7,
    name: 'فيرو بلانت',
    nameEn: 'IRON & MICRONUTRIENTS',
    formula: 'Fe + Mn + Zn',
    category: 'عناصر صغرى',
    price: 1299,
    priceSAR: 1299,
    priceEGP: 1299,
    currency: 'SAR',
    isPriceVerified: true,
    weight: '5 كجم',
    tag: 'عناصر نادرة',
    color: '#5a4a6b',
    description: 'مزيج متكامل من الحديد والمنغنيز والزنك لمعالجة نقص العناصر الصغرى وتحسين خضرة الأوراق.',
    spec: 'حديد · منغنيز · زنك',
    image: {
      url: '/seven.webp',
      publicId: 'fertilizer-7'
    },
    stock: 70,
    isActive: true,
  },
  {
    id: 8,
    name: 'نيترو ستارت',
    nameEn: 'NITROGEN BOOSTER',
    formula: 'N 46%',
    category: 'أسمدة مركبة',
    price: 699,
    priceSAR: 699,
    priceEGP: 699,
    currency: 'SAR',
    isPriceVerified: true,
    weight: '10 كجم',
    tag: 'تنشيط النمو',
    color: '#3a5f4a',
    description: 'سماد نيتروجيني مركز لتنشيط النمو الخضري في مراحل التأسيس الأولى للمحصول.',
    spec: 'نيتروجين 46%',
    image: {
      url: '/eight.webp',
      publicId: 'fertilizer-8'
    },
    stock: 90,
    isActive: true,
  },
];

export const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    console.log('📦 Seeding/updating 8 fertilizer products with SAR pricing...');

    for (const item of products) {
      const existing = await Product.findOne({ id: item.id });
      if (existing) {
        await Product.updateOne({ id: item.id }, { $set: item });
        console.log(`  Updated product ${item.id}: ${item.name} (${item.priceSAR} SAR)`);
      } else {
        await Product.create(item);
        console.log(`  Created product ${item.id}: ${item.name} (${item.priceSAR} SAR)`);
      }
    }

    console.log('✅ All 8 fertilizer products seeded successfully in SAR!');
    return true;
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    throw err;
  }
};

// If run directly from CLI
if (process.argv[1] && process.argv[1].endsWith('seedProducts.js')) {
  seedProducts()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
