/**
 * Financial calculation helper for Green Line Store (EGP)
 * Uses integer piastres/cents arithmetic to prevent IEEE 754 floating point rounding errors.
 */

// 1 EGP = 100 Piastres (قروش)
const CENTS_PER_EGP = 100;

/**
 * Convert EGP amount to integer Piastres (cents)
 * @param {number|string} amount - Amount in EGP
 * @returns {number} Integer Piastres / Cents
 */
export const toCents = (amount) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num) || !isFinite(num)) {
    throw new TypeError(`Invalid financial amount: ${amount}`);
  }
  return Math.round(num * CENTS_PER_EGP);
};

/**
 * Convert Piastres / cents back to EGP (floating point with 2 decimals)
 * @param {number} cents - Integer Piastres / cents
 * @returns {number} EGP amount
 */
export const fromCents = (cents) => {
  return Math.round(cents) / CENTS_PER_EGP;
};

// Backwards compatibility aliases
export const toHalalas = toCents;
export const fromHalalas = fromCents;
export const toPiastres = toCents;
export const fromPiastres = fromCents;

/**
 * Format EGP amount to 2 decimal string (e.g. "1500.00")
 * @param {number|string} amount
 * @returns {string}
 */
export const formatEGPString = (amount) => {
  return fromCents(toCents(amount)).toFixed(2);
};

export const formatSARString = formatEGPString;

/**
 * Calculate item total in EGP safely
 * @param {number} unitPrice - EGP unit price
 * @param {number} qty - Integer quantity
 * @returns {number} EGP amount
 */
export const calculateItemTotal = (unitPrice, qty) => {
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new Error(`Invalid item quantity: ${qty}`);
  }
  const itemCents = toCents(unitPrice) * qty;
  return fromCents(itemCents);
};

/**
 * Calculate order total in EGP from items
 * @param {Array<{ price: number, qty: number }>} items
 * @returns {number} EGP order total
 */
export const calculateOrderTotal = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return 0;
  }
  const totalCents = items.reduce((sum, item) => {
    return sum + (toCents(item.price) * item.qty);
  }, 0);
  return fromCents(totalCents);
};
