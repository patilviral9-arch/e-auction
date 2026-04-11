import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import { formatINR } from "../auctionData";
import Swal from "sweetalert2";

// ── Mark auction Completed in DB when timer hits zero ─────────────────────────
async function markCompleted(auctionId, onStatusChange) {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/auction/auction/${auctionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Completed" }),
    });
    if (res.ok) onStatusChange(auctionId, "Completed");
  } catch { /* silent — UI already shows Completed via status override */ }
}

// ── Shared endTime-based countdown
function useCountdown(endTime, auctionId, status, onStatusChange) {
  const calc = () => {
    const diff = Math.max(0, (endTime || 0) - Date.now());
    return {
      diff,
      h: Math.floor(diff / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  };
  const [state, setState] = useState(calc);
  const firedRef = useRef(false);
  useEffect(() => {
    if (!endTime) return;
    setState(calc());
    const id = setInterval(() => {
      const next = calc();
      setState(next);
      if (next.diff === 0 && !firedRef.current && status === "Active" && auctionId && onStatusChange) {
        firedRef.current = true;
        markCompleted(auctionId, onStatusChange);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [endTime]);
  if (!endTime || state.diff === 0) return null;
  if (state.h > 0) return `${state.h}h ${String(state.m).padStart(2, "0")}m`;
  return `${String(state.m).padStart(2, "0")}m ${String(state.s).padStart(2, "0")}s`;
}

function LiveCountdown({ endTime, auctionId, status, onStatusChange }) {
  const text = useCountdown(endTime, auctionId, status, onStatusChange);
  if (!text) return <span style={{ color: "#94a3b8" }}>—</span>;
  const urgent = endTime - Date.now() < 3600000;
  return <span style={{ color: urgent ? "#f43f5e" : "#38bdf8", fontWeight: 700 }}>{text}</span>;
}

function getImg(images) {
  if (!Array.isArray(images) || images.length === 0)
    return "https://placehold.co/80x80?text=No+Img";
  const first = images[0];
  if (typeof first === "string") return first;
  return first.url || first.secure_url || "https://placehold.co/80x80?text=No+Img";
}

function computeEndTime(a) {
  if (a.endTime) return new Date(a.endTime).getTime();
  const base = a.startDate || a.createdAt;
  const mins = a.durationMinutes ?? (() => {
    const dur = a.duration || "";
    if (/1 hour/i.test(dur))   return 60;
    if (/6 hour/i.test(dur))   return 360;
    if (/12 hour/i.test(dur))  return 720;
    if (/3 day/i.test(dur))    return 4320;
    if (/7 day/i.test(dur))    return 10080;
    return 1440;
  })();
  if (base) return new Date(base).getTime() + mins * 60 * 1000;
  return null;
}

// ── Status config keyed by EXACT API status strings ──────────────────────────
// Keys: "Active" | "Scheduled" | "Completed" | "Cancelled"
const STATUS_CONFIG = {
  Active:    { bg: "rgba(244,63,94,.12)",   color: "#f43f5e", label: "🔴 Live (Active)" },
  Scheduled: { bg: "rgba(245,158,11,.12)",  color: "#f59e0b", label: "📅 Scheduled" },
  Completed: { bg: "rgba(100,116,139,.12)", color: "#94a3b8", label: "✓ Completed" },
  Cancelled: { bg: "rgba(239,68,68,.08)",   color: "#ef4444", label: "🚫 Cancelled" },
};

// normalise keeps status as the raw API value — no translation needed
function normalise(a) {
  const endTime = computeEndTime(a);
  // If the API never set a status, fall back to Scheduled
  let status  = a.status || "Scheduled";
  // Client-side override: if still Active but endTime already passed, treat as Completed
  if (status === "Active" && endTime && endTime < Date.now()) status = "Completed";
  return {
    id:          String(a._id || a.id),
    title:       a.title,
    category:    a.category,
    condition:   a.condition,
    location:    a.location,
    img:         getImg(a.images),
    images:      a.images || [],
    currentBid:  a.currentBid ?? a.startingBid ?? 0,
    startingBid: a.startingBid ?? 0,
    totalBids:   a.totalBids ?? a.bids?.length ?? 0,
    duration:    a.duration || "—",
    endTime,
    status,      // "Active" | "Scheduled" | "Completed" | "Cancelled"
    createdAt:   a.createdAt,
    tags:        a.tags || [],
  };
}

// ── Inline status changer dropdown ───────────────────────────────────────────
function StatusChanger({ auction, onStatusChange }) {
  const [open,   setOpen]   = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = async (newStatus) => {
    setOpen(false);
    if (newStatus === auction.status) return;
    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auction/auction/${auction.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: newStatus }), // send exact API value
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Server error: ${res.status}`);
      }
      onStatusChange(auction.id, newStatus); // update parent state
    } catch (err) {
      Swal.fire({ title: "Failed to update status", text: err.message, icon: "error", timer: 2500, showConfirmButton: false });
    } finally {
      setSaving(false);
    }
  };

  const cfg = STATUS_CONFIG[auction.status] || STATUS_CONFIG.Scheduled;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Current status pill — click to open dropdown */}
      <button
        onClick={() => !saving && setOpen(o => !o)}
        title="Change auction status"
        style={{
          display: "inline-flex", alignItems: "center", gap: "5px",
          padding: "4px 10px", borderRadius: "50px",
          fontSize: "11px", fontWeight: 700,
          background: cfg.bg, color: cfg.color,
          border: `1px solid ${cfg.color}44`,
          cursor: saving ? "wait" : "pointer",
          whiteSpace: "nowrap", transition: "opacity .15s, box-shadow .15s",
          opacity: saving ? 0.6 : 1,
          boxShadow: open ? `0 0 0 3px ${cfg.color}22` : "none",
        }}
      >
        {saving ? "⏳ Saving…" : cfg.label}
        {!saving && <span style={{ fontSize: "9px", opacity: 0.65, marginLeft: "1px" }}>▼</span>}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 1000,
          background: "var(--bg-secondary)", border: "1px solid var(--border)",
          borderRadius: "14px", padding: "6px", minWidth: "200px",
          boxShadow: "0 12px 32px rgba(0,0,0,0.28)",
          animation: "fadeUp .15s ease",
        }}>
          <div style={{ color: "var(--text-muted)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", padding: "6px 10px 4px" }}>
            Change Status
          </div>
          {Object.entries(STATUS_CONFIG).map(([apiStatus, { color, bg, label }]) => {
            const isCurrent = auction.status === apiStatus;
            return (
              <button
                key={apiStatus}
                onClick={() => handleSelect(apiStatus)}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  width: "100%", textAlign: "left",
                  padding: "9px 12px", borderRadius: "9px", border: "none",
                  background: isCurrent ? bg : "transparent",
                  color: isCurrent ? color : "var(--text-secondary)",
                  fontSize: "12px", fontWeight: isCurrent ? 700 : 500,
                  cursor: isCurrent ? "default" : "pointer",
                  transition: "background .1s",
                }}
                onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ flex: 1 }}>{label}</span>
                {isCurrent && (
                  <span style={{ fontSize: "11px", background: color, color: "#fff", borderRadius: "50px", padding: "1px 7px", fontWeight: 700 }}>Current</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatPill({ value, label, color }) {
  return (
    <div style={{ textAlign:"center", minWidth:"56px" }}>
      <div style={{ color: color || "var(--text-primary)", fontSize:"15px", fontWeight:800 }}>{value}</div>
      <div style={{ color:"var(--text-muted)", fontSize:"10px", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em", marginTop:"1px" }}>{label}</div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function Listings() {
  const { userId }  = useAuth();
  const { theme }   = useTheme();
  const isLight     = theme === "light";
  const navigate    = useNavigate();

  const [all,     setAll]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("all");
  const [sort,    setSort]    = useState("newest");
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== "undefined" ? window.matchMedia("(max-width: 900px)").matches : false
  ));
  const [view,    setView]    = useState(() => (
    typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches ? "grid" : "list"
  ));

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const media = window.matchMedia("(max-width: 900px)");
    const onChange = (event) => setIsMobile(event.matches);
    setIsMobile(media.matches);
    if (media.addEventListener) media.addEventListener("change", onChange);
    else media.addListener(onChange);
    return () => {
      if (media.removeEventListener) media.removeEventListener("change", onChange);
      else media.removeListener(onChange);
    };
  }, []);

  useEffect(() => {
    if (isMobile && view === "list") setView("grid");
  }, [isMobile, view]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError("");
    fetch(`${import.meta.env.VITE_API_URL}/auction/auctions`)
      .then(r => { if (!r.ok) throw new Error(`Server error: ${r.status}`); return r.json(); })
      .then(async data => {
        const list = Array.isArray(data) ? data : data.auctions ?? data.data ?? [];
        const mine = list.filter(a => {
          const c = a.createdBy;
          if (!c) return false;
          if (typeof c === "string") return c === String(userId);
          return String(c._id || c) === String(userId);
        });
        const normalised = mine.map(normalise);

        // Enrich each auction's currentBid and totalBids from the bids endpoint
        const enriched = await Promise.all(normalised.map(async (auction) => {
          try {
            const r = await fetch(`${import.meta.env.VITE_API_URL}/bid/bids/auction/${auction.id}`);
            if (!r.ok) return auction;
            const bidData = await r.json();
            const bids = bidData.data ?? [];
            if (bids.length > 0) {
              return { ...auction, currentBid: bids[0].bidAmount, totalBids: bids.length };
            }
            return auction;
          } catch { return auction; }
        }));

        setAll(enriched);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  // ── Status change handler — updates local state immediately ──────────────
  // newStatus is the exact API value: "Active" | "Scheduled" | "Completed" | "Cancelled"
  const handleStatusChange = (id, newStatus) => {
    setAll(prev => prev.map(a =>
      a.id === id ? { ...a, status: newStatus } : a
    ));
  };

  // ── derived ───────────────────────────────────────────────────────────────
  const filtered = all
    .filter(a => filter === "all" || a.status === filter)
    .filter(a =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "newest")    return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === "oldest")    return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === "highest")   return b.currentBid - a.currentBid;
      if (sort === "most-bids") return b.totalBids - a.totalBids;
      return 0;
    });

  const counts = {
    all:       all.length,
    Active:    all.filter(a => a.status === "Active").length,
    Scheduled: all.filter(a => a.status === "Scheduled").length,
    Completed: all.filter(a => a.status === "Completed").length,
    Cancelled: all.filter(a => a.status === "Cancelled").length,
  };

  const totalRevenue = all
    .filter(a => a.status === "Completed")
    .reduce((sum, a) => sum + a.currentBid, 0);

  // ── delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (auction) => {
    const swalBg    = isLight ? "#ffffff" : "#0f172a";
    const swalColor = isLight ? "#0f172a" : "#f1f5f9";
    const result = await Swal.fire({
      title: "Delete Auction?",
      text: `"${auction.title}" will be permanently removed.`,
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#e11d48", cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
      background: swalBg, color: swalColor,
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auction/auction/${auction.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setAll(prev => prev.filter(a => a.id !== auction.id));
      Swal.fire({ title:"Deleted!", icon:"success", timer:1500, showConfirmButton:false, background:swalBg, color:swalColor });
    } catch (err) {
      Swal.fire({ title:"Error", text:err.message, icon:"error", background:swalBg, color:swalColor });
    }
  };

  // ── style tokens ──────────────────────────────────────────────────────────
  const S = {
    page:  { background:"var(--bg-primary)", minHeight:"100vh", fontFamily:"system-ui, sans-serif", transition:"background 0.25s" },
    inner: { maxWidth:"1100px", margin:"0 auto", padding: isMobile ? "0 14px 34px" : "0 32px 60px" },
    card:  { background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:"16px", padding:"20px", boxShadow: isLight ? "0 2px 12px rgba(0,0,0,0.06)" : "0 2px 16px rgba(0,0,0,0.3)" },
    input: { background:"var(--bg-input)", border:"1px solid var(--border-input)", borderRadius:"10px", padding:"9px 14px", fontSize:"13px", color:"var(--text-primary)", outline:"none", fontFamily:"system-ui, sans-serif" },
    filterBtn: (active) => ({
      padding:"7px 16px", borderRadius:"50px", fontSize:"13px", fontWeight:600, cursor:"pointer", border:"none",
      background: active ? (isLight ? "#0f172a" : "#f1f5f9") : "transparent",
      color:      active ? (isLight ? "#ffffff"  : "#0f172a") : "var(--text-muted)",
      boxShadow:  active ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
      transition: "all .15s",
    }),
    viewBtn: (active) => ({
      width:"32px", height:"32px", display:"flex", alignItems:"center", justifyContent:"center",
      borderRadius:"8px", border:"1px solid var(--border)", cursor:"pointer",
      background: active ? (isLight ? "#0f172a" : "#f1f5f9") : "var(--bg-card)",
      color:      active ? (isLight ? "#ffffff"  : "#0f172a") : "var(--text-muted)",
      transition: "all .15s",
    }),
    actionBtn: { padding:"7px 14px", borderRadius:"8px", border:"1px solid var(--border)", background:"var(--bg-card)", color:"var(--text-secondary)", fontSize:"12px", fontWeight:600, cursor:"pointer", transition:"all .15s" },
    delBtn:    { padding:"7px 12px", borderRadius:"8px", border:"1px solid var(--border)", background:"var(--bg-card)", color:"var(--text-muted)", fontSize:"13px", cursor:"pointer", transition:"all .15s" },
  };

  return (
    <div style={S.page}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
        .lst-row:hover    { background: var(--bg-hover) !important; }
        .lst-card:hover   { transform:translateY(-3px); box-shadow: ${isLight ? "0 12px 32px rgba(0,0,0,0.1)" : "0 12px 32px rgba(0,0,0,0.5)"} !important; }
        .lst-action:hover { background: var(--bg-hover) !important; color: var(--text-primary) !important; border-color: var(--border-input) !important; }
        .lst-del:hover    { background: rgba(244,63,94,.12) !important; border-color: rgba(244,63,94,.4) !important; color: #f43f5e !important; }
        input::placeholder { color: var(--text-muted); }
        select option      { background: var(--bg-secondary); color: var(--text-primary); }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background:"var(--bg-secondary)", borderBottom:"1px solid var(--border)", padding: isMobile ? "22px 0 0" : "32px 0 0" }}>
        <div style={{ maxWidth:"1100px", margin:"0 auto", padding: isMobile ? "0 14px" : "0 32px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems: isMobile ? "flex-start" : "flex-end", flexWrap:"wrap", gap:"16px", marginBottom: isMobile ? "16px" : "24px" }}>
            <div>
              <div style={{ color:"var(--accent-blue)", fontSize:"12px", fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", marginBottom:"6px" }}>📋 My Auctions</div>
              <h1 style={{ color:"var(--text-primary)", fontSize: isMobile ? "24px" : "28px", fontWeight:900, margin:"0 0 4px", letterSpacing:"-0.5px" }}>My Auctions</h1>
              <p style={{ color:"var(--text-muted)", fontSize: isMobile ? "13px" : "14px", margin:0 }}>All auctions you've created</p>
            </div>
            <Link to="/create-auction" style={{ padding: isMobile ? "10px 16px" : "11px 22px", borderRadius:"12px", background:"linear-gradient(135deg,#38bdf8,#6366f1)", color:"white", fontWeight:700, fontSize:"14px", textDecoration:"none", display:"flex", alignItems:"center", gap:"6px", boxShadow:"0 4px 14px rgba(56,189,248,0.3)", whiteSpace:"nowrap" }}>
              ➕ New Auction
            </Link>
          </div>

          {/* Stat bar */}
          {!loading && all.length > 0 && (
            <div style={{ display:"flex", gap: isMobile ? "16px" : "28px", paddingBottom: isMobile ? "14px" : "20px", borderBottom:"2px solid var(--border)", flexWrap:"wrap" }}>
              <StatPill value={counts.all}       label="Total"     color="var(--text-primary)" />
              <StatPill value={counts.Active}    label="Live"      color="#f43f5e" />
              <StatPill value={counts.Scheduled} label="Scheduled" color="#f59e0b" />
              <StatPill value={counts.Completed} label="Completed" color="var(--text-muted)" />
              <StatPill value={counts.Cancelled} label="Cancelled" color="#ef4444" />
              <div style={{ marginLeft:"auto" }}>
                <StatPill value={formatINR(totalRevenue)} label="Revenue" color="#10b981" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={S.inner}>
        {/* Controls */}
        <div style={{ display:"flex", gap:"12px", alignItems:"center", margin: isMobile ? "16px 0 14px" : "24px 0 20px", flexWrap:"wrap" }}>
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"50px", padding:"4px", display:"flex", gap:"4px", maxWidth: "100%", overflowX: "auto" }}>
            {[
              ["all",       "All"],
              ["Active",    "🔴 Live"],
              ["Scheduled", "📅 Scheduled"],
              ["Completed", "✓ Completed"],
              ["Cancelled", "🚫 Cancelled"],
            ].map(([val, label]) => (
              <button key={val} style={{ ...S.filterBtn(filter === val), whiteSpace: "nowrap", flexShrink: 0 }} onClick={() => setFilter(val)}>
                {label}
                {val !== "all" && counts[val] > 0 && <span style={{ marginLeft:"4px", opacity:.55 }}>({counts[val]})</span>}
                {val === "all" && <span style={{ marginLeft:"4px", opacity:.55 }}>({counts.all})</span>}
              </button>
            ))}
          </div>

          <div style={{ position:"relative", flex:1, minWidth:"180px" }}>
            <span style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", fontSize:"14px", color:"var(--text-muted)" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or category…"
              style={{ ...S.input, width:"100%", paddingLeft:"34px", boxSizing:"border-box" }} />
          </div>

          <select value={sort} onChange={e => setSort(e.target.value)} style={{ ...S.input, cursor:"pointer", width: isMobile ? "100%" : "auto" }}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Bid</option>
            <option value="most-bids">Most Bids</option>
          </select>

          {!isMobile && (
            <div style={{ display:"flex", gap:"6px", marginLeft:"auto" }}>
              <button title="List view" onClick={() => setView("list")} style={S.viewBtn(view === "list")}>≡</button>
              <button title="Grid view" onClick={() => setView("grid")} style={S.viewBtn(view === "grid")}>▦</button>
            </div>
          )}
        </div>

        {!loading && (
          <div style={{ color:"var(--text-muted)", fontSize:"13px", marginBottom:"16px" }}>
            {filtered.length} {filtered.length === 1 ? "auction" : "auctions"} found
          </div>
        )}

        {/* States */}
        {loading ? (
          <div style={{ textAlign:"center", padding:"80px 0" }}>
            <div style={{ fontSize:"44px", marginBottom:"14px", animation:"pulse 1s infinite" }}>⏳</div>
            <div style={{ color:"var(--text-secondary)", fontSize:"15px", fontWeight:600 }}>Loading your listings…</div>
          </div>

        ) : error ? (
          <div style={{ textAlign:"center", padding:"80px 0" }}>
            <div style={{ fontSize:"44px", marginBottom:"14px" }}>⚠️</div>
            <div style={{ color:"#f43f5e", fontWeight:700, fontSize:"15px", marginBottom:"6px" }}>Could not load listings</div>
            <div style={{ color:"var(--text-muted)", fontSize:"13px", marginBottom:"20px" }}>{error}</div>
            <button onClick={() => window.location.reload()} style={{ padding:"10px 24px", borderRadius:"10px", background:"linear-gradient(135deg,#38bdf8,#6366f1)", border:"none", color:"white", fontWeight:700, cursor:"pointer" }}>Retry</button>
          </div>

        ) : all.length === 0 ? (
          <div style={{ textAlign:"center", padding:"80px 0" }}>
            <div style={{ fontSize:"52px", marginBottom:"16px" }}>📭</div>
            <div style={{ color:"var(--text-primary)", fontSize:"18px", fontWeight:700, marginBottom:"8px" }}>No auctions yet</div>
            <div style={{ color:"var(--text-muted)", fontSize:"14px", marginBottom:"28px" }}>Create your first auction and start selling.</div>
            <Link to="/create-auction" style={{ padding:"12px 28px", borderRadius:"12px", background:"linear-gradient(135deg,#38bdf8,#6366f1)", color:"white", fontWeight:700, fontSize:"14px", textDecoration:"none" }}>➕ Create Auction</Link>
          </div>

        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0" }}>
            <div style={{ fontSize:"44px", marginBottom:"14px" }}>🔍</div>
            <div style={{ color:"var(--text-primary)", fontSize:"16px", fontWeight:600, marginBottom:"6px" }}>No results</div>
            <div style={{ color:"var(--text-muted)", fontSize:"13px" }}>Try a different search or filter.</div>
          </div>

        ) : view === "list" ? (

          /* LIST VIEW */
          <div style={{ display:"flex", flexDirection:"column", gap:"10px", animation:"fadeUp .3s ease" }}>
            {filtered.map(a => (
              <div key={a.id} className="lst-row"
                style={{ ...S.card, display:"flex", gap: isMobile ? "12px" : "16px", alignItems: isMobile ? "flex-start" : "center", padding: isMobile ? "14px" : "16px 20px", transition:"background .15s", flexDirection: isMobile ? "column" : "row" }}>
                <img src={a.img} alt={a.title}
                  style={{ width: isMobile ? "100%" : "72px", height: isMobile ? "180px" : "72px", borderRadius:"10px", objectFit:"cover", flexShrink:0, border:"1px solid var(--border)", filter: a.status === "Cancelled" ? "grayscale(60%)" : "none" }} />

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px", flexWrap:"wrap" }}>
                    <div style={{ color:"var(--text-primary)", fontWeight:700, fontSize:"15px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.title}</div>
                    {/* ── Clickable status badge / changer ── */}
                    <StatusChanger auction={a} onStatusChange={handleStatusChange} />
                  </div>
                  <div style={{ color:"var(--text-muted)", fontSize:"12px", display:"flex", gap:"10px", flexWrap:"wrap" }}>
                    <span>📁 {a.category}</span>
                    <span>📍 {a.location || "—"}</span>
                    <span>⏱ {a.duration}</span>
                    {a.status === "Active" && a.endTime && (
                      <span>🔴 <LiveCountdown endTime={a.endTime} auctionId={a.id} status={a.status} onStatusChange={handleStatusChange} /></span>
                    )}
                    {a.createdAt && <span>🗓 {new Date(a.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span>}
                  </div>
                </div>

                <div style={{ display:"flex", gap:"20px", alignItems:"center", flexShrink:0, width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "space-between" : "flex-start" }}>
                  <StatPill value={formatINR(a.currentBid)} label="Current Bid" color="var(--accent-blue)" />
                  <StatPill value={a.totalBids} label="Bids" />
                </div>

                <div style={{ display:"flex", gap:"6px", flexShrink:0, width: isMobile ? "100%" : "auto" }}>
                  {a.status === "Completed" ? (
                    <button disabled style={{ padding:"7px 14px", borderRadius:"8px", border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", fontSize:"12px", fontWeight:600, cursor:"not-allowed" }}>✓ Completed</button>
                  ) : a.status === "Cancelled" ? (
                    <button disabled style={{ padding:"7px 14px", borderRadius:"8px", border:"1px solid rgba(239,68,68,0.35)", background:"rgba(239,68,68,0.06)", color:"#ef4444", fontSize:"12px", fontWeight:600, cursor:"not-allowed" }}>🚫 Cancelled</button>
                  ) : a.status === "Scheduled" ? (
                    <button disabled style={{ padding:"7px 14px", borderRadius:"8px", border:"1px solid rgba(245,158,11,0.35)", background:"rgba(245,158,11,0.08)", color:"#f59e0b", fontSize:"12px", fontWeight:600, cursor:"not-allowed" }}>📅 Not Started</button>
                  ) : (
                    <button className="lst-action" onClick={() => navigate(`/auction/${a.id}`)} style={{ ...S.actionBtn, flex: isMobile ? 1 : "unset" }}>View</button>
                  )}
                  <button className="lst-action" onClick={() => navigate(`/edit-auction/${a.id}`)} style={{ ...S.actionBtn, flex: isMobile ? 1 : "unset" }}>Edit</button>
                  <button className="lst-del"    onClick={() => handleDelete(a)}                   style={S.delBtn} title="Delete">🗑</button>
                </div>
              </div>
            ))}
          </div>

        ) : (

          /* GRID VIEW */
          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(240px, 1fr))", gap: isMobile ? "12px" : "16px", animation:"fadeUp .3s ease" }}>
            {filtered.map(a => (
              <div key={a.id} className="lst-card"
                style={{ ...S.card, padding:0, overflow:"hidden", transition:"all .25s cubic-bezier(.34,1.56,.64,1)" }}>
                <div style={{ position:"relative", height: isMobile ? "190px" : "160px", background:"var(--bg-card)", overflow:"hidden" }}>
                  <img src={a.img} alt={a.title} style={{ width:"100%", height:"100%", objectFit:"cover", filter: a.status === "Completed" || a.status === "Cancelled" ? "grayscale(35%)" : "none" }} />
                  <div style={{ position:"absolute", top:"8px", left:"8px" }}>
                    <StatusChanger auction={a} onStatusChange={handleStatusChange} />
                  </div>
                  {a.images.length > 1 && (
                    <div style={{ position:"absolute", bottom:"8px", right:"8px", background:"rgba(0,0,0,.6)", color:"white", fontSize:"10px", fontWeight:700, borderRadius:"20px", padding:"2px 8px" }}>
                      +{a.images.length - 1} photos
                    </div>
                  )}
                </div>
                  <div style={{ padding: isMobile ? "14px" : "16px" }}>
                  <div style={{ color:"var(--text-muted)", fontSize:"11px", fontWeight:600, marginBottom:"4px", textTransform:"uppercase", letterSpacing:".04em" }}>{a.category}</div>
                  <div style={{ color:"var(--text-primary)", fontWeight:700, fontSize:"14px", marginBottom:"10px", lineHeight:1.3, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{a.title}</div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"14px" }}>
                    <div>
                      <div style={{ color:"var(--text-muted)", fontSize:"10px", fontWeight:600 }}>CURRENT BID</div>
                      <div style={{ color: a.status === "Completed" || a.status === "Cancelled" ? "var(--text-secondary)" : "var(--accent-blue)", fontSize:"17px", fontWeight:800 }}>{formatINR(a.currentBid)}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      {a.status === "Active" && a.endTime ? (
                        <>
                          <div style={{ color:"var(--text-muted)", fontSize:"10px", fontWeight:600 }}>ENDS IN</div>
                          <div style={{ fontSize:"13px" }}><LiveCountdown endTime={a.endTime} auctionId={a.id} status={a.status} onStatusChange={handleStatusChange} /></div>
                        </>
                      ) : (
                        <>
                          <div style={{ color:"var(--text-muted)", fontSize:"10px", fontWeight:600 }}>BIDS</div>
                          <div style={{ color:"var(--text-primary)", fontSize:"17px", fontWeight:800 }}>{a.totalBids}</div>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:"6px" }}>
                    {a.status === "Completed" ? (
                      <button disabled style={{ flex:1, padding:"8px", borderRadius:"8px", border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", fontSize:"12px", fontWeight:700, cursor:"not-allowed" }}>✓ Completed</button>
                    ) : a.status === "Cancelled" ? (
                      <button disabled style={{ flex:1, padding:"8px", borderRadius:"8px", border:"1px solid rgba(239,68,68,0.3)", background:"rgba(239,68,68,0.06)", color:"#ef4444", fontSize:"12px", fontWeight:700, cursor:"not-allowed" }}>🚫 Cancelled</button>
                    ) : a.status === "Scheduled" ? (
                      <button disabled style={{ flex:1, padding:"8px", borderRadius:"8px", border:"1px solid rgba(245,158,11,0.35)", background:"rgba(245,158,11,0.08)", color:"#f59e0b", fontSize:"12px", fontWeight:700, cursor:"not-allowed" }}>📅 Not Started</button>
                    ) : (
                      <button className="lst-action" onClick={() => navigate(`/auction/${a.id}`)} style={{ ...S.actionBtn, flex:1, textAlign:"center" }}>View</button>
                    )}
                    <button onClick={() => navigate(`/edit-auction/${a.id}`)} style={{ flex:1, padding:"8px", borderRadius:"8px", background:"linear-gradient(135deg,#38bdf8,#6366f1)", border:"none", color:"white", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>Edit</button>
                    <button className="lst-del" onClick={() => handleDelete(a)} style={S.delBtn}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

