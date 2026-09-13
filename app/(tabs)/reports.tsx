import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  TextInput,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useShop } from "@/context/ShopContext";
import { StatsCard } from "@/components/StatsCard";
import {
  getDailySalesReport,
  getMonthlySalesReport,
  getDailyPurchasesReport,
  getStockValue,
  getProfitBreakdown,
  getTotalPurchaseCost,
  getTodayTotal,
  getTodayProfit,
  getMonthTotal,
  getMonthProfit,
  getOutstandingReceivables,
  getOutstandingPayables,
  getTotalExpenses,
  getExpenses,
  createExpense,
  deleteExpense,
} from "@/lib/db";

type ReportTab = "sales" | "purchases";
type PeriodTab = "daily" | "monthly";

export default function ReportsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedShop } = useShop();
  const [refreshing, setRefreshing] = useState(false);
  const [, setTick] = useState(0);
  const [reportTab, setReportTab] = useState<ReportTab>("sales");
  const [periodTab, setPeriodTab] = useState<PeriodTab>("daily");
  const [expenseModal, setExpenseModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Other");
  const [expenseDescription, setExpenseDescription] = useState("");

  const shopId = selectedShop?.id ?? 0;
  const dailySales = shopId ? getDailySalesReport(shopId) : [];
  const monthlySales = shopId ? getMonthlySalesReport(shopId) : [];
  const dailyPurchases = shopId ? getDailyPurchasesReport(shopId) : [];
  const stockValue = shopId ? getStockValue(shopId) : 0;
  const breakdown = shopId
    ? getProfitBreakdown(shopId)
    : { billedRevenue: 0, settledRevenue: 0, outstandingReceivables: 0, cogs: 0, grossProfit: 0, expenses: 0, netProfit: 0, margin: 0 };
  const totalPurchaseCost = shopId ? getTotalPurchaseCost(shopId) : 0;
  const todayTotal = shopId ? getTodayTotal(shopId) : 0;
  const todayProfit = shopId ? getTodayProfit(shopId) : 0;
  const monthTotal = shopId ? getMonthTotal(shopId) : 0;
  const monthProfit = shopId ? getMonthProfit(shopId) : 0;
  const outstandingReceivables = shopId ? getOutstandingReceivables(shopId) : 0;
  const outstandingPayables = shopId ? getOutstandingPayables(shopId) : 0;
  const totalExpenses = shopId ? getTotalExpenses(shopId) : 0;
  const recentExpenses = shopId ? getExpenses(shopId, 20) : [];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTick((t) => t + 1);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleAddExpense = () => {
    if (!shopId) { Alert.alert("No Shop", "Select a shop first."); return; }
    const amount = Number(expenseAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert("Invalid amount", "Enter an expense amount greater than 0.");
      return;
    }
    createExpense({
      shopId,
      category: expenseCategory.trim() || "Other",
      description: expenseDescription.trim(),
      amount,
      date: new Date().toISOString().split("T")[0],
    });
    setExpenseAmount(""); setExpenseCategory("Other"); setExpenseDescription("");
    setExpenseModal(false);
    setTick((t) => t + 1);
  };

  const handleDeleteExpense = (id: number) => {
    Alert.alert("Delete Expense", "Remove this expense? Net profit will increase by this amount.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { deleteExpense(id); setTick((t) => t + 1); } },
    ]);
  };

  const handleReportPdf = async () => {
    if (!shopId) { Alert.alert("No Shop", "Select a shop first."); return; }
    const rows = recentExpenses.map((e) => `<tr><td>${e.date}</td><td>${e.category}</td><td>${e.description || "-"}</td><td>₹${e.amount.toFixed(2)}</td></tr>`).join("");
    const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><style>body{font-family:Arial;color:#111827;padding:20px}h1{text-align:center}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left}td:last-child,th:last-child{text-align:right}.box{padding:12px;background:#f3f4f6;border-radius:8px;margin:10px 0}.profit{font-size:20px;font-weight:bold}</style></head><body><h1>${selectedShop?.shopName || "ShelfFlow"}</h1><p style="text-align:center">Business Report</p><div class="box">Settled Revenue: ₹${breakdown.settledRevenue.toFixed(2)}<br/>Cost of Goods: ₹${breakdown.cogs.toFixed(2)}<br/>Gross Profit: ₹${breakdown.grossProfit.toFixed(2)}<br/>Expenses: ₹${breakdown.expenses.toFixed(2)}<br/><span class="profit">Net Profit: ₹${breakdown.netProfit.toFixed(2)}</span></div><h2>Expenses</h2><table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead><tbody>${rows || '<tr><td colspan="4">No expenses</td></tr>'}</tbody></table></body></html>`;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "ShelfFlow Report PDF" });
      else Alert.alert("PDF Ready", `Report PDF created at ${uri}`);
    } catch { Alert.alert("PDF Error", "Could not generate the report PDF."); }
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const salesData = periodTab === "daily" ? dailySales : monthlySales;
  const purchasesData = dailyPurchases;
  const displayData = reportTab === "sales" ? salesData : purchasesData;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 16, paddingBottom: insets.bottom + 100 },
      ]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Reports</Text>

      {/* Overview stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatsCard
            title="Stock Value"
            value={`₹${stockValue.toLocaleString()}`}
            icon="layers"
            color={colors.primary}
          />
          <StatsCard
            title="Net Profit"
            value={`₹${breakdown.netProfit.toLocaleString()}`}
            icon="trending-up"
            color={breakdown.grossProfit >= 0 ? colors.success : colors.destructive}
          />
        </View>
        <View style={styles.statsRow}>
          <StatsCard
            title="Today Sales"
            value={`₹${todayTotal.toLocaleString()}`}
            icon="shopping-cart"
            color={colors.success}
          />
          <StatsCard
            title="Total Purchases"
            value={`₹${totalPurchaseCost.toLocaleString()}`}
            icon="truck"
            color="#F59E0B"
          />
        </View>
        <StatsCard
          title="Month Sales"
          value={`₹${monthTotal.toLocaleString()}`}
          icon="calendar"
          color="#8B5CF6"
        />
        <StatsCard
          title="Total Expenses"
          value={`₹${totalExpenses.toLocaleString()}`}
          icon="credit-card"
          color={colors.destructive}
        />
      </View>

      {/* Profit breakdown */}
      <View style={[styles.breakdownCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.breakdownTitle, { color: colors.foreground }]}>Profit Breakdown</Text>
        <Text style={[styles.breakdownNote, { color: colors.mutedForeground }]}>
          Cash-basis: credit sales counted only when collected
        </Text>

        {/* Revenue → COGS → Profit row */}
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownLabel, { color: colors.mutedForeground }]}>Settled Revenue</Text>
            <Text style={[styles.breakdownValue, { color: colors.foreground }]}>
              ₹{breakdown.settledRevenue.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.breakdownDivider, { backgroundColor: colors.border }]} />
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownLabel, { color: colors.mutedForeground }]}>Cost of Goods</Text>
            <Text style={[styles.breakdownValue, { color: "#F59E0B" }]}>
              ₹{breakdown.cogs.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.breakdownDivider, { backgroundColor: colors.border }]} />
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownLabel, { color: colors.mutedForeground }]}>Gross Profit</Text>
            <Text style={[styles.breakdownValue, {
              color: breakdown.grossProfit >= 0 ? colors.success : colors.destructive
            }]}>
              ₹{breakdown.grossProfit.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={[styles.periodBreakdown, { borderTopColor: colors.border }]}>
          <View style={styles.periodBreakdownItem}>
            <Text style={[styles.periodLabel, { color: colors.mutedForeground }]}>Expenses</Text>
            <Text style={[styles.periodProfit, { color: colors.destructive }]}>- ₹{breakdown.expenses.toLocaleString()}</Text>
          </View>
          <View style={[styles.breakdownDivider, { backgroundColor: colors.border }]} />
          <View style={styles.periodBreakdownItem}>
            <Text style={[styles.periodLabel, { color: colors.mutedForeground }]}>Net Profit</Text>
            <Text style={[styles.periodProfit, { color: breakdown.netProfit >= 0 ? colors.success : colors.destructive }]}>₹{breakdown.netProfit.toLocaleString()}</Text>
          </View>
        </View>

        {breakdown.settledRevenue > 0 && (
          <View style={[styles.marginBadge, {
            backgroundColor: breakdown.grossProfit >= 0 ? colors.success + "18" : colors.destructive + "18"
          }]}>
            <Feather
              name={breakdown.grossProfit >= 0 ? "trending-up" : "trending-down"}
              size={14}
              color={breakdown.grossProfit >= 0 ? colors.success : colors.destructive}
            />
            <Text style={[styles.marginText, {
              color: breakdown.grossProfit >= 0 ? colors.success : colors.destructive
            }]}>
              {breakdown.margin.toFixed(1)}% margin on settled sales
            </Text>
          </View>
        )}

        {/* Outstanding credit */}
        {(outstandingReceivables > 0 || outstandingPayables > 0) && (
          <View style={[styles.outstandingRow, { borderTopColor: colors.border }]}>
            {outstandingReceivables > 0 && (
              <View style={[styles.outstandingItem, { backgroundColor: colors.success + "10", borderColor: colors.success + "30" }]}>
                <Feather name="arrow-down-circle" size={13} color={colors.success} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.outstandingLabel, { color: colors.mutedForeground }]}>To Collect</Text>
                  <Text style={[styles.outstandingAmount, { color: colors.success }]}>
                    ₹{outstandingReceivables.toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
            {outstandingPayables > 0 && (
              <View style={[styles.outstandingItem, { backgroundColor: "#F59E0B10", borderColor: "#F59E0B30" }]}>
                <Feather name="arrow-up-circle" size={13} color="#F59E0B" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.outstandingLabel, { color: colors.mutedForeground }]}>To Pay</Text>
                  <Text style={[styles.outstandingAmount, { color: "#F59E0B" }]}>
                    ₹{outstandingPayables.toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Period sub-breakdown */}
        <View style={[styles.periodBreakdown, { borderTopColor: colors.border }]}>
          <View style={styles.periodBreakdownItem}>
            <Text style={[styles.periodLabel, { color: colors.mutedForeground }]}>Today</Text>
            <Text style={[styles.periodRevenue, { color: colors.foreground }]}>
              ₹{todayTotal.toLocaleString()} billed
            </Text>
            <Text style={[styles.periodProfit, {
              color: todayProfit >= 0 ? colors.success : colors.destructive
            }]}>
              ₹{todayProfit.toLocaleString()} profit
            </Text>
          </View>
          <View style={[styles.breakdownDivider, { backgroundColor: colors.border }]} />
          <View style={styles.periodBreakdownItem}>
            <Text style={[styles.periodLabel, { color: colors.mutedForeground }]}>This Month</Text>
            <Text style={[styles.periodRevenue, { color: colors.foreground }]}>
              ₹{monthTotal.toLocaleString()} billed
            </Text>
            <Text style={[styles.periodProfit, {
              color: monthProfit >= 0 ? colors.success : colors.destructive
            }]}>
              ₹{monthProfit.toLocaleString()} profit
            </Text>
          </View>
        </View>
      </View>

      {/* Expenses + PDF report */}
      <View style={[styles.expenseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.expenseHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.breakdownTitle, { color: colors.foreground }]}>Expenses</Text>
            <Text style={[styles.breakdownNote, { color: colors.mutedForeground }]}>Expenses are deducted from gross profit to calculate net profit.</Text>
          </View>
          <TouchableOpacity style={[styles.addExpenseBtn, { backgroundColor: colors.primary }]} onPress={() => setExpenseModal(true)}>
            <Feather name="plus" size={15} color="#fff" />
            <Text style={styles.addExpenseText}>Add</Text>
          </TouchableOpacity>
        </View>
        {recentExpenses.slice(0, 5).map((e) => (
          <View key={e.id} style={[styles.expenseRow, { borderTopColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowDate, { color: colors.foreground }]}>{e.category}</Text>
              <Text style={[styles.rowCount, { color: colors.mutedForeground }]}>{e.description || e.date}</Text>
            </View>
            <Text style={[styles.expenseAmount, { color: colors.destructive }]}>- ₹{e.amount.toLocaleString()}</Text>
            <TouchableOpacity onPress={() => handleDeleteExpense(e.id)} style={{ padding: 6 }}>
              <Feather name="trash-2" size={15} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        ))}
        <View style={[styles.pdfReportRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.breakdownTitle, { color: colors.foreground }]}>Report PDF</Text>
          <TouchableOpacity style={[styles.pdfReportBtn, { backgroundColor: colors.primary + "14" }]} onPress={handleReportPdf}>
            <Feather name="file-text" size={16} color={colors.primary} />
            <Text style={[styles.exportText, { color: colors.primary }]}>Generate PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { backgroundColor: colors.muted }]}>
        {(["sales", "purchases"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, reportTab === tab && { backgroundColor: colors.card }]}
            onPress={() => setReportTab(tab)}
          >
            <Text style={[styles.tabText, {
              color: reportTab === tab ? colors.foreground : colors.mutedForeground
            }]}>
              {tab === "sales" ? "Sales" : "Purchases"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {reportTab === "sales" && (
        <View style={[styles.periodRow, { backgroundColor: colors.muted }]}>
          {(["daily", "monthly"] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, periodTab === p && { backgroundColor: colors.card }]}
              onPress={() => setPeriodTab(p)}
            >
              <Text style={[styles.periodText, {
                color: periodTab === p ? colors.foreground : colors.mutedForeground
              }]}>
                {p === "daily" ? "Daily" : "Monthly"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Report table */}
      {displayData.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="bar-chart-2" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No data yet</Text>
        </View>
      ) : (
        <View style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {displayData.map((row, i) => {
            const label = "date" in row ? row.date : "month" in row ? row.month : "";
            const isSales = reportTab === "sales";
            const profit = isSales && "profit" in row ? (row as { profit: number }).profit : null;
            return (
              <React.Fragment key={label + i}>
                {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                <View style={styles.reportRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowDate, { color: colors.foreground }]}>{label}</Text>
                    <Text style={[styles.rowCount, { color: colors.mutedForeground }]}>
                      {row.count} {reportTab === "sales" ? "sale" : "purchase"}
                      {row.count !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={[styles.rowTotal, {
                      color: isSales ? colors.foreground : colors.primary
                    }]}>
                      ₹{row.total.toLocaleString()}
                    </Text>
                    {profit !== null && (
                      <Text style={[styles.rowProfit, {
                        color: profit >= 0 ? colors.success : colors.destructive
                      }]}>
                        ₹{profit.toLocaleString()} profit
                      </Text>
                    )}
                  </View>
                </View>
              </React.Fragment>
            );
          })}
        </View>
      )}
      <Modal visible={expenseModal} transparent animationType="slide" onRequestClose={() => setExpenseModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Expense</Text>
            <TextInput value={expenseAmount} onChangeText={setExpenseAmount} keyboardType="decimal-pad" placeholder="Amount" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
            <TextInput value={expenseCategory} onChangeText={setExpenseCategory} placeholder="Category (Rent, Electricity, Salary...)" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
            <TextInput value={expenseDescription} onChangeText={setExpenseDescription} placeholder="Description" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.muted }]} onPress={() => setExpenseModal(false)}><Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleAddExpense}><Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold" }}>Save Expense</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 14 },
  pageTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statsGrid: { gap: 10 },
  statsRow: { flexDirection: "row", gap: 10 },

  breakdownCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  breakdownTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  breakdownNote: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: -8 },
  breakdownRow: { flexDirection: "row", alignItems: "center" },
  breakdownItem: { flex: 1, alignItems: "center", gap: 4 },
  breakdownDivider: { width: 1, height: 36, marginHorizontal: 8 },
  breakdownLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  breakdownValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  marginBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  marginText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  outstandingRow: {
    flexDirection: "row", gap: 8,
    borderTopWidth: 1, paddingTop: 12,
  },
  outstandingItem: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    padding: 10, borderRadius: 10, borderWidth: 1,
  },
  outstandingLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  outstandingAmount: { fontSize: 14, fontFamily: "Inter_700Bold" },

  periodBreakdown: { flexDirection: "row", borderTopWidth: 1, paddingTop: 12 },
  periodBreakdownItem: { flex: 1, alignItems: "center", gap: 3 },
  periodLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  periodRevenue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  periodProfit: { fontSize: 12, fontFamily: "Inter_500Medium" },

  exportRow: { flexDirection: "row", gap: 8 },
  exportBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  exportText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  tabRow: { flexDirection: "row", borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  periodRow: {
    flexDirection: "row", borderRadius: 10, padding: 3, marginTop: -6,
  },
  periodBtn: { flex: 1, paddingVertical: 6, alignItems: "center", borderRadius: 8 },
  periodText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  emptyBox: {
    alignItems: "center", justifyContent: "center", gap: 12,
    paddingVertical: 48, borderRadius: 16, borderWidth: 1,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  reportCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  reportRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14,
  },
  rowDate: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  rowCount: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  rowRight: { alignItems: "flex-end", gap: 2 },
  rowTotal: { fontSize: 16, fontFamily: "Inter_700Bold" },
  rowProfit: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  divider: { height: 1, marginHorizontal: 14 },
  expenseCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  expenseHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  addExpenseBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9 },
  addExpenseText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  expenseRow: { flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, paddingTop: 10 },
  expenseAmount: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  pdfReportRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, paddingTop: 12, marginTop: 2 },
  pdfReportBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 10 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontFamily: "Inter_400Regular" },
  modalBtn: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 10 },

});
