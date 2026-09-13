import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ visible, onScan, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) setScanned(false);
  }, [visible]);

  if (Platform.OS === "web") return null;

  const handleScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    onScan(data);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="x" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Barcode / QR / Code</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* States */}
        {!permission ? (
          <View style={styles.center}>
            <Text style={styles.statusText}>Checking camera…</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.center}>
            <Feather name="camera-off" size={52} color="#94A3B8" />
            <Text style={styles.statusText}>Camera permission required</Text>
            {permission.canAskAgain ? (
              <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
                <Text style={styles.permBtnText}>Allow Camera</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.hintText}>Enable camera access in your device Settings</Text>
            )}
          </View>
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              barcodeScannerSettings={{
                barcodeTypes: ["aztec", "codabar", "code39", "code93", "code128", "datamatrix", "ean13", "ean8", "itf14", "pdf417", "qr", "upc_a", "upc_e"],
              }}
              onBarcodeScanned={scanned ? undefined : handleScanned}
            />
            {/* Overlay */}
            <View style={styles.overlay}>
              <View style={styles.finderContainer}>
                <View style={styles.finder}>
                  {/* Corner markers */}
                  {[
                    { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0 },
                    { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0 },
                    { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0 },
                    { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0 },
                  ].map((style, i) => (
                    <View key={i} style={[styles.corner, style]} />
                  ))}
                </View>
              </View>
              <Text style={styles.hint}>Point at a barcode to scan automatically</Text>
            </View>
            {scanned && (
              <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
                <Text style={styles.rescanText}>Tap to scan again</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontFamily: "Inter_600SemiBold" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  statusText: { color: "#94A3B8", fontSize: 16, fontFamily: "Inter_500Medium", textAlign: "center" },
  hintText: { color: "#64748B", fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  permBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  permBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cameraWrap: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  finderContainer: {
    width: 260,
    height: 180,
    backgroundColor: "transparent",
  },
  finder: {
    flex: 1,
    backgroundColor: "transparent",
    borderRadius: 4,
    overflow: "visible",
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: "#fff",
    borderWidth: CORNER_THICKNESS,
    borderRadius: 2,
  },
  hint: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 20,
    textAlign: "center",
    opacity: 0.8,
  },
  rescanBtn: {
    position: "absolute",
    bottom: 60,
    alignSelf: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  rescanText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
