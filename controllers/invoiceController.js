import Order from '../models/Order.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Generate Invoice Number
 */
const generateInvoiceNumber = (orderId, createdAt) => {
  const date = new Date(createdAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Format: INV-YYYYMMDD-ORDERID
  return `INV-${year}${month}${day}-${orderId}`;
};

/**
 * Generate PDF Invoice for an order
 * @route   POST /api/invoices/:orderId/generate
 */
export const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId }).populate('items.product');

    if (!order) {
      return res.status(404).json({ message: 'الطلب غير موجود' });
    }

    // Generate invoice number if not exists
    if (!order.invoice?.invoiceNumber) {
      if (!order.invoice) order.invoice = {};
      order.invoice.invoiceNumber = generateInvoiceNumber(order.orderId, order.createdAt);
      order.invoice.isGenerated = true;
      order.invoice.generatedAt = new Date();
      await order.save();
    }

    // Create invoices directory if not exists
    const invoicesDir = path.join(process.cwd(), 'invoices');
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    const invoiceFileName = `${order.invoice.invoiceNumber}.pdf`;
    const invoiceFilePath = path.join(invoicesDir, invoiceFileName);

    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(invoiceFilePath);
    doc.pipe(stream);

    // Company Header
    doc.fontSize(24).font('Helvetica-Bold').text('GREEN LINE', 50, 50);
    doc.fontSize(10).font('Helvetica').text('شركة جرين لاين للأسمدة الزراعية', 50, 80);
    doc.text('Green Line Agricultural Fertilizers', 50, 95);
    doc.text('الموقع: www.greenline-fertilizers.com', 50, 110);
    doc.text('الهاتف: +20 155 245 6445', 50, 125);

    // Invoice Title
    doc.fontSize(20).font('Helvetica-Bold').text('INVOICE / فاتورة', 400, 50, { align: 'right' });
    doc.fontSize(10).font('Helvetica');
    doc.text(`رقم الفاتورة: ${order.invoice.invoiceNumber}`, 400, 80, { align: 'right' });
    doc.text(`Invoice #: ${order.invoice.invoiceNumber}`, 400, 95, { align: 'right' });
    doc.text(`التاريخ: ${new Date(order.paidAt || order.createdAt).toLocaleDateString('ar-EG')}`, 400, 110, { align: 'right' });

    // Line separator
    doc.moveTo(50, 160).lineTo(550, 160).stroke();

    // Customer Information
    doc.fontSize(12).font('Helvetica-Bold').text('بيانات العميل / Customer Information', 50, 180);
    doc.fontSize(10).font('Helvetica');
    doc.text(`الاسم / Name: ${order.customer.name}`, 50, 200);
    doc.text(`الهاتف / Phone: ${order.customer.phone}`, 50, 215);
    doc.text(`المدينة / City: ${order.customer.city}`, 50, 230);
    doc.text(`العنوان / Address: ${order.customer.address}`, 50, 245);
    doc.text(`الدولة / Country: ${order.customer.country === 'SA' ? 'السعودية / Saudi Arabia' : 'مصر / Egypt'}`, 50, 260);

    // Payment Information
    doc.fontSize(12).font('Helvetica-Bold').text('بيانات الدفع / Payment Details', 320, 180);
    doc.fontSize(10).font('Helvetica');
    doc.text(`رقم الطلب / Order ID: ${order.orderId}`, 320, 200);
    doc.text(`طريقة الدفع / Method: ${order.payment.method === 'kashier' ? 'بطاقة بنكية / Card' : 'كاش / Cash'}`, 320, 215);
    doc.text(`الحالة / Status: ${order.payment.status === 'paid' ? 'مدفوع / Paid' : 'معلق / Pending'}`, 320, 230);
    
    if (order.payment.kashierTransactionId) {
      doc.text(`Transaction ID: ${order.payment.kashierTransactionId}`, 320, 245);
    }
    if (order.payment.kashierCardBrand) {
      doc.text(`البطاقة / Card: ${order.payment.kashierCardBrand} ****${order.payment.kashierCardLast4 || ''}`, 320, 260);
    }
    if (order.payment.paidAt) {
      doc.text(`تاريخ الدفع: ${new Date(order.payment.paidAt).toLocaleString('ar-EG')}`, 320, 275);
    }

    // Line separator
    doc.moveTo(50, 300).lineTo(550, 300).stroke();

    // Items Table Header
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('المنتج / Product', 50, 320);
    doc.text('الكمية', 300, 320);
    doc.text('السعر', 370, 320);
    doc.text('الإجمالي', 470, 320);

    // Line under header
    doc.moveTo(50, 335).lineTo(550, 335).stroke();

    // Items
    let yPosition = 350;
    doc.fontSize(10).font('Helvetica');

    const currency = order.pricing.currency || 'EGP';
    const currencyLabel = currency === 'SAR' ? 'ر.س' : 'ج.م';

    for (const item of order.items) {
      const itemPrice = currency === 'SAR' ? (item.priceSAR || item.price) : (item.priceEGP || item.price);
      const itemTotal = itemPrice * item.qty;

      doc.text(item.name, 50, yPosition, { width: 230 });
      doc.text(`${item.qty}`, 300, yPosition);
      doc.text(`${itemPrice.toLocaleString()} ${currencyLabel}`, 370, yPosition);
      doc.text(`${itemTotal.toLocaleString()} ${currencyLabel}`, 470, yPosition);

      yPosition += 25;
      
      // Add new page if needed
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
    }

    // Line before totals
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 20;

    // Total
    const totalAmount = order.pricing.totalEGP || order.pricing.totalLocal || order.pricing.totalSAR || 0;
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('الإجمالي / Total:', 370, yPosition);
    doc.text(`${totalAmount.toLocaleString()} ${currencyLabel}`, 470, yPosition);

    yPosition += 40;

    // Footer
    doc.fontSize(9).font('Helvetica').fillColor('#666');
    doc.text('شكراً لتعاملكم معنا / Thank you for your business', 50, yPosition, { align: 'center' });
    doc.text('Green Line - Agricultural Excellence', 50, yPosition + 15, { align: 'center' });

    // Finalize PDF
    doc.end();

    // Wait for PDF to be written
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    // Update order with invoice info
    order.invoice.invoiceUrl = `/invoices/${invoiceFileName}`;
    order.invoice.isGenerated = true;
    order.invoice.generatedAt = new Date();
    await order.save();

    res.json({
      message: 'تم إنشاء الفاتورة بنجاح',
      invoice: {
        invoiceNumber: order.invoice.invoiceNumber,
        invoiceUrl: order.invoice.invoiceUrl,
        downloadUrl: `/api/invoices/${orderId}/download`,
      },
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ 
      message: 'خطأ في إنشاء الفاتورة',
      error: error.message 
    });
  }
};

