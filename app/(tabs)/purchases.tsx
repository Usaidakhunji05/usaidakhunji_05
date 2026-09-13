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
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useShop } from "@/context/ShopContext";
import { EmptyState } from "@/components/EmptyState";
import { getPurchases, deletePurchase, getTotalPurchaseCost, Purchase } from "@/lib/db";

export default function PurchasesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedShop } = useShop();
  const [refreshing, setRefreshing] = useState(false);
  const [, setTick] = useState(0);

  const shopId = selectedShop?.id ?? 0;
  const purchases = shopId ? getPurchases(shopId, 100) : [];
  const totalCost = shopId ? getTotalPurchaseCost(shopId) : 0;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTick((t) => t + 1);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleDelete = (p: Purchase) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete Purchase",
      `Delete this purchase of "${p.productName}"? Stock will be reduced.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deletePurchase(p.id);
            setTick((t) => t + 1);
          },
        },
      ]
    );
  };

  const handleEdit = (p: Purchase) => {
    router.push({ pathname: "/purchase-form", params: { id: String(p.id) } });
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const renderItem = ({ item }: { item: Purchase }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.cardIcon, { backgroundColor: colors.primary + "18" }]}>
        <Feather name="truck" size={18} color={colors.primary} />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={1}>
          {item.productName ?? "Product"}
        </Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {item.qty} × ₹{item.cost.toLocaleString()} · {item.date}
        </Text>
        {item.supplier ? (
          <Text style={[styles.supplier, { color: colors.mutedForeground }]}>
            {item.supplier}
          </Text>
        ) : null}
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.cost, { color: colors.foreground }]}>
          ₹{(item.cost * item.qty).toLocaleString()}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
            <Feather name="edit-2" size={15} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
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
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Purchases</Text>
        <View style={[styles.totalBox, { backgroundColor: colors.primary + "18" }]}>
          <Text style={[styles.totalLabel, { color: colors.primary }]}>Total Spent</Text>
          <Text style={[styles.totalAmount, { color: colors.primary }]}>
            ₹{totalCost.toLocaleString()}
          </Text>
        </View>
      </View>

      <FlatList
        data={purchases}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        scrollEnabled={!!purchases.length}
        ListEmptyComponent={
          <EmptyState
            icon="truck"
            title="No purchases yet"
            description="Tap + to record a purchase"
          />
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + 24 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/purchase-form");
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  pageTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  totalBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  totalLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  totalAmount: { fontSize: 18, fontFamily: "Inter_700Bold" },
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
  cardContent: { flex: 1, gap: 2 },
  productName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  meta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  supplier: { fontSize: 12, fontFamily: "Inter_400Regular" },
  cardRight: { alignItems: "flex-end", gap: 4 },
  cost: { fontSize: 14, fontFamily: "Inter_700Bold" },
  actions: { flexDirection: "row", gap: 10 },
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
