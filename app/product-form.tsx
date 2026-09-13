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
import { createProduct, updateProduct, getProductById, getCategories, Product } from "@/lib/db";
import { BarcodeScanner } from "@/components/BarcodeScanner";

// ── Field configurations per shop type ────────────────────────────────────

interface MetaField {
  key: string;
  label: string;
  placeholder?: string;
  numeric?: boolean;
  optional?: boolean;
}

interface ShopFieldConfig {
  showCategory: boolean;
  showBarcode: boolean;
  boxQtyLabel: string; // e.g. "Pieces per Box", "Bottles per Crate"
  showBoxQty: boolean;
  showUnit: boolean;
  metaFields: MetaField[];
}

const CONFIGS: Record<string, ShopFieldConfig> = {
  Grocery: {
    showCategory: true, showBarcode: true,
    boxQtyLabel: "Pieces per Box", showBoxQty: true, showUnit: true,
    metaFields: [
      { key: "supplier", label: "Supplier", placeholder: "Supplier name", optional: true },
      { key: "expiryDate", label: "Expiry Date", placeholder: "DD/MM/YYYY", optional: true },
    ],
  },
  "Cold Drink": {
    showCategory: false, showBarcode: true,
    boxQtyLabel: "Bottles per Crate", showBoxQty: true, showUnit: true,
    metaFields: [
      { key: "brand", label: "Brand", placeholder: "e.g. Coca Cola" },
      { key: "bottleSize", label: "Bottle Size", placeholder: "e.g. 500ml, 1L" },
      { key: "supplier", label: "Supplier", placeholder: "Distributor name", optional: true },
    ],
  },
  Medical: {
    showCategory: true, showBarcode: false,
    boxQtyLabel: "Pieces per Box", showBoxQty: false, showUnit: true,
    metaFields: [
      { key: "batchNo", label: "Batch No.", placeholder: "e.g. B2024001" },
      { key: "expiryDate", label: "Expiry Date", placeholder: "DD/MM/YYYY" },
      { key: "mrp", label: "MRP (₹)", placeholder: "0.00", numeric: true },
      { key: "gst", label: "GST %", placeholder: "e.g. 12", numeric: true, optional: true },
      { key: "supplier", label: "Supplier / Company", placeholder: "Pharma company", optional: true },
    ],
  },
  Egg: {
    showCategory: false, showBarcode: false,
    boxQtyLabel: "Eggs per Tray", showBoxQty: true, showUnit: false,
    metaFields: [
      { key: "farmSupplier", label: "Farm / Supplier", placeholder: "Farm name or supplier" },
    ],
  },
  Clothing: {
    showCategory: true, showBarcode: true,
    boxQtyLabel: "Pieces per Box", showBoxQty: false, showUnit: false,
    metaFields: [
      { key: "brand", label: "Brand", placeholder: "e.g. Levi's", optional: true },
      { key: "size", label: "Size", placeholder: "e.g. S, M, L, XL, 32" },
      { key: "color", label: "Color", placeholder: "e.g. Red, Navy Blue" },
      { key: "variant", label: "Variant / Style", placeholder: "e.g. Slim Fit", optional: true },
    ],
  },
  Electronics: {
    showCategory: false, showBarcode: true,
    boxQtyLabel: "Pieces per Box", showBoxQty: false, showUnit: false,
    metaFields: [
      { key: "brand", label: "Brand", placeholder: "e.g. Samsung" },
      { key: "model", label: "Model", placeholder: "e.g. Galaxy A54" },
      { key: "serialNumber", label: "Serial Number", placeholder: "Enter serial no.", optional: true },
      { key: "imei", label: "IMEI", placeholder: "15-digit IMEI", optional: true },
      { key: "warrantyMonths", label: "Warranty (months)", placeholder: "12", numeric: true, optional: true },
    ],
  },
  Hardware: {
    showCategory: true, showBarcode: true,
    boxQtyLabel: "Pieces per Box", showBoxQty: false, showUnit: true,
    metaFields: [
      { key: "brand", label: "Brand", placeholder: "e.g. Stanley", optional: true },
      { key: "sizeSpec", label: "Size / Spec", placeholder: "e.g. 5kg, 10m, M6", optional: true },
      { key: "supplier", label: "Supplier", placeholder: "Supplier name", optional: true },
    ],
  },
  Stationery: {
    showCategory: true, showBarcode: true,
    boxQtyLabel: "Pieces per Box", showBoxQty: false, showUnit: false,
    metaFields: [
      { key: "brand", label: "Brand", placeholder: "e.g. Camlin, Classmate", optional: true },
      { key: "supplier", label: "Supplier", placeholder: "Supplier name", optional: true },
    ],
  },
  Bakery: {
    showCategory: true, showBarcode: false,
    boxQtyLabel: "Pieces per Batch", showBoxQty: false, showUnit: false,
    metaFields: [
      { key: "weight", label: "Weight / Size", placeholder: "e.g. 500g, 1kg" },
      { key: "expiryDate", label: "Expiry Date", placeholder: "DD/MM/YYYY", optional: true },
      { key: "freshnessHours", label: "Fresh For (hours)", placeholder: "e.g. 24, 48", numeric: true, optional: true },
    ],
  },
  "Mobile Shop": {
    showCategory: false, showBarcode: false,
    boxQtyLabel: "Units", showBoxQty: false, showUnit: false,
    metaFields: [
      { key: "brand", label: "Brand", placeholder: "e.g. Samsung, Apple" },
      { key: "model", label: "Model", placeholder: "e.g. iPhone 15 Pro" },
      { key: "ramStorage", label: "RAM / Storage", placeholder: "e.g. 8GB / 256GB" },
      { key: "imei", label: "IMEI", placeholder: "15-digit IMEI", optional: true },
      { key: "warrantyMonths", label: "Warranty (months)", placeholder: "12", numeric: true, optional: true },
      { key: "accessories", label: "Accessories", placeholder: "e.g. Charger, Case", optional: true },
    ],
  },
  Custom: {
    showCategory: true, showBarcode: true,
    boxQtyLabel: "Pieces per Box", showBoxQty: true, showUnit: true,
    metaFields: [
      { key: "supplier", label: "Supplier", placeholder: "Supplier name", optional: true },
      { key: "notes", label: "Notes", placeholder: "Additional details", optional: true },
    ],
  },
};

