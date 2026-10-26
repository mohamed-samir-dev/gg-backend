import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// 1. CORS Middleware - MUST BE FIRST (handles preflight OPTIONS immediately)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key, x-kashier-signature, signature');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'x-kashier-signature', 'signature']
}));

// 2. Body Parser Middleware with rawBody support for webhook verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ extended: true }));

// 3. Connect to Database at startup
connectDB().catch(err => {
  console.error('Initial MongoDB connection error:', err.message);
});

// 4. Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/invoices', invoiceRoutes);

// Serve static invoice files
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));
app.use('/api/invoices', invoiceRoutes);

// Serve static invoice files
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Green Line API is running', currency: 'SAR' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message || 'حدث خطأ في الخادم',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`
🚀 Server running on port ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📦 MongoDB: ${process.env.MONGO_URI ? 'Configured' : 'Not configured'}
💵 Currency: SAR (الريال السعودي)
    `);
  });
}

// Export for Vercel
export default app;
