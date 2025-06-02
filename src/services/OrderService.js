const axios = require('axios');
const logger = require('../utils/Logger');

const ORDERS_MS_URL = process.env.ORDERS_MS_URL || 'http://localhost:3000';

class OrderService {
  static async updateOrderStatus(orderId, status) {
    try {
      logger.info(`[OrderService] Actualizando orden ${orderId} a estado '${status}'`);
      await axios.put(
        `${ORDERS_MS_URL}/orders/${orderId}`,
        { status }
      );
      logger.info(`[OrderService] Orden ${orderId} actualizada correctamente a '${status}'`);
    } catch (error) {
      logger.error(`[OrderService] Error actualizando orden ${orderId} a '${status}': ${error.message}`);
      throw error;
    }
  }
}

module.exports = OrderService;