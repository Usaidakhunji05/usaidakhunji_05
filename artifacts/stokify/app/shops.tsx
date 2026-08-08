import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useShop } from "@/context/ShopContext";
import { Shop } from "@/lib/db";

const SHOP_TYPES = [
  "Grocery", "Cold Drink", "Medical", "Egg", "Clothing",
  "Electronics", "Hardware", "Stationery", "Bakery", "Mobile Shop", "Custom",
];

const SHOP_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  Grocery: "shopping-cart",
  "Cold Drink": "droplet",
  Medical: "plus-circle",
  Egg: "circle",
  Clothing: "tag",
  Electronics: "cpu",
  Hardware: "tool",
  Stationery: "book-open",
  Bakery: "coffee",
  "Mobile Shop": "smartphone",
  Custom: "sliders",
};

const SHOP_COLORS: Record<string, string> = {
  Grocery: "#16A34A",
  "Cold Drink": "#0EA5E9",
  Medical: "#EF4444",
  Egg: "#F59E0B",
  Clothing: "#8B5CF6",
  Electronics: "#3B82F6",
  Hardware: "#92400E",
  Stationery: "#F97316",
  Bakery: "#D97706",
  "Mobile Shop": "#6366F1",
  Custom: "#64748B",
};

export default function ShopsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { shops, selectedShop, selectShop, removeShop, addShop, loadShops } = useShop();

  const [modalVisible, setModalVisible] = useState(false);
  const [shopName, setShopName] = useState("");
  const [shopType, setShopType] = useState("Grocery");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  const handleSelectShop = async (shop: Shop) => {
    await selectShop(shop);
    router.replace("/(tabs)");
  };

  const handleAddShop = async () => {
    if (!shopName.trim()) {
      Alert.alert("Shop Name Required", "Please enter a shop name.");
      return;
    }
    setSaving(true);
    await addShop(shopName.trim(), shopType);
    setShopName("");
    setShopType("General");
    setModalVisible(false);
    setSaving(false);
  };

  const handleDelete = (shop: Shop) => {
    Alert.alert("Delete Shop", `Delete "${shop.shopName}"? All data will be lost.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => removeShop(shop.id) },
    ]);
  };

  const renderShop = ({ item }: { item: Shop }) => {
    const icon = SHOP_ICONS[item.shopType] ?? "box";
    const shopColor = SHOP_COLORS[item.shopType] ?? colors.primary;
    const isSelected = selectedShop?.id === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.shopCard,
          { backgroundColor: colors.card, borderColor: isSelected ? shopColor : colors.border },
          isSelected && { borderWidth: 2 },
        ]}
        onPress={() => handleSelectShop(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.shopIcon, { backgroundColor: shopColor + "18" }]}>
          <Feather name={icon} size={24} color={shopColor} />
        </View>
        <View style={styles.shopInfo}>
          <Text style={[styles.shopName, { color: colors.foreground }]}>{item.shopName}</Text>
          <Text style={[styles.shopType, { color: colors.mutedForeground }]}>{item.shopType}</Text>
        </View>
        <View style={styles.shopActions}>
          {isSelected && <Feather name="check-circle" size={20} color={colors.primary} />}
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
            <Feather name="trash-2" size={18} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20, borderBottomColor: colors.border }]}>
        <View style={styles.logoRow}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Your Shops</Text>
      </View>

      {shops.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="shopping-bag" size={56} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No shops yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Tap the + button to create your first shop
          </Text>
        </View>
      ) : (
        <FlatList
          data={shops}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderShop}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + 24 }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Add Shop Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>New Shop</Text>

            {/* Shop Name */}
            <Text style={[styles.label, { color: colors.foreground }]}>Shop Name</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Feather name="shopping-bag" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Enter your shop name"
                placeholderTextColor={colors.mutedForeground}
                value={shopName}
                onChangeText={setShopName}
              />
            </View>

            {/* Shop Type */}
            <Text style={[styles.label, { color: colors.foreground, marginTop: 16 }]}>Shop Type</Text>
            <View style={styles.typeGrid}>
              {SHOP_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeChip,
                    { borderColor: shopType === t ? colors.primary : colors.border, backgroundColor: shopType === t ? colors.primary + "18" : colors.background },
                  ]}
                  onPress={() => setShopType(t)}
                >
                  <Text style={{ color: shopType === t ? colors.primary : colors.mutedForeground, fontSize: 12, fontFamily: "Inter_500Medium" }}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => { setModalVisible(false); setShopName(""); setShopType("General"); }}
              >
                <Text style={[styles.cancelText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.7 }]}
                onPress={handleAddShop}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Create Shop</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  logoRow: { alignItems: "center", marginBottom: 8 },
  logo: { width: 120, height: 60 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  shopCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  shopIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  shopInfo: { flex: 1 },
  shopName: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  shopType: { fontSize: 12, fontFamily: "Inter_400Regular" },
  shopActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  deleteBtn: { padding: 4 },
  fab: { position: "absolute", right: 20, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#CBD5E1", alignSelf: "center", marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 20 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 52, marginBottom: 4 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  btnRow: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  cancelText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  saveBtn: { flex: 1, height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  saveText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
