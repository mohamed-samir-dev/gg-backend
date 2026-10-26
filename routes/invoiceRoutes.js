import express from 'express';
import { generateInvoice, downloadInvoice, getInvoiceInfo } from '../controllers/invoiceController.js';

const router = express.Router();

// Generate invoice for a paid order
router.post('/:orderId/generate', generateInvoice);

// Download invoice PDF
router.get('/:orderId/download', downloadInvoice);

// Get invoice information
router.get('/:orderId', getInvoiceInfo);

export default router;
