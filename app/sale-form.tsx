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
import { getProducts, createSale, updateSale, getSaleById, Product } from "@/lib/db";

export default function SaleFormScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedShop } = useShop();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const shopId = selectedShop?.id ?? 0;
  const products = shopId ? getProducts(shopId) : [];

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentType, setPaymentType] = useState<"cash" | "credit">("cash");
  const [customerName, setCustomerName] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");
  const [originalQty, setOriginalQty] = useState(0);

  const subtotal = parseFloat(salePrice || "0") * (parseFloat(qty || "0") || 0);
  const costPerUnit = selectedProduct?.costPrice ?? 0;
  const totalCost = costPerUnit * (parseFloat(qty || "0") || 0);
  const profit = subtotal - totalCost;
  const marginPct = subtotal > 0 ? (profit / subtotal) * 100 : 0;

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (id) {
      const sale = getSaleById(Number(id));
      if (sale) {
        setOriginalQty(sale.qty);
        setQty(String(sale.qty));
        setSalePrice(String(sale.salePrice || (sale.amount / sale.qty)));
        setDate(sale.date);
        setPaymentType(sale.paymentType ?? "cash");
        setCustomerName(sale.customerName ?? "");
        const prod = products.find((p) => p.id === sale.productId);
        if (prod) setSelectedProduct(prod);
      }
    }
  }, [id]);

  const handleSave = async () => {
    if (!selectedProduct) {
      Alert.alert("Select Product", "Please select a product.");
      return;
    }
    const qtyNum = parseFloat(qty) || 0;
    if (qtyNum <= 0) {
      Alert.alert("Invalid Qty", "Please enter a valid quantity.");
      return;
    }
    const salePriceNum = parseFloat(salePrice) || 0;
    if (salePriceNum <= 0) {
      Alert.alert("Invalid Price", "Please enter a sale price.");
      return;
    }
    if (paymentType === "credit" && !customerName.trim()) {
      Alert.alert("Customer Required", "Enter the customer name for a credit sale.");
      return;
    }
    if (!isEdit && qtyNum > selectedProduct.stock) {
      Alert.alert(
        "Insufficient Stock",
        `Only ${selectedProduct.stock} ${selectedProduct.unit} available.`
      );
      return;
    }
    setSaving(true);
    try {
      if (isEdit && id) {
        updateSale(
          {
            id: Number(id),
            shopId: selectedShop!.id,
            productId: selectedProduct.id,
            qty: qtyNum,
            salePrice: salePriceNum,
            costPrice: 0,
            amount: subtotal,
            date,
            paymentType,
            customerName: customerName.trim(),
            paidAt: paymentType === "cash" ? new Date().toISOString().split("T")[0] : null,
          },
          originalQty
        );
      } else {
        createSale({
          shopId: selectedShop!.id,
          productId: selectedProduct.id,
          qty: qtyNum,
          salePrice: salePriceNum,
          costPrice: 0,
          amount: subtotal,
          date,
          paymentType,
          customerName: customerName.trim(),
          paidAt: paymentType === "cash" ? date : null,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save sale.");
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
          {isEdit ? "Edit Sale" : "New Sale"}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, { backgroundColor: colors.success }, saving && { opacity: 0.7 }]}
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
                color={paymentType === "cash" ? colors.success : colors.mutedForeground}
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
                color={paymentType === "credit" ? colors.destructive : colors.mutedForeground}
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

        {/* ── Credit notice + customer name ── */}
        {paymentType === "credit" && (
          <>
            <View style={[styles.creditNotice, { backgroundColor: colors.destructive + "12", borderColor: colors.destructive + "40" }]}>
              <Feather name="info" size={14} color={colors.destructive} />
              <Text style={[styles.creditNoticeText, { color: colors.destructive }]}>
                Credit sale — profit counted only when collected
              </Text>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Customer Name *</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Who is buying on credit?"
                  placeholderTextColor={colors.mutedForeground}
                  value={customerName}
                  onChangeText={setCustomerName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          </>
        )}

        {/* ── Product Picker ── */}
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
              {filteredProducts.length === 0 ? (
                <Text style={[styles.noProducts, { color: colors.mutedForeground }]}>
                  No products found
                </Text>
              ) : (
                filteredProducts.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.productOption,
                      selectedProduct?.id === p.id && { backgroundColor: colors.primary + "15" },
                    ]}
                    onPress={() => {
                      setSelectedProduct(p);
                      setSalePrice(String(p.price));
                      setShowPicker(false);
                      setSearch("");
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionName, { color: colors.foreground }]}>{p.name}</Text>
                      <Text style={[styles.optionMeta, { color: colors.mutedForeground }]}>
                        Stock: {p.stock} {p.unit} · Default ₹{p.price}
                      </Text>
                    </View>
                    {selectedProduct?.id === p.id && (
                      <Feather name="check" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* ── Qty + Sale Price ── */}
        <View style={styles.rowFields}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.foreground }]}>Quantity ({selectedProduct?.unit || "unit"}) *</Text>
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
            <Text style={[styles.label, { color: colors.foreground }]}>Sale Price (₹) *</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                value={salePrice}
                onChangeText={setSalePrice}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Sale price is editable — it won't affect the product's default price.
        </Text>

        {/* ── Date ── */}
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

        {/* ── Total + profit preview ── */}
        {subtotal > 0 && (
          <View style={[styles.totalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Revenue row */}
            <View style={styles.totalRow}>
              <View>
                <Text style={[styles.totalLabel, { color: colors.foreground }]}>Subtotal</Text>
                <Text style={[styles.totalFormula, { color: colors.mutedForeground }]}>
                  {qty || 0} × ₹{parseFloat(salePrice || "0").toLocaleString()}
                </Text>
              </View>
              <Text style={[styles.totalAmount, { color: colors.success }]}>
                ₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>

            {/* Profit rows — only when costPrice is known */}
            {costPerUnit > 0 && (
              <>
                <View style={[styles.totalDivider, { backgroundColor: colors.border }]} />
                <View style={styles.totalRow}>
                  <View>
                    <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Cost of Goods</Text>
                    <Text style={[styles.totalFormula, { color: colors.mutedForeground }]}>
                      {qty || 0} × ₹{costPerUnit.toLocaleString()}
                    </Text>
                  </View>
                  <Text style={[styles.totalAmount, { color: "#F59E0B", fontSize: 18 }]}>
                    ₹{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={[styles.totalDivider, { backgroundColor: colors.border }]} />
                <View style={styles.totalRow}>
                  <View>
                    <Text style={[styles.totalLabel, { color: profit >= 0 ? colors.success : colors.destructive }]}>
                      Gross Profit
                    </Text>
                    <Text style={[styles.totalFormula, { color: colors.mutedForeground }]}>
                      {marginPct.toFixed(1)}% margin
                      {paymentType === "credit" ? " · counted on collection" : ""}
                    </Text>
                  </View>
                  <Text style={[styles.totalAmount, { color: profit >= 0 ? colors.success : colors.destructive }]}>
                    ₹{profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              </>
            )}

            {/* Credit deferred notice */}
            {paymentType === "credit" && (
              <View style={[styles.deferredNote, { backgroundColor: colors.destructive + "10", borderColor: colors.destructive + "30" }]}>
                <Feather name="clock" size={13} color={colors.destructive} />
                <Text style={[styles.deferredText, { color: colors.destructive }]}>
                  Not counted in profit until collected from {customerName || "customer"}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Stock info */}
        {selectedProduct && (
          <View style={[styles.stockBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="layers" size={14} color={colors.mutedForeground} />
            <Text style={[styles.stockText, { color: colors.mutedForeground }]}>
              Available: {selectedProduct.stock} {selectedProduct.unit}
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
  form: { padding: 16, gap: 14 },
  fieldGroup: { gap: 6 },
  rowFields: { flexDirection: "row", gap: 12 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  hint: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -6 },

  // Payment toggle
  toggleRow: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 10,
    borderRadius: 9,
  },
  toggleText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },

  // Credit notice
  creditNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: -4,
  },
  creditNoticeText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },

  productPicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  pickerText: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  pickerDropdown: { borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  productOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  optionMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  noProducts: {
    padding: 16,
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  inputRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    justifyContent: "center",
  },
  input: { fontSize: 16, fontFamily: "Inter_400Regular" },

  // Total card
  totalCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalDivider: { height: 1 },
  totalLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  totalFormula: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  totalAmount: { fontSize: 22, fontFamily: "Inter_700Bold" },
  deferredNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  deferredText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium" },

  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  stockText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
