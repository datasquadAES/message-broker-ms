const OrderService = require('../../services/OrderService');
const { QueueManager } = require('@oerazoo/commons-ms');
const logger = require('../../utils/Logger');

// Configuración de la base de datos para la cola (ajusta según tu entorno)
const queueConfig = {
  user: process.env.QUEUE_DB_USER || '',
  host: process.env.QUEUE_DB_HOST || '',
  database: process.env.QUEUE_DB_NAME || '',
  password: process.env.QUEUE_DB_PASSWORD || '',
  port: process.env.QUEUE_DB_PORT ? parseInt(process.env.QUEUE_DB_PORT) : 5434
};
const queueManager = new QueueManager(queueConfig);

const strategies = {
  ready_for_payment: async (message) => {
    logger.info(`[orderHandler] Orden con productos reservados y lista para pagos orderId: ${message.payload.orderId}`);
    try {
      await OrderService.updateOrderStatus(message.payload.orderId, 'lista_para_pago');
      logger.info(`[orderHandler] Orden ${message.payload.orderId} actualizada a estado 'lista_para_pago'`);

      // Crear mensaje en la cola para iniciar el pago
      await queueManager.enqueue('create_payment', { ...message.payload });
      logger.info(`[orderHandler] Mensaje encolado con topic 'create_payment' para orderId: ${message.payload.orderId}`);
    } catch (error) {
      logger.error(`[orderHandler] Error actualizando orden ${message.payload.orderId} a 'lista_para_pago': ${error.message}`);
      throw error;
    }
  },
  product_out_of_stock: async (message) => {
    logger.info(`[orderHandler] Sin stock de productos, orden no puede pagarse: ${message.payload.orderId}`);
    try {
      await OrderService.updateOrderStatus(message.payload.orderId, 'fallida');
      logger.info(`[orderHandler] Orden ${message.payload.orderId} actualizada a estado 'fallida'`);
    } catch (error) {
      logger.error(`[orderHandler] Error actualizando orden ${message.payload.orderId} a 'fallida': ${error.message}`);
      throw error;
    }
  }
  // Puedes agregar más estrategias aquí
};

// Handler principal que despacha según el topic usando el patrón Strategy
module.exports = async function orderHandler(message) {
  const topic = (message.topic || '').trim().toLowerCase();
  const strategy = strategies[topic];
  if (typeof strategy === 'function') {
    await strategy(message);
  } else {
    logger.warn(`[orderHandler] No strategy found for topic: ${message.topic}`);
  }
};