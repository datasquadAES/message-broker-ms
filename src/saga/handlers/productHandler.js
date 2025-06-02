const ProductService = require('../../services/ProductService');
const { QueueManager } = require('@oerazoo/commons-ms');
const logger = require('../../utils/Logger');

// Configuración de la base de datos para la cola (ajusta según tu entorno)
const queueConfig = {
  user: process.env.QUEUE_DB_USER || '',
  host: process.env.QUEUE_DB_HOST || '',
  database: process.env.QUEUE_DB_NAME || '',
  password: process.env.QUEUE_DB_PASSWORD || '',
  port: process.env.QUEUE_DB_PORT ? parseInt(process.env.QUEUE_DB_PORT) : 5434,
  ssl: { require: true, rejectUnauthorized: false }
};
const queueManager = new QueueManager(queueConfig);

// Estrategias para cada tipo de mensaje relacionado a productos
const strategies = {
  reserve_inventory: async (message) => {
    logger.info(`[productHandler] Reservando productos para orderId: ${message.payload.orderId}`);
    try {
      const result = await ProductService.reserveProducts(message.payload.items);
      logger.info(`[productHandler] Reserva exitosa para orderId: ${message.payload.orderId}. Encolando 'ready_for_payment'.`);
      await queueManager.enqueue(
        'ready_for_payment',
        { ...message.payload }
      );
    } catch (error) {
      // Si es un error 400 de axios, tratamos como reserva fallida
      if (error.response && error.response.status === 400) {
        logger.warn(`[productHandler] Reserva fallida (400) para orderId: ${message.payload.orderId}. Encolando 'product_out_of_stock'.`);
        await queueManager.enqueue(
          'product_out_of_stock',
          { ...message.payload, error: error.message }
        );
        return; // No lanzamos el error para evitar reintentos innecesarios
      } else {
        logger.error(`[productHandler] Error reservando productos para orderId: ${message.payload.orderId}: ${error.message}`);
        throw error; // Deja que el sistema de reintentos maneje otros errores
      }
    }
  },
  release_product: async (message) => {
    logger.info(`[productHandler] Liberando productos para orderId: ${message.payload.orderId}`);
    try {
      await ProductService.releaseProducts(message.payload.items);
      logger.info(`[productHandler] Productos liberados exitosamente para orderId: ${message.payload.orderId}`);
    } catch (error) {
      logger.error(`[productHandler] Error liberando productos para orderId: ${message.payload.orderId}: ${error.message}`);
      throw error; // Permite reintentos si ocurre un error real
    }
  }
};

// Handler principal que despacha según el topic usando el patrón Strategy
module.exports = async function productHandler(message) {
  const topic = (message.topic || '').trim().toLowerCase();
  const strategy = strategies[topic];
  if (typeof strategy === 'function') {
    await strategy(message);
  } else {
    logger.warn(`[productHandler] No strategy found for topic: ${message.topic}`);
  }
};
