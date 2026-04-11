import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useThemeStyles } from "../utils/themeStyles";
import { useAuth } from "../context/AuthContext";
import FooterComponent from "../components/user/FooterComponent";

const API = `${import.meta.env.VITE_API_URL}/wish`;

// ── inline helpers ────────────────────────────────────────────────────────────
const formatINR = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

// Resolve endTime ms from raw auction object
function resolveEndTime(a) {
  if (a.endTime) return new Date(a.endTime).getTime();
  const base = a.startDate || a.createdAt;
  const dur = a.duration || "";
  let mins = 1440;
  if (/1\s*hour/i.test(dur))  mins = 60;
  else if (/6\s*hour/i.test(dur))  mins = 360;
  else if (/12\s*hour/i.test(dur)) mins = 720;
  else if (/3\s*day/i.test(dur))   mins = 4320;
  else if (/7\s*day/i.test(dur))   mins = 10080;
  if (base) return new Date(base).getTime() + mins * 60 * 1000;
  return null;
}

// Normalise raw auction from backend populate
function normalise(a) {
  const imgs = Array.isArray(a.images) ? a.images : [];
  const img = imgs.length
    ? (typeof imgs[0] === "string" ? imgs[0] : imgs[0]?.url || imgs[0]?.secure_url || "")
    : "https://placehold.co/400x300?text=No+Image";
  const seller = typeof a.createdBy === "object" && a.createdBy
    ? (a.createdBy.businessName || a.createdBy.name || a.createdBy.email || "Unknown")
    : (a.createdBy || "Unknown");
  const endTime = resolveEndTime(a);
  let status = a.status;  // "Active" | "Completed" | "Scheduled" | "Cancelled"
  if (status === "Active" && endTime && endTime < Date.now()) status = "Completed";
  return {
    id:         String(a._id || a.id),
    title:      a.title,
    category:   a.category,
    condition:  a.condition,
    seller,
    img,
    currentBid: a.currentBid ?? a.startingBid ?? 0,
    totalBids:  a.totalBids ?? 0,
    endTime,
    status,
    live:       status === "Active",
    hot:        a.hot || false,
    createdById: typeof a.createdBy === "object" && a.createdBy !== null
                   ? String(a.createdBy._id || a.createdBy.id || "")
                   : String(a.createdBy || ""),
  };
}

// ── Mark auction Completed in DB when timer hits zero ─────────────────────────
async function markCompleted(auctionId, onDone) {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/auction/auction/${auctionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Completed" }),
    });
    if (res.ok && onDone) onDone(auctionId);
  } catch { /* silent */ }
}

