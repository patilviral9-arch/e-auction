import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useMaintenanceMode } from "../../hooks/useMaintenanceMode";

/* Ã¢â€â‚¬Ã¢â€â‚¬ SVG Icon Components Ã¢â€â‚¬Ã¢â€â‚¬ */
const Icon = ({ d, size = 16, strokeWidth = 1.75, fill = "none", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size} height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
    {...props}
  >
    {d}
  </svg>
);

const Icons = {
  Home:        <Icon d={<><path d="M3 9.75L12 3l9 6.75V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.75z"/><path d="M9 21V12h6v9"/></>} />,
  Browse:      <Icon d={<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></>} />,
  Live:        <Icon d={<><circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4M2.1 2.1a15 15 0 0 0 0 19.8M21.9 2.1a15 15 0 0 1 0 19.8"/></>} />,
  Bids:        <Icon d={<><path d="M7 7H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-3"/><path d="M12 3v10M9 6l3-3 3 3"/></>} />,
  Wishlist:    <Icon d={<><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></>} />,
  Won:         <Icon d={<><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></>} />,
  NewAuction:  <Icon d={<><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></>} />,
  MyAuctions:  <Icon d={<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>} />,
  Payouts:     <Icon d={<><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></>} />,
  Moon:        <Icon d={<><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>} />,
  Sun:         <Icon d={<><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>} />,
  Bell:        <Icon d={<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>} />,
  Search:      <Icon d={<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></>} />,
  User:        <Icon d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} />,
  Building:    <Icon d={<><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22V12h6v10"/><path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01"/></>} />,
  Tag:         <Icon d={<><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>} />,
  Trophy:      <Icon d={<><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></>} />,
  CreditCard:  <Icon d={<><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></>} />,
  List:        <Icon d={<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>} />,
  Analytics:   <Icon d={<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>} />,
  DollarSign:  <Icon d={<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>} />,
  Settings:    <Icon d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>} />,
  Logout:      <Icon d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>} />,
  Check:       <Icon d={<polyline points="20 6 9 17 4 12"/>} size={14} strokeWidth={2.5} />,
  ChevronDown: <Icon d={<polyline points="6 9 12 15 18 9"/>} size={12} strokeWidth={2.5} />,
};

/* Ã¢â€â‚¬Ã¢â€â‚¬ tiny hook: close on outside click Ã¢â€â‚¬Ã¢â€â‚¬ */
function useOutsideClick(ref, cb) {
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) cb(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, cb]);
}

