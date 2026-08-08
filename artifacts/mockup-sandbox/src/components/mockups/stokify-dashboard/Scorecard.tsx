import React from "react";
import {
  Store,
  ChevronDown,
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  BarChart2,
  AlertCircle,
  ArrowUpRight
} from "lucide-react";

export function Scorecard() {
  return (
    <div
      style={{
        width: "390px",
        height: "844px",
        overflow: "hidden",
        position: "relative",
        fontFamily: "'Inter', sans-serif",
        background: "#F8FAFC",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>

      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          background: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "#3B82F6",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
            }}
          >
            <Store size={18} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              General
            </span>
            <span style={{ fontSize: "15px", color: "#0F172A", fontWeight: 600 }}>
              b mart
            </span>
          </div>
        </div>
        <button
          style={{
            background: "none",
            border: "none",
            color: "#64748B",
            padding: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronDown size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: "auto", paddingBottom: "80px" }} className="no-scrollbar">
        {/* Date header */}
        <div style={{ padding: "24px 20px 8px 20px" }}>
          <h2 style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "1px" }}>
            Statement
          </h2>
        </div>

        {/* Ledger List */}
        <div style={{ background: "#FFFFFF", borderTop: "1px solid #E2E8F0", borderBottom: "1px solid #E2E8F0" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: "1px solid #F1F5F9" }}>
            <span style={{ fontSize: "15px", color: "#475569", fontWeight: 500 }}>Products</span>
            <span style={{ fontSize: "18px", color: "#0F172A", fontWeight: 700 }}>42</span>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: "1px solid #F1F5F9" }}>
            <span style={{ fontSize: "15px", color: "#475569", fontWeight: 500 }}>Total Stock</span>
            <span style={{ fontSize: "18px", color: "#0F172A", fontWeight: 700 }}>187</span>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: "1px solid #F1F5F9" }}>
            <span style={{ fontSize: "15px", color: "#475569", fontWeight: 500 }}>Today Sales</span>
            <span style={{ fontSize: "18px", color: "#0F172A", fontWeight: 700 }}>Rs 3,400</span>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px" }}>
            <span style={{ fontSize: "15px", color: "#475569", fontWeight: 500 }}>Month Sales</span>
            <span style={{ fontSize: "18px", color: "#3B82F6", fontWeight: 700 }}>Rs 28,500</span>
          </div>
          
        </div>

        {/* Alerts / Activity */}
        <div style={{ padding: "32px 20px 8px 20px" }}>
          <h2 style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "1px" }}>
            Attention Required
          </h2>
        </div>
        
        <div style={{ background: "#FFFFFF", borderTop: "1px solid #E2E8F0", borderBottom: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #F1F5F9" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <AlertCircle size={18} color="#EF4444" />
              <span style={{ fontSize: "14px", color: "#475569", fontWeight: 500 }}>Low Stock Items</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "15px", color: "#EF4444", fontWeight: 600 }}>8 items</span>
              <ArrowUpRight size={16} color="#CBD5E1" />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Package size={18} color="#F59E0B" />
              <span style={{ fontSize: "14px", color: "#475569", fontWeight: 500 }}>Pending Returns</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "15px", color: "#F59E0B", fontWeight: 600 }}>2 items</span>
              <ArrowUpRight size={16} color="#CBD5E1" />
            </div>
          </div>
        </div>

      </main>

      {/* Bottom Tab Bar */}
      <nav
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "83px",
          background: "#FFFFFF",
          borderTop: "1px solid #E2E8F0",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "flex-start",
          paddingTop: "12px",
          paddingBottom: "24px",
        }}
      >
        <button style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: "none", border: "none", color: "#3B82F6", cursor: "pointer" }}>
          <LayoutDashboard size={24} />
          <span style={{ fontSize: "10px", fontWeight: 600 }}>Dashboard</span>
        </button>
        <button style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>
          <Package size={24} />
          <span style={{ fontSize: "10px", fontWeight: 500 }}>Products</span>
        </button>
        <button style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>
          <Tag size={24} />
          <span style={{ fontSize: "10px", fontWeight: 500 }}>Sales</span>
        </button>
        <button style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>
          <ShoppingCart size={24} />
          <span style={{ fontSize: "10px", fontWeight: 500 }}>Purchase</span>
        </button>
        <button style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>
          <BarChart2 size={24} />
          <span style={{ fontSize: "10px", fontWeight: 500 }}>Reports</span>
        </button>
      </nav>
    </div>
  );
}
