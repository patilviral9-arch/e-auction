import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

/* ── tiny hook: close on outside click ── */
function useOutsideClick(ref, cb) {
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) cb(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, cb]);
}

/* ── category data ── */
const CATEGORIES = [
  { label: "Electronics",   icon: "⚡", sub: ["Smartphones","Laptops","Cameras","Audio"] },
  { label: "Vehicles",      icon: "🚗", sub: ["Motorcycles","Cars","Boats","Parts"] },
  { label: "Collectibles",  icon: "🏺", sub: ["Coins","Stamps","Art","Antiques"] },
  { label: "Luxury",        icon: "💎", sub: ["Watches","Jewellery","Bags","Pens"] },
  { label: "Real Estate",   icon: "🏠", sub: ["Residential","Commercial","Land"] },
  { label: "Industrial",    icon: "🏭", sub: ["Machinery","Tools","Equipment"] },
];

export const UserNavbar = ({ role: roleProp, userName: userNameProp, setRole: setRoleProp, onLogout }) => {
  // Pull live auth state from context so navbar updates instantly on login/logout
  // AuthContext is always available (provided by AppShell inside the router)
  const authCtx  = useAuth();
  const role     = authCtx.role;
  const userName = authCtx.userName;
  const location  = useLocation();
  const navigate  = useNavigate();

  const [catOpen,     setCatOpen]     = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const [activeHover, setActiveHover] = useState(null);

  const catRef     = useRef(null);
  const profileRef = useRef(null);

  useOutsideClick(catRef,     () => setCatOpen(false));
  useOutsideClick(profileRef, () => setProfileOpen(false));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const initial = userName?.charAt(0).toUpperCase() || "U";

  const { logout } = useAuth();

  const handleLogout = () => {
    logout();        // update context state
    navigate("/");   // redirect
  };

  const isActive = (path) => location.pathname === path;

  /* ── shared link renderer ── */
  const NavLink = ({ to, children, icon }) => (
    <Link
      to={to}
      onMouseEnter={() => setActiveHover(to)}
      onMouseLeave={() => setActiveHover(null)}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        borderRadius: "8px",
        color: isActive(to) ? "#38bdf8" : activeHover === to ? "#e2e8f0" : "#94a3b8",
        textDecoration: "none",
        fontWeight: 600,
        fontSize: "14px",
        letterSpacing: "0.01em",
        transition: "all 0.2s",
        background: isActive(to) ? "rgba(56,189,248,0.08)" : activeHover === to ? "rgba(255,255,255,0.05)" : "transparent",
        borderBottom: isActive(to) ? "2px solid #38bdf8" : "2px solid transparent",
      }}
    >
      {icon && <span style={{ fontSize: "15px" }}>{icon}</span>}
      {children}
    </Link>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "auto" }}>

      {/* ── MAIN NAVBAR ── */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        height: "64px",
        background: scrolled
          ? "rgba(15,23,42,0.97)"
          : "rgba(15,23,42,0.95)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.4)" : "none",
        transition: "all 0.3s ease",
      }}>

        {/* LEFT: Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}>
          <span style={{ color: "white", fontWeight: 800, fontSize: "20px", letterSpacing: "-0.02em" }}>
            E-<span style={{ color: "#38bdf8" }}>Auction</span>
          </span>
        </Link>

        {/* CENTER: Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <NavLink to="/" icon="🏠">Home</NavLink>
          <NavLink to="/browse" icon="🔍">Browse</NavLink>

          {/* ── Categories Dropdown ── */}
          <div ref={catRef} style={{ position: "relative" }}>
            <button
              onClick={() => setCatOpen(o => !o)}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "6px 12px", borderRadius: "8px",
                color: catOpen ? "#38bdf8" : "#94a3b8",
                background: catOpen ? "rgba(56,189,248,0.08)" : "transparent",
                border: "none", cursor: "pointer",
                fontWeight: 600, fontSize: "14px",
                transition: "all 0.2s",
              }}
            >
              <span>📂</span> Categories
              <span style={{
                display: "inline-block",
                transform: catOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.25s",
                fontSize: "10px",
              }}>▼</span>
            </button>

            {catOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 10px)", left: "50%",
                transform: "translateX(-50%)",
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "16px",
                padding: "16px",
                width: "520px",
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                gap: "8px",
                boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
                animation: "fadeDown 0.2s ease",
                zIndex: 1000,
              }}>
                {CATEGORIES.map(cat => (
                  <Link
                    key={cat.label}
                    to={`/category/${cat.label.toLowerCase()}`}
                    onClick={() => setCatOpen(false)}
                    style={{ textDecoration: "none" }}
                  >
                    <div style={{
                      padding: "12px 14px",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      transition: "all 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "rgba(56,189,248,0.08)";
                      e.currentTarget.style.borderColor = "rgba(56,189,248,0.3)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                    }}
                    >
                      <div style={{ fontSize: "22px", marginBottom: "4px" }}>{cat.icon}</div>
                      <div style={{ color: "white", fontWeight: 700, fontSize: "13px", marginBottom: "4px" }}>{cat.label}</div>
                      <div style={{ color: "#64748b", fontSize: "11px" }}>{cat.sub.join(" · ")}</div>
                    </div>
                  </Link>
                ))}
                <div style={{
                  gridColumn: "1 / -1",
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                  marginTop: "8px", paddingTop: "12px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ color: "#64748b", fontSize: "12px" }}>Can't find what you need?</span>
                  <Link to="/browse" onClick={() => setCatOpen(false)} style={{
                    color: "#38bdf8", fontSize: "12px", fontWeight: 700, textDecoration: "none",
                    padding: "4px 12px", border: "1px solid rgba(56,189,248,0.3)", borderRadius: "6px",
                  }}>View All →</Link>
                </div>
              </div>
            )}
          </div>

          {/* Live Auctions always visible */}
          <NavLink to="/live" icon="🔴">Live</NavLink>

          {/* ── Personal role links ── */}
          {role === "personal" && (
            <>
              <NavLink to="/my-bids" icon="🏷️">My Bids</NavLink>
              <NavLink to="/watchlist" icon="👁️">Watchlist</NavLink>
              <NavLink to="/won" icon="🏆">Won</NavLink>
            </>
          )}

          {/* ── Business role links ── */}
          {role === "business" && (
            <>
              <NavLink to="/create-auction" icon="➕">New Auction</NavLink>
              <NavLink to="/profile" icon="📋">Listings</NavLink>
              <NavLink to="/analytics" icon="📊">Analytics</NavLink>
              <NavLink to="/payouts" icon="💰">Payouts</NavLink>
            </>
          )}
        </div>

        {/* RIGHT: Auth / Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

          {/* Notifications (logged in only) */}
          {role !== "guest" && (
            <button style={{
              position: "relative", background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px", width: "38px", height: "38px",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#94a3b8", cursor: "pointer", fontSize: "16px",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            >
              🔔
              <span style={{
                position: "absolute", top: "6px", right: "6px",
                width: "8px", height: "8px", borderRadius: "50%",
                background: "#f43f5e", border: "2px solid #0f172a",
              }}></span>
            </button>
          )}

          {/* Search icon */}
          <button style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px", width: "38px", height: "38px",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#94a3b8", cursor: "pointer", fontSize: "16px",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
          onClick={() => navigate("/browse")}
          >🔍</button>

          {/* Guest: Login / Signup */}
          {(role === "guest" || !role) ? (
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => navigate("/Login")} style={{
                color: "#94a3b8", background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px", padding: "7px 16px",
                fontSize: "14px", fontWeight: 600, cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
              >Log in</button>
              <button onClick={() => navigate("/Signup")} style={{
                background: "linear-gradient(135deg, #38bdf8, #6366f1)",
                color: "white", border: "none",
                borderRadius: "8px", padding: "7px 18px",
                fontSize: "14px", fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 14px rgba(56,189,248,0.3)",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(56,189,248,0.45)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(56,189,248,0.3)"; }}
              >Sign Up</button>
            </div>
          ) : (
            /* Profile dropdown */
            <div ref={profileRef} style={{ position: "relative" }}>
              <button onClick={() => setProfileOpen(o => !o)} style={{
                display: "flex", alignItems: "center", gap: "10px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "12px", padding: "5px 12px 5px 5px",
                cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
              >
                <div style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  background: "linear-gradient(135deg, #38bdf8, #6366f1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px", fontWeight: 800, color: "white",
                }}>{initial}</div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ color: "white", fontSize: "13px", fontWeight: 700 }}>{userName}</div>
                  <div style={{ color: "#38bdf8", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {role === "business" ? "🏢 Business" : "👤 Personal"}
                  </div>
                </div>
                <span style={{ color: "#64748b", fontSize: "10px", transform: profileOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▼</span>
              </button>

              {profileOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 10px)", right: 0,
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "16px", overflow: "hidden",
                  width: "220px",
                  boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
                  animation: "fadeDown 0.2s ease",
                  zIndex: 1001,
                }}>
                  <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    <div style={{ color: "#64748b", fontSize: "11px", marginBottom: "4px" }}>Signed in as</div>
                    <div style={{ color: "white", fontWeight: 700, fontSize: "15px" }}>{userName}</div>
                    <div style={{
                      display: "inline-block", marginTop: "6px",
                      background: role === "business" ? "rgba(99,102,241,0.15)" : "rgba(56,189,248,0.15)",
                      color: role === "business" ? "#818cf8" : "#38bdf8",
                      fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
                      letterSpacing: "0.06em", padding: "3px 8px", borderRadius: "6px",
                    }}>
                      {role === "business" ? "🏢 Business Account" : "👤 Personal Account"}
                    </div>
                  </div>

                  {/* Role-specific menu items */}
                  {role === "personal" && (
                    <>
                      <DropItem to="/profile" icon="👤" label="My Profile" onClick={() => setProfileOpen(false)} />
                      <DropItem to="/my-bids" icon="🏷️" label="Active Bids" onClick={() => setProfileOpen(false)} />
                      <DropItem to="/won" icon="🏆" label="Won Auctions" onClick={() => setProfileOpen(false)} />
                      <DropItem to="/watchlist" icon="👁️" label="Watchlist" onClick={() => setProfileOpen(false)} />
                      <DropItem to="/payment-methods" icon="💳" label="Payment Methods" onClick={() => setProfileOpen(false)} />
                    </>
                  )}

                  {role === "business" && (
                    <>
                      <DropItem to="/profile" icon="🏢" label="Business Profile" onClick={() => setProfileOpen(false)} />
                      <DropItem to="/my-listings" icon="📋" label="My Listings" onClick={() => setProfileOpen(false)} />
                      <DropItem to="/create-auction" icon="➕" label="New Auction" onClick={() => setProfileOpen(false)} />
                      <DropItem to="/analytics" icon="📊" label="Analytics" onClick={() => setProfileOpen(false)} />
                      <DropItem to="/payouts" icon="💰" label="Payouts" onClick={() => setProfileOpen(false)} />
                    </>
                  )}

                  <DropItem to="/settings" icon="⚙️" label="Settings" onClick={() => setProfileOpen(false)} />

                  <div style={{ padding: "10px 12px 12px" }}>
                    <button onClick={handleLogout} style={{
                      width: "100%", padding: "9px",
                      background: "rgba(244,63,94,0.1)",
                      border: "1px solid rgba(244,63,94,0.25)",
                      borderRadius: "8px",
                      color: "#f43f5e", fontSize: "13px", fontWeight: 700,
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(244,63,94,0.2)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(244,63,94,0.1)"}
                    >🚪 Log Out</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Page Content is rendered by the router shell; Navbar no longer renders <Outlet/> */}


      <style>{`
        @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeDown  { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

/* ── Dropdown item helper ── */
const DropItem = ({ to, icon, label, onClick }) => (
  <Link to={to} onClick={onClick} style={{ textDecoration: "none" }}>
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "10px 16px", color: "#94a3b8",
      fontSize: "13px", transition: "all 0.15s", cursor: "pointer",
    }}
    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "white"; }}
    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
    >
      <span style={{ fontSize: "15px" }}>{icon}</span>
      <span>{label}</span>
    </div>
  </Link>
);

export default UserNavbar;
