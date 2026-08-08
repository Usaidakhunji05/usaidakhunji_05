import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync("stokify.db");
  }
  return db;
}

export function initDatabase(): void {
  const database = getDb();

  database.execSync(`
    CREATE TABLE IF NOT EXISTS shops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      shopName TEXT NOT NULL,
      shopType TEXT NOT NULL DEFAULT 'General',
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shopId INTEGER NOT NULL,
      name TEXT NOT NULL,
      category TEXT DEFAULT '',
      barcode TEXT DEFAULT '',
      boxQuantity INTEGER NOT NULL DEFAULT 1,
      price REAL NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      unit TEXT DEFAULT 'pcs',
      FOREIGN KEY (shopId) REFERENCES shops(id)
    );
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shopId INTEGER NOT NULL,
      productId INTEGER NOT NULL,
      qty INTEGER NOT NULL,
      salePrice REAL NOT NULL DEFAULT 0,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (shopId) REFERENCES shops(id),
      FOREIGN KEY (productId) REFERENCES products(id)
    );
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shopId INTEGER NOT NULL,
      productId INTEGER NOT NULL,
      qty INTEGER NOT NULL,
      cost REAL NOT NULL DEFAULT 0,
      supplier TEXT DEFAULT '',
      date TEXT NOT NULL,
      FOREIGN KEY (shopId) REFERENCES shops(id),
      FOREIGN KEY (productId) REFERENCES products(id)
    );
  `);

  // Migrations — safe to run multiple times; ALTER TABLE errors on duplicate columns are swallowed
  const migrations = [
    "ALTER TABLE products ADD COLUMN boxQuantity INTEGER NOT NULL DEFAULT 1",
    "ALTER TABLE sales ADD COLUMN salePrice REAL NOT NULL DEFAULT 0",
    "ALTER TABLE products ADD COLUMN metadata TEXT DEFAULT '{}'",
    // COGS tracking
    "ALTER TABLE products ADD COLUMN costPrice REAL NOT NULL DEFAULT 0",
    "ALTER TABLE sales ADD COLUMN costPrice REAL NOT NULL DEFAULT 0",
    // Cash / Credit payment tracking
    "ALTER TABLE sales ADD COLUMN paymentType TEXT NOT NULL DEFAULT 'cash'",
    "ALTER TABLE sales ADD COLUMN customerName TEXT DEFAULT ''",
    "ALTER TABLE sales ADD COLUMN paidAt TEXT DEFAULT NULL",
    "ALTER TABLE purchases ADD COLUMN paymentType TEXT NOT NULL DEFAULT 'cash'",
    "ALTER TABLE purchases ADD COLUMN paidAt TEXT DEFAULT NULL",
  ];
  for (const sql of migrations) {
    try {
      database.execSync(sql);
    } catch {
      // Column already exists — ignore
    }
  }
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface Shop {
  id: number;
  shopName: string;
  shopType: string;
  createdAt?: string;
}

export interface Product {
  id: number;
  shopId: number;
  name: string;
  category: string;
  barcode: string;
  boxQuantity: number;
  price: number;
  costPrice: number;
  stock: number;
  unit: string;
  metadata: string;
}

export interface Sale {
  id: number;
  shopId: number;
  productId: number;
  qty: number;
  salePrice: number;
  costPrice: number;
  amount: number;
  date: string;
  /** 'cash' = settled immediately; 'credit' = deferred until paidAt is set */
  paymentType: "cash" | "credit";
  /** Name of customer — required when paymentType = 'credit' */
  customerName: string;
  /** Date credit was collected. NULL means still outstanding. */
  paidAt: string | null;
  productName?: string;
}

export interface Purchase {
  id: number;
  shopId: number;
  productId: number;
  qty: number;
  cost: number;
  supplier: string;
  date: string;
  /** 'cash' = paid immediately; 'credit' = deferred until paidAt is set */
  paymentType: "cash" | "credit";
  /** Date credit was paid. NULL means still outstanding. */
  paidAt: string | null;
  productName?: string;
}

export interface ProfitBreakdown {
  /** Total billed revenue (all sales regardless of payment status) */
  billedRevenue: number;
  /** Revenue from settled transactions only (cash + paid credit) */
  settledRevenue: number;
  /** Outstanding receivables (unpaid credit sales) */
  outstandingReceivables: number;
  /** COGS for settled transactions only */
  cogs: number;
  /** Gross profit = settledRevenue − cogs */
  grossProfit: number;
  /** grossProfit / settledRevenue × 100 */
  margin: number;
}

// ── Shops ─────────────────────────────────────────────────────────────────

export function getShops(): Shop[] {
  return getDb().getAllSync<Shop>("SELECT * FROM shops ORDER BY createdAt DESC");
}

export function createShop(shopName: string, shopType: string): void {
  getDb().runSync(
    "INSERT INTO shops (userId, shopName, shopType) VALUES (?, ?, ?)",
    ["local", shopName, shopType]
  );
}

export function deleteShop(id: number): void {
  const database = getDb();
  database.runSync("DELETE FROM sales WHERE shopId = ?", [id]);
  database.runSync("DELETE FROM purchases WHERE shopId = ?", [id]);
  database.runSync("DELETE FROM products WHERE shopId = ?", [id]);
  database.runSync("DELETE FROM shops WHERE id = ?", [id]);
}

// ── Products ──────────────────────────────────────────────────────────────

export function getProducts(shopId: number): Product[] {
  return getDb().getAllSync<Product>(
    "SELECT * FROM products WHERE shopId = ? ORDER BY name ASC",
    [shopId]
  );
}

export function searchProducts(shopId: number, query: string): Product[] {
  return getDb().getAllSync<Product>(
    "SELECT * FROM products WHERE shopId = ? AND (name LIKE ? OR category LIKE ? OR barcode LIKE ?) ORDER BY name ASC",
    [shopId, `%${query}%`, `%${query}%`, `%${query}%`]
  );
}

export function getProductsByCategory(shopId: number, category: string): Product[] {
  return getDb().getAllSync<Product>(
    "SELECT * FROM products WHERE shopId = ? AND category = ? ORDER BY name ASC",
    [shopId, category]
  );
}

export function getCategories(shopId: number): string[] {
  const rows = getDb().getAllSync<{ category: string }>(
    "SELECT DISTINCT category FROM products WHERE shopId = ? AND category != '' ORDER BY category ASC",
    [shopId]
  );
  return rows.map((r) => r.category);
}

export function getLowStockProducts(shopId: number, threshold: number = 10): Product[] {
  return getDb().getAllSync<Product>(
    "SELECT * FROM products WHERE shopId = ? AND stock <= ? ORDER BY stock ASC",
    [shopId, threshold]
  );
}

export function createProduct(product: Omit<Product, "id">): void {
  getDb().runSync(
    "INSERT INTO products (shopId, name, category, barcode, boxQuantity, price, costPrice, stock, unit, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [product.shopId, product.name, product.category, product.barcode, product.boxQuantity, product.price, product.costPrice ?? 0, product.stock, product.unit, product.metadata ?? "{}"]
  );
}

export function updateProduct(product: Product): void {
  getDb().runSync(
    "UPDATE products SET name=?, category=?, barcode=?, boxQuantity=?, price=?, costPrice=?, stock=?, unit=?, metadata=? WHERE id=?",
    [product.name, product.category, product.barcode, product.boxQuantity, product.price, product.costPrice ?? 0, product.stock, product.unit, product.metadata ?? "{}", product.id]
  );
}

export function deleteProduct(id: number): void {
  getDb().runSync("DELETE FROM products WHERE id = ?", [id]);
}

export function getProductById(id: number): Product | null {
  return getDb().getFirstSync<Product>("SELECT * FROM products WHERE id = ?", [id]) ?? null;
}

// ── Sales ─────────────────────────────────────────────────────────────────

export function createSale(sale: Omit<Sale, "id">): void {
  const database = getDb();
  const product = database.getFirstSync<{ costPrice: number }>(
    "SELECT costPrice FROM products WHERE id = ?",
    [sale.productId]
  );
  const costPrice = product?.costPrice ?? sale.costPrice ?? 0;
  database.runSync(
    `INSERT INTO sales (shopId, productId, qty, salePrice, costPrice, amount, date, paymentType, customerName, paidAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [sale.shopId, sale.productId, sale.qty, sale.salePrice, costPrice, sale.amount, sale.date,
     sale.paymentType ?? "cash", sale.customerName ?? "", sale.paidAt ?? null]
  );
  // Stock always moves immediately regardless of payment type
  database.runSync("UPDATE products SET stock = stock - ? WHERE id = ?", [sale.qty, sale.productId]);
}

export function getSaleById(id: number): Sale | null {
  return getDb().getFirstSync<Sale>(
    `SELECT s.*, p.name as productName FROM sales s
     LEFT JOIN products p ON s.productId = p.id
     WHERE s.id = ?`,
    [id]
  ) ?? null;
}

export function updateSale(sale: Sale, originalQty: number): void {
  const database = getDb();
  database.runSync("UPDATE products SET stock = stock + ? WHERE id = ?", [originalQty, sale.productId]);
  database.runSync("UPDATE products SET stock = stock - ? WHERE id = ?", [sale.qty, sale.productId]);
  const product = database.getFirstSync<{ costPrice: number }>(
    "SELECT costPrice FROM products WHERE id = ?",
    [sale.productId]
  );
  const costPrice = product?.costPrice ?? sale.costPrice ?? 0;
  database.runSync(
    `UPDATE sales SET qty=?, salePrice=?, costPrice=?, amount=?, date=?,
     paymentType=?, customerName=?, paidAt=? WHERE id=?`,
    [sale.qty, sale.salePrice, costPrice, sale.amount, sale.date,
     sale.paymentType ?? "cash", sale.customerName ?? "", sale.paidAt ?? null, sale.id]
  );
}

export function deleteSale(id: number): void {
  const database = getDb();
  const sale = database.getFirstSync<{ productId: number; qty: number }>(
    "SELECT productId, qty FROM sales WHERE id = ?",
    [id]
  );
  if (sale) {
    database.runSync("UPDATE products SET stock = stock + ? WHERE id = ?", [sale.qty, sale.productId]);
  }
  database.runSync("DELETE FROM sales WHERE id = ?", [id]);
}

export function getSales(shopId: number, limit: number = 100): Sale[] {
  return getDb().getAllSync<Sale>(
    `SELECT s.*, p.name as productName FROM sales s
     LEFT JOIN products p ON s.productId = p.id
     WHERE s.shopId = ? ORDER BY s.date DESC, s.id DESC LIMIT ?`,
    [shopId, limit]
  );
}

/** Credit sales that have NOT been paid yet (outstanding receivables). */
export function getCreditSales(shopId: number): Sale[] {
  return getDb().getAllSync<Sale>(
    `SELECT s.*, p.name as productName FROM sales s
     LEFT JOIN products p ON s.productId = p.id
     WHERE s.shopId = ? AND s.paymentType = 'credit' AND s.paidAt IS NULL
     ORDER BY s.date DESC, s.id DESC`,
    [shopId]
  );
}

/** Mark a credit sale as settled (payment received). */
export function settleCreditSale(id: number, paidAt: string): void {
  getDb().runSync("UPDATE sales SET paidAt = ? WHERE id = ?", [paidAt, id]);
}

export function getTodayTotal(shopId: number): number {
  const today = new Date().toISOString().split("T")[0];
  const result = getDb().getFirstSync<{ total: number }>(
    "SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE shopId = ? AND date = ?",
    [shopId, today]
  );
  return result?.total ?? 0;
}

export function getMonthTotal(shopId: number): number {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const result = getDb().getFirstSync<{ total: number }>(
    "SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE shopId = ? AND strftime('%Y-%m', date) = ?",
    [shopId, yearMonth]
  );
  return result?.total ?? 0;
}

// ── Purchases ─────────────────────────────────────────────────────────────

export function createPurchase(purchase: Omit<Purchase, "id">): void {
  const database = getDb();
  database.runSync(
    `INSERT INTO purchases (shopId, productId, qty, cost, supplier, date, paymentType, paidAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [purchase.shopId, purchase.productId, purchase.qty, purchase.cost, purchase.supplier,
     purchase.date, purchase.paymentType ?? "cash", purchase.paidAt ?? null]
  );
  // Stock always moves immediately
  database.runSync("UPDATE products SET stock = stock + ? WHERE id = ?", [purchase.qty, purchase.productId]);
  database.runSync("UPDATE products SET costPrice = ? WHERE id = ?", [purchase.cost, purchase.productId]);
}

export function getPurchaseById(id: number): Purchase | null {
  return getDb().getFirstSync<Purchase>(
    `SELECT p.*, pr.name as productName FROM purchases p
     LEFT JOIN products pr ON p.productId = pr.id
     WHERE p.id = ?`,
    [id]
  ) ?? null;
}

export function updatePurchase(purchase: Purchase, originalQty: number): void {
  const database = getDb();
  database.runSync("UPDATE products SET stock = stock - ? WHERE id = ?", [originalQty, purchase.productId]);
  database.runSync("UPDATE products SET stock = stock + ? WHERE id = ?", [purchase.qty, purchase.productId]);
  database.runSync(
    `UPDATE purchases SET qty=?, cost=?, supplier=?, date=?, paymentType=?, paidAt=? WHERE id=?`,
    [purchase.qty, purchase.cost, purchase.supplier, purchase.date,
     purchase.paymentType ?? "cash", purchase.paidAt ?? null, purchase.id]
  );
  database.runSync("UPDATE products SET costPrice = ? WHERE id = ?", [purchase.cost, purchase.productId]);
}

export function deletePurchase(id: number): void {
  const database = getDb();
  const purchase = database.getFirstSync<{ productId: number; qty: number }>(
    "SELECT productId, qty FROM purchases WHERE id = ?",
    [id]
  );
  if (purchase) {
    database.runSync("UPDATE products SET stock = stock - ? WHERE id = ?", [purchase.qty, purchase.productId]);
  }
  database.runSync("DELETE FROM purchases WHERE id = ?", [id]);
}

export function getPurchases(shopId: number, limit: number = 100): Purchase[] {
  return getDb().getAllSync<Purchase>(
    `SELECT p.*, pr.name as productName FROM purchases p
     LEFT JOIN products pr ON p.productId = pr.id
     WHERE p.shopId = ? ORDER BY p.date DESC, p.id DESC LIMIT ?`,
    [shopId, limit]
  );
}

/** Credit purchases that have NOT been paid yet (outstanding payables). */
export function getCreditPurchases(shopId: number): Purchase[] {
  return getDb().getAllSync<Purchase>(
    `SELECT p.*, pr.name as productName FROM purchases p
     LEFT JOIN products pr ON p.productId = pr.id
     WHERE p.shopId = ? AND p.paymentType = 'credit' AND p.paidAt IS NULL
     ORDER BY p.date DESC, p.id DESC`,
    [shopId]
  );
}

/** Mark a credit purchase as settled (payment made to supplier). */
export function settleCreditPurchase(id: number, paidAt: string): void {
  getDb().runSync("UPDATE purchases SET paidAt = ? WHERE id = ?", [paidAt, id]);
}

export function getTotalPurchaseCost(shopId: number): number {
  const result = getDb().getFirstSync<{ total: number }>(
    "SELECT COALESCE(SUM(cost * qty), 0) as total FROM purchases WHERE shopId = ?",
    [shopId]
  );
  return result?.total ?? 0;
}

/** Total unpaid credit sales (money customers owe you). */
export function getOutstandingReceivables(shopId: number): number {
  const result = getDb().getFirstSync<{ total: number }>(
    "SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE shopId = ? AND paymentType = 'credit' AND paidAt IS NULL",
    [shopId]
  );
  return result?.total ?? 0;
}

/** Total unpaid credit purchases (money you owe suppliers). */
export function getOutstandingPayables(shopId: number): number {
  const result = getDb().getFirstSync<{ total: number }>(
    "SELECT COALESCE(SUM(cost * qty), 0) as total FROM purchases WHERE shopId = ? AND paymentType = 'credit' AND paidAt IS NULL",
    [shopId]
  );
  return result?.total ?? 0;
}

// ── Reports ───────────────────────────────────────────────────────────────

export function getDailySalesReport(
  shopId: number
): { date: string; total: number; profit: number; cogs: number; count: number }[] {
  return getDb().getAllSync<{ date: string; total: number; profit: number; cogs: number; count: number }>(
    `SELECT
       date,
       COALESCE(SUM(amount), 0) as total,
       COALESCE(SUM(qty * costPrice), 0) as cogs,
       COALESCE(SUM(amount) - SUM(qty * costPrice), 0) as profit,
       COUNT(*) as count
     FROM sales WHERE shopId = ?
     AND (paymentType = 'cash' OR paidAt IS NOT NULL)
     GROUP BY date ORDER BY date DESC LIMIT 30`,
    [shopId]
  );
}

export function getMonthlySalesReport(
  shopId: number
): { month: string; total: number; profit: number; cogs: number; count: number }[] {
  return getDb().getAllSync<{ month: string; total: number; profit: number; cogs: number; count: number }>(
    `SELECT
       strftime('%Y-%m', date) as month,
       COALESCE(SUM(amount), 0) as total,
       COALESCE(SUM(qty * costPrice), 0) as cogs,
       COALESCE(SUM(amount) - SUM(qty * costPrice), 0) as profit,
       COUNT(*) as count
     FROM sales WHERE shopId = ?
     AND (paymentType = 'cash' OR paidAt IS NOT NULL)
     GROUP BY month ORDER BY month DESC LIMIT 12`,
    [shopId]
  );
}

export function getDailyPurchasesReport(shopId: number): { date: string; total: number; count: number }[] {
  return getDb().getAllSync<{ date: string; total: number; count: number }>(
    `SELECT date, SUM(cost * qty) as total, COUNT(*) as count
     FROM purchases WHERE shopId = ? GROUP BY date ORDER BY date DESC LIMIT 30`,
    [shopId]
  );
}

export function getStockValue(shopId: number): number {
  const result = getDb().getFirstSync<{ value: number }>(
    "SELECT COALESCE(SUM(stock * boxQuantity * price), 0) as value FROM products WHERE shopId = ?",
    [shopId]
  );
  return result?.value ?? 0;
}

/**
 * Net profit — cash-basis: only cash sales + settled credit sales.
 * Formula: settledRevenue − COGS(settled)
 */
export function getProfit(shopId: number): number {
  const result = getDb().getFirstSync<{ revenue: number; cogs: number }>(
    `SELECT
       COALESCE(SUM(amount), 0)          as revenue,
       COALESCE(SUM(qty * costPrice), 0) as cogs
     FROM sales
     WHERE shopId = ? AND (paymentType = 'cash' OR paidAt IS NOT NULL)`,
    [shopId]
  );
  return (result?.revenue ?? 0) - (result?.cogs ?? 0);
}

export function getProfitBreakdown(shopId: number): ProfitBreakdown {
  const settled = getDb().getFirstSync<{ revenue: number; cogs: number }>(
    `SELECT
       COALESCE(SUM(amount), 0)          as revenue,
       COALESCE(SUM(qty * costPrice), 0) as cogs
     FROM sales
     WHERE shopId = ? AND (paymentType = 'cash' OR paidAt IS NOT NULL)`,
    [shopId]
  );
  const billed = getDb().getFirstSync<{ total: number }>(
    "SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE shopId = ?",
    [shopId]
  );
  const settledRevenue = settled?.revenue ?? 0;
  const cogs = settled?.cogs ?? 0;
  const billedRevenue = billed?.total ?? 0;
  const grossProfit = settledRevenue - cogs;
  const margin = settledRevenue > 0 ? (grossProfit / settledRevenue) * 100 : 0;
  return {
    billedRevenue,
    settledRevenue,
    outstandingReceivables: billedRevenue - settledRevenue,
    cogs,
    grossProfit,
    margin,
  };
}

export function getTodayProfit(shopId: number): number {
  const today = new Date().toISOString().split("T")[0];
  const result = getDb().getFirstSync<{ revenue: number; cogs: number }>(
    `SELECT
       COALESCE(SUM(amount), 0)          as revenue,
       COALESCE(SUM(qty * costPrice), 0) as cogs
     FROM sales
     WHERE shopId = ? AND date = ? AND (paymentType = 'cash' OR paidAt IS NOT NULL)`,
    [shopId, today]
  );
  return (result?.revenue ?? 0) - (result?.cogs ?? 0);
}

export function getMonthProfit(shopId: number): number {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const result = getDb().getFirstSync<{ revenue: number; cogs: number }>(
    `SELECT
       COALESCE(SUM(amount), 0)          as revenue,
       COALESCE(SUM(qty * costPrice), 0) as cogs
     FROM sales
     WHERE shopId = ? AND strftime('%Y-%m', date) = ?
       AND (paymentType = 'cash' OR paidAt IS NOT NULL)`,
    [shopId, yearMonth]
  );
  return (result?.revenue ?? 0) - (result?.cogs ?? 0);
}

export function getTotalProducts(shopId: number): number {
  const result = getDb().getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM products WHERE shopId = ?",
    [shopId]
  );
  return result?.count ?? 0;
}

export function getTotalStock(shopId: number): number {
  const result = getDb().getFirstSync<{ total: number }>(
    "SELECT COALESCE(SUM(stock), 0) as total FROM products WHERE shopId = ?",
    [shopId]
  );
  return result?.total ?? 0;
}

export function getLowStockCount(shopId: number, threshold: number = 10): number {
  const result = getDb().getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM products WHERE shopId = ? AND stock <= ?",
    [shopId, threshold]
  );
  return result?.count ?? 0;
}

