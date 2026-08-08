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
