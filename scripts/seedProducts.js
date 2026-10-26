import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import cloudinary from '../config/cloudinary.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Products data from original project
const products = [
  {
    id: 1,
    name: 'جرين جرو المتوازن',
    nameEn: 'BALANCED NUTRITION',
    formula: 'NPK 20-20-20',
    category: 'أسمدة مركبة',
    price: 1000,
    weight: '25 كجم',
    tag: 'اختيار الموسم',
    color: '#38694c',
    description: 'تركيبة متوازنة تجمع العناصر الأساسية ضمن برنامج تغذية المحاصيل.',
    spec: 'نيتروجين 20% · فوسفور 20% · بوتاسيوم 20%',
    imageLocal: 'fertilizer.png',
    stock: 100,
  },
  {
    id: 2,
    name: 'أورجانيك بلس',
    nameEn: 'ORGANIC MATTER',
    formula: 'ORGANIC PLUS',
    category: 'أسمدة عضوية',
    price: 500,
    weight: '20 كجم',
    tag: 'عضوي',
    color: '#876746',
    description: 'سماد عضوي لإضافته إلى خطتك للعناية بالتربة والمحاصيل.',
    spec: 'مادة عضوية',
    imageLocal: 'two.webp',
    stock: 150,
  },
  {
    id: 3,
    name: 'بوتاسيوم باور',
    nameEn: 'FRUIT & FLOWER',
    formula: 'NPK 12-12-36',
    category: 'أسمدة مركبة',
    price: 1800,
    weight: '25 كجم',
    tag: 'تغذية متخصصة',
    color: '#a77b35',
    description: 'تركيبة عالية البوتاسيوم ضمن مجموعة تغذية مرحلة الإثمار.',
    spec: 'نيتروجين 12% · فوسفور 12% · بوتاسيوم 36%',
    imageLocal: 'three.webp',
    stock: 80,
  },
  {
    id: 4,
    name: 'هيوميك روت',
    nameEn: 'ROOT CARE',
    formula: 'HUMIC ACID',
    category: 'محسنات تربة',
    price: 1500,
    weight: '10 كجم',
    tag: 'عناية بالجذور',
    color: '#624a37',
    description: 'محسن تربة ضمن مجموعة جرين لاين للعناية بمنطقة الجذور.',
    spec: 'أحماض هيوميك',
    imageLocal: 'four.webp',
    stock: 60,
  },
  {
    id: 5,
    name: 'كالسيوم برو',
    nameEn: 'CALCIUM COMPLEX',
    formula: 'CALCIUM + B',
    category: 'عناصر صغرى',
    price: 2500,
    weight: '20 لتر',
    tag: 'تركيبة سائلة',
    color: '#476d87',
    description: 'مزيج من الكالسيوم والبورون للتغذية الزراعية المتخصصة.',
    spec: 'كالسيوم + بورون',
    imageLocal: 'five.webp',
    stock: 40,
  },
  {
    id: 6,
    name: 'جرين ماكس الاحترافي',
    nameEn: 'PROFESSIONAL SERIES',
    formula: 'NPK 15-5-30',
    category: 'أسمدة مركبة',
    price: 3500,
    weight: '50 كجم',
    tag: 'عبوة المزارع',
    color: '#344b42',
    description: 'عبوة كبيرة من الأسمدة المركبة لمتطلبات المزارع.',
    spec: 'نيتروجين 15% · فوسفور 5% · بوتاسيوم 30%',
    imageLocal: 'six.webp',
    stock: 30,
  },
  {
    id: 7,
    name: 'فيرو بلانت',
    nameEn: 'IRON & MICRONUTRIENTS',
    formula: 'Fe + Mn + Zn',
    category: 'عناصر صغرى',
    price: 1299,
    weight: '5 كجم',
    tag: 'عناصر نادرة',
    color: '#5a4a6b',
    description: 'مزيج متكامل من الحديد والمنغنيز والزنك لمعالجة نقص العناصر الصغرى وتحسين خضرة الأوراق.',
    spec: 'حديد · منغنيز · زنك',
    imageLocal: 'seven.webp',
    stock: 70,
  },
  {
    id: 8,
    name: 'نيترو ستارت',
    nameEn: 'NITROGEN BOOSTER',
    formula: 'N 46%',
    category: 'أسمدة مركبة',
    price: 699,
    weight: '10 كجم',
    tag: 'تنشيط النمو',
    color: '#3a5f4a',
    description: 'سماد نيتروجيني مركز لتنشيط النمو الخضري في مراحل التأسيس الأولى للمحصول.',
    spec: 'نيتروجين 46%',
    imageLocal: 'eight.webp',
    stock: 90,
  },
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Safe upsert without deleting existing documents
    console.log('\n📦 Seeding/updating fertilizer products with SAR pricing...\n');

    for (const productData of products) {
      try {
        const placeholderImage = `https://via.placeholder.com/800x800/38694c/ffffff?text=${encodeURIComponent(productData.nameEn)}`;
        
        const updateData = {
          ...productData,
          priceSAR: productData.price,
          currency: 'SAR',
          isPriceVerified: true,
          image: {
            url: placeholderImage,
            publicId: `placeholder-${productData.nameEn.toLowerCase().replace(/\s+/g, '-')}`,
          },
        };

        await Product.findOneAndUpdate(
          { id: productData.id },
          { $set: updateData },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log(`✅ Upserted product ${productData.id}: ${productData.name} (${productData.price} SAR)`);
      } catch (error) {
        console.error(`❌ Failed to upsert ${productData.name}:`, error.message);
      }
    }

    console.log('\n✅ Products seeded/updated successfully with SAR pricing!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedProducts();
