import express from 'express';
import {
  createOrder,
  getOrderById,
  verifyOrderPayment,
  updateOrderStatus,
  kashierWebhook,
  getAllOrders,
} from '../controllers/orderController.js';

const router = express.Router();

router.route('/')
  .get(getAllOrders)
  .post(createOrder);

router.get('/:orderId', getOrderById);
router.get('/:orderId/verify-payment', verifyOrderPayment);
router.put('/:orderId/status', updateOrderStatus);
router.post('/kashier-webhook', kashierWebhook);

export default router;
