import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useShop } from "@/context/ShopContext";
import {
  getCreditSales,
  getCreditPurchases,
  recordSalePayment,
  recordPurchasePayment,
  getOutstandingReceivables,
  getOutstandingPayables,
  Sale,
  Purchase,
} from "@/lib/db";

type CreditTab = "receivables" | "payables";

export default function CreditScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedShop } = useShop();
  const [tab, setTab] = useState<CreditTab>("receivables");
  const [refreshing, setRefreshing] = useState(false);
  const [, setTick] = useState(0);

  // Settle modal state
  const [settleTarget, setSettleTarget] = useState<{ id: number; kind: "sale" | "purchase"; name: string; amount: number } | null>(null);
  const [settleDate, setSettleDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [settling, setSettling] = useState(false);

  const shopId = selectedShop?.id ?? 0;
  const creditSales = shopId ? getCreditSales(shopId) : [];
  const creditPurchases = shopId ? getCreditPurchases(shopId) : [];
  const totalReceivables = shopId ? getOutstandingReceivables(shopId) : 0;
  const totalPayables = shopId ? getOutstandingPayables(shopId) : 0;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTick((t) => t + 1);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const openSettle = (id: number, kind: "sale" | "purchase", name: string, amount: number) => {
    setSettleTarget({ id, kind, name, amount });
    setSettleDate(new Date().toISOString().split("T")[0]);
    setPaymentAmount(String(amount));
    setPaidBy(name);
    setPaymentNote("");
  };

  const confirmSettle = async () => {
    if (!settleTarget) return;
    if (!settleDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert("Invalid Date", "Enter date as YYYY-MM-DD");
      return;
    }
    const received = Number(paymentAmount);
    if (!Number.isFinite(received) || received <= 0) {
      Alert.alert("Invalid Amount", "Enter the amount actually received/paid.");
      return;
    }
    if (!paidBy.trim()) {
      Alert.alert("Name Required", settleTarget.kind === "sale" ? "Enter who gave the payment." : "Enter who received the payment.");
      return;
    }
    if (received > settleTarget.amount + 0.005) {
      Alert.alert("Amount Too High", "Payment cannot be greater than the pending amount.");
      return;
    }
    setSettling(true);
    try {
      if (settleTarget.kind === "sale") {
        recordSalePayment(settleTarget.id, received, paidBy.trim(), settleDate, paymentNote.trim());
      } else {
        recordPurchasePayment(settleTarget.id, received, paidBy.trim(), settleDate, paymentNote.trim());
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSettleTarget(null);
      setTick((t) => t + 1);
    } catch {
      Alert.alert("Error", "Failed to settle. Please try again.");
    } finally {
      setSettling(false);
    }
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const renderSaleRow = (item: Sale, index: number, total: number) => (
    <React.Fragment key={item.id}>
      {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
      <View style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: colors.success + "18" }]}>
          <Feather name="user" size={16} color={colors.success} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowParty, { color: colors.foreground }]} numberOfLines={1}>
            {item.customerName || "Unknown customer"}
          </Text>
          <Text style={[styles.rowMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
            {item.productName ?? "Product"} · {item.qty} unit · {item.date}
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={[styles.rowAmount, { color: colors.success }]}>₹{(item.pendingAmount ?? Math.max(0, item.amount - (item.paidAmount ?? 0))).toLocaleString()} pending</Text>
          {item.paidAmount && item.paidAmount > 0 ? (
            <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>Received ₹{item.paidAmount.toLocaleString()} {item.lastPaymentFrom ? `from ${item.lastPaymentFrom}` : ""}</Text>
          ) : null}
          <TouchableOpacity
            style={[styles.settleBtn, { backgroundColor: colors.success }]}
            onPress={() => openSettle(item.id, "sale", item.customerName || "customer", item.pendingAmount ?? Math.max(0, item.amount - (item.paidAmount ?? 0)))}
            activeOpacity={0.8}
          >
            <Text style={styles.settleBtnText}>Collect</Text>
          </TouchableOpacity>
        </View>
      </View>
    </React.Fragment>
  );

  const renderPurchaseRow = (item: Purchase, index: number, total: number) => (
    <React.Fragment key={item.id}>
      {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
      <View style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: "#F59E0B18" }]}>
          <Feather name="truck" size={16} color="#F59E0B" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowParty, { color: colors.foreground }]} numberOfLines={1}>
            {item.supplier || "Unknown supplier"}
          </Text>
          <Text style={[styles.rowMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
            {item.productName ?? "Product"} · {item.qty} unit · {item.date}
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={[styles.rowAmount, { color: "#F59E0B" }]}>₹{(item.pendingAmount ?? Math.max(0, item.cost * item.qty - (item.paidAmount ?? 0))).toLocaleString()} pending</Text>
          {item.paidAmount && item.paidAmount > 0 ? (
            <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>Paid ₹{item.paidAmount.toLocaleString()} to {item.lastPaymentFrom || item.supplier}</Text>
          ) : null}
          <TouchableOpacity
            style={[styles.settleBtn, { backgroundColor: "#F59E0B" }]}
            onPress={() => openSettle(item.id, "purchase", item.supplier || "supplier", item.pendingAmount ?? Math.max(0, item.cost * item.qty - (item.paidAmount ?? 0)))}
            activeOpacity={0.8}
          >
            <Text style={styles.settleBtnText}>Pay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </React.Fragment>
  );

  if (!shopId) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No shop selected</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 16, paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Credit Ledger</Text>

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <TouchableOpacity
            style={[
              styles.summaryCard,
              { backgroundColor: colors.card, borderColor: tab === "receivables" ? colors.success : colors.border },
              tab === "receivables" && { borderWidth: 2 },
            ]}
            onPress={() => setTab("receivables")}
            activeOpacity={0.8}
          >
            <View style={[styles.summaryIcon, { backgroundColor: colors.success + "18" }]}>
              <Feather name="arrow-down-circle" size={20} color={colors.success} />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>To Collect</Text>
            <Text style={[styles.summaryAmount, { color: colors.success }]}>
              ₹{totalReceivables.toLocaleString()}
            </Text>
            <Text style={[styles.summaryCount, { color: colors.mutedForeground }]}>
              {creditSales.length} customer{creditSales.length !== 1 ? "s" : ""}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.summaryCard,
              { backgroundColor: colors.card, borderColor: tab === "payables" ? "#F59E0B" : colors.border },
              tab === "payables" && { borderWidth: 2 },
            ]}
            onPress={() => setTab("payables")}
            activeOpacity={0.8}
          >
            <View style={[styles.summaryIcon, { backgroundColor: "#F59E0B18" }]}>
              <Feather name="arrow-up-circle" size={20} color="#F59E0B" />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>To Pay</Text>
            <Text style={[styles.summaryAmount, { color: "#F59E0B" }]}>
              ₹{totalPayables.toLocaleString()}
            </Text>
            <Text style={[styles.summaryCount, { color: colors.mutedForeground }]}>
              {creditPurchases.length} supplier{creditPurchases.length !== 1 ? "s" : ""}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Net position */}
        {(totalReceivables > 0 || totalPayables > 0) && (
          <View style={[styles.netCard, {
            backgroundColor: colors.card,
            borderColor: colors.border,
          }]}>
            <Text style={[styles.netLabel, { color: colors.mutedForeground }]}>Net Credit Position</Text>
            <Text style={[styles.netAmount, {
              color: totalReceivables >= totalPayables ? colors.success : colors.destructive
            }]}>
              {totalReceivables >= totalPayables ? "+" : "−"}₹{Math.abs(totalReceivables - totalPayables).toLocaleString()}
            </Text>
            <Text style={[styles.netSub, { color: colors.mutedForeground }]}>
              {totalReceivables >= totalPayables
                ? "Customers owe you more than you owe suppliers"
                : "You owe suppliers more than customers owe you"}
            </Text>
          </View>
        )}

        {/* Tab toggle */}
        <View style={[styles.tabRow, { backgroundColor: colors.muted }]}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "receivables" && { backgroundColor: colors.card }]}
            onPress={() => setTab("receivables")}
          >
            <Feather
              name="arrow-down-circle"
              size={14}
              color={tab === "receivables" ? colors.success : colors.mutedForeground}
            />
            <Text style={[styles.tabText, { color: tab === "receivables" ? colors.foreground : colors.mutedForeground }]}>
              Receivables
            </Text>
            {creditSales.length > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: colors.success }]}>
                <Text style={styles.tabBadgeText}>{creditSales.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "payables" && { backgroundColor: colors.card }]}
            onPress={() => setTab("payables")}
          >
            <Feather
              name="arrow-up-circle"
              size={14}
              color={tab === "payables" ? "#F59E0B" : colors.mutedForeground}
            />
            <Text style={[styles.tabText, { color: tab === "payables" ? colors.foreground : colors.mutedForeground }]}>
              Payables
            </Text>
            {creditPurchases.length > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: "#F59E0B" }]}>
                <Text style={styles.tabBadgeText}>{creditPurchases.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* List */}
        {tab === "receivables" ? (
          creditSales.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="check-circle" size={36} color={colors.success} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>All collected</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No outstanding credit sales
              </Text>
            </View>
          ) : (
            <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {creditSales.map((s, i) => renderSaleRow(s, i, creditSales.length))}
            </View>
          )
        ) : (
          creditPurchases.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="check-circle" size={36} color={colors.success} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>All paid</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No outstanding credit purchases
              </Text>
            </View>
          ) : (
            <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {creditPurchases.map((p, i) => renderPurchaseRow(p, i, creditPurchases.length))}
            </View>
          )
        )}
      </ScrollView>

      {/* Settle modal */}
      <Modal
        visible={!!settleTarget}
        animationType="slide"
        transparent
        onRequestClose={() => setSettleTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {settleTarget?.kind === "sale" ? "Collect Payment" : "Record Payment"}
              </Text>
              <TouchableOpacity onPress={() => setSettleTarget(null)}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {settleTarget && (
              <View style={[styles.modalInfo, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.modalParty, { color: colors.foreground }]}>
                  {settleTarget.name}
                </Text>
                <Text style={[styles.modalAmount, {
                  color: settleTarget.kind === "sale" ? colors.success : "#F59E0B"
                }]}>
                  ₹{settleTarget.amount.toLocaleString()}
                </Text>
              </View>
            )}

            <View style={styles.modalField}>
              <Text style={[styles.modalLabel, { color: colors.foreground }]}>{settleTarget?.kind === "sale" ? "Amount Received" : "Amount Paid"}</Text>
              <View style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border }]}> 
                <Text style={[styles.currencyPrefix, { color: colors.mutedForeground }]}>₹</Text>
                <TextInput
                  style={[styles.modalInputText, { color: colors.foreground }]}
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>

            <View style={styles.modalField}>
              <Text style={[styles.modalLabel, { color: colors.foreground }]}>{settleTarget?.kind === "sale" ? "Received From" : "Paid To"}</Text>
              <View style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border }]}> 
                <Feather name="user" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.modalInputText, { color: colors.foreground }]}
                  value={paidBy}
                  onChangeText={setPaidBy}
                  placeholder={settleTarget?.kind === "sale" ? "Customer name" : "Supplier name"}
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>

            <View style={styles.modalField}>
              <Text style={[styles.modalLabel, { color: colors.foreground }]}>Note (optional)</Text>
              <View style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border }]}> 
                <Feather name="edit-3" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.modalInputText, { color: colors.foreground }]}
                  value={paymentNote}
                  onChangeText={setPaymentNote}
                  placeholder="Payment note"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>

            <View style={styles.modalField}>
              <Text style={[styles.modalLabel, { color: colors.foreground }]}>Payment Date</Text>
              <View style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Feather name="calendar" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.modalInputText, { color: colors.foreground }]}
                  value={settleDate}
                  onChangeText={setSettleDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                {
                  backgroundColor: settleTarget?.kind === "sale" ? colors.success : "#F59E0B",
                  opacity: settling ? 0.7 : 1,
                },
              ]}
              onPress={confirmSettle}
              disabled={settling}
              activeOpacity={0.85}
            >
              {settling ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="check" size={18} color="#fff" />
                  <Text style={styles.confirmBtnText}>
                    {settleTarget?.kind === "sale" ? "Record Payment Received" : "Record Payment"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center", gap: 12 },
  content: { paddingHorizontal: 16, gap: 14 },
  pageTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },

  summaryRow: { flexDirection: "row", gap: 12 },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
    alignItems: "center",
  },
  summaryIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center", marginBottom: 2,
  },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  summaryAmount: { fontSize: 22, fontFamily: "Inter_700Bold" },
  summaryCount: { fontSize: 11, fontFamily: "Inter_400Regular" },

  netCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  netLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  netAmount: { fontSize: 26, fontFamily: "Inter_700Bold" },
  netSub: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },

  tabRow: { flexDirection: "row", borderRadius: 12, padding: 4 },
  tabBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 9, borderRadius: 10,
  },
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  tabBadge: {
    minWidth: 18, height: 18, borderRadius: 9,
    paddingHorizontal: 4, alignItems: "center", justifyContent: "center",
  },
  tabBadgeText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold" },

  listCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  divider: { height: 1, marginHorizontal: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  rowParty: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  rowMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  rowRight: { alignItems: "flex-end", gap: 6 },
  rowAmount: { fontSize: 15, fontFamily: "Inter_700Bold" },
  settleBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
  },
  settleBtnText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },

  emptyCard: {
    alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 48,
    borderRadius: 16, borderWidth: 1,
  },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 16,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalInfo: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 14, borderRadius: 12, borderWidth: 1,
  },
  modalParty: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  modalAmount: { fontSize: 20, fontFamily: "Inter_700Bold" },
  modalField: { gap: 8 },
  modalLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  modalInput: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 52,
  },
  currencyPrefix: { fontSize: 16, fontFamily: "Inter_700Bold" },
  modalInputText: { flex: 1, fontSize: 16, fontFamily: "Inter_400Regular" },
  confirmBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 52, borderRadius: 14,
  },
  confirmBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
