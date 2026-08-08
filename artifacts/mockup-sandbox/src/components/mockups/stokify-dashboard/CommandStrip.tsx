import React from "react";
import { 
  Store, 
  ChevronDown, 
  Package, 
  Layers, 
  TrendingUp, 
  Plus, 
  ShoppingCart, 
  FileText, 
  LayoutDashboard, 
  Tag, 
  CreditCard,
  BarChart3
} from "lucide-react";

export function CommandStrip() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      <div style={{
        width: "390px",
        height: "844px",
        overflow: "hidden",
        position: "relative",
        fontFamily: "'Inter', sans-serif",
        background: "#F1F5F9",
        display: "flex",
        flexDirection: "column"
      }}>
        
        {/* UPPER 40% - HERO SECTION */}
        <div style={{
          height: "40%",
          backgroundColor: "#3B82F6",
          display: "flex",
          flexDirection: "column",
          padding: "24px",
          color: "white",
          borderBottomLeftRadius: "32px",
          borderBottomRightRadius: "32px",
          boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)"
        }}>
          {/* Shop Context Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ 
                width: "40px", 
                height: "40px", 
                backgroundColor: "rgba(255,255,255,0.2)", 
                borderRadius: "12px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center" 
              }}>
                <Store size={20} color="white" />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  General
                </div>
                <div style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.5px" }}>
                  b mart
                </div>
              </div>
            </div>
            <button style={{ 
              background: "rgba(255,255,255,0.15)", 
              border: "none", 
              borderRadius: "50%", 
              width: "36px", 
              height: "36px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              cursor: "pointer"
            }}>
              <ChevronDown size={20} color="white" />
            </button>
          </div>

          {/* Hero Metric */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" }}>
            <span style={{ fontSize: "14px", fontWeight: 500, color: "rgba(255,255,255,0.9)", marginBottom: "8px" }}>
              Today's Revenue
            </span>
            <div style={{ fontSize: "48px", fontWeight: 800, letterSpacing: "-1px", lineHeight: 1 }}>
              Rs 3,400
            </div>
            <div style={{ 
              marginTop: "16px", 
              padding: "6px 12px", 
              backgroundColor: "rgba(255,255,255,0.2)", 
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <TrendingUp size={14} />
              +12% vs yesterday
            </div>
          </div>
        </div>

        {/* HORIZONTAL STAT CHIPS */}
        <div className="no-scrollbar" style={{ 
          display: "flex", 
          gap: "12px", 
          padding: "24px", 
          overflowX: "auto",
          marginTop: "-10px"
        }}>
          {/* Chip 1: Products */}
          <div style={{ 
            minWidth: "140px", 
            backgroundColor: "white", 
            borderRadius: "16px", 
            padding: "16px", 
            display: "flex", 
            alignItems: "center", 
            gap: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
          }}>
            <div style={{ backgroundColor: "#EFF6FF", padding: "10px", borderRadius: "12px" }}>
              <Package size={20} color="#3B82F6" />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 500 }}>Products</div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>42</div>
            </div>
          </div>

          {/* Chip 2: Total Stock */}
          <div style={{ 
            minWidth: "140px", 
            backgroundColor: "white", 
            borderRadius: "16px", 
            padding: "16px", 
            display: "flex", 
            alignItems: "center", 
            gap: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
          }}>
            <div style={{ backgroundColor: "#F0FDF4", padding: "10px", borderRadius: "12px" }}>
              <Layers size={20} color="#16A34A" />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 500 }}>Total Stock</div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>187</div>
            </div>
          </div>

          {/* Chip 3: Month Sales */}
          <div style={{ 
            minWidth: "160px", 
            backgroundColor: "white", 
            borderRadius: "16px", 
            padding: "16px", 
            display: "flex", 
            alignItems: "center", 
            gap: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
          }}>
            <div style={{ backgroundColor: "#FEF2F2", padding: "10px", borderRadius: "12px" }}>
              <CreditCard size={20} color="#DC2626" />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 500 }}>Month Sales</div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>Rs 28.5k</div>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS 2x2 GRID */}
        <div style={{ padding: "0 24px", flex: 1, display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1E293B", marginBottom: "16px" }}>Quick Actions</h3>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr", 
            gap: "16px",
            marginBottom: "24px"
          }}>
            <button style={{ 
              backgroundColor: "white", 
              borderRadius: "20px", 
              padding: "20px", 
              border: "none", 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center",
              gap: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              cursor: "pointer"
            }}>
              <div style={{ backgroundColor: "#EFF6FF", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Plus size={24} color="#3B82F6" />
              </div>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#334155" }}>Add Product</span>
            </button>
            
            <button style={{ 
              backgroundColor: "white", 
              borderRadius: "20px", 
              padding: "20px", 
              border: "none", 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center",
              gap: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              cursor: "pointer"
            }}>
              <div style={{ backgroundColor: "#F0FDF4", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShoppingCart size={24} color="#16A34A" />
              </div>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#334155" }}>New Sale</span>
            </button>
            
            <button style={{ 
              backgroundColor: "white", 
              borderRadius: "20px", 
              padding: "20px", 
              border: "none", 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center",
              gap: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              cursor: "pointer"
            }}>
              <div style={{ backgroundColor: "#FEF2F2", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Package size={24} color="#DC2626" />
              </div>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#334155" }}>New Purchase</span>
            </button>
            
            <button style={{ 
              backgroundColor: "white", 
              borderRadius: "20px", 
              padding: "20px", 
              border: "none", 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center",
              gap: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              cursor: "pointer"
            }}>
              <div style={{ backgroundColor: "#FAF5FF", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText size={24} color="#9333EA" />
              </div>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#334155" }}>View Reports</span>
            </button>
          </div>
        </div>

        {/* BOTTOM TAB BAR */}
        <div style={{ 
          height: "80px", 
          backgroundColor: "white", 
          borderTop: "1px solid #E2E8F0",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          paddingBottom: "16px",
          marginTop: "auto"
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", color: "#3B82F6" }}>
            <LayoutDashboard size={24} fill="#DBEAFE" />
            <span style={{ fontSize: "10px", fontWeight: 600 }}>Dashboard</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", color: "#94A3B8" }}>
            <Tag size={24} />
            <span style={{ fontSize: "10px", fontWeight: 500 }}>Products</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", color: "#94A3B8" }}>
            <ShoppingCart size={24} />
            <span style={{ fontSize: "10px", fontWeight: 500 }}>Sales</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", color: "#94A3B8" }}>
            <Package size={24} />
            <span style={{ fontSize: "10px", fontWeight: 500 }}>Purchase</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", color: "#94A3B8" }}>
            <BarChart3 size={24} />
            <span style={{ fontSize: "10px", fontWeight: 500 }}>Reports</span>
          </div>
        </div>

      </div>
    </>
  );
}
