// Web stub — SQLite is not available on web.
// The real implementation is in db.ts and runs on iOS/Android.

export interface LocalUser {
  id: number;
  name: string;
  email: string;
}

export function createUser(_name: string, _email: string, _password: string): LocalUser {
  throw new Error("SQLite not available on web.");
}
export function verifyUser(_email: string, _password: string): LocalUser {
  throw new Error("SQLite not available on web.");
}
export function getUserByEmail(_email: string): LocalUser | null { return null; }
export function updateUserPassword(_email: string, _newPassword: string): void {}

export interface Shop {
  id: number;
  userId: string;
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
  price: number;
  stock: number;
  unit: string;
}

export interface Sale {
  id: number;
  shopId: number;
  productId: number;
  qty: number;
  amount: number;
  date: string;
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
  productName?: string;
}

export function initDatabase(): void {}

export function getShops(_userId: string): Shop[] { return []; }
export function createShop(_userId: string, _shopName: string, _shopType: string): void {}
export function deleteShop(_id: number): void {}

export function getProducts(_shopId: number): Product[] { return []; }
export function searchProducts(_shopId: number, _query: string): Product[] { return []; }
export function getLowStockProducts(_shopId: number, _threshold?: number): Product[] { return []; }
export function createProduct(_product: Omit<Product, "id">): void {}
export function updateProduct(_product: Product): void {}
export function deleteProduct(_id: number): void {}
export function getProductById(_id: number): Product | null { return null; }

export function createSale(_sale: Omit<Sale, "id">): void {}
export function getSales(_shopId: number, _limit?: number): Sale[] { return []; }
export function getTodayTotal(_shopId: number): number { return 0; }
export function getMonthTotal(_shopId: number): number { return 0; }

export function createPurchase(_purchase: Omit<Purchase, "id">): void {}
export function getPurchases(_shopId: number, _limit?: number): Purchase[] { return []; }

export function getDailySalesReport(_shopId: number): { date: string; total: number; count: number }[] { return []; }
export function getMonthlySalesReport(_shopId: number): { month: string; total: number; count: number }[] { return []; }
export function getStockValue(_shopId: number): number { return 0; }
export function getProfit(_shopId: number): number { return 0; }
export function getTotalProducts(_shopId: number): number { return 0; }
export function getTotalStock(_shopId: number): number { return 0; }
export function getLowStockCount(_shopId: number, _threshold?: number): number { return 0; }
export function exportSalesCSV(_shopId: number): string { return "Date,Product,Qty,Amount\n"; }
export function exportPurchasesCSV(_shopId: number): string { return "Date,Product,Qty,Cost,Supplier\n"; }