// ── CSV Export ────────────────────────────────────────────────────────────

function csvField(value: string | number | null | undefined): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const header = headers.map(csvField).join(",");
  const body = rows.map((r) => r.map(csvField).join(",")).join("\n");
  return header + "\n" + body;
}

export function exportSalesCSV(shopId: number): string {
  const sales = getDb().getAllSync<Sale & { productName: string }>(
    `SELECT s.*, p.name as productName FROM sales s
     LEFT JOIN products p ON s.productId = p.id
     WHERE s.shopId = ? ORDER BY s.date DESC`,
    [shopId]
  );
  return buildCSV(
    ["Date", "Product", "Customer", "Qty", "Sale Price", "Cost Price", "Revenue", "Profit", "Payment", "Paid Date"],
    sales.map((s) => {
      const revenue = s.amount;
      const cogs = s.qty * (s.costPrice ?? 0);
      const settled = s.paymentType === "cash" || s.paidAt;
      return [
        s.date, s.productName ?? "Unknown", s.customerName ?? "",
        s.qty, s.salePrice ?? 0, s.costPrice ?? 0,
        revenue, settled ? (revenue - cogs).toFixed(2) : "pending",
        s.paymentType, s.paidAt ?? "outstanding",
      ];
    })
  );
}

export function exportPurchasesCSV(shopId: number): string {
  const purchases = getDb().getAllSync<Purchase & { productName: string }>(
    `SELECT p.*, pr.name as productName FROM purchases p
     LEFT JOIN products pr ON p.productId = pr.id
     WHERE p.shopId = ? ORDER BY p.date DESC`,
    [shopId]
  );
  return buildCSV(
    ["Date", "Product", "Supplier", "Qty", "Cost Per Unit", "Total Cost", "Payment", "Paid Date"],
    purchases.map((p) => [
      p.date, p.productName ?? "Unknown", p.supplier,
      p.qty, p.cost, p.cost * p.qty,
      p.paymentType, p.paidAt ?? "outstanding",
    ])
  );
}

export function exportProductsCSV(shopId: number): string {
  const products = getDb().getAllSync<Product>(
    "SELECT * FROM products WHERE shopId = ? ORDER BY name ASC",
    [shopId]
  );
  return buildCSV(
    ["Name", "Category", "Barcode", "Box Qty", "Sale Price/Piece", "Cost Price/Piece", "Price/Box", "Stock", "Unit"],
    products.map((p) => [
      p.name, p.category, p.barcode, p.boxQuantity,
      p.price, p.costPrice ?? 0, (p.boxQuantity * p.price).toFixed(2),
      p.stock, p.unit,
    ])
  );
}
