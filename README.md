# Green Line Backend API

Backend API لمتجر جرين لاين للأسمدة الزراعية

## المميزات

- ✅ MongoDB لإدارة قاعدة البيانات
- ✅ Cloudinary لتخزين الصور
- ✅ تكامل كامل مع بوابة الدفع Kashier
- ✅ إدارة المنتجات (CRUD)
- ✅ نظام الطلبات المتكامل
- ✅ Idempotency لتجنب الطلبات المكررة

## التثبيت

```bash
# تثبيت المكتبات
npm install

# تشغيل الخادم في وضع التطوير
npm run dev

# تشغيل الخادم في وضع الإنتاج
npm start
```

## إضافة المنتجات الأولية

```bash
node scripts/seedProducts.js
```

## API Endpoints

### المنتجات

- `GET /api/products` - جلب كل المنتجات
- `GET /api/products/:id` - جلب منتج واحد
- `POST /api/products` - إضافة منتج جديد (مع رفع صورة)
- `PUT /api/products/:id` - تحديث منتج
- `DELETE /api/products/:id` - حذف منتج

### الطلبات

- `POST /api/orders` - إنشاء طلب جديد
- `GET /api/orders` - جلب كل الطلبات (Admin)
- `GET /api/orders/:orderId` - جلب طلب محدد
- `PUT /api/orders/:orderId/status` - تحديث حالة الطلب
- `POST /api/orders/kashier-webhook` - Webhook من Kashier

## رفع صورة منتج

```bash
curl -X POST http://localhost:5000/api/products \
  -F "name=اسم المنتج" \
  -F "nameEn=Product Name" \
  -F "formula=NPK 20-20-20" \
  -F "category=أسمدة مركبة" \
  -F "price=1000" \
  -F "weight=25 كجم" \
  -F "description=الوصف" \
  -F "spec=المواصفات" \
  -F "stock=100" \
  -F "image=@/path/to/image.jpg"
```

## متغيرات البيئة

راجع ملف `.env` للتأكد من تكوين جميع المتغيرات.

## الخادم

الخادم يعمل على: `http://localhost:5000`

Health check: `http://localhost:5000/health`
