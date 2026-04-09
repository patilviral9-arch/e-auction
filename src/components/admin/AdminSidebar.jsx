import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ─── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:      '#0f172a',
  bg2:     '#1e293b',
  bg3:     '#334155',
  border:  '#1e293b',
  text:    '#94a3b8',
  textHi:  '#f1f5f9',
  textMid: '#64748b',
  blue:    '#3b82f6',
  btnBlue: '#2563eb',
  btnRed:  '#dc2626',
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icons = {
  Dashboard: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  Users: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Auctions: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2.5 9 8l-6 6 3 3 6-6 5.5-5.5-3-3z"/>
      <path d="m16 6 2 2"/><path d="m7 17-4.5 4.5"/><path d="m21 15-5 5"/>
    </svg>
  ),
  Categories: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2H3V7z"/>
      <path d="M3 9h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/>
      <path d="M10 13h4"/>
    </svg>
  ),
  Bids: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  Reports: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  Settings: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Globe: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  Logout: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Menu: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Close: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

// ─── Nav config ───────────────────────────────────────────────────────────────
const navSections = [
  { title: 'Overview',   items: [{ to: '/admin', label: 'Dashboard', icon: 'Dashboard', end: true }] },
  { title: 'Management', items: [
    { to: '/admin/Users/UsersList',   label: 'Users',    icon: 'Users'    },
    { to: '/admin/Auctions/Auctions', label: 'Auctions', icon: 'Auctions' },
    { to: '/admin/Categories/Categories', label: 'Categories', icon: 'Categories' },
  ]},
  { title: 'Bidding',   items: [{ to: '/admin/bids',     label: 'Bids',     icon: 'Bids'     }] },
  { title: 'Analytics', items: [{ to: '/admin/reports',  label: 'Reports',  icon: 'Reports'  }] },
  { title: 'System',    items: [{ to: '/admin/settings', label: 'Settings', icon: 'Settings' }] },
];

