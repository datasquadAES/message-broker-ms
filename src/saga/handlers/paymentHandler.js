const { QueueManager } = require('@oerazoo/commons-ms');
const logger = require('../../utils/Logger');
const PaymentsService = require('../../services/PaymentsService');
const { v4: uuidv4 } = require('uuid'); // Agrega esta línea al inicio del archivo

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

// Estrategias para cada tipo de mensaje relacionado a pagos
const strategies = {
  create_payment: async (message) => {
    logger.info(`[paymentHandler] Procesando creación de pago para orderId: ${message.payload.orderId}`);
    try {
      // Llamar al microservicio de pagos para crear el pago
      const paymentPayload = {
        order_id: message.payload.orderId,
        user_id: message.payload.user_id,
        amount: message.payload.total,
        //amount: null,
        status: 'pendiente',
        payment_method: message.payload.payment_method || null,
        transaction_id: uuidv4() // Genera un UID único para el transaction_id
      };
      await PaymentsService.createPayment(paymentPayload);

      logger.info(`[paymentHandler] Pago creado exitosamente para orderId: ${message.payload.orderId}. Encolando 'payment_in_progress'.`);
    } catch (error) {
      console.error(`[paymentHandler] Error al crear pago para orderId: ${message.payload.orderId}: ${error}`)
      logger.warn(`[paymentHandler] Error al crear pago para orderId: ${message.payload.orderId}. Encolando 'release_product'.`);
      await queueManager.enqueue(
        'release_product',
        { ...message.payload }
      );
    }
  }
  // Puedes agregar más estrategias aquí
};

// Handler principal que despacha según el topic usando el patrón Strategy
module.exports = async function paymentHandler(message) {
  const topic = (message.topic || '').trim().toLowerCase();
  const strategy = strategies[topic];
  if (typeof strategy === 'function') {
    await strategy(message);
  } else {
    logger.warn(`[paymentHandler] No strategy found for topic: ${message.topic}`);
  }
};