const DEFAULT_CONFIG: ShopFieldConfig = {
  showCategory: true, showBarcode: true,
  boxQtyLabel: "Pieces per Box", showBoxQty: true, showUnit: true,
  metaFields: [],
};

const UNITS = ["pcs", "kg", "g", "L", "mL", "m", "cm", "box", "pack", "dozen", "pair"];
const PACKAGE_TYPES = ["none", "box", "pack", "crate", "tray", "dozen", "pair"];

// ── Component ──────────────────────────────────────────────────────────────

export default function ProductFormScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedShop } = useShop();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const shopType = selectedShop?.shopType ?? "Custom";
  const config = CONFIGS[shopType] ?? DEFAULT_CONFIG;

  // Core fields
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  // Standard conditional fields
  const [category, setCategory] = useState("");
  const [showCatSuggestions, setShowCatSuggestions] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [boxQuantity, setBoxQuantity] = useState("1");
  const [packageType, setPackageType] = useState("none");
  const [stockPackages, setStockPackages] = useState("");
  const [looseStock, setLooseStock] = useState("");
  const [unit, setUnit] = useState("pcs");
  // Extra type-specific fields (stored in metadata JSON)
  const [meta, setMeta] = useState<Record<string, string>>({});
  // UI
  const [saving, setSaving] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const shopId = selectedShop?.id ?? 0;
  const existingCategories = shopId ? getCategories(shopId) : [];
  const filteredCategories = existingCategories.filter(
    (c) => c.toLowerCase().includes(category.toLowerCase()) && c !== category
  );
  const unitsPerPackage = Math.max(1, parseFloat(boxQuantity || "1") || 1);
  const pricePerPackage = parseFloat(price || "0") * unitsPerPackage;
  const usesPackaging = unit === "pcs" && packageType !== "none" && unitsPerPackage > 1;
  const calculatedStock = usesPackaging
    ? ((parseFloat(stockPackages || "0") || 0) * unitsPerPackage) + (parseFloat(looseStock || "0") || 0)
    : (parseFloat(stock || "0") || 0);

  const getMeta = (key: string) => meta[key] ?? "";
  const setMetaField = (key: string, value: string) =>
    setMeta((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (id) {
      const p = getProductById(Number(id));
      if (p) {
        setName(p.name);
        setCategory(p.category);
        setBarcode(p.barcode);
        setBoxQuantity(String(p.boxQuantity || 1));
        setPrice(String(p.price));
        setStock(String(p.stock));
        setUnit(p.unit);
        try {
          const savedMeta = p.metadata ? JSON.parse(p.metadata) : {};
          setMeta(savedMeta);
          setPackageType(savedMeta.packageType ?? (p.boxQuantity > 1 ? "box" : "none"));
          const perPackage = Math.max(1, Number(p.boxQuantity || 1));
          if (savedMeta.packageType && savedMeta.packageType !== "none" && p.unit === "pcs" && perPackage > 1) {
            setStockPackages(String(Math.floor((p.stock || 0) / perPackage)));
            setLooseStock(String((p.stock || 0) % perPackage));
          }
        } catch {
          setMeta({});
        }
      }
    }
  }, [id]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Required", "Product name is required."); return; }
    if (!selectedShop) { Alert.alert("No Shop", "Please select a shop first."); return; }
    setSaving(true);
    try {
      const product: Omit<Product, "id"> = {
        shopId: selectedShop.id,
        name: name.trim(),
        category: category.trim(),
        barcode: barcode.trim(),
        boxQuantity: usesPackaging ? unitsPerPackage : 1,
        price: parseFloat(price) || 0,
        costPrice: 0, // set automatically when a purchase is recorded
        stock: calculatedStock,
        unit,
        metadata: JSON.stringify({ ...meta, packageType, unitsPerPackage }),
      };
      if (isEdit && id) {
        updateProduct({ ...product, id: Number(id) });
      } else {
        createProduct(product);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {isEdit ? "Edit Product" : "New Product"}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.7 }]}
        >
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Shop type badge */}
        {selectedShop && (
          <View style={[styles.typeBadge, { backgroundColor: colors.primary + "14" }]}>
            <Feather name="shopping-bag" size={13} color={colors.primary} />
            <Text style={[styles.typeBadgeText, { color: colors.primary }]}>
              {selectedShop.shopName} · {shopType}
            </Text>
          </View>
        )}

        {/* ── Product Name ─────────────────────────────────────── */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>Product Name *</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Enter product name"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        {/* ── Category (conditional) ───────────────────────────── */}
        {config.showCategory && (
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Category</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="e.g. Beverages"
                placeholderTextColor={colors.mutedForeground}
                value={category}
                onChangeText={(t) => { setCategory(t); setShowCatSuggestions(true); }}
                onFocus={() => setShowCatSuggestions(true)}
                onBlur={() => setTimeout(() => setShowCatSuggestions(false), 150)}
              />
            </View>
            {showCatSuggestions && filteredCategories.length > 0 && (
              <View style={[styles.suggestions, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {filteredCategories.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                    onPress={() => { setCategory(c); setShowCatSuggestions(false); }}
                  >
                    <Feather name="tag" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.suggestionText, { color: colors.foreground }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Barcode (conditional) ────────────────────────────── */}
        {config.showBarcode && (
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Barcode</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Scan or type barcode"
                placeholderTextColor={colors.mutedForeground}
                value={barcode}
                onChangeText={setBarcode}
              />
              {Platform.OS !== "web" && (
                <TouchableOpacity
                  onPress={() => setShowScanner(true)}
                  style={[styles.scanBtn, { backgroundColor: colors.primary }]}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Feather name="camera" size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ── Unit + packaging ───────────────────────────────────── */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>Unit / Stock Type</Text>
          <View style={styles.chipRow}>
            {UNITS.map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.chip, { backgroundColor: unit === u ? colors.primary : colors.card, borderColor: unit === u ? colors.primary : colors.border }]}
                onPress={() => { setUnit(u); if (u !== "pcs") { setPackageType("none"); setBoxQuantity("1"); } }}
              >
                <Text style={[styles.chipText, { color: unit === u ? "#fff" : colors.foreground }]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.helperText, { color: colors.mutedForeground }]}>Choose the unit in which you sell and track stock. Weight/liquid units can use decimals.</Text>
        </View>

        {unit === "pcs" && (
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Packaging</Text>
            <View style={styles.chipRow}>
              {PACKAGE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, { backgroundColor: packageType === type ? colors.primary : colors.card, borderColor: packageType === type ? colors.primary : colors.border }]}
                  onPress={() => { setPackageType(type); if (type === "none") { setBoxQuantity("1"); setStockPackages(""); setLooseStock(""); } }}
                >
                  <Text style={[styles.chipText, { color: packageType === type ? "#fff" : colors.foreground }]}>{type === "none" ? "No package" : type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {unit === "pcs" && packageType !== "none" && (
          <View style={styles.rowFields}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.foreground }]}>Pieces per {packageType}</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="e.g. 12"
                  placeholderTextColor={colors.mutedForeground}
                  value={boxQuantity}
                  onChangeText={setBoxQuantity}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.foreground }]}>Price / Piece (₹)</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.mutedForeground}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
        )}

        {unit !== "pcs" && (
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Selling Price / {unit} (₹)</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput style={[styles.input, { color: colors.foreground }]} placeholder="0.00" placeholderTextColor={colors.mutedForeground} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
            </View>
          </View>
        )}

        {unit === "pcs" && packageType === "none" && (
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Selling Price / Piece (₹)</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput style={[styles.input, { color: colors.foreground }]} placeholder="0.00" placeholderTextColor={colors.mutedForeground} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
            </View>
          </View>
        )}

        {usesPackaging && parseFloat(price || "0") > 0 && (
          <View style={[styles.autoCalcCard, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
            <View style={styles.autoCalcRow}>
              <Text style={[styles.autoCalcLabel, { color: colors.mutedForeground }]}>Price per {packageType}</Text>
              <Text style={[styles.autoCalcFormula, { color: colors.mutedForeground }]}>{unitsPerPackage} × ₹{parseFloat(price || "0").toLocaleString()}</Text>
            </View>
            <Text style={[styles.autoCalcValue, { color: colors.primary }]}>₹{pricePerPackage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          </View>
        )}

        {/* ── Type-specific metadata fields ────────────────────── */}
        {config.metaFields.length > 0 && (
          <>
            <View style={[styles.sectionDivider, { borderColor: colors.border }]}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                {shopType} Details
              </Text>
            </View>
            {config.metaFields.map((field) => (
              <View key={field.key} style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  {field.label}
                  {field.optional && (
                    <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}> (optional)</Text>
                  )}
                </Text>
                <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder={field.placeholder ?? ""}
                    placeholderTextColor={colors.mutedForeground}
                    value={getMeta(field.key)}
                    onChangeText={(v) => setMetaField(field.key, v)}
                    keyboardType={field.numeric ? "decimal-pad" : "default"}
                  />
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── Stock ────────────────────────────────────────────── */}
        <View style={[styles.sectionDivider, { borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Inventory</Text>
        </View>

        {usesPackaging ? (
          <>
            <View style={styles.rowFields}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.foreground }]}>Number of {packageType}s</Text>
                <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput style={[styles.input, { color: colors.foreground }]} placeholder="0" placeholderTextColor={colors.mutedForeground} value={stockPackages} onChangeText={setStockPackages} keyboardType="decimal-pad" />
                </View>
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.foreground }]}>Loose pieces</Text>
                <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput style={[styles.input, { color: colors.foreground }]} placeholder="0" placeholderTextColor={colors.mutedForeground} value={looseStock} onChangeText={setLooseStock} keyboardType="decimal-pad" />
                </View>
              </View>
            </View>
            <View style={[styles.autoCalcCard, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
              <Text style={[styles.autoCalcLabel, { color: colors.mutedForeground }]}>Total stock</Text>
              <Text style={[styles.autoCalcValue, { color: colors.primary }]}>{calculatedStock} pcs</Text>
              <Text style={[styles.helperText, { color: colors.mutedForeground }]}>{stockPackages || 0} × {unitsPerPackage} + {looseStock || 0} loose</Text>
            </View>
          </>
        ) : (
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Stock Quantity ({unit})</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput style={[styles.input, { color: colors.foreground }]} placeholder="0" placeholderTextColor={colors.mutedForeground} value={stock} onChangeText={setStock} keyboardType="decimal-pad" />
            </View>
            <Text style={[styles.helperText, { color: colors.mutedForeground }]}>Use decimals for units such as kg, g, L, mL, m and cm.</Text>
          </View>
        )}
      </ScrollView>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        visible={showScanner}
        onScan={(code) => setBarcode(code)}
        onClose={() => setShowScanner(false)}
      />
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
  },
  backBtn: { marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold" },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10, minWidth: 64, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  form: { padding: 16, gap: 14 },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  typeBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  sectionDivider: {
    borderTopWidth: 1,
    paddingTop: 14,
    marginTop: 4,
  },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8 },
  fieldGroup: { gap: 6 },
  rowFields: { flexDirection: "row", gap: 12 },
  helperText: { fontSize: 12, lineHeight: 18, marginTop: 6, fontFamily: "Inter_400Regular" },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  inputRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  scanBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestions: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 2,
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  suggestionText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  autoCalcCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 4 },
  autoCalcRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  autoCalcLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  autoCalcFormula: { fontSize: 12, fontFamily: "Inter_400Regular" },
  autoCalcValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