// ─── NavItem with hover state ──────────────────────────────────────────────────
function NavItem({ item, collapsed, onNavigate }) {
  const [hovered, setHovered] = useState(false);
  const Icon = Icons[item.icon];

  return (
    <NavLink
      to={item.to}
      end={item.end}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: '10px',
        padding: collapsed ? '9px' : '9px 12px',
        borderRadius: '8px',
        marginBottom: '2px',
        fontSize: '13px',
        fontWeight: isActive ? 600 : 500,
        textDecoration: 'none',
        cursor: 'pointer',
        color: isActive ? '#ffffff' : hovered ? C.textHi : C.text,
        background: isActive
          ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
          : hovered ? C.bg2 : C.bg,
        boxShadow: isActive ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
        whiteSpace: 'nowrap',
        transition: 'background 0.15s, color 0.15s, transform 0.1s',
        transform: hovered && !isActive ? 'translateX(2px)' : 'none',
        boxSizing: 'border-box',
      })}
      onClick={onNavigate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Icon />
      {!collapsed && (
        <span style={{ background: 'none', backgroundColor: 'inherit', color: 'inherit', display: 'inline' }}>
          {item.label}
        </span>
      )}
    </NavLink>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function AdminSidebar({ isMobile = false, onNavigate, onRequestClose }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [collapsed, setCollapsed]   = useState(false);
  const [webHover, setWebHover]     = useState(false);
  const [outHover, setOutHover]     = useState(false);
  const [colHover, setColHover]     = useState(false);

  useEffect(() => {
    if (isMobile) setCollapsed(false);
  }, [isMobile]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    onNavigate?.();
  };

  const handleWebsiteNav = () => {
    navigate('/');
    onNavigate?.();
  };

  const expandedWidth = isMobile ? 260 : 240;
  const sidebarWidth = collapsed ? 60 : expandedWidth;

  return (
    <div style={{
      position: isMobile ? 'relative' : 'sticky',
      top: 0,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      width: `${sidebarWidth}px`,
      minWidth: `${sidebarWidth}px`,
      maxWidth: `${sidebarWidth}px`,
      backgroundColor: C.bg,
      color: C.text,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      transition: 'width 0.3s cubic-bezier(.4,0,.2,1)',
      zIndex: 2000,
      boxShadow: isMobile ? '10px 0 32px rgba(0,0,0,0.45)' : '4px 0 24px rgba(0,0,0,0.4)',
      borderRight: `1px solid ${C.border}`,
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>

      {/* ── Header ── */}
      <div style={{
        backgroundColor: C.bg,
        padding: '18px 14px 14px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
        flexShrink: 0,
        boxSizing: 'border-box',
      }}>
        {(!collapsed || isMobile) && (
          <div style={{ backgroundColor: C.bg }}>
            <div style={{ backgroundColor: C.bg }}>
              <span style={{ backgroundColor: C.bg, color: '#ffffff', fontSize: '20px', fontWeight: 900, letterSpacing: '-0.5px' }}>E-</span>
              <span style={{ backgroundColor: C.bg, color: '#38bdf8', fontSize: '20px', fontWeight: 900, letterSpacing: '-0.5px' }}>Auction</span>
            </div>
            <span style={{ backgroundColor: C.bg, color: C.textMid, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '2px', display: 'block' }}>
              Admin Panel
            </span>
          </div>
        )}
        <button
          onClick={isMobile ? onRequestClose : () => setCollapsed(c => !c)}
          onMouseEnter={() => setColHover(true)}
          onMouseLeave={() => setColHover(false)}
          style={{
            width: '32px', height: '32px',
            backgroundColor: colHover ? C.bg3 : C.bg2,
            border: `1px solid ${C.bg3}`,
            borderRadius: '8px',
            color: colHover ? C.textHi : C.text,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'background-color 0.15s, color 0.15s',
            padding: 0,
            boxSizing: 'border-box',
          }}
        >
          {isMobile ? <Icons.Close /> : collapsed ? <Icons.ChevronRight /> : <Icons.Menu />}
        </button>
      </div>

      {/* ── Nav ── */}
      <nav style={{
        backgroundColor: C.bg,
        flex: 1,
        padding: '6px 8px',
        overflowY: 'auto',
        overflowX: 'hidden',
        minHeight: 0,
        boxSizing: 'border-box',
      }}>
        {navSections.map(section => (
          <div key={section.title} style={{ backgroundColor: C.bg }}>
            {(!collapsed || isMobile) && (
              <span style={{
                backgroundColor: C.bg,
                color: C.textMid,
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: '0 8px',
                margin: '12px 0 4px',
                fontWeight: 600,
                display: 'block',
              }}>
                {section.title}
              </span>
            )}
            {section.items.map(item => (
              <NavItem key={item.to} item={item} collapsed={collapsed && !isMobile} onNavigate={onNavigate} />
            ))}
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div style={{
        backgroundColor: C.bg,
        flexShrink: 0,
        padding: '10px 8px 14px',
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        boxSizing: 'border-box',
      }}>
        {/* Go to Website */}
        <button
          onClick={handleWebsiteNav}
          onMouseEnter={() => setWebHover(true)}
          onMouseLeave={() => setWebHover(false)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '8px',
            padding: collapsed ? '9px' : '9px 12px',
            borderRadius: '8px',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', width: '100%',
            whiteSpace: 'nowrap',
            backgroundColor: webHover ? '#1d4ed8' : C.btnBlue,
            color: '#ffffff',
            border: '1px solid #1d4ed8',
            transition: 'background-color 0.15s, transform 0.1s',
            transform: webHover ? 'translateY(-1px)' : 'none',
            boxSizing: 'border-box',
          }}
        >
          <Icons.Globe />
          {(!collapsed || isMobile) && (
            <span style={{ background: 'none', backgroundColor: 'inherit', color: 'inherit', display: 'inline' }}>
              Go to Website
            </span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          onMouseEnter={() => setOutHover(true)}
          onMouseLeave={() => setOutHover(false)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '8px',
            padding: collapsed ? '9px' : '9px 12px',
            borderRadius: '8px',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', width: '100%',
            whiteSpace: 'nowrap',
            backgroundColor: outHover ? '#b91c1c' : C.btnRed,
            color: '#ffffff',
            border: '1px solid #b91c1c',
            transition: 'background-color 0.15s, transform 0.1s',
            transform: outHover ? 'translateY(-1px)' : 'none',
            boxSizing: 'border-box',
          }}
        >
          <Icons.Logout />
          {(!collapsed || isMobile) && (
            <span style={{ background: 'none', backgroundColor: 'inherit', color: 'inherit', display: 'inline' }}>
              Logout
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
