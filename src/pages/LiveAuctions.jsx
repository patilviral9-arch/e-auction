import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useThemeStyles } from "../utils/themeStyles";
import { useAuth } from "../context/AuthContext";
import FooterComponent from "../components/user/FooterComponent";

// ── inline helpers ────────────────────────────────────────────────────────────
const formatINR = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const WISHLIST_API = "http://localhost:3000/wish";

// ── Mark auction Completed in DB when timer hits zero ─────────────────────────
async function markCompleted(auctionId, onDone) {
  try {
    const res = await fetch(`http://localhost:3000/auction/auction/${auctionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Completed" }),
    });
    if (res.ok && onDone) onDone(auctionId);
  } catch { /* silent */ }
}

// ── endTime-based countdown (same as BrowseAuctions / AuctionDetail) ─────────
function useCountdown(endTime, auctionId, status, onComplete) {
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
      if (next.diff === 0 && !firedRef.current && status === "Active" && auctionId) {
        firedRef.current = true;
        markCompleted(auctionId, onComplete);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  if (!endTime || state.diff === 0) return { text: "Ended", urgent: false, ended: true };
  const urgent = state.diff < 3600000;
  let text;
  if (state.h > 0) text = `${state.h}h ${String(state.m).padStart(2, "0")}m ${String(state.s).padStart(2, "0")}s`;
  else text = `${String(state.m).padStart(2, "0")}m ${String(state.s).padStart(2, "0")}s`;
  return { text, urgent, ended: false, h: state.h, m: state.m, s: state.s };
}

// ── Normalise raw API auction ─────────────────────────────────────────────────
function parseDurationToMs(a) {
  if (a.endTime) return new Date(a.endTime).getTime();
  const base = a.startDate || a.createdAt;
  const mins = a.durationMinutes ?? (() => {
    const dur = a.duration || "";
    if (/1\s*hour/i.test(dur))  return 60;
    if (/6\s*hour/i.test(dur))  return 360;
    if (/12\s*hour/i.test(dur)) return 720;
    if (/3\s*day/i.test(dur))   return 4320;
    if (/7\s*day/i.test(dur))   return 10080;
    return 1440;
  })();
  if (base) return new Date(base).getTime() + mins * 60 * 1000;
  return Date.now() + mins * 60 * 1000;
}

function normalise(a) {
  const imgs = Array.isArray(a.images) ? a.images : [];
  const img = imgs.length
    ? (typeof imgs[0] === "string" ? imgs[0] : imgs[0]?.url || imgs[0]?.secure_url || "")
    : "https://placehold.co/600x400?text=No+Image";
  const endTime = parseDurationToMs(a);
  let status = a.status;  // "Active" | "Completed" | "Scheduled" | "Cancelled"
  if (status === "Active" && endTime && endTime < Date.now()) status = "Completed";
  return {
    id:          String(a._id || a.id),
    title:       a.title,
    category:    a.category,
    condition:   a.condition,
    seller:      typeof a.createdBy === "object" && a.createdBy
                   ? (a.createdBy.businessName || a.createdBy.name || a.createdBy.email || "Unknown")
                   : (a.createdBy || "Unknown"),
    img,
    currentBid:  a.currentBid ?? a.startingBid ?? 0,
    startingBid: a.startingBid ?? 0,
    totalBids:   a.totalBids ?? a.bids?.length ?? 0,
    endTime,
    // ── FIX: store raw API status for filtering ──
    status,
    live:        status === "Active",
    sellerRating: a.sellerRating ?? "4.8",
    createdById: typeof a.createdBy === "object" && a.createdBy !== null
                   ? String(a.createdBy._id || a.createdBy.id || "")
                   : String(a.createdBy || ""),
  };
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
  Cancelled: (s=12) => <Ico size={s}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></Ico>,
  Ended:     (s=12) => <Ico size={s}><polyline points="20 6 9 17 4 12"/></Ico>,
  Heart:     (s=15, filled=false) => <Ico size={s} fill={filled ? "currentColor" : "none"} sw={filled ? 0 : 1.75}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></Ico>,
  Tag:       (s=11) => <Ico size={s}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></Ico>,
  Clock:     (s=11) => <Ico size={s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Ico>,
  Users:     (s=13) => <Ico size={s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Ico>,
  Gavel:     (s=14) => <Ico size={s}><path d="M14.5 2.5 19 7l-9 9-4.5-4.5 9-9z"/><path d="m2 22 7-7"/><path d="M14.5 2.5 12 5"/></Ico>,
};

// ── Single Live Auction Card ──────────────────────────────────────────────────
function LiveCard({ auction, onView, watched, onToggleWatch, onComplete, isBusiness }) {
  const t = useThemeStyles();
  const [hov, setHov] = useState(false);
  const { text, urgent, ended, h, m, s } = useCountdown(auction.endTime, auction.id, auction.status, onComplete);
  const isCancelled = auction.status === "Cancelled" || auction.status === "cancelled";
  const isEnded = !isCancelled && (ended || auction.status === "Completed");

  const timeColor = isCancelled ? "#ef4444" : isEnded ? t.textMut : "#f43f5e";
  const timeValue = isCancelled ? "Cancelled" : isEnded ? "Ended" : text;
  const timeLabel = isEnded || isCancelled ? "Ended" : "Ends In";

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: t.bgCardGrad,
        borderRadius: "20px",
        overflow: "hidden",
        border: isCancelled
          ? "1px solid rgba(239,68,68,0.3)"
          : urgent && !isEnded
          ? "1px solid rgba(244,63,94,0.4)"
          : hov
          ? "1px solid rgba(56,189,248,0.3)"
          : `1px solid ${t.border}`,
        transform: !isEnded && !isCancelled && hov ? "translateY(-6px)" : "translateY(0)",
        boxShadow: !isEnded && !isCancelled && hov ? `0 24px 48px ${t.shadow}` : `0 4px 20px ${t.shadow}`,
        transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        opacity: isCancelled || isEnded ? 0.78 : 1,
        width: "100%",
      }}>

      {/* ── Image ── */}
      <div style={{ position: "relative", height: "200px", background: t.bgCardGrad, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img
          src={auction.img}
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
        ) : (
          <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", alignItems: "center", gap: "6px", background: "#f43f5e", color: "white", borderRadius: "8px", padding: "4px 10px", fontSize: "11px", fontWeight: 800 }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "white", animation: "livePulse 1s infinite" }} />
            LIVE
          </div>
        )}

        {/* Urgent badge */}
        {!isCancelled && !isEnded && urgent && (
          <div style={{ position: "absolute", top: "12px", left: "76px", background: "rgba(245,158,11,0.92)", color: "white", borderRadius: "8px", padding: "4px 10px", fontSize: "11px", fontWeight: 800 }}>
            ⚡ ENDING SOON
          </div>
        )}

        {/* Wishlist heart button */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleWatch(auction.id); }}
          title={watched ? "Remove from wishlist" : "Add to wishlist"}
          style={{
            position: "absolute", top: "10px", right: "10px",
            background: watched ? "rgba(244,63,94,0.15)" : t.L ? "rgba(255,255,255,0.85)" : "rgba(15,23,42,0.8)",
            backdropFilter: "blur(8px)",
            border: `1px solid ${watched ? "rgba(244,63,94,0.45)" : t.borderMd}`,
            borderRadius: "8px", width: "32px", height: "32px",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: watched ? "#f43f5e" : t.textMut,
            transition: "all 0.2s",
          }}>
          {SvgIcons.Heart(15, watched)}
        </button>

        {/* Category pill */}
        <div style={{ position: "absolute", bottom: "12px", left: "12px", background: t.L ? "rgba(255,255,255,0.85)" : "rgba(15,23,42,0.8)", backdropFilter: "blur(8px)", border: `1px solid ${t.borderMd}`, borderRadius: "6px", padding: "3px 8px", fontSize: "11px", color: t.textSec, fontWeight: 600 }}>
          {auction.category}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "20px" }}>
        <h3 style={{ color: t.textPri, fontWeight: 700, fontSize: "15px", margin: "0 0 12px", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {auction.title}
        </h3>

        {/* Bid + Timer row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: t.textMut, fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>
              {SvgIcons.Tag(11)} Current Bid
            </div>
            <div style={{ color: isCancelled ? "#ef4444" : isEnded ? t.textSec : "#38bdf8", fontSize: "22px", fontWeight: 800 }}>
              {formatINR(auction.currentBid)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px", color: t.textMut, fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>
              {SvgIcons.Clock(11)} {timeLabel}
            </div>
            <div style={{ color: timeColor, fontSize: "13px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {timeValue}
            </div>
          </div>
        </div>

        {/* Bids progress bar (live only) */}
        {!isEnded && !isCancelled && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: t.textMut }}>
              {SvgIcons.Users(13)}
              <span style={{ color: t.textMut, fontSize: "12px" }}>{auction.totalBids} bids</span>
            </div>
            <div style={{ flex: 1, height: "3px", background: t.L ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, (auction.totalBids / 50) * 100)}%`, background: urgent ? "linear-gradient(90deg,#f43f5e,#dc2626)" : "linear-gradient(90deg, #38bdf8, #6366f1)", borderRadius: "2px" }} />
            </div>
          </div>
        )}
        {(isEnded || isCancelled) && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: t.textMut, fontSize: "12px" }}>
              {SvgIcons.Users(13)} {auction.totalBids} bids
            </div>
          </div>
        )}

        {/* Action button */}
        {isCancelled ? (
          <button disabled style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#ef4444", fontWeight: 700, fontSize: "14px", cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            {SvgIcons.Cancelled(14)} Auction Cancelled
          </button>
        ) : isEnded ? (
          <button disabled style={{ width: "100%", padding: "12px", borderRadius: "12px", border: `1px solid ${t.border}`, background: "transparent", color: t.textMut, fontWeight: 700, fontSize: "14px", cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            {SvgIcons.Ended(14)} Auction Ended
          </button>
        ) : isBusiness ? (
          <button disabled style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid rgba(99,102,241,0.35)", background: "rgba(99,102,241,0.08)", color: "#6366f1", fontWeight: 700, fontSize: "12px", cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            🚫 Business accounts can't bid
          </button>
        ) : (
          <button
            onClick={() => onView(auction.id)}
            onMouseEnter={e => e.currentTarget.style.opacity = ".88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#f43f5e,#dc2626)", color: "white", fontWeight: 700, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "opacity 0.15s" }}>
            {SvgIcons.Live(14)} {urgent ? "Bid Now — Ending Soon!" : "Place Bid"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LiveAuctions() {
  const t = useThemeStyles();
  const navigate = useNavigate();
  const { userId, role } = useAuth();

   useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); });

  const [auctions,     setAuctions]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState("");
  const [watchlistIds, setWatchlistIds] = useState([]);
  const [search,       setSearch]       = useState("");
  const [sort,         setSort]         = useState("ending");
  const [category,     setCategory]     = useState("All");

  const refreshRef = useRef(null);

  const fetchLive = () => {
    setFetchError("");
    fetch("http://localhost:3000/auction/auctions")
      .then(r => { if (!r.ok) throw new Error(`Server error: ${r.status}`); return r.json(); })
      .then(async data => {
        const list = Array.isArray(data) ? data : data.auctions ?? data.data ?? [];
        const now = Date.now();

        // ── FIX: only show auctions with status "Active" (not Cancelled/Scheduled/Completed)
        const live = list
          .filter(a => a.status === "Active")
          .map(normalise)
          .filter(a => a.endTime > now);   // also drop time-expired ones

        const enriched = await Promise.all(live.map(async (auction) => {
          try {
            const r = await fetch(`http://localhost:3000/bid/bids/auction/${auction.id}`);
            if (!r.ok) return auction;
            const bidData = await r.json();
            const bids = bidData.data ?? [];
            if (bids.length > 0) {
              return { ...auction, currentBid: bids[0].bidAmount, totalBids: bids.length };
            }
            return auction;
          } catch { return auction; }
        }));

        setAuctions(enriched);
        setLoading(false);
      })
      .catch(err => { setFetchError(err.message); setLoading(false); });
  };

  useEffect(() => {
    setLoading(true);
    fetchLive();
    refreshRef.current = setInterval(fetchLive, 30000);
    // ── FIX: Re-fetch instantly when user returns to this tab (picks up Listings status changes)
    const onVisible = () => { if (document.visibilityState === "visible") fetchLive(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(refreshRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Load watchlist IDs
  useEffect(() => {
    if (!userId) return;
    fetch(`${WISHLIST_API}/wishlist/${userId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setWatchlistIds((data.auctions || []).map(a => String(a._id || a.id || a))))
      .catch(() => {});
  }, [userId]);

  const toggleWatch = async (id) => {
    if (!userId) { navigate("/Login"); return; }
    const isWatched = watchlistIds.includes(id);
    setWatchlistIds(prev => isWatched ? prev.filter(x => x !== id) : [...prev, id]);
    try {
      if (isWatched) {
        await fetch(`${WISHLIST_API}/wishlist/${userId}/remove/${id}`, { method: "DELETE" });
      } else {
        await fetch(`${WISHLIST_API}/wishlist/${userId}/add`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ auctionId: id }),
        });
      }
    } catch {
      setWatchlistIds(prev => isWatched ? [...prev, id] : prev.filter(x => x !== id));
    }
  };

  const CATEGORIES = ["All", "Electronics", "Vehicles", "Luxury", "Furniture", "Collectibles", "Real Estate", "Industrial", "Art", "Sports", "Books"];

  const filtered = auctions
    .filter(a => category === "All" || a.category === category)
    .filter(a => a.title?.toLowerCase().includes(search.toLowerCase()) || a.category?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "ending")  return a.endTime - b.endTime;
      if (sort === "highest") return b.currentBid - a.currentBid;
      if (sort === "bids")    return b.totalBids - a.totalBids;
      return 0;
    });

  const urgentCount = auctions.filter(a => {
    const remaining = a.endTime - Date.now();
    return remaining > 0 && remaining < 3600000;
  }).length;

  return (
    <div style={{ background: t.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", transition: "background 0.25s" }}>

      {/* ── Header ── */}
      <div style={{ background: t.bgSec, borderBottom: `1px solid ${t.border}`, padding: "40px 40px 0" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f43f5e", display: "inline-block", animation: "livePulse 1s infinite" }} />
                <span style={{ color: "#f43f5e", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em" }}>
                  {loading ? "Loading…" : `${auctions.filter(a => a.endTime - Date.now() > 0).length} auctions live right now`}
                </span>
                {urgentCount > 0 && (
                  <span style={{ background: "rgba(245,158,11,.12)", border: "1px solid rgba(245,158,11,.3)", color: "#f59e0b", fontSize: "11px", fontWeight: 700, padding: "2px 10px", borderRadius: "20px" }}>
                    ⚡ {urgentCount} ending soon
                  </span>
                )}
              </div>
              <h1 style={{ color: t.textPri, fontSize: "36px", fontWeight: 900, margin: 0, letterSpacing: "-.02em" }}>Live Auctions</h1>
              <p style={{ color: t.textMut, marginTop: "8px", fontSize: "15px" }}>Bid in real time — every second counts.</p>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: t.textMut }}>🔍</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search live auctions…"
                  style={{ background: t.bgInput, border: `1px solid ${t.borderMd}`, borderRadius: "10px", padding: "10px 14px 10px 38px", color: t.textPri, fontSize: "14px", outline: "none", width: "240px" }}
                />
              </div>
              <select value={sort} onChange={e => setSort(e.target.value)}
                style={{ padding: "10px 14px", borderRadius: "10px", border: `1px solid ${t.border}`, background: t.bgCard, color: t.textSec, fontSize: "13px", outline: "none", cursor: "pointer" }}>
                <option value="ending">Ending Soon</option>
                <option value="highest">Highest Bid</option>
                <option value="bids">Most Bids</option>
              </select>
              <button onClick={() => { setLoading(true); fetchLive(); }}
                style={{ padding: "10px 16px", borderRadius: "10px", border: `1px solid ${t.border}`, background: t.bgCard, color: t.textSec, fontSize: "13px", cursor: "pointer", fontWeight: 600 }}
                title="Refresh">
                🔄
              </button>
            </div>
          </div>

          {/* Category tabs */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingBottom: "0" }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                style={{ padding: "8px 18px", borderRadius: "50px 50px 0 0", border: category === cat ? `1px solid ${t.border}` : `1px solid ${t.border}`, borderBottom: category === cat ? `2px solid #f43f5e` : "none", background: category === cat ? t.bg : t.bgCard, color: category === cat ? "#f43f5e" : t.textMut, fontWeight: category === cat ? 700 : 500, fontSize: "13px", cursor: "pointer", transition: "all .2s" }}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 40px 60px" }}>

        {loading ? (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <div style={{ fontSize: "52px", marginBottom: "20px", animation: "livePulse 1s infinite" }}>🔴</div>
            <div style={{ color: t.textSec, fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Finding live auctions…</div>
            <div style={{ color: t.textMut, fontSize: "14px" }}>This won't take long</div>
          </div>

        ) : fetchError ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <div style={{ color: "#f43f5e", fontWeight: 700, fontSize: "16px", marginBottom: "8px" }}>Could not load live auctions</div>
            <div style={{ color: t.textMut, fontSize: "13px", marginBottom: "20px" }}>{fetchError}</div>
            <button onClick={() => { setLoading(true); fetchLive(); }}
              style={{ padding: "10px 24px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#38bdf8,#6366f1)", color: "white", fontWeight: 700, cursor: "pointer" }}>
              Retry
            </button>
          </div>

        ) : auctions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <div style={{ fontSize: "72px", marginBottom: "20px" }}>😴</div>
            <h2 style={{ color: t.textPri, fontSize: "24px", fontWeight: 800, marginBottom: "12px" }}>No live auctions right now</h2>
            <p style={{ color: t.textMut, fontSize: "15px", marginBottom: "28px" }}>Check back soon — auctions go live every day.</p>
            <button onClick={() => navigate("/browse")}
              style={{ padding: "13px 32px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#38bdf8,#6366f1)", color: "white", fontWeight: 700, fontSize: "15px", cursor: "pointer", boxShadow: "0 4px 14px rgba(56,189,248,.3)" }}>
              Browse All Auctions →
            </button>
          </div>

        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
            <div style={{ color: t.textSec, fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>No live auctions match</div>
            <div style={{ color: t.textMut, fontSize: "14px" }}>Try a different category or search term.</div>
          </div>

        ) : (
          <>
            <div style={{ color: t.textMut, fontSize: "13px", marginBottom: "24px" }}>
              {filtered.length} live auction{filtered.length !== 1 ? "s" : ""}
              {urgentCount > 0 && <span style={{ color: "#f59e0b", fontWeight: 700, marginLeft: "10px" }}>⚡ {urgentCount} ending in under 1 hour</span>}
            </div>

            {sort === "ending" && filtered.some(a => { const r = a.endTime - Date.now(); return r > 0 && r < 3600000; }) && (
              <div style={{ marginBottom: "28px" }}>
                <div style={{ color: "#f43f5e", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f43f5e", display: "inline-block", animation: "livePulse 1s infinite" }} />
                  Ending in under 1 hour
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" }}>
                  {filtered
                    .filter(a => { const r = a.endTime - Date.now(); return r > 0 && r < 3600000; })
                    .map(a => (
                      <LiveCard key={a.id} auction={a} onView={id => navigate(`/auction/${id}`)} watched={watchlistIds.includes(a.id)} onToggleWatch={toggleWatch} isBusiness={role === "business" && a.createdById === String(userId)}
                        onComplete={(id) => setAuctions(prev => prev.map(x => x.id === id ? { ...x, status: "Completed", live: false } : x))} />
                    ))}
                </div>
                <div style={{ borderTop: `1px solid ${t.border}`, margin: "28px 0 14px" }} />
                <div style={{ color: t.textMut, fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "14px" }}>All live auctions</div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" }}>
              {filtered
                .filter(a => sort !== "ending" || (() => { const r = a.endTime - Date.now(); return r <= 0 || r >= 3600000; })())
                .map(a => (
                  <LiveCard key={a.id} auction={a} onView={id => navigate(`/auction/${id}`)} watched={watchlistIds.includes(a.id)} onToggleWatch={toggleWatch} isBusiness={role === "business" && a.createdById === String(userId)}
                    onComplete={(id) => setAuctions(prev => prev.map(x => x.id === id ? { ...x, status: "Completed", live: false } : x))} />
                ))}
            </div>
          </>
        )}
      </div>

      <FooterComponent/>

      <style>{`
        @keyframes livePulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.5; transform:scale(1.15); } }
        @keyframes fadeIn    { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        input::placeholder   { color: ${t.textFaint}; }
        select option        { background: ${t.bgSec}; color: ${t.textPri}; }
      `}</style>
    </div>
  );
}
