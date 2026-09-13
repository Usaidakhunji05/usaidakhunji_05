import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useShop } from "@/context/ShopContext";
import { EmptyState } from "@/components/EmptyState";
import { getSales, deleteSale, getTodayTotal, Sale } from "@/lib/db";

export default function SalesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedShop } = useShop();
  const [refreshing, setRefreshing] = useState(false);
  const [, setTick] = useState(0);

  const shopId = selectedShop?.id ?? 0;
  const sales = shopId ? getSales(shopId, 100) : [];
  const todayTotal = shopId ? getTodayTotal(shopId) : 0;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTick((t) => t + 1);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleDelete = (s: Sale) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete Sale",
      `Delete this sale of "${s.productName}"? Stock will be restored.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteSale(s.id);
            setTick((t) => t + 1);
          },
        },
      ]
    );
  };

  const handleEdit = (s: Sale) => {
    router.push({ pathname: "/sale-form", params: { id: String(s.id) } });
  };

  const handleDownloadPdf = async (s: Sale) => {
    try {
      const unitPrice = s.salePrice || (s.qty > 0 ? s.amount / s.qty : 0);
      const paymentLabel = s.paymentType === "cash" ? "Paid / Cash" : s.paidAt
        ? `Paid in full on ${s.paidAt}${s.lastPaymentFrom ? ` · Received from ${s.lastPaymentFrom}` : ""}`
        : `Credit / Outstanding${s.paidAmount && s.paidAmount > 0 ? ` · ₹${s.paidAmount.toFixed(2)} received` : ""}`;
      const customer = s.customerName?.trim() || "Walk-in Customer";
      const boxQuantity = Number(s.boxQuantity || 1);
      const unit = s.productUnit || "pcs";
      const wholeBoxes = unit === "pcs" && boxQuantity > 1 ? Math.floor(s.qty / boxQuantity) : 0;
      const loosePieces = unit === "pcs" && boxQuantity > 1 ? s.qty % boxQuantity : 0;
      const packageSummary = unit === "pcs" && boxQuantity > 1
        ? `<div class="packaging"><strong>Packaging:</strong> ${wholeBoxes} box × ${boxQuantity} pcs = ${s.qty} pcs${loosePieces > 0 ? ` (${loosePieces} loose pcs)` : ""}</div>`
        : `<div class="packaging"><strong>Quantity:</strong> ${s.qty} ${unit}</div>`;
      const html = `
        <!doctype html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              @page { margin: 24px; }
              body { font-family: Arial, sans-serif; color: #111827; padding: 8px; }
              .header { text-align: center; border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 18px; }
              h1 { margin: 0; font-size: 24px; }
              .muted { color: #6b7280; font-size: 12px; }
              .row { display: flex; justify-content: space-between; margin: 8px 0; }
              .label { color: #6b7280; }
              table { width: 100%; border-collapse: collapse; margin-top: 18px; }
              th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 6px; text-align: left; }
              th:last-child, td:last-child { text-align: right; }
              .total { font-size: 18px; font-weight: bold; border-top: 2px solid #111827; padding-top: 12px; margin-top: 12px; }
              .status { margin-top: 16px; padding: 10px; background: #f3f4f6; border-radius: 8px; }
              .packaging { margin-top: 12px; padding: 10px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; font-size: 13px; }
              .invoice-title { font-size: 16px; font-weight: bold; margin-top: 18px; margin-bottom: 4px; }
              .footer { margin-top: 28px; text-align: center; font-size: 11px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${selectedShop?.shopName ?? "ShelfFlow"}</h1>
              <div class="muted">Sales Invoice · ShelfFlow</div>
            </div>
            <div class="row"><span class="label">Invoice</span><strong>#${s.id}</strong></div>
            <div class="row"><span class="label">Date</span><span>${s.date}</span></div>
            <div class="row"><span class="label">Customer</span><span>${customer}</span></div>
            <table>
              <thead><tr><th>Product</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead>
              <tbody>
                <tr>
                  <td>${s.productName ?? "Product"}</td>
                  <td>${s.qty}</td>
                  <td>₹${unitPrice.toFixed(2)}</td>
                  <td>₹${s.amount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            <div class="invoice-title">Invoice Quantity</div>
            ${packageSummary}
            <div class="row total"><span>Total</span><span>₹${s.amount.toFixed(2)}</span></div>
            <div class="status"><strong>Payment:</strong> ${paymentLabel}</div>
            <div class="footer">Generated by ShelfFlow</div>
          </body>
        </html>`;

      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Download invoice #${s.id}`,
        });
      } else {
        Alert.alert("PDF Ready", `Invoice PDF created at ${uri}`);
      }
    } catch (error) {
      console.error("PDF generation failed", error);
      Alert.alert("PDF Error", "Could not generate the sales PDF. Please try again.");
    }
  };


  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const renderItem = ({ item }: { item: Sale }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.cardIcon, { backgroundColor: colors.success + "18" }]}>
        <Feather name="shopping-cart" size={18} color={colors.success} />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={1}>
          {item.productName ?? "Product"}
        </Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {item.qty} × ₹{(item.salePrice || (item.amount / item.qty)).toLocaleString()} · {item.date}
        </Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.amount, { color: colors.success }]}>
          ₹{item.amount.toLocaleString()}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleDownloadPdf(item)} style={[styles.actionBtn, styles.pdfBtn, { backgroundColor: colors.primary + "14" }]} accessibilityLabel="Download PDF invoice">
            <Feather name="download" size={15} color={colors.primary} />
            <Text style={[styles.pdfBtnText, { color: colors.primary }]}>PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn} accessibilityLabel="Edit sale">
            <Feather name="edit-2" size={15} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn} accessibilityLabel="Delete sale">
            <Feather name="trash-2" size={15} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Sales</Text>
        <View style={[styles.todayBox, { backgroundColor: colors.success + "18" }]}>
          <Text style={[styles.todayLabel, { color: colors.success }]}>Today</Text>
          <Text style={[styles.todayAmount, { color: colors.success }]}>
            ₹{todayTotal.toLocaleString()}
          </Text>
        </View>
      </View>

      <FlatList
        data={sales}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        scrollEnabled={!!sales.length}
        ListEmptyComponent={
          <EmptyState
            icon="shopping-cart"
            title="No sales yet"
            description="Tap + to record your first sale"
          />
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + 24 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/sale-form");
        }}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 8,
  },
  pageTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  todayBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  todayLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  todayAmount: { fontSize: 18, fontFamily: "Inter_700Bold" },
  list: { padding: 12, gap: 8 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: { flex: 1, gap: 3 },
  productName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  meta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  cardRight: { alignItems: "flex-end", gap: 4 },
  amount: { fontSize: 16, fontFamily: "Inter_700Bold" },
  actions: { flexDirection: "row", gap: 10 },
  actionBtn: { padding: 2 },
  pdfBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7 },
  pdfBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});
