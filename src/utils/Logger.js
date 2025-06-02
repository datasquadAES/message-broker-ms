const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    // Configuración basada en la variable de entorno LOG_OUTPUT (console, file, both)
    this.output = process.env.LOG_OUTPUT || 'console';
    this.logFilePath = path.join(__dirname, '../../logs', `app-${this.getCurrentDate()}.log`);

    // Crea el directorio de logs si no existe
    if (this.output.includes('file') || this.output === 'both') {
      const logDir = path.dirname(this.logFilePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
  }

  // Obtiene la fecha actual en formato YYYY-MM-DD
  getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  // Formatea el mensaje del log con la fecha y hora
  formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
  }

  // Escribe un mensaje en el archivo de log
  writeToFile(message) {
    fs.appendFileSync(this.logFilePath, message + '\n', 'utf8');
  }

  // Imprime un mensaje en la consola
  writeToConsole(message) {
    console.log(message);
  }

  // Método principal para registrar logs
  log(level, message) {
    const formattedMessage = this.formatMessage(level, message);

    if (this.output === 'console' || this.output === 'both') {
      this.writeToConsole(formattedMessage);
    }

    if (this.output === 'file' || this.output === 'both') {
      this.writeToFile(formattedMessage);
    }
  }

  // Métodos específicos para diferentes niveles de log
  info(message) {
    this.log('info', message);
  }

  warn(message) {
    this.log('warn', message);
  }

  error(message) {
    this.log('error', message);
  }
}

module.exports = new Logger();