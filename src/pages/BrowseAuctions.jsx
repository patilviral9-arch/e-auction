import React, { useMemo, useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useThemeStyles } from "../utils/themeStyles";
import { useAuth } from "../context/AuthContext";
import FooterComponent from "../components/user/FooterComponent";

const API = `${import.meta.env.VITE_API_URL}/wish`;

const formatINR = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const CATEGORIES = ["All", "Electronics", "Vehicles", "Mobiles", "Luxury", "Furniture", "Collectibles", "Real Estate", "Industrial", "Art", "Sports", "Books"];

const BROWSE_CATEGORY_ALIASES = {
  All: ["all"],
  Electronics: ["electronics", "electronic", "gadget", "gadgets"],
  Vehicles: ["vehicle", "vehicles", "car", "cars", "bike", "bikes", "automobile", "automobiles"],
  Mobiles: ["mobile", "mobiles", "phone", "phones", "smartphone", "smartphones"],
  Luxury: ["luxury", "luxuries"],
  Furniture: ["furniture", "furnitures"],
  Collectibles: ["collectible", "collectibles", "antique", "antiques"],
  "Real Estate": ["real estate", "realestate", "property", "properties"],
  Industrial: ["industrial", "industry", "machinery", "machine"],
  Art: ["art", "arts", "painting", "paintings", "sculpture", "sculptures"],
  Sports: ["sport", "sports"],
  Books: ["book", "books"],
};

const normalizeCategoryText = (value = "") =>
  String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const resolveBrowseCategory = (value = "") => {
  const normalized = normalizeCategoryText(value);
  if (!normalized) return "";
  for (const [label, aliases] of Object.entries(BROWSE_CATEGORY_ALIASES)) {
    if (aliases.some((alias) => normalizeCategoryText(alias) === normalized)) return label;
  }
  return "";
};

const matchesActiveCategory = (auctionCategory = "", activeCategory = "All") => {
  if (activeCategory === "All") return true;
  return resolveBrowseCategory(auctionCategory) === activeCategory;
};

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

