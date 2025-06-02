const axios = require('axios');
const logger = require('../utils/Logger');

const PRODUCTS_MS_URL = process.env.PRODUCTS_MS_URL || 'http://localhost:3001';

class ProductService {
  static async reserveProducts(items) {
    try {
      for (const item of items) {
        await axios.post(`${PRODUCTS_MS_URL}/products/${item.product_id}/reserve`, { quantity: item.quantity });
      }
      return { success: true };
    } catch (error) {
      logger.error(`[ProductService] Error reservando productos: ${error.message}`);
      throw error;
    }
  }

  static async releaseProducts(items) {
    try {
      for (const item of items) {
        await axios.post(`${PRODUCTS_MS_URL}/products/${item.product_id}/release`, { quantity: item.quantity });
      }
      return { success: true };
    } catch (error) {
      logger.error(`[ProductService] Error liberando productos: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ProductService;