function useCountdown(endTime, auctionId, status, onComplete) {
  const calc = () => {
    const diff = Math.max(0, (endTime || 0) - Date.now());
    return { diff, h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) };
  };
  const [state, setState] = useState(calc);
  const firedRef = useRef(false);
  useEffect(() => {
    if (!endTime) return;
    setState(calc());
    const id = setInterval(() => {
      const next = calc();
      setState(next);
      if (next.diff === 0 && !firedRef.current && status === "Active" && auctionId) {
        firedRef.current = true;
        markCompleted(auctionId, onComplete);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [endTime]);
  if (!endTime || state.diff === 0) return "Ended";
  if (state.h > 0) return `${state.h}h ${String(state.m).padStart(2, "0")}m`;
  return `${String(state.m).padStart(2, "0")}m ${String(state.s).padStart(2, "0")}s`;
}

/* ── Inline SVG icon helper (mirrors BrowseAuctions) ── */
const Ico = ({ d, size = 16, sw = 1.75, fill = "none", vb = "0 0 24 24", children, ...p }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={vb}
    fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }} {...p}>
    {children || <path d={d} />}
  </svg>
);

const SvgIcons = {
  Live:      (s=12) => <Ico size={s}><circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4"/></Ico>,
  Scheduled: (s=12) => <Ico size={s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Ico>,
  Cancelled: (s=12) => <Ico size={s}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></Ico>,
  Ended:     (s=12) => <Ico size={s}><polyline points="20 6 9 17 4 12"/></Ico>,
  Heart:     (s=15, filled=false) => <Ico size={s} fill={filled ? "currentColor" : "none"} sw={filled ? 0 : 1.75}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></Ico>,
  Tag:       (s=11) => <Ico size={s}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></Ico>,
  Clock:     (s=11) => <Ico size={s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Ico>,
  Users:     (s=13) => <Ico size={s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Ico>,
  Gavel:     (s=14) => <Ico size={s}><path d="M14.5 2.5 19 7l-9 9-4.5-4.5 9-9z"/><path d="m2 22 7-7"/><path d="M14.5 2.5 12 5"/></Ico>,
  Star:      (s=11) => <Ico size={s} fill="currentColor" sw={0}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Ico>,
};

// ── Single wishlist card ──────────────────────────────────────────────────────
function WishlistCard({ auction, onRemove, onComplete, isBusiness, isMobile = false }) {
  const t = useThemeStyles();
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  const compact = isMobile;
  const time = useCountdown(auction.endTime, auction.id, auction.status, onComplete);

  const isCancelled = auction.status === "Cancelled" || auction.status === "cancelled";
  const isEnded     = !isCancelled && (time === "Ended" || auction.status === "Completed");
  const isScheduled = !isCancelled && !isEnded && auction.status === "Scheduled";
  const isLive      = !isCancelled && !isEnded && !isScheduled && auction.live;

  const bidLabel  = isLive ? "Current Bid" : isScheduled ? "Starting Bid" : "Final Bid";
  const timeLabel = isLive ? "Ends In" : isScheduled ? "Starts In" : "Ended";
  const timeColor = isCancelled ? "#ef4444" : isEnded ? t.textMut : isLive ? "#f43f5e" : "#f59e0b";
  const timeValue = isCancelled ? "Cancelled" : isEnded ? "Ended" : time;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: t.bgCardGrad,
        borderRadius: compact ? "16px" : "20px",
        overflow: "hidden",
        border: isCancelled
          ? "1px solid rgba(239,68,68,0.3)"
          : hov ? "1px solid rgba(56,189,248,0.3)"
          : `1px solid ${t.border}`,
        transform: !isEnded && !isCancelled && hov ? "translateY(-6px)" : "translateY(0)",
        boxShadow: !isEnded && !isCancelled && hov ? `0 24px 48px ${t.shadow}` : `0 4px 20px ${t.shadow}`,
        transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        opacity: isCancelled || isEnded ? 0.78 : 1,
        width: "100%",
      }}>

      {/* ── Image ── */}
      <div style={{ position: "relative", height: compact ? "150px" : "200px", background: t.bgCardGrad, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img
          src={auction.img || "https://placehold.co/400x300/1e293b/38bdf8?text=No+Image"}
          alt={auction.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: !isEnded && !isCancelled && hov ? "scale(1.07)" : "scale(1)", transition: "transform 0.5s ease", filter: isCancelled ? "grayscale(60%)" : isEnded ? "grayscale(30%)" : "none" }}
          onError={e => { e.target.src = "https://placehold.co/400x300/1e293b/38bdf8?text=No+Image"; }}
        />
        <div style={{ position: "absolute", inset: 0, background: hov ? `linear-gradient(to bottom, transparent 50%, ${t.L ? "rgba(248,250,252,0.8)" : "rgba(15,23,42,0.8)"})` : `linear-gradient(to bottom, transparent 60%, ${t.L ? "rgba(248,250,252,0.5)" : "rgba(15,23,42,0.5)"})`, transition: "all 0.3s" }} />

        {/* Status badge */}
        {isCancelled ? (
          <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", alignItems: "center", gap: "5px", background: "rgba(239,68,68,0.88)", color: "white", borderRadius: "8px", padding: "4px 10px", fontSize: "11px", fontWeight: 800 }}>
            {SvgIcons.Cancelled(11)} CANCELLED
          </div>
        ) : isEnded ? (
          <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", alignItems: "center", gap: "5px", background: "rgba(100,116,139,0.85)", color: "white", borderRadius: "8px", padding: "4px 10px", fontSize: "11px", fontWeight: 800 }}>
            {SvgIcons.Ended(11)} ENDED
          </div>
        ) : isScheduled ? (
          <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", alignItems: "center", gap: "5px", background: "rgba(245,158,11,0.92)", color: "white", borderRadius: "8px", padding: "4px 10px", fontSize: "11px", fontWeight: 800 }}>
            {SvgIcons.Scheduled(11)} SCHEDULED
          </div>
        ) : isLive ? (
          <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", alignItems: "center", gap: "6px", background: "#f43f5e", color: "white", borderRadius: "8px", padding: "4px 10px", fontSize: "11px", fontWeight: 800 }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "white", animation: "pulse 1s infinite" }} />
            LIVE
          </div>
        ) : null}

        {/* Wishlist heart button — filled, removes on click */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); onRemove(auction.id); }}
          title="Remove from wishlist"
          style={{
            position: "absolute", top: "10px", right: "10px",
            background: "rgba(244,63,94,0.15)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(244,63,94,0.45)",
            borderRadius: "8px", width: "32px", height: "32px",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "#f43f5e",
            transition: "all 0.2s",
          }}>
          {SvgIcons.Heart(15, true)}
        </button>

        {/* Category pill */}
        <div style={{ position: "absolute", bottom: "12px", left: "12px", background: t.L ? "rgba(255,255,255,0.85)" : "rgba(15,23,42,0.8)", backdropFilter: "blur(8px)", border: `1px solid ${t.borderMd}`, borderRadius: "6px", padding: "3px 8px", fontSize: "11px", color: t.textSec, fontWeight: 600 }}>
          {auction.category}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: compact ? "12px" : "20px" }}>
        <h3 style={{ color: t.textPri, fontWeight: 700, fontSize: compact ? "14px" : "15px", margin: `0 0 ${compact ? "9px" : "12px"}`, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {auction.title}
        </h3>

        {/* Bid + Timer row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: compact ? "10px" : "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: t.textMut, fontSize: compact ? "10px" : "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: compact ? "2px" : "3px" }}>
              {SvgIcons.Tag(compact ? 10 : 11)} {bidLabel}
            </div>
            <div style={{ color: isCancelled ? "#ef4444" : isEnded ? t.textSec : "#38bdf8", fontSize: compact ? "18px" : "22px", fontWeight: 800 }}>
              {formatINR(auction.currentBid)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px", color: t.textMut, fontSize: compact ? "10px" : "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: compact ? "2px" : "3px" }}>
              {SvgIcons.Clock(compact ? 10 : 11)} {timeLabel}
            </div>
            <div style={{ color: timeColor, fontSize: compact ? "12px" : "13px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {timeValue}
            </div>
          </div>
        </div>

        {/* Bids progress bar */}
        {isLive && (
          <div style={{ display: "flex", alignItems: "center", gap: compact ? "6px" : "8px", marginBottom: compact ? "10px" : "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: t.textMut }}>
              {SvgIcons.Users(compact ? 12 : 13)}
              <span style={{ color: t.textMut, fontSize: compact ? "11px" : "12px" }}>{auction.totalBids} bids</span>
            </div>
            <div style={{ flex: 1, height: "3px", background: t.L ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, (auction.totalBids / 50) * 100)}%`, background: "linear-gradient(90deg, #38bdf8, #6366f1)", borderRadius: "2px" }} />
            </div>
          </div>
        )}
        {!isLive && !isScheduled && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: compact ? "10px" : "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: t.textMut, fontSize: compact ? "11px" : "12px" }}>
              {SvgIcons.Users(compact ? 12 : 13)} {auction.totalBids} bids
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "3px", color: "#f59e0b", fontSize: compact ? "11px" : "12px" }}>
              {SvgIcons.Star(11)} <span style={{ color: t.textSec }}>{auction.sellerRating ?? "4.8"}</span>
            </div>
          </div>
        )}

        {/* Action button */}
        {isCancelled ? (
          <button disabled style={{ width: "100%", padding: compact ? "10px" : "12px", borderRadius: compact ? "10px" : "12px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#ef4444", fontWeight: 700, fontSize: compact ? "13px" : "14px", cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            {SvgIcons.Cancelled(compact ? 13 : 14)} Auction Cancelled
          </button>
        ) : isEnded ? (
          <button disabled style={{ width: "100%", padding: compact ? "10px" : "12px", borderRadius: compact ? "10px" : "12px", border: `1px solid ${t.border}`, background: "transparent", color: t.textMut, fontWeight: 700, fontSize: compact ? "13px" : "14px", cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            {SvgIcons.Ended(compact ? 13 : 14)} Auction Ended
          </button>
        ) : isScheduled ? (
          <button disabled style={{ width: "100%", padding: compact ? "10px" : "12px", borderRadius: compact ? "10px" : "12px", border: "1px solid rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.08)", color: "#f59e0b", fontWeight: 700, fontSize: compact ? "13px" : "14px", cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            {SvgIcons.Scheduled(compact ? 13 : 14)} Not Started Yet
          </button>
        ) : isBusiness ? (
          <button disabled style={{ width: "100%", padding: compact ? "10px" : "12px", borderRadius: compact ? "10px" : "12px", border: "1px solid rgba(99,102,241,0.35)", background: "rgba(99,102,241,0.08)", color: "#6366f1", fontWeight: 700, fontSize: compact ? "11px" : "12px", cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            🚫 Business accounts can't bid
          </button>
        ) : (
          <button
            onClick={() => navigate(`/auction/${auction.id}`)}
            onMouseEnter={e => e.currentTarget.style.opacity = ".88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            style={{ width: "100%", padding: compact ? "10px" : "12px", borderRadius: compact ? "10px" : "12px", border: "none", background: isLive ? "linear-gradient(135deg,#f43f5e,#dc2626)" : "linear-gradient(135deg,#38bdf8,#6366f1)", color: "white", fontWeight: 700, fontSize: compact ? "13px" : "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "opacity 0.15s" }}>
            {isLive ? <>{SvgIcons.Live(compact ? 13 : 14)} Place Bid</> : <>{SvgIcons.Gavel(compact ? 13 : 14)} Place Bid</>}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MyWishlist() {
  const t = useThemeStyles();
  const navigate = useNavigate();
  const { userId, role } = useAuth();

  const [wishlist,  setWishlist]  = useState([]);  // normalised auction objects
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("all");
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false
  ));

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const media = window.matchMedia("(max-width: 768px)");
    const onChange = (event) => setIsMobile(event.matches);
    setIsMobile(media.matches);
    if (media.addEventListener) media.addEventListener("change", onChange);
    else media.addListener(onChange);
    return () => {
      if (media.removeEventListener) media.removeEventListener("change", onChange);
      else media.removeListener(onChange);
    };
  }, []);

  // ── Fetch wishlist from backend ─────────────────────────────────────────────
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    setError("");
    fetch(`${API}/wishlist/${userId}`)
      .then(r => { if (!r.ok) throw new Error(`Server error: ${r.status}`); return r.json(); })
      .then(async data => {
        const auctions = Array.isArray(data.auctions) ? data.auctions : [];
        const normalised = auctions.map(normalise);

        // Enrich each auction's currentBid from bids endpoint (source of truth)
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

        setWishlist(enriched);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  // ── Remove one auction ──────────────────────────────────────────────────────
  const removeItem = async (auctionId) => {
    // Optimistic update
    setWishlist(prev => prev.filter(a => a.id !== auctionId));
    try {
      await fetch(`${API}/wishlist/${userId}/remove/${auctionId}`, { method: "DELETE" });
    } catch {
      // silently fail — UI already updated
    }
  };

  // ── Clear all ───────────────────────────────────────────────────────────────
  const clearAll = async () => {
    setWishlist([]);
    try {
      await fetch(`${API}/wishlist/${userId}/clear`, { method: "DELETE" });
    } catch {}
  };

  // ── Derived list ────────────────────────────────────────────────────────────
  const filtered = wishlist
    .filter(a => {
      const isCancelled = a.status === "Cancelled" || a.status === "cancelled";
      if (filter === "live")      return !isCancelled && a.live && a.endTime > Date.now();
      if (filter === "ended")     return !isCancelled && (!a.live || a.endTime <= Date.now());
      if (filter === "cancelled") return isCancelled;
      return true;
    })
    .filter(a =>
      (a.title?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (a.category?.toLowerCase() || "").includes(search.toLowerCase())
    );

  const liveCount      = wishlist.filter(a => a.status !== "Cancelled" && a.status !== "cancelled" && a.live && a.endTime > Date.now()).length;
  const endedCount     = wishlist.filter(a => a.status !== "Cancelled" && a.status !== "cancelled" && (!a.live || a.endTime <= Date.now())).length;
  const cancelledCount = wishlist.filter(a => a.status === "Cancelled" || a.status === "cancelled").length;

  // ── Not logged in ───────────────────────────────────────────────────────────
  if (!userId) return (
    <div style={{ background: t.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "64px", marginBottom: "16px" }}>🔒</div>
        <h2 style={{ color: t.textPri, marginBottom: "12px" }}>Login to see your wishlist</h2>
        <button onClick={() => navigate("/Login")} style={{ padding: "12px 28px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#38bdf8,#6366f1)", color: "white", fontWeight: 700, cursor: "pointer" }}>Log In</button>
      </div>
    </div>
  );

  return (
    <div style={{ background: t.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", transition: "background 0.25s" }}>

      {/* ── Header ── */}
      <div style={{ background: t.bgSec, borderBottom: `1px solid ${t.border}`, padding: isMobile ? "24px 14px 20px" : "40px 40px 32px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ color: "#f43f5e", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "8px" }}>❤️ Saved Auctions</div>
              <h1 style={{ color: t.textPri, fontSize: isMobile ? "28px" : "36px", fontWeight: 900, margin: 0 }}>My Wishlist</h1>
              <p style={{ color: t.textMut, marginTop: "8px", fontSize: isMobile ? "14px" : "15px" }}>
                {loading ? "Loading…" : wishlist.length === 0 ? "No saved auctions yet." : `${wishlist.length} auction${wishlist.length !== 1 ? "s" : ""} saved · ${liveCount} live${cancelledCount > 0 ? ` · ${cancelledCount} cancelled` : ""}`}
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: t.textMut, fontSize: "15px" }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search wishlist…"
                  style={{ background: t.bgInput, border: `1px solid ${t.borderMd}`, borderRadius: "10px", padding: "10px 14px 10px 38px", color: t.textPri, fontSize: "14px", outline: "none", width: isMobile ? "100%" : "220px", minWidth: isMobile ? "220px" : "auto" }} />
              </div>
              {wishlist.length > 0 && (
                <button onClick={clearAll}
                  style={{ padding: "10px 16px", borderRadius: "10px", border: "1px solid rgba(244,63,94,.3)", background: "rgba(244,63,94,.08)", color: "#f43f5e", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(244,63,94,.15)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(244,63,94,.08)"}>
                  🗑 Clear All
                </button>
              )}
            </div>
          </div>

          {!loading && wishlist.length > 0 && (
            <div style={{ display: "flex", gap: "8px", marginTop: "24px", flexWrap: "wrap" }}>
              {[
                ["all",       `All (${wishlist.length})`],
                ["live",      `🔴 Live (${liveCount})`],
                ["ended",     `✓ Ended (${endedCount})`],
                ...(cancelledCount > 0 ? [["cancelled", `🚫 Cancelled (${cancelledCount})`]] : []),
              ].map(([val, label]) => (
                <button key={val} onClick={() => setFilter(val)}
                  style={{ padding: "7px 16px", borderRadius: "50px", border: filter === val ? (val === "cancelled" ? "1px solid rgba(239,68,68,.5)" : "1px solid rgba(56,189,248,.5)") : `1px solid ${t.border}`, background: filter === val ? (val === "cancelled" ? "rgba(239,68,68,.12)" : "rgba(56,189,248,.12)") : t.bgCard, color: filter === val ? (val === "cancelled" ? "#ef4444" : "#38bdf8") : t.textMut, fontWeight: 600, fontSize: "13px", cursor: "pointer", transition: "all .2s" }}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: isMobile ? "18px 14px 28px" : "32px 40px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px", animation: "pulse 1s infinite" }}>⏳</div>
            <div style={{ color: t.textSec, fontSize: "16px", fontWeight: 600 }}>Loading your wishlist…</div>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
            <div style={{ color: "#f43f5e", fontWeight: 700, fontSize: "16px", marginBottom: "8px" }}>Could not load wishlist</div>
            <div style={{ color: t.textMut, fontSize: "13px", marginBottom: "20px" }}>{error}</div>
            <button onClick={() => window.location.reload()} style={{ padding: "10px 24px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#38bdf8,#6366f1)", color: "white", fontWeight: 700, cursor: "pointer" }}>Retry</button>
          </div>
        ) : wishlist.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "72px", marginBottom: "20px" }}>🤍</div>
            <h2 style={{ color: t.textPri, fontSize: "24px", fontWeight: 800, marginBottom: "12px" }}>Your wishlist is empty</h2>
            <p style={{ color: t.textMut, fontSize: "15px", marginBottom: "28px" }}>Click the ❤️ icon on any auction to save it here.</p>
            <button onClick={() => navigate("/browse")} style={{ padding: "13px 32px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#38bdf8,#6366f1)", color: "white", fontWeight: 700, fontSize: "15px", cursor: "pointer", boxShadow: "0 4px 14px rgba(56,189,248,.3)" }}>
              Browse Auctions →
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
            <div style={{ color: t.textSec, fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>No results</div>
            <div style={{ color: t.textMut, fontSize: "14px" }}>Try a different search or filter.</div>
          </div>
        ) : (
          <>
            <div style={{ color: t.textMut, fontSize: "13px", marginBottom: "20px" }}>{filtered.length} auction{filtered.length !== 1 ? "s" : ""}</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fill, minmax(240px, 1fr))", gap: isMobile ? "12px" : "20px" }}>
              {filtered.map(a => (
                <WishlistCard key={a.id} auction={a} onRemove={removeItem} isBusiness={role === "business" && a.createdById === String(userId)} isMobile={isMobile}
                  onComplete={(id) => setWishlist(prev => prev.map(x => x.id === id ? { ...x, status: "Completed", live: false } : x))} />
              ))}
            </div>
          </>
        )}
      </div>

      <FooterComponent/>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        input::placeholder { color: ${t.textFaint}; }
      `}</style>
    </div>
  );
}

