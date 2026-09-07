const REQUIRED_COLUMNS = ['sku', 'name', 'currency', 'unit_price', 'min_order_qty'];
const ISO_CURRENCIES = new Set(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SGD', 'HKD']);

function issue(code, message, field, value) {
  return { code, message, ...(field ? { field } : {}), ...(value !== undefined ? { value } : {}) };
}

function numberValue(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value.trim().replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

export function validatePriceList(rows, options = {}) {
  const normalizedRows = rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [String(key).trim().toLowerCase().replace(/\\s+/g, '_'), typeof value === 'string' ? value.trim() : value])));
  const columns = new Set(normalizedRows.flatMap((row) => Object.keys(row)));
  const missing = REQUIRED_COLUMNS.filter((column) => !columns.has(column));
  if (missing.length) return { status: 'rejected', summary: { total: normalizedRows.length, accepted: 0, rejected: normalizedRows.length }, issues: missing.map((column) => issue('MISSING_COLUMN', 'Required column is missing', column)), accepted: [], rejected: normalizedRows };

  const seen = new Map();
  const accepted = [];
  const rejected = [];
  const warnings = [];
  const maxPriceRatio = options.maxPriceRatio ?? 10;
  normalizedRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const sku = String(row.sku ?? '').trim();
    const name = String(row.name ?? '').trim();
    const currency = String(row.currency ?? '').trim().toUpperCase();
    const price = numberValue(row.unit_price);
    const moq = numberValue(row.min_order_qty);
    const issues = [];
    if (!sku) issues.push(issue('MISSING_SKU', 'SKU is required', 'sku'));
    if (!name) issues.push(issue('MISSING_NAME', 'Product name is required', 'name'));
    if (!ISO_CURRENCIES.has(currency)) issues.push(issue('INVALID_CURRENCY', 'Currency is not supported', 'currency', currency));
    if (price === null) issues.push(issue('INVALID_PRICE', 'Unit price must be numeric', 'unit_price', row.unit_price));
    else if (price <= 0) issues.push(issue('NON_POSITIVE_PRICE', 'Unit price must be greater than zero', 'unit_price', price));
    if (moq === null) issues.push(issue('INVALID_MOQ', 'Minimum order quantity must be numeric', 'min_order_qty', row.min_order_qty));
    else if (moq <= 0) issues.push(issue('NON_POSITIVE_MOQ', 'Minimum order quantity must be greater than zero', 'min_order_qty', moq));
    if (sku && seen.has(sku)) issues.push(issue('DUPLICATE_SKU', 'SKU already appeared on row ' + seen.get(sku), 'sku', sku));
    else if (sku) seen.set(sku, rowNumber);
    const previous = options.previousPrices?.[sku];
    if (price !== null && previous > 0 && Math.max(price, previous) / Math.min(price, previous) >= maxPriceRatio) warnings.push({ rowNumber, code: 'PRICE_OUTLIER', sku, previous, price });
    const normalized = { ...row, sku, name, currency, unit_price: price, min_order_qty: moq };
    if (issues.length) rejected.push({ rowNumber, row: normalized, issues });
    else accepted.push({ rowNumber, row: normalized });
  });
  return { status: rejected.length ? 'needs_review' : 'accepted', summary: { total: normalizedRows.length, accepted: accepted.length, rejected: rejected.length, warningCount: warnings.length }, issues: [], accepted, rejected, warnings, policy: { requiredColumns: REQUIRED_COLUMNS, maxPriceRatio } };
}
