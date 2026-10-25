/**
 * Financial calculation helper for Green Line Store (SAR)
 * Uses integer halalas arithmetic to prevent IEEE 754 floating point rounding errors.
 */

// 1 SAR = 100 Halalas
const HALALAS_PER_SAR = 100;

/**
 * Convert SAR amount to integer Halalas
 * @param {number|string} amount - Amount in SAR
 * @returns {number} Integer Halalas
 */
export const toHalalas = (amount) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num) || !isFinite(num)) {
    throw new TypeError(`Invalid financial amount: ${amount}`);
  }
  return Math.round(num * HALALAS_PER_SAR);
};

/**
 * Convert Halalas back to SAR (floating point with 2 decimals)
 * @param {number} halalas - Integer Halalas
 * @returns {number} SAR amount
 */
export const fromHalalas = (halalas) => {
  return Math.round(halalas) / HALALAS_PER_SAR;
};

/**
 * Format SAR amount to 2 decimal string (e.g. "1500.00")
 * @param {number|string} amount
 * @returns {string}
 */
export const formatSARString = (amount) => {
  return fromHalalas(toHalalas(amount)).toFixed(2);
};

/**
 * Calculate item total in SAR safely
 * @param {number} unitPrice - SAR unit price
 * @param {number} qty - Integer quantity
 * @returns {number} SAR amount
 */
export const calculateItemTotal = (unitPrice, qty) => {
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new Error(`Invalid item quantity: ${qty}`);
  }
  const itemHalalas = toHalalas(unitPrice) * qty;
  return fromHalalas(itemHalalas);
};

/**
 * Calculate order total in SAR from items
 * @param {Array<{ price: number, qty: number }>} items
 * @returns {number} SAR order total
 */
export const calculateOrderTotal = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return 0;
  }
  const totalHalalas = items.reduce((sum, item) => {
    return sum + (toHalalas(item.price) * item.qty);
  }, 0);
  return fromHalalas(totalHalalas);
};
