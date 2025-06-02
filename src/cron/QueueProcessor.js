const QueueManager = require('@oerazoo/commons-ms').QueueManager;
const SagaOrchestrator = require('../saga/SagaOrchestrator');
const logger = require('../utils/Logger');

// Configuración de la base de datos para la cola (ajusta según tu entorno)
const queueConfig = {
  user: process.env.QUEUE_DB_USER || '',
  host: process.env.QUEUE_DB_HOST || '',
  database: process.env.QUEUE_DB_NAME || '',
  password: process.env.QUEUE_DB_PASSWORD || '',
  port: process.env.QUEUE_DB_PORT ? parseInt(process.env.QUEUE_DB_PORT) : 5434,
  ssl: { require: true, rejectUnauthorized: false },
  schema: 'ph_queue'
};
const queueManager = new QueueManager(queueConfig);

// Define los topics que quieres procesar
const topicsToProcess = [
  'reserve_inventory',
  'release_product',
  'ready_for_payment',
  'product_out_of_stock',
  'create_payment'
];
const microservice = process.env.MICROSERVICE_NAME || 'message-broker';

async function processQueue() {
  for (const topic of topicsToProcess) {
    const messages = await queueManager.fetchPendingMessages(microservice, topic, 10);
    for (const message of messages) {
      try {
        logger.info(`[QueueProcessor] Procesando mensaje ID: ${message.id} | Topic: ${message.topic}`);
        await SagaOrchestrator.handleMessage(message);
        await queueManager.markAsDone(message.id);
      } catch (error) {
        if (message.retries < message.max_retries) {
          await queueManager.retryMessage(message.id);
        } else {
          await queueManager.markAsError(message.id, error.message);
          logger.error(`[QueueProcessor] Mensaje ID: ${message.id} marcado como error tras agotar reintentos.`);
        }
      }
    }
  }
}

function start() {
  setInterval(processQueue, 5000); // Procesa la cola cada 5 segundos
}

module.exports = { start };