/**
 * Download Invoice PDF
 * @route   GET /api/invoices/:orderId/download
 */
export const downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ message: 'الطلب غير موجود' });
    }

    if (!order.invoice.isGenerated || !order.invoice.invoiceNumber) {
      return res.status(404).json({ message: 'الفاتورة غير موجودة، يرجى إنشاؤها أولاً' });
    }

    const invoiceFileName = `${order.invoice.invoiceNumber}.pdf`;
    const invoiceFilePath = path.join(process.cwd(), 'invoices', invoiceFileName);

    if (!fs.existsSync(invoiceFilePath)) {
      return res.status(404).json({ message: 'ملف الفاتورة غير موجود' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoiceFileName}"`);

    const fileStream = fs.createReadStream(invoiceFilePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({ 
      message: 'خطأ في تحميل الفاتورة',
      error: error.message 
    });
  }
};

/**
 * Get Invoice Info
 * @route   GET /api/invoices/:orderId
 */
export const getInvoiceInfo = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId }).select('invoice payment orderId customer.name pricing createdAt');

    if (!order) {
      return res.status(404).json({ message: 'الطلب غير موجود' });
    }

    res.json({
      orderId: order.orderId,
      customerName: order.customer.name,
      total: order.pricing.totalLocal,
      currency: order.pricing.currency,
      paymentStatus: order.payment.status,
      invoice: order.invoice,
      createdAt: order.createdAt,
    });
  } catch (error) {
    console.error('Error fetching invoice info:', error);
    res.status(500).json({ 
      message: 'خطأ في جلب معلومات الفاتورة',
      error: error.message 
    });
  }
};
