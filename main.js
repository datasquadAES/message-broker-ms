require('dotenv').config();
const QueueProcessor = require('./src/cron/QueueProcessor');

// Iniciar el procesamiento de la cola (cron)
QueueProcessor.start();