// endTime is a Unix ms timestamp — same source of truth as AuctionDetail
function useCountdown(endTime, auctionId, status, onComplete) {
  const calc = () => {
    const diff = Math.max(0, endTime - Date.now());
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { diff, h, m, s };
  };
  const [state, setState] = useState(calc);
  const firedRef = useRef(false);
  useEffect(() => {
    setState(calc());
    const t = setInterval(() => {
      const next = calc();
      setState(next);
      if (next.diff === 0 && !firedRef.current && status === "Active" && auctionId) {
        firedRef.current = true;
        markCompleted(auctionId, onComplete);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [endTime]);

  if (state.diff === 0) return "Ended";
  if (state.h > 0) return `${state.h}h ${String(state.m).padStart(2, "0")}m`;
  return `${String(state.m).padStart(2, "0")}m ${String(state.s).padStart(2, "0")}s`;
}

function BidModal({ auction, onClose, onBid }) {
  const t = useThemeStyles();
  const { userId, userName } = useAuth();
  const [amount, setAmount] = useState(auction.currentBid + 500);
  const [placed, setPlaced] = useState(false);
  const [bidError, setBidError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const min = auction.currentBid + 1;

  const submit = async () => {
    if (amount < min) return;
    setBidError("");
    setSubmitting(true);
    try {
      let bidderName = "Anonymous";
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        bidderName = storedUser.businessName
          || ((storedUser.firstName || "") + " " + (storedUser.lastName || "")).trim()
          || storedUser.name || userName || "Anonymous";
      } catch { bidderName = userName || "Anonymous"; }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/bid/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auction: auction.id, auctionTitle: auction.title, bidder: userId, userName: bidderName, bidAmount: amount }),
      });
      const data = await res.json();
      if (!res.ok) { setBidError(data.message || "Failed to place bid."); setSubmitting(false); return; }
      setPlaced(true);
      setTimeout(() => { onBid(auction.id, amount); onClose(); }, 1200);
    } catch { setBidError("Network error — please try again."); setSubmitting(false); }
  };
  const endsInText = useCountdown(auction.endTime);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: t.bgSec, border: `1px solid ${t.borderMd}`, borderRadius: "20px", padding: "32px", width: "420px", boxShadow: `0 32px 64px ${t.shadow}` }} onClick={e => e.stopPropagation()}>
        {placed ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "52px", marginBottom: "16px" }}>🎉</div>
            <div style={{ color: "#34d399", fontSize: "20px", fontWeight: 800 }}>Bid Placed!</div>
            <div style={{ color: t.textMut, fontSize: "14px", marginTop: "8px" }}>{formatINR(amount)} on {auction.title}</div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <div style={{ color: t.textMut, fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "4px" }}>Place a Bid</div>
                <div style={{ color: t.textPri, fontSize: "16px", fontWeight: 700, maxWidth: "280px", lineHeight: 1.3 }}>{auction.title}</div>
              </div>
              <button onClick={onClose} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "8px", color: t.textSec, cursor: "pointer", width: "32px", height: "32px", fontSize: "16px" }}>✕</button>
            </div>
            <img src={auction.img} alt={auction.title} style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "12px", marginBottom: "20px" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              {[
                ["Current Bid", formatINR(auction.currentBid), "#38bdf8"],
                ["Total Bids",  auction.totalBids + " bids",   t.textSec],
                ["Minimum",     formatINR(min),                "#f59e0b"],
                ["Ends In",     endsInText,                    auction.live ? "#f43f5e" : t.textSec],
              ].map(([label, val, col]) => (
                <div key={label} style={{ background: t.bgCard, borderRadius: "10px", padding: "12px", border: `1px solid ${t.border}` }}>
                  <div style={{ color: t.textMut, fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>{label}</div>
                  <div style={{ color: col, fontSize: "15px", fontWeight: 700 }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: t.textSec, fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "8px" }}>Your Bid Amount (₹)</label>
              <div style={{ display: "flex", border: "1px solid rgba(56,189,248,0.4)", borderRadius: "12px", overflow: "hidden" }}>
                <span style={{ padding: "12px 16px", background: "rgba(56,189,248,0.08)", color: "#38bdf8", fontWeight: 700, fontSize: "16px" }}>₹</span>
                <input type="number" value={amount} min={min} onChange={e => setAmount(Number(e.target.value))}
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: t.textPri, fontSize: "18px", fontWeight: 700, padding: "12px 16px" }} />
              </div>
              {amount < min && <div style={{ color: "#f43f5e", fontSize: "12px", marginTop: "6px" }}>Minimum bid is {formatINR(min)}</div>}
              {bidError && <div style={{ color: "#f43f5e", fontSize: "12px", marginTop: "6px" }}>⚠️ {bidError}</div>}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={submit} disabled={amount < min || submitting} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: (amount >= min && !submitting) ? "linear-gradient(135deg,#38bdf8,#6366f1)" : t.bgCard, color: (amount >= min && !submitting) ? "white" : t.textMut, fontWeight: 700, fontSize: "15px", cursor: (amount >= min && !submitting) ? "pointer" : "not-allowed" }}>{submitting ? "⏳ Placing…" : "🏷️ Confirm Bid"}</button>
              <button onClick={onClose} style={{ padding: "14px 20px", borderRadius: "12px", border: `1px solid ${t.border}`, background: "transparent", color: t.textSec, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Inline SVG icon helper (mirrors HomeComponent) ── */
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
  Fire:      (s=14) => <Ico size={s}><path d="M12 2c0 0-5 6-5 10a5 5 0 0 0 10 0c0-4-5-10-5-10z"/><path d="M12 12c0 0-2 2.5-2 4a2 2 0 0 0 4 0c0-1.5-2-4-2-4z" fill="currentColor" stroke="none"/></Ico>,
  Heart:     (s=15, filled=false) => <Ico size={s} fill={filled ? "currentColor" : "none"} sw={filled ? 0 : 1.75}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></Ico>,
  Tag:       (s=11) => <Ico size={s}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></Ico>,
  Clock:     (s=11) => <Ico size={s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Ico>,
  Users:     (s=13) => <Ico size={s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Ico>,
  Gavel:     (s=14) => <Ico size={s}><path d="M14.5 2.5 19 7l-9 9-4.5-4.5 9-9z"/><path d="m2 22 7-7"/><path d="M14.5 2.5 12 5"/></Ico>,
  Star:      (s=11) => <Ico size={s} fill="currentColor" sw={0}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Ico>,
};

function AuctionCard({ auction, onBid, watchlist, toggleWatch, onComplete,isBusiness}) {
  const t = useThemeStyles();
  const [hov, setHov] = useState(false);
  const time = useCountdown(auction.endTime, auction.id, auction.status, onComplete);
  const watched = watchlist.includes(auction.id);

  const isCancelled = auction.status === "Cancelled" || auction.status === "cancelled";
  const isEnded     = !isCancelled && (time === "Ended" || auction.status === "Completed" || auction.status === "ended");
  const isScheduled = !isCancelled && !isEnded && (auction.scheduled || auction.status === "Scheduled");
  const isLive      = !isCancelled && !isEnded && !isScheduled && auction.live;

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, []);

  /* ── bid label & time label ── */
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
        borderRadius: "20px",
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

        {/* Hot badge */}
        {auction.hot && !isEnded && (
          <div style={{ position: "absolute", top: "12px", right: "44px", display: "flex", alignItems: "center", justifyContent: "center", background: t.L ? "rgba(255,255,255,0.9)" : "rgba(15,23,42,0.8)", backdropFilter: "blur(8px)", border: `1px solid ${t.borderMd}`, borderRadius: "8px", padding: "4px 8px", color: "#f97316" }}>
            {SvgIcons.Fire(14)}
          </div>
        )}

        {/* Wishlist heart button */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); toggleWatch(auction.id); }}
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
              {SvgIcons.Tag(11)} {bidLabel}
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

        {/* Bids progress bar */}
        {isLive && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: t.textMut }}>
              {SvgIcons.Users(13)}
              <span style={{ color: t.textMut, fontSize: "12px" }}>{auction.totalBids} bids</span>
            </div>
            <div style={{ flex: 1, height: "3px", background: t.L ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, (auction.totalBids / 50) * 100)}%`, background: "linear-gradient(90deg, #38bdf8, #6366f1)", borderRadius: "2px" }} />
            </div>
          </div>
        )}
        {!isLive && !isScheduled && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: t.textMut, fontSize: "12px" }}>
              {SvgIcons.Users(13)} {auction.totalBids} bids
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "3px", color: "#f59e0b", fontSize: "12px" }}>
              {SvgIcons.Star(11)} <span style={{ color: t.textSec }}>{auction.sellerRating ?? "4.8"}</span>
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
        ) : isScheduled ? (
          <button disabled style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.08)", color: "#f59e0b", fontWeight: 700, fontSize: "14px", cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            {SvgIcons.Scheduled(14)} Not Started Yet
          </button>
        ) : isBusiness ? (
          <button disabled style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid rgba(99,102,241,0.35)", background: "rgba(99,102,241,0.08)", color: "#6366f1", fontWeight: 700, fontSize: "12px", cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            🚫 Business account can't bid
          </button>
        ) : (
          <button
            onClick={() => onBid(auction)}
            onMouseEnter={e => e.currentTarget.style.opacity = ".88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "none", background: isLive ? "linear-gradient(135deg,#f43f5e,#dc2626)" : "linear-gradient(135deg,#38bdf8,#6366f1)", color: "white", fontWeight: 700, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "opacity 0.15s" }}>
            {isLive ? <>{SvgIcons.Live(14)} Place Bid</> : <>{SvgIcons.Gavel(14)} Place Bid</>}
          </button>
        )}
      </div>
    </div>
  );
}

export default function BrowseAuctions() {
  const t = useThemeStyles();
  const location = useLocation();
  const navigate = useNavigate();
  const { userId, role } = useAuth();
  const [auctions,   setAuctions]  = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [search,    setSearch]    = useState("");
  const [sort,      setSort]      = useState("ending");
  const [watchlistIds, setWatchlistIds] = useState([]);
  const [liveOnly,  setLiveOnly]  = useState(false);

  // ── Load user's wishlist IDs from backend ─────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    fetch(`${API}/wishlist/${userId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const ids = (data.auctions || []).map(a => String(a._id || a.id || a));
        setWatchlistIds(ids);
      })
      .catch(() => {});
  }, [userId]);

  const parseDurationToMs = (a) => {
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
    return Date.now() + mins * 60 * 1000;
  };

  const normalise = (a) => {
    const endTime = parseDurationToMs(a);
    let status = a.status;   // "Active" | "Completed" | "Scheduled" | "Cancelled"
    if (status === "Active" && endTime && endTime < Date.now()) status = "Completed";
    return {
    id:         String(a._id || a.id),
    title:      a.title,
    category:   a.category,
    condition:  a.condition,
    seller:     (typeof a.createdBy === "object" && a.createdBy !== null)
                  ? (a.createdBy.businessName || a.createdBy.name || a.createdBy.email || "Unknown")
                  : (a.createdBy || "Unknown"),
    img:        (() => {
                  const imgs = a.images;
                  if (!imgs || imgs.length === 0) return "https://placehold.co/400x300?text=No+Image";
                  const first = imgs[0];
                  if (typeof first === "string") return first;
                  if (typeof first === "object") return first.url || first.secure_url || first.src || "https://placehold.co/400x300?text=No+Image";
                  return "https://placehold.co/400x300?text=No+Image";
                })(),
    currentBid: a.currentBid ?? a.startingBid ?? 0,
    totalBids:  a.totalBids ?? a.bids?.length ?? 0,
    endTime,
    // ── FIX: use raw API status as the source of truth ──
    status,
    live:       status === "Active",
    scheduled:  status === "Scheduled",
    hot:        a.hot || false,
    sellerRating: a.sellerRating ?? "4.8",
    createdById: typeof a.createdBy === "object" && a.createdBy !== null
                   ? String(a.createdBy._id || a.createdBy.id || "")
                   : String(a.createdBy || ""),
  };
  };

  const fetchAuctions = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setFetchError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auction/auctions`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.auctions ?? data.data ?? [];

      // ── Show all auctions including Cancelled ──
      const normalised = list.map(normalise);

      // Enrich currentBid from bids endpoint (source of truth)
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

      setAuctions(enriched);
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAuctions(true); }, []);

  // Preselect category when coming from links like /browse?category=Electronics
  useEffect(() => {
    const categoryParam = new URLSearchParams(location.search).get("category");
    if (!categoryParam) return;
    const resolvedCategory = resolveBrowseCategory(categoryParam);
    setActiveCat(resolvedCategory && CATEGORIES.includes(resolvedCategory) ? resolvedCategory : "All");
  }, [location.search]);

  // Re-fetch silently when user comes back to this tab (picks up status changes made in Listings)
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible") fetchAuctions(false); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // ── Toggle wishlist ─────────────────────────────────────────────────────────
  const toggleWatch = async (id) => {
    if (!userId) { navigate("/Login"); return; }
    const isWatched = watchlistIds.includes(id);
    setWatchlistIds(prev => isWatched ? prev.filter(x => x !== id) : [...prev, id]);
    try {
      if (isWatched) {
        await fetch(`${API}/wishlist/${userId}/remove/${id}`, { method: "DELETE" });
      } else {
        await fetch(`${API}/wishlist/${userId}/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ auctionId: id }),
        });
      }
    } catch {
      setWatchlistIds(prev => isWatched ? [...prev, id] : prev.filter(x => x !== id));
    }
  };

  const handleBid = (id, amount) => {
    setAuctions(prev => prev.map(a => a.id === id ? { ...a, currentBid: amount, totalBids: a.totalBids + 1 } : a));
    setTimeout(() => {
      fetch(`${import.meta.env.VITE_API_URL}/bid/bids/auction/${id}`)
        .then(r => r.ok ? r.json() : null)
        .then(bidData => {
          if (!bidData) return;
          const list = bidData.data ?? [];
          if (list.length > 0) {
            const trueBid = list[0].bidAmount;
            setAuctions(prev => prev.map(a => a.id === id ? { ...a, currentBid: trueBid, totalBids: list.length } : a));
          }
        }).catch(() => {});
    }, 800);
  };

  const categoryCounts = useMemo(() => {
    const counts = Object.fromEntries(CATEGORIES.map((category) => [category, 0]));
    auctions.forEach((auction) => {
      const resolved = resolveBrowseCategory(auction?.category || "");
      if (resolved && counts[resolved] !== undefined) counts[resolved] += 1;
    });
    counts.All = auctions.length;
    return counts;
  }, [auctions]);

  const filtered = auctions
    .filter(a => matchesActiveCategory(a.category, activeCat))
    .filter(a => !liveOnly || a.live)
    .filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || (a.category || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "ending")  return a.endTime - b.endTime;
      if (sort === "highest") return b.currentBid - a.currentBid;
      if (sort === "lowest")  return a.currentBid - b.currentBid;
      if (sort === "bids")    return b.totalBids - a.totalBids;
      return 0;
    });

  const liveCount = auctions.filter(a => a.live).length;

  return (
    <div style={{ background: t.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", transition: "background 0.25s" }}>

      {/* ── HEADER ── */}
      <div style={{ background: t.bgSec, borderBottom: `1px solid ${t.border}`, padding: "40px 40px 32px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h1 style={{ color: t.textPri, fontSize: "36px", fontWeight: 900, margin: 0 }}>Browse Auctions</h1>
              <p style={{ color: t.textMut, marginTop: "8px", fontSize: "15px" }}>Find your next deal — bid smart, win big.</p>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: t.textMut, fontSize: "15px" }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search auctions..."
                  style={{ background: t.bgInput, border: `1px solid ${t.borderMd}`, borderRadius: "10px", padding: "10px 14px 10px 38px", color: t.textPri, fontSize: "14px", outline: "none", width: "240px" }} />
              </div>
            </div>
          </div>

          {/* Category tabs */}
          <div style={{ display: "flex", gap: "8px", marginTop: "24px", flexWrap: "wrap" }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCat(cat)} style={{ padding: "7px 16px", borderRadius: "50px", border: activeCat === cat ? "1px solid rgba(56,189,248,.5)" : `1px solid ${t.border}`, background: activeCat === cat ? "rgba(56,189,248,.12)" : t.bgCard, color: activeCat === cat ? "#38bdf8" : t.textMut, fontWeight: 600, fontSize: "13px", cursor: "pointer", transition: "all .2s", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span>{cat}</span>
                <span style={{ background: activeCat === cat ? "rgba(56,189,248,.2)" : t.L ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)", borderRadius: "50px", padding: "1px 7px", fontSize: "11px", color: activeCat === cat ? "#38bdf8" : t.textMut, transition: "all .2s" }}>
                  {categoryCounts[cat] ?? 0}
                </span>
              </button>
            ))}
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: "50px", border: `1px solid ${t.border}`, background: t.bgCard, color: t.textSec, fontSize: "13px", outline: "none", cursor: "pointer" }}>
              <option value="ending">Ending Soon</option>
              <option value="highest">Highest Bid</option>
              <option value="lowest">Lowest Bid</option>
              <option value="bids">Most Bids</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── GRID ── */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 40px" }}>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: t.textFaint }}>
            <div style={{ fontSize: "40px", marginBottom: "16px", animation: "pulse 1s infinite" }}>⏳</div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: t.textSec }}>Loading auctions…</div>
          </div>
        ) : fetchError ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: "#f43f5e", marginBottom: "8px" }}>Could not load auctions</div>
            <div style={{ fontSize: "13px", color: t.textMut, marginBottom: "20px" }}>{fetchError}</div>
            <button onClick={() => window.location.reload()} style={{ padding: "10px 24px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#38bdf8,#6366f1)", color: "white", fontWeight: 700, cursor: "pointer" }}>Retry</button>
          </div>
        ) : (
          <>
            <div style={{ color: t.textMut, fontSize: "13px", marginBottom: "20px" }}>{filtered.length} auctions found</div>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: t.textFaint }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
                <div style={{ fontSize: "18px", fontWeight: 600, color: t.textSec }}>No auctions found</div>
                <div style={{ fontSize: "14px", marginTop: "8px" }}>Try a different category or search term</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" }}>
                {filtered.map(a => (
                  <AuctionCard
                    key={a.id}
                    auction={a}
                    isBusiness={role === "business" && a.createdById === String(userId)}
                    onBid={(auction) => {
                      // Only open bid modal for active auctions; navigate to detail for others
                      if (auction.status === "Active") {
                        navigate(`/auction/${auction.id}`);
                      }
                    }}
                    watchlist={watchlistIds}
                    toggleWatch={toggleWatch}
                    onComplete={(id) => setAuctions(prev => prev.map(a => a.id === id ? { ...a, status: "Completed", live: false } : a))}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

       <FooterComponent/>

      <style>{`
        @keyframes cardIn  { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
        input::placeholder { color: ${t.textFaint}; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
      `}</style>
    </div>
  );
}

