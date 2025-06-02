const axios = require('axios');
const logger = require('../utils/Logger');

const PAYMENTS_MS_URL = process.env.PAYMENTS_MS_URL || 'http://localhost:3002';

class PaymentsService {
  static async createPayment(paymentData) {
    try {
      const response = await axios.post(`${PAYMENTS_MS_URL}/payments`, paymentData);
      logger.info(`[PaymentsService] Pago creado exitosamente para orderId: ${paymentData.order_id}`);
      return response.data;
    } catch (error) {
      logger.error(`[PaymentsService] Error al crear pago para orderId: ${paymentData.order_id}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = PaymentsService;