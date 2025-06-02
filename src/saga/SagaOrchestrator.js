const orderHandler = require('./handlers/orderHandler');
const productHandler = require('./handlers/productHandler');
const paymentHandler = require('./handlers/paymentHandler');

const handlers = {
  'reserve_inventory': productHandler,
  'release_product': productHandler,
  'ready_for_payment': orderHandler,
  'product_out_of_stock': orderHandler,
  'create_payment': paymentHandler
};

async function handleMessage(message) {
  const { topic } = message;
  if (handlers[topic]) {
    await handlers[topic](message);
  } else {
    console.warn(`No handler for topic: ${topic}`);
  }
}

module.exports = { handleMessage };