import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useShop } from "@/context/ShopContext";
import { getProducts, createPurchase, updatePurchase, getPurchaseById, Product } from "@/lib/db";

export default function PurchaseFormScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedShop } = useShop();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const shopId = selectedShop?.id ?? 0;
  const products = shopId ? getProducts(shopId) : [];

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState("");
  const [cost, setCost] = useState("");
  const [supplier, setSupplier] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentType, setPaymentType] = useState<"cash" | "credit">("cash");
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");
  const [originalQty, setOriginalQty] = useState(0);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalCost = cost && qty ? parseFloat(cost) * (parseInt(qty) || 0) : 0;

  useEffect(() => {
    if (id) {
      const purchase = getPurchaseById(Number(id));
      if (purchase) {
        setOriginalQty(purchase.qty);
        setQty(String(purchase.qty));
        setCost(String(purchase.cost));
        setSupplier(purchase.supplier ?? "");
        setDate(purchase.date);
        setPaymentType(purchase.paymentType ?? "cash");
        const prod = products.find((p) => p.id === purchase.productId);
        if (prod) setSelectedProduct(prod);
      }
    }
  }, [id]);

  const handleSave = async () => {
    if (!selectedProduct) {
      Alert.alert("Select Product", "Please select a product.");
      return;
    }
    const qtyNum = parseInt(qty) || 0;
    if (qtyNum <= 0) {
      Alert.alert("Invalid Qty", "Please enter a valid quantity.");
      return;
    }
    if (paymentType === "credit" && !supplier.trim()) {
      Alert.alert("Supplier Required", "Enter the supplier name for a credit purchase.");
      return;
    }
    setSaving(true);
    try {
      if (isEdit && id) {
        updatePurchase(
          {
            id: Number(id),
            shopId: selectedShop!.id,
            productId: selectedProduct.id,
            qty: qtyNum,
            cost: parseFloat(cost) || 0,
            supplier: supplier.trim(),
            date,
            paymentType,
            paidAt: paymentType === "cash" ? date : null,
          },
          originalQty
        );
      } else {
        createPurchase({
          shopId: selectedShop!.id,
          productId: selectedProduct.id,
          qty: qtyNum,
          cost: parseFloat(cost) || 0,
          supplier: supplier.trim(),
          date,
          paymentType,
          paidAt: paymentType === "cash" ? date : null,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save purchase.");
    } finally {
      setSaving(false);
    }
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

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
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {isEdit ? "Edit Purchase" : "New Purchase"}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.7 }]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Payment Type ── */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>Payment Type</Text>
          <View style={[styles.toggleRow, { backgroundColor: colors.muted }]}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                paymentType === "cash" && { backgroundColor: colors.card },
              ]}
              onPress={() => setPaymentType("cash")}
              activeOpacity={0.8}
            >
              <Feather
                name="dollar-sign"
                size={15}
                color={paymentType === "cash" ? colors.primary : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.toggleText,
                  { color: paymentType === "cash" ? colors.foreground : colors.mutedForeground },
                ]}
              >
                Cash
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                paymentType === "credit" && { backgroundColor: colors.card },
              ]}
              onPress={() => setPaymentType("credit")}
              activeOpacity={0.8}
            >
              <Feather
                name="credit-card"
                size={15}
                color={paymentType === "credit" ? "#F59E0B" : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.toggleText,
                  { color: paymentType === "credit" ? colors.foreground : colors.mutedForeground },
                ]}
              >
                Credit
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Credit notice */}
        {paymentType === "credit" && (
          <View style={[styles.creditNotice, { backgroundColor: "#F59E0B12", borderColor: "#F59E0B40" }]}>
            <Feather name="info" size={14} color="#F59E0B" />
            <Text style={[styles.creditNoticeText, { color: "#B45309" }]}>
              Credit purchase — stock added now, cost tracked as payable
            </Text>
          </View>
        )}

        {/* Product picker */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>Select Product *</Text>
          <TouchableOpacity
            style={[styles.productPicker, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowPicker(!showPicker)}
          >
            <Feather name="package" size={18} color={colors.mutedForeground} />
            <Text
              style={[
                styles.pickerText,
                { color: selectedProduct ? colors.foreground : colors.mutedForeground },
              ]}
              numberOfLines={1}
            >
              {selectedProduct ? selectedProduct.name : "Tap to select..."}
            </Text>
            <Feather
              name={showPicker ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>

          {showPicker && (
            <View style={[styles.pickerDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.searchRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Feather name="search" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.searchInput, { color: colors.foreground }]}
                  placeholder="Search..."
                  placeholderTextColor={colors.mutedForeground}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
              {filteredProducts.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.productOption,
                    selectedProduct?.id === p.id && { backgroundColor: colors.primary + "15" },
                  ]}
                  onPress={() => {
                    setSelectedProduct(p);
                    setShowPicker(false);
                    setSearch("");
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionName, { color: colors.foreground }]}>{p.name}</Text>
                    <Text style={[styles.optionMeta, { color: colors.mutedForeground }]}>
                      Current stock: {p.stock} {p.unit}
                    </Text>
                  </View>
                  {selectedProduct?.id === p.id && (
                    <Feather name="check" size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Qty + Cost */}
        <View style={styles.rowFields}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.foreground }]}>Quantity *</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                value={qty}
                onChangeText={setQty}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.foreground }]}>Cost / Unit (₹)</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                value={cost}
                onChangeText={setCost}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Supplier */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            Supplier{paymentType === "credit" ? " *" : ""}
          </Text>
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder={paymentType === "credit" ? "Required for credit purchase" : "Supplier name (optional)"}
              placeholderTextColor={colors.mutedForeground}
              value={supplier}
              onChangeText={setSupplier}
            />
          </View>
        </View>

        {/* Date */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>Date</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              value={date}
              onChangeText={setDate}
            />
          </View>
        </View>

        {/* Total cost */}
        {totalCost > 0 && (
          <View
            style={[
              styles.totalCard,
              {
                backgroundColor: paymentType === "credit" ? "#F59E0B12" : colors.primary + "12",
                borderColor: paymentType === "credit" ? "#F59E0B40" : colors.primary + "40",
              },
            ]}
          >
            <View>
              <Text style={[styles.totalLabel, { color: paymentType === "credit" ? "#B45309" : colors.primary }]}>
                {paymentType === "credit" ? "Amount Payable" : "Total Cost"}
              </Text>
              <Text style={[styles.totalFormula, { color: (paymentType === "credit" ? "#B45309" : colors.primary) + "AA" }]}>
                {qty || 0} × ₹{parseFloat(cost || "0").toLocaleString()}
                {paymentType === "credit" ? " · due later" : ""}
              </Text>
            </View>
            <Text style={[styles.totalAmount, { color: paymentType === "credit" ? "#B45309" : colors.primary }]}>
              ₹{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  title: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold" },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 64,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  form: { padding: 16, gap: 16 },
  fieldGroup: { gap: 6 },
  rowFields: { flexDirection: "row", gap: 12 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  toggleRow: { flexDirection: "row", borderRadius: 12, padding: 4 },
  toggleBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 7, paddingVertical: 10, borderRadius: 9,
  },
  toggleText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },

  creditNotice: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1, marginTop: -8,
  },
  creditNoticeText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },

  productPicker: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 52,
  },
  pickerText: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  pickerDropdown: { borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  searchRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderBottomWidth: 1, paddingHorizontal: 12, height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  productOption: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12,
  },
  optionName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  optionMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  inputRow: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 52, justifyContent: "center",
  },
  input: { fontSize: 15, fontFamily: "Inter_400Regular" },
  totalCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16, borderRadius: 14, borderWidth: 1,
  },
  totalLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  totalFormula: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  totalAmount: { fontSize: 22, fontFamily: "Inter_700Bold" },
});
