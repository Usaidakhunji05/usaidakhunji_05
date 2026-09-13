import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useShop } from "@/context/ShopContext";
import { EmptyState } from "@/components/EmptyState";
import {
  getProducts,
  searchProducts,
  getProductsByCategory,
  getCategories,
  deleteProduct,
  Product,
} from "@/lib/db";

export default function ProductsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedShop } = useShop();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [, setTick] = useState(0);

  const shopId = selectedShop?.id ?? 0;
  const categories = shopId ? getCategories(shopId) : [];

  const products: Product[] = shopId
    ? query.trim()
      ? searchProducts(shopId, query.trim())
      : selectedCategory
      ? getProductsByCategory(shopId, selectedCategory)
      : getProducts(shopId)
    : [];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTick((t) => t + 1);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleDelete = (p: Product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete Product", `Delete "${p.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteProduct(p.id);
          setTick((t) => t + 1);
        },
      },
    ]);
  };

  const handleEdit = (p: Product) => {
    router.push({ pathname: "/product-form", params: { id: String(p.id) } });
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const renderItem = ({ item }: { item: Product }) => {
    const stockColor =
      item.stock <= 0
        ? colors.destructive
        : item.stock <= 10
        ? colors.warning
        : colors.success;
    let packageType = "none";
    try { packageType = item.metadata ? (JSON.parse(item.metadata).packageType ?? "none") : "none"; } catch {}
    const unitsPerPackage = item.boxQuantity || 1;
    const pricePerPackage = item.price * unitsPerPackage;
    const fullPackages = packageType !== "none" && unitsPerPackage > 1 ? Math.floor(item.stock / unitsPerPackage) : 0;
    const loose = packageType !== "none" && unitsPerPackage > 1 ? item.stock % unitsPerPackage : item.stock;

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.cardLeft, { backgroundColor: colors.primary + "15" }]}>
          <Feather name="package" size={20} color={colors.primary} />
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.productMeta, { color: colors.mutedForeground }]}>
            {item.category || "No category"} · {item.unit}
          </Text>
          {item.boxQuantity > 1 && (
            <Text style={[styles.boxInfo, { color: colors.mutedForeground }]}>
              Box: {item.boxQuantity} pcs = ₹{pricePerPackage.toLocaleString()}
            </Text>
          )}
          {item.barcode ? (
            <Text style={[styles.barcode, { color: colors.mutedForeground }]}>
              # {item.barcode}
            </Text>
          ) : null}
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.price, { color: colors.foreground }]}>
            ₹{item.price.toLocaleString()}
          </Text>
          <Text style={[styles.stock, { color: stockColor }]}>
            {item.stock} {item.unit}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
              <Feather name="edit-2" size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
              <Feather name="trash-2" size={16} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

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
        <View style={styles.titleRow}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Products</Text>
          <Text style={[styles.pageCount, { color: colors.mutedForeground }]}>
            {products.length} items
          </Text>
        </View>

        {/* Search */}
        <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search products..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={(t) => { setQuery(t); setSelectedCategory(null); }}
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category filter chips */}
        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
            contentContainerStyle={styles.chipRow}
          >
            <TouchableOpacity
              style={[
                styles.chip,
                {
                  backgroundColor: selectedCategory === null ? colors.primary : colors.card,
                  borderColor: selectedCategory === null ? colors.primary : colors.border,
                },
              ]}
              onPress={() => { setSelectedCategory(null); setQuery(""); }}
            >
              <Text style={[styles.chipText, { color: selectedCategory === null ? "#fff" : colors.foreground }]}>
                All
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selectedCategory === cat ? colors.primary : colors.card,
                    borderColor: selectedCategory === cat ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => { setSelectedCategory(cat); setQuery(""); }}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: selectedCategory === cat ? "#fff" : colors.foreground },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        scrollEnabled={!!products.length}
        ListEmptyComponent={
          <EmptyState
            icon="package"
            title={query || selectedCategory ? "No results found" : "No products yet"}
            description={
              query || selectedCategory
                ? "Try a different search or category"
                : "Tap + to add your first product"
            }
          />
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + 24 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/product-form");
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
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  titleRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  pageTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  pageCount: { fontSize: 13, fontFamily: "Inter_400Regular" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  chipScroll: { marginHorizontal: -16 },
  chipRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  list: { padding: 12, gap: 8 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  cardLeft: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: { flex: 1, gap: 2 },
  productName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  productMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  boxInfo: { fontSize: 11, fontFamily: "Inter_400Regular" },
  barcode: { fontSize: 11, fontFamily: "Inter_400Regular" },
  cardRight: { alignItems: "flex-end", gap: 2 },
  price: { fontSize: 14, fontFamily: "Inter_700Bold" },
  stock: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  actions: { flexDirection: "row", gap: 12, marginTop: 4 },
  actionBtn: { padding: 2 },
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
