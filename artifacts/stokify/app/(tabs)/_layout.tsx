import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useShop } from "@/context/ShopContext";
import { getOutstandingReceivables, getOutstandingPayables } from "@/lib/db";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="products">
        <Icon sf={{ default: "shippingbox", selected: "shippingbox.fill" }} />
        <Label>Products</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="sales">
        <Icon sf={{ default: "cart", selected: "cart.fill" }} />
        <Label>Sales</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="purchases">
        <Icon sf={{ default: "tray.and.arrow.down", selected: "tray.and.arrow.down.fill" }} />
        <Label>Purchase</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="credit">
        <Icon sf={{ default: "creditcard", selected: "creditcard.fill" }} />
        <Label>Credit</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="reports">
        <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
        <Label>Reports</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { selectedShop } = useShop();
  const shopId = selectedShop?.id ?? 0;
  const hasCreditAlerts = shopId
    ? getOutstandingReceivables(shopId) > 0 || getOutstandingPayables(shopId) > 0
    : false;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <Feather name="home" size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color }) => <Feather name="package" size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: "Sales",
          tabBarIcon: ({ color }) => <Feather name="shopping-cart" size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="purchases"
        options={{
          title: "Purchase",
          tabBarIcon: ({ color }) => <Feather name="truck" size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="credit"
        options={{
          title: "Credit",
          tabBarIcon: ({ color }) => (
            <View>
              <Feather name="credit-card" size={21} color={color} />
              {hasCreditAlerts && (
                <View style={[styles.dot, { backgroundColor: colors.destructive }]} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color }) => <Feather name="bar-chart-2" size={21} color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}

const styles = StyleSheet.create({
  dot: {
    position: "absolute",
    top: -1,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
