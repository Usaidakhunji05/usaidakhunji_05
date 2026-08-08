import React from 'react';
import { LayoutDashboard, Package, ShoppingCart, ShoppingBag, FileText, ArrowRightLeft, TrendingUp, Activity, Box, Tag } from 'lucide-react';

export function Feed() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
      <div style={{
        width: '390px',
        height: '844px',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: "'Inter', sans-serif",
        background: '#F1F5F9',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header Banner */}
        <div style={{
          background: '#3B82F6',
          padding: '64px 24px 32px 24px',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottomLeftRadius: '32px',
          borderBottomRightRadius: '32px',
          boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)',
          zIndex: 10
        }}>
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'rgba(255,255,255,0.85)',
              marginBottom: '6px'
            }}>General</div>
            <div style={{
              fontSize: '36px',
              fontWeight: 800,
              letterSpacing: '-1.5px',
              lineHeight: 1
            }}>b mart</div>
          </div>
          <button style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '14px',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            transition: 'background 0.2s',
          }}>
            <ArrowRightLeft size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable Feed */}
        <div className="hide-scrollbar" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 20px 100px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Stat 1: Products */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '28px 24px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.03)'
          }}>
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '8px',
              background: '#3B82F6'
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '12px'
                }}>Products</div>
                <div style={{
                  fontSize: '48px',
                  fontWeight: 800,
                  color: '#0F172A',
                  lineHeight: 1,
                  letterSpacing: '-1px'
                }}>42</div>
              </div>
              <div style={{
                background: '#EFF6FF',
                color: '#3B82F6',
                padding: '14px',
                borderRadius: '16px'
              }}>
                <Tag size={26} strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Stat 2: Total Stock */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '28px 24px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.03)'
          }}>
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '8px',
              background: '#8B5CF6'
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '12px'
                }}>Total Stock</div>
                <div style={{
                  fontSize: '48px',
                  fontWeight: 800,
                  color: '#0F172A',
                  lineHeight: 1,
                  letterSpacing: '-1px'
                }}>187</div>
              </div>
              <div style={{
                background: '#F5F3FF',
                color: '#8B5CF6',
                padding: '14px',
                borderRadius: '16px'
              }}>
                <Box size={26} strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Stat 3: Today Sales */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '28px 24px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.03)'
          }}>
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '8px',
              background: '#10B981'
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '12px'
                }}>Today Sales</div>
                <div style={{
                  fontSize: '40px',
                  fontWeight: 800,
                  color: '#0F172A',
                  lineHeight: 1,
                  letterSpacing: '-1px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '4px'
                }}><span style={{ fontSize: '20px', fontWeight: 700, color: '#94A3B8', paddingBottom: '4px' }}>Rs</span>3,400</div>
              </div>
              <div style={{
                background: '#ECFDF5',
                color: '#10B981',
                padding: '14px',
                borderRadius: '16px'
              }}>
                <Activity size={26} strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Stat 4: Month Sales */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '28px 24px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.03)'
          }}>
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '8px',
              background: '#F59E0B'
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '12px'
                }}>Month Sales</div>
                <div style={{
                  fontSize: '40px',
                  fontWeight: 800,
                  color: '#0F172A',
                  lineHeight: 1,
                  letterSpacing: '-1px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '4px'
                }}><span style={{ fontSize: '20px', fontWeight: 700, color: '#94A3B8', paddingBottom: '4px' }}>Rs</span>28,500</div>
              </div>
              <div style={{
                background: '#FFFBEB',
                color: '#F59E0B',
                padding: '14px',
                borderRadius: '16px'
              }}>
                <TrendingUp size={26} strokeWidth={2} />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Tab Bar */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '84px',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 20px 24px 20px',
          zIndex: 20
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#3B82F6', gap: '6px', width: '60px' }}>
            <LayoutDashboard size={24} strokeWidth={2.5} />
            <span style={{ fontSize: '10px', fontWeight: 700 }}>Dashboard</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94A3B8', gap: '6px', width: '60px' }}>
            <Package size={24} strokeWidth={2} />
            <span style={{ fontSize: '10px', fontWeight: 500 }}>Products</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94A3B8', gap: '6px', width: '60px' }}>
            <ShoppingCart size={24} strokeWidth={2} />
            <span style={{ fontSize: '10px', fontWeight: 500 }}>Sales</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94A3B8', gap: '6px', width: '60px' }}>
            <ShoppingBag size={24} strokeWidth={2} />
            <span style={{ fontSize: '10px', fontWeight: 500 }}>Purchase</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94A3B8', gap: '6px', width: '60px' }}>
            <FileText size={24} strokeWidth={2} />
            <span style={{ fontSize: '10px', fontWeight: 500 }}>Reports</span>
          </div>
        </div>
      </div>
    </>
  );
}
