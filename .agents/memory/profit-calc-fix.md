---
name: Profit calculation fix
description: How net profit is correctly calculated in stokify — what changed and why.
---

## The rule

Net profit = SUM(sales.amount) − SUM(sales.qty × sales.costPrice)

Do NOT subtract total purchase spend from total sales revenue — that is a cash-flow figure, not profit.

**Why:** The old formula deducted ALL purchases ever made, so buying unsold stock made profit go deeply negative even when every sold item had a healthy margin. Two shopkeepers with identical sales but different reorder sizes would show wildly different "profits."

**How to apply:**
- `sales.costPrice` is a snapshot taken at insert/update time from `products.costPrice`.
- `products.costPrice` is kept current by `createPurchase` / `updatePurchase` (set to the purchase's `cost` per unit).
- Always compute COGS from `sales` rows, never from `purchases` rows.
- New functions available: `getProfit`, `getProfitBreakdown`, `getTodayProfit`, `getMonthProfit`.
