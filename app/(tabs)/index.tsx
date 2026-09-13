import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useShop } from "@/context/ShopContext";
import {
  getTotalProducts,
  getTotalStock,
  getTodayTotal,
  getMonthTotal,
  getLowStockCount,
  getLowStockProducts,
  getSales,
  getOutstandingReceivables,
  getOutstandingPayables,
  Product,
  Sale,
} from "@/lib/db";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedShop, clearShop } = useShop();
  const [refreshing, setRefreshing] = useState(false);
  const [, setTick] = useState(0);

  const shopId = selectedShop?.id ?? 0;

  const totalProducts = shopId ? getTotalProducts(shopId) : 0;
  const totalStock = shopId ? getTotalStock(shopId) : 0;
  const todayTotal = shopId ? getTodayTotal(shopId) : 0;
  const monthTotal = shopId ? getMonthTotal(shopId) : 0;
  const lowStockCount = shopId ? getLowStockCount(shopId) : 0;
  const lowStockItems = shopId ? getLowStockProducts(shopId, 10).slice(0, 5) : [];
  const recentSales = shopId ? getSales(shopId, 5) : [];
  const outstandingReceivables = shopId ? getOutstandingReceivables(shopId) : 0;
  const outstandingPayables = shopId ? getOutstandingPayables(shopId) : 0;
  const hasCreditAlert = outstandingReceivables > 0 || outstandingPayables > 0;

  const todaySalesCount = recentSales.filter(
    (s) => s.date === new Date().toISOString().split("T")[0]
  ).length;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTick((t) => t + 1);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const handleSwitchShop = async () => {
    await clearShop();
    router.replace("/shops");
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const heroHeight = Math.max(SCREEN_HEIGHT * 0.35, 240);

  const quickActions = [
    {
      label: "New Sale",
      icon: "shopping-cart" as const,
      iconBg: colors.success + "18",
      iconColor: colors.success,
      onPress: () => router.push("/sale-form"),
    },
    {
      label: "New Purchase",
      icon: "package" as const,
      iconBg: colors.primary + "18",
      iconColor: colors.primary,
      onPress: () => router.push("/purchase-form"),
    },
    {
      label: "Add Product",
      icon: "plus" as const,
      iconBg: "#8B5CF618",
      iconColor: "#8B5CF6",
      onPress: () => router.push("/product-form"),
    },
    {
      label: "Credit Ledger",
      icon: "credit-card" as const,
      iconBg: colors.destructive + "18",
      iconColor: colors.destructive,
      badge: hasCreditAlert,
      onPress: () => router.push("/(tabs)/credit"),
    },
  ];

  if (!shopId) {
    return (
      <View style={[styles.noShopRoot, { backgroundColor: colors.background }]}>
        <View style={[styles.noShopHero, { backgroundColor: colors.primary, paddingTop: topPad + 24 }]}>
          <View style={[styles.heroIconBox, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Feather name="shopping-bag" size={28} color="#fff" />
          </View>
          <Text style={styles.heroNoShopTitle}>ShelfFlow</Text>
          <Text style={styles.heroNoShopSub}>Streamlined Stock Management</Text>
        </View>
        <View style={styles.noShopBody}>
          <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
          <Text style={[styles.noShopText, { color: colors.foreground }]}>No shop selected</Text>
          <Text style={[styles.noShopSub, { color: colors.mutedForeground }]}>
            Select or create a shop to get started
          </Text>
          <TouchableOpacity
            style={[styles.selectBtn, { backgroundColor: colors.primary }]}
            onPress={handleSwitchShop}
          >
            <Text style={styles.selectBtnText}>Select a Shop</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── HERO ── */}
      <View
        style={[
          styles.hero,
          { height: heroHeight, paddingTop: topPad + 16, backgroundColor: colors.primary },
        ]}
      >
        <View style={styles.heroHeader}>
          <View style={styles.shopInfo}>
            <View style={styles.shopIconBox}>
              <Feather name="shopping-bag" size={18} color="#fff" />
            </View>
            <View>
              <Text style={styles.shopType}>{selectedShop?.shopType ?? "Shop"}</Text>
              <Text style={styles.shopName} numberOfLines={1}>
                {selectedShop?.shopName ?? "—"}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.switchBtn} onPress={handleSwitchShop}>
            <Feather name="repeat" size={18} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>

        <View style={styles.heroMetric}>
          <Text style={styles.heroLabel}>Today's Revenue</Text>
          <Text style={styles.heroAmount}>₹{todayTotal.toLocaleString()}</Text>
          <View style={styles.heroPill}>
            <Feather name="shopping-cart" size={13} color="rgba(255,255,255,0.9)" />
            <Text style={styles.heroPillText}>
              {todaySalesCount} sale{todaySalesCount !== 1 ? "s" : ""} today
            </Text>
          </View>
        </View>
      </View>

      {/* ── BODY ── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.bodyContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* ── STAT CHIPS ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsRow}
        >
          <StatChip
            label="Products"
            value={String(totalProducts)}
            icon="package"
            iconBg={colors.primary + "18"}
            iconColor={colors.primary}
            cardBg={colors.card}
            textColor={colors.foreground}
            subColor={colors.mutedForeground}
          />
          <StatChip
            label="Total Stock"
            value={String(totalStock)}
            icon="layers"
            iconBg={colors.success + "18"}
            iconColor={colors.success}
            cardBg={colors.card}
            textColor={colors.foreground}
            subColor={colors.mutedForeground}
          />
          <StatChip
            label="Month Sales"
            value={`₹${monthTotal >= 1000 ? (monthTotal / 1000).toFixed(1) + "k" : monthTotal.toLocaleString()}`}
            icon="trending-up"
            iconBg="#F59E0B18"
            iconColor="#F59E0B"
            cardBg={colors.card}
            textColor={colors.foreground}
            subColor={colors.mutedForeground}
          />
          {outstandingReceivables > 0 && (
            <StatChip
              label="To Collect"
              value={`₹${outstandingReceivables >= 1000 ? (outstandingReceivables / 1000).toFixed(1) + "k" : outstandingReceivables.toLocaleString()}`}
              icon="arrow-down-circle"
              iconBg={colors.success + "18"}
              iconColor={colors.success}
              cardBg={colors.card}
              textColor={colors.foreground}
              subColor={colors.mutedForeground}
              onPress={() => router.push("/(tabs)/credit")}
            />
          )}
          {outstandingPayables > 0 && (
            <StatChip
              label="To Pay"
              value={`₹${outstandingPayables >= 1000 ? (outstandingPayables / 1000).toFixed(1) + "k" : outstandingPayables.toLocaleString()}`}
              icon="arrow-up-circle"
              iconBg="#F59E0B18"
              iconColor="#F59E0B"
              cardBg={colors.card}
              textColor={colors.foreground}
              subColor={colors.mutedForeground}
              onPress={() => router.push("/(tabs)/credit")}
            />
          )}
          {lowStockCount > 0 && (
            <StatChip
              label="Low Stock"
              value={String(lowStockCount)}
              icon="alert-triangle"
              iconBg={colors.destructive + "18"}
              iconColor={colors.destructive}
              cardBg={colors.card}
              textColor={colors.foreground}
              subColor={colors.mutedForeground}
            />
          )}
        </ScrollView>

        {/* ── QUICK ACTIONS ── */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.actionTile, { backgroundColor: colors.card }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                action.onPress();
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBox, { backgroundColor: action.iconBg }]}>
                <Feather name={action.icon} size={24} color={action.iconColor} />
                {action.badge && (
                  <View style={[styles.actionDot, { backgroundColor: colors.destructive }]} />
                )}
              </View>
              <Text style={[styles.actionLabel, { color: colors.foreground }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── LOW STOCK ── */}
        {lowStockCount > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Low Stock</Text>
              <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
                <Text style={styles.badgeText}>{lowStockCount}</Text>
              </View>
            </View>
            <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.destructive + "40" }]}>
              {lowStockItems.map((p: Product, i: number) => (
                <React.Fragment key={p.id}>
                  {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                  <View style={styles.listRow}>
                    <View style={[styles.listIcon, { backgroundColor: colors.destructive + "15" }]}>
                      <Feather name="alert-circle" size={16} color={colors.destructive} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.listName, { color: colors.foreground }]} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text style={[styles.listSub, { color: colors.mutedForeground }]}>
                        {p.stock} {p.unit} remaining
                      </Text>
                    </View>
                    <Text style={[styles.listTag, { color: colors.mutedForeground }]}>
                      {p.category || "—"}
                    </Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </>
        )}

        {/* ── RECENT SALES ── */}
        {recentSales.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Sales</Text>
            <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {recentSales.map((s: Sale, i: number) => (
                <React.Fragment key={s.id}>
                  {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                  <View style={styles.listRow}>
                    <View style={[styles.listIcon, {
                      backgroundColor: s.paymentType === "credit"
                        ? colors.destructive + "15"
                        : colors.success + "15",
                    }]}>
                      <Feather
                        name={s.paymentType === "credit" ? "credit-card" : "check-circle"}
                        size={16}
                        color={s.paymentType === "credit" ? colors.destructive : colors.success}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.listName, { color: colors.foreground }]} numberOfLines={1}>
                        {s.productName ?? "Product"}
                      </Text>
                      <Text style={[styles.listSub, { color: colors.mutedForeground }]}>
                        {s.qty} unit · {s.date}
                        {s.paymentType === "credit" && s.customerName
                          ? ` · ${s.customerName}`
                          : ""}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 2 }}>
                      <Text style={[styles.saleAmount, {
                        color: s.paymentType === "credit" ? colors.destructive : colors.success
                      }]}>
                        ₹{s.amount.toLocaleString()}
                      </Text>
                      {s.paymentType === "credit" && (
                        <Text style={[styles.creditTag, { color: colors.destructive }]}>credit</Text>
                      )}
                    </View>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

interface StatChipProps {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  iconBg: string;
  iconColor: string;
  cardBg: string;
  textColor: string;
  subColor: string;
  onPress?: () => void;
}

function StatChip({ label, value, icon, iconBg, iconColor, cardBg, textColor, subColor, onPress }: StatChipProps) {
  const content = (
    <View style={[styles.chip, { backgroundColor: cardBg }]}>
      <View style={[styles.chipIcon, { backgroundColor: iconBg }]}>
        <Feather name={icon} size={20} color={iconColor} />
      </View>
      <View>
        <Text style={[styles.chipLabel, { color: subColor }]}>{label}</Text>
        <Text style={[styles.chipValue, { color: textColor }]}>{value}</Text>
      </View>
    </View>
  );
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    justifyContent: "space-between",
  },
  heroHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  shopInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  shopIconBox: {
    width: 40, height: 40, backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12, alignItems: "center", justifyContent: "center",
  },
  shopType: {
    fontSize: 11, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  shopName: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  switchBtn: {
    width: 36, height: 36, backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 18, alignItems: "center", justifyContent: "center",
  },
  heroMetric: { alignItems: "center", gap: 8 },
  heroLabel: { fontSize: 14, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.9)" },
  heroAmount: {
    fontSize: 48, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -1, lineHeight: 56,
  },
  heroPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  heroPillText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.95)" },

  body: { flex: 1 },
  bodyContent: { paddingTop: 20, paddingHorizontal: 16, gap: 14 },

  chipsScroll: { marginHorizontal: -16 },
  chipsRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 12, minWidth: 148,
    borderRadius: 16, padding: 16, shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  chipIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  chipLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  chipValue: { fontSize: 20, fontFamily: "Inter_700Bold", marginTop: 1 },

  sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: -4 },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: {
    minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6,
    alignItems: "center", justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold" },

  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  actionTile: {
    width: "47%", borderRadius: 20, paddingVertical: 20, paddingHorizontal: 16,
    alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  actionIconBox: {
    width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center",
  },
  actionDot: {
    position: "absolute", top: 0, right: 0, width: 10, height: 10, borderRadius: 5,
  },
  actionLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "center" },

  listCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  listRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  listIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  listName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  listSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  listTag: { fontSize: 12, fontFamily: "Inter_400Regular" },
  saleAmount: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  creditTag: { fontSize: 10, fontFamily: "Inter_500Medium" },
  divider: { height: 1, marginHorizontal: 14 },

  noShopRoot: { flex: 1 },
  noShopHero: {
    alignItems: "center", paddingBottom: 40, gap: 12,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  heroIconBox: {
    width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  heroNoShopTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -0.5 },
  heroNoShopSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)" },
  noShopBody: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  noShopText: { fontSize: 20, fontFamily: "Inter_700Bold" },
  noShopSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  selectBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  selectBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
