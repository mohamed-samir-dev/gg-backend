import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { createKashierSession, getKashierSession, verifyKashierWebhookSignature, STORE_CURRENCY } from '../utils/kashier.js';
import { toCents, fromCents, formatEGPString } from '../utils/finance.js';

// @desc    Create new order in EGP
// @route   POST /api/orders
// @access  Public
export const createOrder = async (req, res) => {
  try {
    const { name, phone, city, address, country = 'EG', paymentMethod, items } = req.body;
    const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey;

    // Validate required fields
    if (!name || !phone || !city || !address) {
      return res.status(400).json({ message: 'بيانات الطلب غير مكتملة' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'الطلب فارغ، أضف منتجات إلى السلة' });
    }

    if (!idempotencyKey) {
      return res.status(400).json({ message: 'مفتاح الطلب مفقود' });
    }

    // Check for duplicate order via idempotency key
    const existingOrder = await Order.findOne({ idempotencyKey });
    if (existingOrder) {
      return res.json({
        orderId: existingOrder.orderId,
        status: 'duplicate',
        message: 'تم معالجة هذا الطلب مسبقاً',
        total: existingOrder.pricing.totalEGP ?? existingOrder.pricing.totalLocal ?? existingOrder.pricing.totalSAR,
        totalLocal: existingOrder.pricing.totalLocal,
        currency: existingOrder.pricing.currency || 'EGP',
        order: existingOrder,
      });
    }

    // Server-side calculation supporting SAR and EGP
    let totalCents = 0;
    const orderItems = [];
    let orderCurrency = req.body.currency;

    for (const item of items) {
      if (!item.id || !Number.isInteger(item.qty) || item.qty <= 0) {
        return res.status(400).json({ message: `بيانات الكمية أو المنتج غير صالحة: ${item.id}` });
      }

      // Find product flexibly by numeric ID, string ID, or MongoDB _id
      const numericId = Number(item.id);
      let query;
      if (!isNaN(numericId)) {
        query = { id: numericId };
      } else if (item.id && typeof item.id === 'string' && item.id.length === 24) {
        query = { _id: item.id };
      } else {
        query = { id: item.id };
      }

      let product = await Product.findOne(query);
      
      if (!product) {
        console.warn(`Product not found with ID: ${item.id}, attempting fallback search...`);
        product = await Product.findOne({ $or: [{ id: numericId }, { id: String(item.id) }] });
      }

      if (!product) {
        console.warn(`Product still not found with ID: ${item.id}`);
        return res.status(404).json({ message: `المنتج غير موجود: ${item.id}` });
      }

      if (!product.isActive) {
        return res.status(400).json({ message: `المنتج ${product.name} غير متاح حالياً` });
      }

      // If product has currency SAR or client requested SAR, use SAR
      const isSARItem = product.currency === 'SAR' || orderCurrency === 'SAR';
      if (isSARItem) {
        orderCurrency = 'SAR';
      }

      const unitPrice = isSARItem
        ? (product.priceSAR !== undefined && product.priceSAR !== null ? product.priceSAR : product.price)
        : (product.priceEGP !== undefined && product.priceEGP !== null ? product.priceEGP : product.price);

      const itemCents = Math.round(unitPrice * 100) * item.qty;
      totalCents += itemCents;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: unitPrice,
        priceEGP: product.priceEGP ?? unitPrice,
        priceSAR: product.priceSAR ?? unitPrice,
        qty: item.qty,
      });
    }

    const totalAmount = parseFloat((totalCents / 100).toFixed(2));
    const currency = orderCurrency || 'SAR';
    const exchangeRate = 1;

    // Generate unique order ID
    const orderId = `GL-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Create order in database
    const order = await Order.create({
      orderId,
      customer: {
        name,
        phone,
        city,
        address,
        country: country || (currency === 'SAR' ? 'SA' : 'EG'),
      },
      items: orderItems,
      pricing: {
        totalEGP: totalAmount,
        totalSAR: totalAmount,
        totalLocal: totalAmount,
        currency,
        exchangeRate,
      },
      payment: {
        method: paymentMethod || 'cash_on_delivery',
        status: 'pending',
        kashierCurrency: currency,
        kashierAmount: totalAmount,
      },
      idempotencyKey,
    });

    const response = {
      orderId: order.orderId,
      total: totalAmount,
      totalLocal: totalAmount,
      currency,
      status: 'confirmed',
      order: order,
    };

    // Handle Kashier payment session creation
    if (paymentMethod === 'kashier') {
      try {
        const kashierSession = await createKashierSession({
          orderId: order.orderId,
          amount: totalAmount,
          currency,
          customer: {
            name,
            phone,
            email: `customer-${phone}@temp.kashier.local`,
          },
        });

        if (kashierSession.sessionUrl) {
          order.payment.kashierSessionId = kashierSession.sessionId;
          order.payment.kashierCurrency = kashierSession.currency;
          order.payment.kashierAmount = parseFloat(kashierSession.amount);
          await order.save();

          response.status = 'pending_payment';
          response.kashier = {
            sessionUrl: kashierSession.sessionUrl,
            sessionId: kashierSession.sessionId,
            currency: kashierSession.currency,
            amount: kashierSession.amount,
          };
        }
      } catch (error) {
        console.error('Kashier session creation error:', error);
        return res.status(500).json({
          message: 'فشل إنشاء جلسة الدفع عبر كاشير',
          error: error.message,
        });
      }
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      message: 'خطأ في إنشاء الطلب',
      error: error.message,
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:orderId
// @access  Public
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId })
      .populate('items.product');

    if (!order) {
      return res.status(404).json({ message: 'الطلب غير موجود' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({
      message: 'خطأ في جلب الطلب',
      error: error.message,
    });
  }
};

// @desc    Verify payment status with Kashier (on redirect return)
// @route   GET /api/orders/:orderId/verify-payment
// @access  Public
export const verifyOrderPayment = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });

    if (!order) {
      return res.status(404).json({ message: 'الطلب غير موجود' });
    }

    const total = order.pricing?.totalSAR ?? order.pricing?.totalLocal ?? order.pricing?.totalEGP ?? 0;
    const currency = order.pricing?.currency || 'SAR';

    // If already marked paid
    if (order.payment.status === 'paid') {
      return res.json({
        orderId: order.orderId,
        status: order.payment.status,
        currency,
        total,
        paidAt: order.payment.paidAt,
      });
    }

    // If order has Kashier session, check status with Kashier API
    if (order.payment.method === 'kashier' && order.payment.kashierSessionId) {
      try {
        const kashierData = await getKashierSession(order.payment.kashierSessionId);
        const sessionInfo = kashierData.data || kashierData;
        const sessionStatus = String(sessionInfo.status || '').toUpperCase();

        if (sessionStatus === 'CAPTURED' || sessionStatus === 'PAID' || sessionStatus === 'SUCCESS') {
          order.payment.status = 'paid';
          order.payment.paidAt = new Date();
          order.status = 'processing';
          await order.save();
        }
      } catch (err) {
        console.warn('Could not verify session with Kashier:', err.message);
      }
    }

    res.json({
      orderId: order.orderId,
      status: order.payment.status,
      currency,
      total,
      order,
    });
  } catch (error) {
    res.status(500).json({
      message: 'خطأ في التحقق من حالة الدفع',
      error: error.message,
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:orderId/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findOne({ orderId: req.params.orderId });

    if (!order) {
      return res.status(404).json({ message: 'الطلب غير موجود' });
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({
      message: 'خطأ في تحديث حالة الطلب',
      error: error.message,
    });
  }
};

// @desc    Kashier webhook handler with signature verification & amount/currency matching
// @route   POST /api/orders/kashier-webhook
// @access  Public
export const kashierWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-kashier-signature'] || req.headers['signature'];
    const rawPayload = req.rawBody || req.body;

    // Signature verification when signature header is present
    if (signature) {
      const isValid = verifyKashierWebhookSignature(rawPayload, signature);
      if (!isValid) {
        console.warn('[Webhook] Invalid Kashier webhook signature');
        return res.status(401).json({ message: 'Invalid webhook signature' });
      }
    }

    // Extract payload data
    const data = req.body.data || req.body;
    const orderId = data.orderReference || data.orderId || data.order || data.merchantOrderId || req.body.orderId;
    const status = String(data.status || data.paymentStatus || data.kashierPaymentStatus || req.body.status || '').toUpperCase();
    const transactionId = data.transactionId || data.transactionRef || data.kashierTransactionId || req.body.transactionId;
    const webhookAmount = data.amount !== undefined ? parseFloat(data.amount) : undefined;
    const webhookCurrency = data.currency ? String(data.currency).toUpperCase() : 'EGP';
    
    // Extract additional payment details from Kashier
    const cardBrand = data.cardBrand || data.card_brand || data.cardScheme;
    const cardLast4 = data.cardLast4 || data.card_last4 || data.maskedCard;
    const paymentMethod = data.paymentMethod || data.payment_method || 'card';
    const merchantOrderId = data.merchantOrderId || data.merchant_order_id;

    if (!orderId) {
      return res.status(400).json({ message: 'Missing orderId in webhook payload' });
    }

    const order = await Order.findOne({ orderId });

    if (!order) {
      console.warn(`[Webhook] Order not found for orderId: ${orderId}`);
      return res.status(404).json({ message: 'Order not found' });
    }

    // Idempotency: If order is already paid, do not process again
    if (order.payment.status === 'paid') {
      return res.json({ message: 'Order already marked as paid (idempotent)', orderId });
    }

    const orderExpectedTotal = order.pricing?.totalSAR ?? order.pricing?.totalLocal ?? order.pricing?.totalEGP;
    const orderCurrency = order.pricing?.currency || 'SAR';

    // Amount match check (allow slight 0.05 margin)
    if (webhookAmount !== undefined) {
      if (Math.abs(webhookAmount - orderExpectedTotal) > 0.05) {
        console.warn(`[Webhook] Amount mismatch for order ${orderId}: expected ${orderExpectedTotal}, got ${webhookAmount}`);
        return res.status(400).json({
          message: `Amount mismatch: expected ${orderExpectedTotal} ${orderCurrency}, received ${webhookAmount}`,
        });
      }
    }

    // Process payment status
    if (status === 'SUCCESS' || status === 'PAID' || status === 'CAPTURED') {
      order.payment.status = 'paid';
      order.payment.paidAt = new Date();
      order.payment.kashierTransactionId = transactionId || order.payment.kashierTransactionId;
      order.payment.kashierCurrency = webhookCurrency || orderCurrency;
      order.payment.kashierAmount = webhookAmount || orderExpectedTotal;
      order.payment.kashierCardBrand = cardBrand;
      order.payment.kashierCardLast4 = cardLast4;
      order.payment.kashierPaymentMethod = paymentMethod;
      order.payment.kashierMerchantOrderId = merchantOrderId;
      order.payment.kashierOrderReference = orderId;
      order.payment.kashierRawResponse = req.body; // Store full webhook payload
      order.status = 'processing';
      await order.save();
      console.log(`[Webhook] Order ${orderId} successfully marked as PAID`);
      
      // Auto-generate invoice after successful payment
      try {
        if (!order.invoice.invoiceNumber) {
          const date = new Date(order.createdAt);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          order.invoice.invoiceNumber = `INV-${year}${month}${day}-${order.orderId}`;
          await order.save();
          console.log(`[Webhook] Invoice number generated: ${order.invoice.invoiceNumber}`);
        }
      } catch (invoiceError) {
        console.error('[Webhook] Failed to generate invoice number:', invoiceError);
      }
    } else if (status === 'FAILURE' || status === 'FAILED' || status === 'DECLINED') {
      order.payment.status = 'failed';
      order.payment.kashierRawResponse = req.body;
      await order.save();
      console.log(`[Webhook] Order ${orderId} payment marked as FAILED`);
    }

    res.json({ message: 'Webhook processed successfully', orderId, status: order.payment.status });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed', error: error.message });
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: 'خطأ في جلب الطلبات',
      error: error.message,
    });
  }
};
