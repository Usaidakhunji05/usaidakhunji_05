import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import { useShop } from "@/context/ShopContext";
import { useColors } from "@/hooks/useColors";

export default function IndexScreen() {
  const { selectedShop, loadShops, loadSelectedShop } = useShop();
  const colors = useColors();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await loadShops();
      await loadSelectedShop();
      setInitialized(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (!initialized) return;
    if (selectedShop) {
      router.replace("/(tabs)");
    } else {
      router.replace("/shops");
    }
  }, [initialized, selectedShop]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
