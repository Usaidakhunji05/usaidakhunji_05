import React, { createContext, useContext, useState, useCallback } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Shop, getShops, createShop, deleteShop } from "@/lib/db";

const SELECTED_SHOP_KEY = "stokify_selected_shop";
const WEB_SHOPS_KEY = "stokify_web_shops";

// ── Web shop store ─────────────────────────────────────────────────────────
async function webLoadShops(): Promise<Shop[]> {
  try {
    const raw = await AsyncStorage.getItem(WEB_SHOPS_KEY);
    return raw ? (JSON.parse(raw) as Shop[]) : [];
  } catch {
    return [];
  }
}

async function webSave(shops: Shop[]): Promise<void> {
  await AsyncStorage.setItem(WEB_SHOPS_KEY, JSON.stringify(shops));
}

async function webCreateShop(shopName: string, shopType: string): Promise<Shop[]> {
  const existing = await webLoadShops();
  const newShop: Shop = {
    id: Date.now(),
    shopName,
    shopType,
    createdAt: new Date().toISOString(),
  };
  const updated = [newShop, ...existing];
  await webSave(updated);
  return updated;
}

async function webDeleteShop(id: number): Promise<Shop[]> {
  const existing = await webLoadShops();
  const updated = existing.filter((s) => s.id !== id);
  await webSave(updated);
  return updated;
}

// ── Context ────────────────────────────────────────────────────────────────
interface ShopContextValue {
  selectedShop: Shop | null;
  shops: Shop[];
  selectShop: (shop: Shop) => Promise<void>;
  clearShop: () => Promise<void>;
  loadShops: () => Promise<void>;
  addShop: (shopName: string, shopType: string) => Promise<void>;
  removeShop: (id: number) => Promise<void>;
  loadSelectedShop: () => Promise<Shop | null>;
}

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const isWeb = Platform.OS === "web";

  const loadShops = useCallback(async () => {
    if (isWeb) {
      setShops(await webLoadShops());
    } else {
      setShops(getShops());
    }
  }, [isWeb]);

  const loadSelectedShop = useCallback(async (): Promise<Shop | null> => {
    try {
      const raw = await AsyncStorage.getItem(SELECTED_SHOP_KEY);
      if (raw) {
        const shop = JSON.parse(raw) as Shop;
        setSelectedShop(shop);
        return shop;
      }
    } catch {}
    return null;
  }, []);

  const selectShop = useCallback(async (shop: Shop) => {
    setSelectedShop(shop);
    await AsyncStorage.setItem(SELECTED_SHOP_KEY, JSON.stringify(shop));
  }, []);

  const clearShop = useCallback(async () => {
    setSelectedShop(null);
    await AsyncStorage.removeItem(SELECTED_SHOP_KEY);
  }, []);

  const addShop = useCallback(async (shopName: string, shopType: string) => {
    if (isWeb) {
      setShops(await webCreateShop(shopName, shopType));
    } else {
      createShop(shopName, shopType);
      setShops(getShops());
    }
  }, [isWeb]);

  const removeShop = useCallback(async (id: number) => {
    if (isWeb) {
      setShops(await webDeleteShop(id));
    } else {
      deleteShop(id);
      setShops((prev) => prev.filter((s) => s.id !== id));
    }
    if (selectedShop?.id === id) await clearShop();
  }, [selectedShop, clearShop, isWeb]);

  return (
    <ShopContext.Provider value={{ selectedShop, shops, selectShop, clearShop, loadShops, addShop, removeShop, loadSelectedShop }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
}