export const UserNavbar = ({
  role: roleProp,
  userName: userNameProp,
  setRole: setRoleProp,
  onLogout,
  maintenanceMode: maintenanceModeProp,
}) => {
  const authCtx  = useAuth();
  const role     = authCtx.role;
  const userName = authCtx.userName;
  const maintenanceModeFromStorage = useMaintenanceMode();
  const maintenanceMode = typeof maintenanceModeProp === "boolean"
    ? maintenanceModeProp
    : maintenanceModeFromStorage;
  const isMaintenanceLock = false;
  const maintenanceMessage = "Website is in Maintenance";
  const maintenanceSlotCount = role === "business" ? 5 : role === "personal" ? 5 : 3;

  // FIX 1: Guard avatar Ã¢â‚¬â€ only use it if it's a valid non-empty string
  const avatar = typeof authCtx.avatar === "string" && authCtx.avatar.trim() ? authCtx.avatar : null;

  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  const location  = useLocation();
  const navigate  = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [themeOpen,   setThemeOpen]   = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const [activeHover, setActiveHover] = useState(null);
  const [notifCount,  setNotifCount]  = useState(0);
  const [isMobile,    setIsMobile]    = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 1024;
  });

  // FIX 2: Track broken image so we fall back to the initial-letter avatar
  const [avatarError, setAvatarError] = useState(false);

  const profileRef = useRef(null);
  const themeRef   = useRef(null);

  useOutsideClick(profileRef, () => setProfileOpen(false));
  useOutsideClick(themeRef,   () => setThemeOpen(false));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Reset avatar error when avatar URL changes
  useEffect(() => {
    setAvatarError(false);
  }, [avatar]);

  // Fetch unread notification count for the logged-in user
  const { userId } = authCtx;
  useEffect(() => {
    if (!userId || role === "guest") return;
    fetch(`${import.meta.env.VITE_API_URL}/notification/${userId}/unread-count`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setNotifCount(data.count ?? data.unread ?? 0);
      })
      .catch(() => {});
  }, [userId, role]);

  // FIX 3: Guard userName so it never renders as "undefined"
  const displayName = userName || "User";
  const initial = displayName.charAt(0).toUpperCase();
  const { logout } = useAuth();

  const handleLogout = () => { logout(); navigate("/"); };
  const isActive = (path) => location.pathname === path;
  const navItems = [
    { to: "/", icon: Icons.Home, label: "Home" },
    { to: "/browse", icon: Icons.Browse, label: "Browse" },
    { to: "/LiveAuctions", icon: Icons.Live, label: "Live" },
    ...(role === "personal"
      ? [
          { to: "/wallet", icon: Icons.CreditCard, label: "Wallet" },
          { to: "/my-bids", icon: Icons.Bids, label: "My Bids" },
          { to: "/MyWishlist", icon: Icons.Wishlist, label: "Wishlist" },
          { to: "/won", icon: Icons.Won, label: "Won" },
        ]
      : []),
    ...(role === "business"
      ? [
          { to: "/add-auction", icon: Icons.NewAuction, label: "New Auction" },
          { to: "/Business/Listings", icon: Icons.MyAuctions, label: "My Auctions" },
          { to: "/MyWishlist", icon: Icons.Wishlist, label: "Wishlist" },
          { to: "/payouts", icon: Icons.Payouts, label: "Payouts" },
        ]
      : []),
  ];

  /* Ã¢â€â‚¬Ã¢â€â‚¬ shared link renderer Ã¢â€â‚¬Ã¢â€â‚¬ */
  const NavLink = ({ to, label, icon }) => (
    <Link
      to={to}
      onMouseEnter={() => setActiveHover(to)}
      onMouseLeave={() => setActiveHover(null)}
      style={{
        position: "relative",
        display: "flex", alignItems: "center", justifyContent: isMobile ? "center" : "flex-start", gap: isMobile ? "4px" : "6px",
        padding: isMobile ? "8px 6px" : "6px 12px", borderRadius: "8px",
        color: isActive(to)
          ? "var(--accent-blue)"
          : activeHover === to
            ? "var(--text-primary)"
            : "var(--text-secondary)",
        textDecoration: "none", fontWeight: 600, fontSize: isMobile ? "12px" : "14px",
        letterSpacing: "0.01em", transition: "all 0.2s", whiteSpace: "nowrap", flexShrink: 0,
        width: isMobile ? "100%" : "auto",
        minWidth: 0,
        overflow: "hidden",
        background: isActive(to)
          ? "rgba(56,189,248,0.08)"
          : activeHover === to
            ? isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.05)"
            : "transparent",
        borderBottom: isActive(to) ? "2px solid var(--accent-blue)" : "2px solid transparent",
      }}
    >
      {icon && <span style={{ display: "flex", alignItems: "center" }}>{icon}</span>}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
    </Link>
  );

  /* Ã¢â€â‚¬Ã¢â€â‚¬ Avatar renderer Ã¢â‚¬â€ image with fallback to initial letter Ã¢â€â‚¬Ã¢â€â‚¬ */
  const AvatarDisplay = ({ size = 32, borderRadius = "8px" }) => {
    const style = { width: `${size}px`, height: `${size}px`, borderRadius, objectFit: "cover", display: "block" };
    if (avatar && !avatarError) {
      return (
        <img
          src={avatar}
          alt="avatar"
          style={style}
          onError={() => setAvatarError(true)}
        />
      );
    }
    return (
      <div style={{
        width: `${size}px`, height: `${size}px`, borderRadius,
        background: "linear-gradient(135deg, #38bdf8, #6366f1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: `${Math.round(size * 0.44)}px`, fontWeight: 800, color: "white",
        flexShrink: 0,
      }}>
        {initial}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "auto" }}>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ MAIN NAVBAR Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 999,
        display: "flex", alignItems: "center", justifyContent: "flex-start",
        flexWrap: isMobile ? "wrap" : "nowrap",
        padding: isMobile ? "8px 12px" : "0 32px", minHeight: "64px",
        background: isLight
          ? scrolled ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.95)"
          : scrolled ? "rgba(15,23,42,0.97)"    : "rgba(15,23,42,0.95)",
        backdropFilter: "blur(16px)",
        borderBottom: isLight ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.07)",
        boxShadow: scrolled
          ? isLight ? "0 4px 24px rgba(0,0,0,0.08)" : "0 4px 24px rgba(0,0,0,0.4)"
          : "none",
        transition: "all 0.3s ease",
      }}>

        {/* LEFT: Logo / Maintenance */}
        {isMaintenanceLock ? (
          <span
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              background: "rgba(245,158,11,0.12)",
              border: "1px solid rgba(245,158,11,0.25)",
              color: "#f59e0b",
              fontSize: "12px",
              fontWeight: 700,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {maintenanceMessage}
          </span>
        ) : (
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}>
            <span style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: isMobile ? "18px" : "20px", letterSpacing: "-0.02em" }}>
              E-<span style={{ color: "var(--accent-blue)" }}>Auction</span>
            </span>
          </Link>
        )}

        {/* CENTER: Nav links */}
        <div style={{
          display: isMobile ? "grid" : "flex",
          gridTemplateColumns: isMobile ? "repeat(4, minmax(0, 1fr))" : undefined,
          alignItems: "center",
          gap: isMobile ? "6px" : "4px",
          marginLeft: isMobile ? 0 : "32px",
          width: isMobile ? "100%" : "auto",
          overflowX: "visible",
          paddingTop: isMobile ? "8px" : 0,
          paddingBottom: isMobile ? "6px" : 0,
          order: isMobile ? 3 : 2,
        }}>
          {isMaintenanceLock ? (
            <>
              {Array.from({ length: maintenanceSlotCount }, (_, index) => index).map((item) => (
                <span
                  key={item}
                  style={{
                    padding: "6px 8px",
                    borderRadius: "8px",
                    background: "rgba(245,158,11,0.12)",
                    border: "1px solid rgba(245,158,11,0.25)",
                    color: "#f59e0b",
                    fontSize: "12px",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    width: isMobile ? "100%" : "auto",
                    textAlign: "center",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {maintenanceMessage}
                </span>
              ))}
            </>
          ) : (
            <>
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} icon={item.icon} label={item.label} />
              ))}
            </>
          )}
        </div>

        {/* RIGHT: Theme + Auth / Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "12px", marginLeft: "auto", order: 2 }}>
          {isMaintenanceLock && (
            <span style={{
              padding: "6px 10px",
              borderRadius: "8px",
              background: "rgba(245,158,11,0.12)",
              border: "1px solid rgba(245,158,11,0.25)",
              color: "#f59e0b",
              fontSize: "12px",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}>
              {maintenanceMessage}
            </span>
          )}

          {/* Ã¢â€â‚¬Ã¢â€â‚¬ Theme Toggle Ã¢â€â‚¬Ã¢â€â‚¬ */}
          {!isMaintenanceLock && (
            <div ref={themeRef} style={{ position: "relative" }}>
            <button
              onClick={() => setThemeOpen(o => !o)}
              title="Switch theme"
              style={{
                background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
                border: isLight ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px", width: "38px", height: "38px",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--text-secondary)", transition: "all 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}
              onMouseLeave={e => e.currentTarget.style.background = isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)"}
            >
              {isLight ? Icons.Moon : Icons.Sun}
            </button>

            {themeOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 10px)", right: 0,
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "14px", overflow: "hidden",
                width: "160px",
                boxShadow: "0 16px 40px var(--shadow)",
                animation: "fadeDown 0.2s ease",
                zIndex: 1002,
              }}>
                <div style={{ padding: "10px 12px 6px", color: "var(--text-muted)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Appearance
                </div>
                {[
                  { val: "light", icon: Icons.Sun,  label: "Light" },
                  { val: "dark",  icon: Icons.Moon, label: "Dark"  },
                ].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => { toggleTheme(opt.val); setThemeOpen(false); }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: "10px",
                      padding: "10px 14px", border: "none", cursor: "pointer",
                      background: theme === opt.val
                        ? "rgba(56,189,248,0.12)"
                        : "transparent",
                      color: theme === opt.val ? "var(--accent-blue)" : "var(--text-secondary)",
                      fontSize: "13px", fontWeight: theme === opt.val ? 700 : 500,
                      transition: "all 0.15s", textAlign: "left",
                    }}
                    onMouseEnter={e => { if (theme !== opt.val) e.currentTarget.style.background = isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.05)"; }}
                    onMouseLeave={e => { if (theme !== opt.val) e.currentTarget.style.background = "transparent"; }}
                  >
                    {opt.icon}
                    {opt.label}
                    {theme === opt.val && <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", color: "var(--accent-blue)" }}>{Icons.Check}</span>}
                  </button>
                ))}
                <div style={{ height: "6px" }} />
              </div>
            )}
            </div>
          )}

          {/* Notifications */}
          {!isMaintenanceLock && role !== "guest" && (
            <button style={{
              position: "relative",
              background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
              border: isLight ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px", width: "38px", height: "38px",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-secondary)", cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)"}
            onClick={() => { setNotifCount(0); navigate("/notifications"); }}
            >
              {Icons.Bell}
              {notifCount > 0 && (
                <span style={{ position: "absolute", top: "6px", right: "6px", width: "8px", height: "8px", borderRadius: "50%", background: "#f43f5e", border: "2px solid var(--bg-nav)" }} />
              )}
            </button>
          )}

          {/* Search icon */}
          {!isMaintenanceLock && !isMobile && (
            <button style={{
              background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
              border: isLight ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px", width: "38px", height: "38px",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-secondary)", cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)"}
            onClick={() => navigate("/browse")}
            >
              {Icons.Search}
            </button>
          )}

          {/* Guest: Login / Signup */}
          {(role === "guest" || !role) ? (
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => navigate("/Login")} style={{
                color: "var(--text-secondary)", background: "transparent",
                border: "1px solid var(--border-input)",
                borderRadius: "8px", padding: isMobile ? "7px 12px" : "7px 16px",
                fontSize: isMobile ? "13px" : "14px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.borderColor = "rgba(56,189,248,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "var(--border-input)"; }}
              >{isMaintenanceLock ? "Admin Login" : "Log in"}</button>
              {!isMaintenanceLock && !isMobile && (
                <button onClick={() => navigate("/Signup")} style={{
                  background: "linear-gradient(135deg, #38bdf8, #6366f1)",
                  color: "white", border: "none", borderRadius: "8px", padding: "7px 18px",
                  fontSize: "14px", fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(56,189,248,0.3)", transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(56,189,248,0.45)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(56,189,248,0.3)"; }}
                >Sign Up</button>
              )}
            </div>
          ) : isMaintenanceLock ? (
            <button
              onClick={handleLogout}
              style={{
                background: "rgba(244,63,94,0.1)",
                border: "1px solid rgba(244,63,94,0.25)",
                borderRadius: "8px",
                color: "#f43f5e",
                padding: "7px 14px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {Icons.Logout}
              Log Out
            </button>
          ) : (
            /* Profile dropdown */
            <div ref={profileRef} style={{ position: "relative" }}>
              <button onClick={() => setProfileOpen(o => !o)} style={{
                display: "flex", alignItems: "center", gap: "10px",
                background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)",
                border: isLight ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.12)",
                borderRadius: "12px", padding: isMobile ? "5px" : "5px 12px 5px 5px",
                cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}
              onMouseLeave={e => e.currentTarget.style.background = isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)"}
              >
                {/* FIX: Use AvatarDisplay which handles null/broken URLs gracefully */}
                <AvatarDisplay size={32} borderRadius="8px" />
                {!isMobile && (
                  <div style={{ textAlign: "left" }}>
                    <div style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 700 }}>{displayName}</div>
                    <div style={{ color: "var(--accent-blue)", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ display: "flex", alignItems: "center" }}>
                        {role === "business" ? Icons.Building : Icons.User}
                      </span>
                      {role === "business" ? "Business" : "Personal"}
                    </div>
                  </div>
                )}
                <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", transform: profileOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
                  {Icons.ChevronDown}
                </span>
              </button>

              {profileOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 10px)", right: 0,
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "16px", overflow: "hidden", width: "220px",
                  boxShadow: "0 24px 48px var(--shadow)",
                  animation: "fadeDown 0.2s ease", zIndex: 1001,
                }}>
                  <div style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ color: "var(--text-muted)", fontSize: "11px", marginBottom: "4px" }}>Signed in as</div>
                    <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "15px" }}>{displayName}</div>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: "5px", marginTop: "6px",
                      background: role === "business" ? "rgba(99,102,241,0.15)" : "rgba(56,189,248,0.15)",
                      color: role === "business" ? "var(--accent-indigo)" : "var(--accent-blue)",
                      fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
                      letterSpacing: "0.06em", padding: "3px 8px", borderRadius: "6px",
                    }}>
                      {role === "business" ? Icons.Building : Icons.User}
                      {role === "business" ? "Business Account" : "Personal Account"}
                    </div>
                  </div>

                  {role === "personal" && (
                    <>
                      <DropItem to="/profile"         icon={Icons.User}       label="My Profile"      onClick={() => setProfileOpen(false)} isLight={isLight} />
                      <DropItem to="/my-bids"         icon={Icons.Tag}        label="Active Bids"     onClick={() => setProfileOpen(false)} isLight={isLight} />
                      <DropItem to="/won"             icon={Icons.Trophy}     label="Won Auctions"    onClick={() => setProfileOpen(false)} isLight={isLight} />
                      <DropItem to="/MyWishlist"      icon={Icons.Wishlist}   label="Wishlist"        onClick={() => setProfileOpen(false)} isLight={isLight} />
                      <DropItem to="/wallet"          icon={Icons.CreditCard} label="Wallet"          onClick={() => setProfileOpen(false)} isLight={isLight} />
                    </>
                  )}
                  {role === "business" && (
                    <>
                      <DropItem to="/profile"          icon={Icons.Building}   label="Business Profile" onClick={() => setProfileOpen(false)} isLight={isLight} />
                      <DropItem to="/Business/Listings" icon={Icons.List}      label="My Auctions"      onClick={() => setProfileOpen(false)} isLight={isLight} />
                      <DropItem to="/add-auction"      icon={Icons.NewAuction} label="New Auction"      onClick={() => setProfileOpen(false)} isLight={isLight} />
                      <DropItem to="/analytics"        icon={Icons.Analytics}  label="Analytics"        onClick={() => setProfileOpen(false)} isLight={isLight} />
                      <DropItem to="/payouts"          icon={Icons.DollarSign} label="Payouts"          onClick={() => setProfileOpen(false)} isLight={isLight} />
                    </>
                  )}

                  <div
                    onClick={() => { setProfileOpen(false); navigate("/profile", { state: { tab: 1 } }); }}
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", color: isLight ? "#334155" : "#94a3b8", fontSize: "13px", transition: "all 0.15s", cursor: "pointer" }}
                    onMouseEnter={e => { e.currentTarget.style.background = isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.05)"; e.currentTarget.style.color = isLight ? "#0f172a" : "white"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = isLight ? "#334155" : "#94a3b8"; }}
                  >
                    <span style={{ display: "flex", alignItems: "center" }}>{Icons.Settings}</span>
                    <span>Settings</span>
                  </div>

                  <div style={{ padding: "10px 12px 12px" }}>
                    <button onClick={handleLogout} style={{
                      width: "100%", padding: "9px",
                      background: "rgba(244,63,94,0.1)",
                      border: "1px solid rgba(244,63,94,0.25)",
                      borderRadius: "8px", color: "#f43f5e",
                      fontSize: "13px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(244,63,94,0.2)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(244,63,94,0.1)"}
                    >
                      {Icons.Logout}
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {isMaintenanceLock && (
        <div style={{
          width: "100%",
          borderBottom: isLight ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.08)",
          background: isLight ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.15)",
          color: "#f59e0b",
          fontSize: "13px",
          fontWeight: 700,
          letterSpacing: "0.02em",
          padding: isMobile ? "8px 12px" : "8px 32px",
        }}>
          {maintenanceMessage}
        </div>
      )}

      <style>{`
        @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeDown  { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

/* Ã¢â€â‚¬Ã¢â€â‚¬ Dropdown item helper Ã¢â€â‚¬Ã¢â€â‚¬ */
const DropItem = ({ to, icon, label, onClick, isLight }) => (
  <Link to={to} onClick={onClick} style={{ textDecoration: "none" }}>
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "10px 16px", color: "var(--text-secondary)",
      fontSize: "13px", transition: "all 0.15s", cursor: "pointer",
    }}
    onMouseEnter={e => { e.currentTarget.style.background = isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "var(--text-primary)"; }}
    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
    >
      <span style={{ display: "flex", alignItems: "center" }}>{icon}</span>
      <span>{label}</span>
    </div>
  </Link>
);

export default UserNavbar;

