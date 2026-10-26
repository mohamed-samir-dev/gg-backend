import express from 'express';
import {
  createOrder,
  getOrderById,
  verifyOrderPayment,
  updateOrderStatus,
  kashierWebhook,
  getAllOrders,
  deleteOrder,
} from '../controllers/orderController.js';

const router = express.Router();

router.route('/')
  .get(getAllOrders)
  .post(createOrder);

router.get('/:orderId', getOrderById);
router.delete('/:orderId', deleteOrder);
router.put('/:orderId/status', updateOrderStatus);
router.post('/kashier-webhook', kashierWebhook);

export default router;
