import React, { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import FooterComponent from "./FooterComponent";
import { useThemeStyles } from "../../utils/themeStyles";
import { useAuth } from "../../context/AuthContext";

const WISH_API = `${import.meta.env.VITE_API_URL}/wish`;

/* ─────────── SVG ICONS ─────────── */
const Ico = ({ d, size = 16, sw = 1.75, fill = "none", vb = "0 0 24 24", children, ...p }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={vb}
    fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }} {...p}>
    {children || <path d={d} />}
  </svg>
);

const Icons = {
  Gavel:     (s=18) => <Ico size={s}><path d="M14.5 2.5 19 7l-9 9-4.5-4.5 9-9z"/><path d="m2 22 7-7"/><path d="M14.5 2.5 12 5"/></Ico>,
  Live:      (s=16) => <Ico size={s}><circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4"/></Ico>,
  Search:    (s=16) => <Ico size={s}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></Ico>,
  Eye:       (s=16) => <Ico size={s}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Ico>,
  Fire:      (s=16) => <Ico size={s}><path d="M12 2c0 0-5 6-5 10a5 5 0 0 0 10 0c0-4-5-10-5-10z"/><path d="M12 12c0 0-2 2.5-2 4a2 2 0 0 0 4 0c0-1.5-2-4-2-4z" fill="currentColor" stroke="none"/></Ico>,
  Tag:       (s=14) => <Ico size={s}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></Ico>,
  Clock:     (s=14) => <Ico size={s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Ico>,
  ArrowR:    (s=16) => <Ico size={s}><polyline points="9 18 15 12 9 6"/></Ico>,
  ArrowUp:   (s=16) => <Ico size={s}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></Ico>,
  Users:     (s=16) => <Ico size={s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Ico>,
  TrendUp:   (s=16) => <Ico size={s}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></Ico>,
  Star:      (s=16) => <Ico size={s} fill="currentColor" sw={0}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Ico>,
  Shield:    (s=20) => <Ico size={s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Ico>,
  ComingSoon: (s=16) => <Ico size={s} fill="none" stroke="currentColor" sw={2}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Ico>,
  Bolt:      (s=20) => <Ico size={s}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" sw={0}/></Ico>,
  Globe:     (s=20) => <Ico size={s}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Ico>,
  Lock:      (s=20) => <Ico size={s}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Ico>,
  Register:  (s=32) => <Ico size={s}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></Ico>,
  Bid:       (s=32) => <Ico size={s}><path d="M14.5 2.5 19 7l-9 9-4.5-4.5 9-9z"/><path d="m2 22 7-7"/></Ico>,
  Trophy:    (s=32) => <Ico size={s}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></Ico>,
  Zap:       (s=16) => <Ico size={s}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" sw={0}/></Ico>,
  // Category icons
  Electronics:(s=18) => <Ico size={s}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></Ico>,
  Vehicle:   (s=18) => <Ico size={s}><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></Ico>,
  Gem:       (s=18) => <Ico size={s}><polygon points="6 3 18 3 22 9 12 22 2 9"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="12" y1="3" x2="6" y2="9"/><line x1="12" y1="3" x2="18" y2="9"/></Ico>,
  Home:      (s=18) => <Ico size={s}><path d="M3 9.75L12 3l9 6.75V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.75z"/><path d="M9 21V12h6v9"/></Ico>,
  Cpu:       (s=18) => <Ico size={s}><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></Ico>,
  Palette:   (s=18) => <Ico size={s}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" sw={0}/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" sw={0}/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" sw={0}/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" sw={0}/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></Ico>,
  Mobile:    (s=18) => <Ico size={s}><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></Ico>,
  Factory:   (s=18) => <Ico size={s}><path d="m2 20 7-7v4l7-7v4l4-4v10H2z"/><path d="M2 10V4l5 3-5 3z"/></Ico>,
  Book:      (s=18) => <Ico size={s}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></Ico>,
  Heart:     (s=16, filled=false) => <Ico size={s} fill={filled ? "currentColor" : "none"} sw={filled ? 0 : 1.75}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></Ico>,
};

/* ─────────── Helpers ─────────── */
// exact same useCountdown as BrowseAuctions (ms timestamp input)
function useCountdown(endTime) {
  const calc = () => {
    const diff = Math.max(0, endTime - Date.now());
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { diff, h, m, s };
  };
  const [state, setState] = useState(calc);
  useEffect(() => {
    setState(calc());
    const t = setInterval(() => setState(calc()), 1000);
    return () => clearInterval(t);
  }, [endTime]);
  if (state.diff === 0) return "Ended";
  if (state.h > 0) return `${state.h}h ${String(state.m).padStart(2, "0")}m`;
  return `${String(state.m).padStart(2, "0")}m ${String(state.s).padStart(2, "0")}s`;
}

// exact same parseDurationToMs as BrowseAuctions
function parseDurationToMs(a) {
  if (a.endTime) return new Date(a.endTime).getTime();
  const base = a.startDate || a.createdAt;
  const mins = a.durationMinutes ?? (() => {
    const dur = a.duration || "";
    if (/1 hour/i.test(dur))  return 60;
    if (/6 hour/i.test(dur))  return 360;
    if (/12 hour/i.test(dur)) return 720;
    if (/3 day/i.test(dur))   return 4320;
    if (/7 day/i.test(dur))   return 10080;
    return 1440;
  })();
  if (base) return new Date(base).getTime() + mins * 60 * 1000;
  return Date.now() + mins * 60 * 1000;
}

function formatINR(n) {
  if (!n && n !== 0) return "—";
  return "₹" + Number(n).toLocaleString("en-IN");
}

function isLiveAuction(auction) {
  const now = Date.now();
  const start = auction.startTime ? new Date(auction.startTime).getTime() : 0;
  const end   = auction.endTime   ? new Date(auction.endTime).getTime()   : Infinity;
  return start <= now && now < end && auction.status !== "closed" && auction.status !== "ended";
}

const HOME_CATEGORY_ALIASES = {
  Electronics: ["electronics", "electronic", "gadget", "gadgets"],
  Vehicles: ["vehicle", "vehicles", "car", "cars", "bike", "bikes", "automobile", "automobiles"],
  Mobiles: ["mobile", "mobiles", "phone", "phones", "smartphone", "smartphones"],
  Luxury: ["luxury", "luxuries"],
  Furniture: ["furniture", "furnitures", "sofa", "table", "chair", "chairs"],
  Collectibles: ["collectible", "collectibles", "antique", "antiques"],
  "Real Estate": ["real estate", "realestate", "property", "properties"],
  Industrial: ["industrial", "industry", "machinery", "machine"],
  Art: ["art", "arts", "painting", "paintings", "sculpture", "sculptures"],
  Sports: ["sport", "sports", "fitness", "game", "games"],
  Books: ["book", "books", "novel", "novels", "literature"],
};

const normalizeCategoryText = (value = "") =>
  String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const resolveHomeCategory = (rawCategory = "") => {
  const normalized = normalizeCategoryText(rawCategory);
  if (!normalized) return "";
  for (const [label, aliases] of Object.entries(HOME_CATEGORY_ALIASES)) {
    if (aliases.some((alias) => normalizeCategoryText(alias) === normalized)) return label;
  }
  return "";
};

const shuffleItems = (items = []) => {
  const randomized = [...items];
  for (let i = randomized.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [randomized[i], randomized[j]] = [randomized[j], randomized[i]];
  }
  return randomized;
};

/* ─────────── AuctionCard (API-driven) ─────────── */
function AuctionCard({ item, index, watchlist = [], toggleWatch }) {
  const t = useThemeStyles();
  const [hovered, setHovered] = useState(false);
  const [bidPulse, setBidPulse] = useState(false);
  const handleBid = () => { setBidPulse(true); setTimeout(() => setBidPulse(false), 600); };

  // identical logic to BrowseAuctions: parseDurationToMs → ms timestamp → useCountdown
  const isScheduled = item.status === "Scheduled" || item.scheduled === true;
  const live        = !isScheduled && item.status === "Active";
  const endTimeMs   = parseDurationToMs(item);           // ms number, same as BrowseAuctions
  const countdown   = useCountdown(endTimeMs);           // used for both live (ends in) and scheduled (starts in)

  const id = item._id ?? item.id;
  const watched = watchlist.includes(String(id));

  const currentBid  = item.currentBid  ?? item.startingBid ?? 0;
  const totalBids   = item.totalBids   ?? item.bids?.length ?? 0;
  const category    = item.category    ?? "Other";
  const img         = item.images?.[0] ?? item.image ?? item.img ?? "https://placehold.co/400x300/1e293b/38bdf8?text=No+Image";
  const title       = item.title       ?? item.name ?? "Untitled";
  const hot         = item.hot         ?? (totalBids > 20);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: t.bgCardGrad, borderRadius: "20px", overflow: "hidden",
        border: hovered ? "1px solid rgba(56,189,248,0.3)" : `1px solid ${t.border}`,
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hovered ? `0 24px 48px ${t.shadow}` : `0 4px 20px ${t.shadow}`,
        transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        animation: `cardIn 0.5s ease ${index * 0.1}s both`, width: "100%",
      }}>

      {/* Image */}
      <div style={{ position: "relative", height: "200px", background: t.bgCardGrad, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img src={img} alt={title}
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: hovered ? "scale(1.07)" : "scale(1)", transition: "transform 0.5s ease" }}
          onError={e => { e.target.src = "https://placehold.co/400x300/1e293b/38bdf8?text=No+Image"; }}
        />
        <div style={{ position: "absolute", inset: 0, background: hovered ? `linear-gradient(to bottom, transparent 50%, ${t.L ? "rgba(248,250,252,0.8)" : "rgba(15,23,42,0.8)"})` : `linear-gradient(to bottom, transparent 60%, ${t.L ? "rgba(248,250,252,0.5)" : "rgba(15,23,42,0.5)"})`, transition: "all 0.3s" }} />

        {live ? (
          <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", alignItems: "center", gap: "6px", background: "#f43f5e", color: "white", borderRadius: "8px", padding: "4px 10px", fontSize: "11px", fontWeight: 800 }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "white", animation: "pulse 1s infinite" }} />
            LIVE
          </div>
        ) : (
          <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", alignItems: "center", gap: "6px", background: "#f59e0b", color: "white", borderRadius: "8px", padding: "4px 10px", fontSize: "11px", fontWeight: 800 }}>
            {Icons.ComingSoon(11)} SCHEDULED
          </div>
        )}
        {hot && (
          <div style={{ position: "absolute", top: "12px", right: "44px", display: "flex", alignItems: "center", justifyContent: "center", background: t.L ? "rgba(255,255,255,0.9)" : "rgba(15,23,42,0.8)", backdropFilter: "blur(8px)", border: `1px solid ${t.borderMd}`, borderRadius: "8px", padding: "4px 8px", color: "#f97316" }}>
            {Icons.Fire(14)}
          </div>
        )}
        {/* Wishlist heart button */}
        {toggleWatch && (
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); toggleWatch(String(id)); }}
            title={watched ? "Remove from wishlist" : "Add to wishlist"}
            style={{
              position: "absolute", top: "10px", right: "10px",
              background: watched ? "rgba(244,63,94,0.15)" : t.L ? "rgba(255,255,255,0.85)" : "rgba(15,23,42,0.8)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${watched ? "rgba(244,63,94,0.4)" : t.borderMd}`,
              borderRadius: "8px", width: "30px", height: "30px",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: watched ? "#f43f5e" : t.textMut,
              transition: "all 0.2s",
            }}
          >
            {Icons.Heart(15, watched)}
          </button>
        )}
        <div style={{ position: "absolute", bottom: "12px", left: "12px", background: t.L ? "rgba(255,255,255,0.85)" : "rgba(15,23,42,0.8)", backdropFilter: "blur(8px)", border: `1px solid ${t.borderMd}`, borderRadius: "6px", padding: "3px 8px", fontSize: "11px", color: t.textSec, fontWeight: 600 }}>
          {category}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "20px" }}>
        <h3 style={{ color: t.textPri, fontWeight: 700, fontSize: "15px", margin: "0 0 12px", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{title}</h3>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: t.textMut, fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>
              {Icons.Tag(11)}{live ? "Current Bid" : isScheduled ? "Starting Bid" : "Final Bid"}
            </div>
            <div style={{ color: "#38bdf8", fontSize: "22px", fontWeight: 800 }}>{formatINR(live ? currentBid : (item.startingBid ?? 0))}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px", color: t.textMut, fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>
              {Icons.Clock(11)} {live ? "Ends In" : isScheduled ? "Starts In" : "Ended"}
            </div>
            <div style={{ color: live ? "#f43f5e" : "#f59e0b", fontSize: "13px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{countdown}</div>
          </div>
        </div>

        {live && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: t.textMut }}>
              {Icons.Users(13)}
              <span style={{ color: t.textMut, fontSize: "12px" }}>{totalBids} bids</span>
            </div>
            <div style={{ flex: 1, height: "3px", background: t.L ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, (totalBids / 50) * 100)}%`, background: "linear-gradient(90deg, #38bdf8, #6366f1)", borderRadius: "2px" }} />
            </div>
          </div>
        )}

        {live ? (
          <Link to={`/auction/${item._id ?? item.id}`} onClick={handleBid}>
            <button style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg,#f43f5e,#dc2626)", color: "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer", transform: bidPulse ? "scale(0.97)" : "scale(1)", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              {Icons.Live(14)} Place Bid
            </button>
          </Link>
        ) : (
          <button disabled style={{ width: "100%", padding: "12px", background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            {Icons.ComingSoon(14)} Not Started Yet
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────── Skeleton card ─────────── */
function SkeletonCard({ t }) {
  const shine = {
    background: t.L
      ? "linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)"
      : "linear-gradient(90deg,rgba(255,255,255,0.05) 25%,rgba(255,255,255,0.1) 50%,rgba(255,255,255,0.05) 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite",
    borderRadius: "8px",
  };
  return (
    <div style={{ background: t.bgCardGrad, borderRadius: "20px", overflow: "hidden", border: `1px solid ${t.border}` }}>
      <div style={{ height: "200px", ...shine, borderRadius: 0 }} />
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ height: "14px", width: "80%", ...shine }} />
        <div style={{ height: "14px", width: "60%", ...shine }} />
        <div style={{ height: "28px", width: "50%", ...shine }} />
        <div style={{ height: "40px", ...shine, borderRadius: "12px" }} />
      </div>
    </div>
  );
}

/* ─────────── Stats ─────────── */
function StatsSection() {
  const t = useThemeStyles();
  const [totalAuctions,  setTotalAuctions]  = useState(null);
  const [completedCount, setCompletedCount] = useState(null);
  const [bidderCount,    setBidderCount]    = useState(null);

  useEffect(() => {
    let cancelled = false;

    const toArray = (payload, preferredKeys = []) => {
      for (const key of preferredKeys) {
        if (Array.isArray(payload?.[key])) return payload[key];
      }
      if (Array.isArray(payload?.data)) return payload.data;
      if (Array.isArray(payload)) return payload;
      return [];
    };

    const normalizeStatus = (value) => String(value || "").trim().toLowerCase();

    const fetchJson = async (url) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    };

    const isCompletedAuction = (auction) => {
      const status = normalizeStatus(auction?.status);
      if (status === "completed" || status === "ended") return true;
      if (status === "cancelled" || status === "canceled" || status === "scheduled") return false;
      const endDate = new Date(
        auction?.completedAt ??
        auction?.closedAt ??
        auction?.endDate ??
        auction?.endTime ??
        auction?.endsAt ??
        ""
      );
      return Number.isFinite(endDate.getTime()) && endDate.getTime() <= Date.now();
    };

    const fetchStats = async () => {
      const [auctionPayload, userPayload] = await Promise.all([
        fetchJson(`${import.meta.env.VITE_API_URL}/auction/auctions`),
        fetchJson(`${import.meta.env.VITE_API_URL}/user/getusers`),
      ]);

      if (cancelled) return;

      const auctions = toArray(auctionPayload, ["auctions"]);
      const users = toArray(userPayload, ["users"]);

      setTotalAuctions(auctions.length);
      setCompletedCount(auctions.filter(isCompletedAuction).length);

      const bidders = users.filter((u) => {
        const role = normalizeStatus(u?.role ?? u?.userType);
        return role === "personal";
      }).length;
      setBidderCount(bidders);
    };

    fetchStats().catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const stats = [
    { value: totalAuctions,  label: "Total Auctions",      suffix: "+", icon: Icons.TrendUp(28) },
    { value: completedCount, label: "Auctions Completed",  suffix: "+", icon: Icons.Gavel(28) },
    { value: bidderCount,    label: "Registered Bidders",  suffix: "+", icon: Icons.Users(28) },
  ];

  return (
    <div style={{ background: t.bgSec, borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, padding: "clamp(28px, 6vw, 60px) clamp(14px, 4vw, 40px)" }}>
      <div style={{ maxWidth: "980px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px", color: "#38bdf8" }}>{s.icon}</div>
            <div style={{ fontSize: "clamp(28px, 8vw, 40px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, background: "linear-gradient(135deg, #38bdf8, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {s.value === null
                ? <span style={{ fontSize: "28px", opacity: 0.5 }}>�</span>
                : `${s.prefix || ""}${Number(s.value).toLocaleString("en-IN")}${s.suffix || ""}`
              }
            </div>
            <div style={{ color: t.textMut, fontSize: "14px", fontWeight: 600, marginTop: "6px" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────── Category Strip ─────────── */
function CategoryStrip({ auctions = [] }) {
  const t = useThemeStyles();
  const cats = [
    { icon: Icons.Electronics(18), label: "Electronics", browseCategory: "Electronics" },
    { icon: Icons.Vehicle(18),     label: "Vehicles",    browseCategory: "Vehicles" },
    { icon: Icons.Mobile(18),      label: "Mobiles",     browseCategory: "Mobiles" },
    { icon: Icons.Gem(18),         label: "Luxury",      browseCategory: "Luxury" },
    { icon: Icons.Home(18),        label: "Furniture",   browseCategory: "Furniture" },
    { icon: Icons.Gem(18),         label: "Collectibles",browseCategory: "Collectibles" },
    { icon: Icons.Home(18),        label: "Real Estate", browseCategory: "Real Estate" },
    { icon: Icons.Factory(18),     label: "Industrial",  browseCategory: "Industrial" },
    { icon: Icons.Palette(18),     label: "Art",         browseCategory: "Art" },
    { icon: Icons.Trophy(18),      label: "Sports",      browseCategory: "Sports" },
    { icon: Icons.Book(18),        label: "Books",       browseCategory: "Books" },
  ];
  const categoryCounts = useMemo(() => {
    const counts = Object.fromEntries(cats.map((cat) => [cat.label, 0]));
    auctions.forEach((auction) => {
      const resolved = resolveHomeCategory(auction?.category || "");
      if (resolved && counts[resolved] !== undefined) counts[resolved] += 1;
    });
    return counts;
  }, [auctions]);

  const [hov, setHov] = useState(null);
  return (
    <div style={{ background: t.bgSec, padding: "32px 40px", borderBottom: `1px solid ${t.border}` }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          {cats.map((c, i) => (
            <Link key={c.label} to={`/browse?category=${encodeURIComponent(c.browseCategory)}`} style={{ textDecoration: "none" }}>
              <div onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: hov === i ? "rgba(56,189,248,0.1)" : t.bgCard, border: hov === i ? "1px solid rgba(56,189,248,0.35)" : `1px solid ${t.border}`, borderRadius: "50px", color: hov === i ? "#38bdf8" : t.textSec, fontSize: "13px", fontWeight: 600, transition: "all 0.2s", cursor: "pointer" }}>
                <span style={{ display: "flex", alignItems: "center" }}>{c.icon}</span>
                {c.label}
                <span style={{ background: hov === i ? "rgba(56,189,248,0.2)" : t.L ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)", borderRadius: "50px", padding: "1px 7px", fontSize: "11px", color: hov === i ? "#38bdf8" : t.textMut, transition: "all 0.2s" }}>{categoryCounts[c.label] ?? 0}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────── Trust Section ─────────── */
function TrustSection() {
  const t = useThemeStyles();
  const badges = [
    { icon: Icons.Lock(28),   title: "Bank-grade Security", desc: "256-bit SSL on every transaction" },
    { icon: Icons.Shield(28), title: "Buyer Protection",    desc: "Full refund if item not as described" },
    { icon: Icons.Bolt(28),   title: "Instant Payments",   desc: "Funds released within 24 hours" },
    { icon: Icons.Globe(28),  title: "Global Reach",       desc: "Buyers & sellers from 80+ countries" },
  ];
  return (
    <div style={{ background: t.bgSec, padding: "clamp(28px, 6vw, 60px) clamp(14px, 4vw, 40px)" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "18px" }}>
          {badges.map((b, i) => (
            <div key={i} style={{ padding: "22px 18px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "16px", textAlign: "center", boxShadow: t.shadowCard }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px", color: "#38bdf8" }}>{b.icon}</div>
              <div style={{ color: t.textPri, fontWeight: 700, fontSize: "15px", marginBottom: "6px" }}>{b.title}</div>
              <div style={{ color: t.textMut, fontSize: "13px", lineHeight: 1.5 }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────── MAIN HOME ─────────── */
export const HomeComponent = () => {
  const t = useThemeStyles();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [heroVisible, setHeroVisible] = useState(false);
  const [auctions, setAuctions]       = useState([]);
  const [loading,  setLoading]        = useState(true);
  const [error,    setError]          = useState(null);
  const [watchlistIds, setWatchlistIds] = useState([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => { setTimeout(() => setHeroVisible(true), 100); }, []);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const fetchWithRetry = async (url, options = {}, retries = 2) => {
    let lastErr = null;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        return await fetch(url, options);
      } catch (err) {
        lastErr = err;
        if (attempt < retries) await sleep(1200 * (attempt + 1));
      }
    }
    throw lastErr || new Error("Failed to fetch");
  };
  const retryLoadAuctions = () => {
    setError(null);
    setLoading(true);
    setReloadToken((prev) => prev + 1);
  };

  // Load user's wishlist IDs from backend
  useEffect(() => {
    if (!userId) return;
    fetch(`${WISH_API}/wishlist/${userId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const ids = (data.auctions || []).map(a => String(a._id || a.id || a));
        setWatchlistIds(ids);
      })
      .catch(() => {});
  }, [userId]);

  // Toggle wishlist add/remove
  const toggleWatch = async (id) => {
    if (!userId) { navigate("/Login"); return; }
    const isWatched = watchlistIds.includes(id);
    setWatchlistIds(prev => isWatched ? prev.filter(x => x !== id) : [...prev, id]);
    try {
      if (isWatched) {
        await fetch(`${WISH_API}/wishlist/${userId}/remove/${id}`, { method: "DELETE" });
      } else {
        await fetch(`${WISH_API}/wishlist/${userId}/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ auctionId: id }),
        });
      }
    } catch {
      // Revert on failure
      setWatchlistIds(prev => isWatched ? [...prev, id] : prev.filter(x => x !== id));
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchAuctions = async () => {
      try {
        const res = await fetchWithRetry(`${import.meta.env.VITE_API_URL}/auction/auctions`);
        if (!res.ok) throw new Error("Failed to fetch auctions");
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data ?? data.auctions ?? [];

        // Enrich each auction with real currentBid + totalBids from bids endpoint
        // (same pattern as BrowseAuctions)
        const enriched = await Promise.all(list.map(async (auction) => {
          const id = auction._id ?? auction.id;
          try {
            const r = await fetchWithRetry(`${import.meta.env.VITE_API_URL}/bid/bids/auction/${id}`);
            if (!r.ok) return auction;
            const bidData = await r.json();
            const bids = bidData.data ?? [];
            if (bids.length > 0) {
              return { ...auction, currentBid: bids[0].bidAmount, totalBids: bids.length };
            }
            return auction;
          } catch {
            return auction;
          }
        }));

        if (!isMounted) return;
        setAuctions(enriched);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || "Network error");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAuctions();
    return () => { isMounted = false; };
  }, [reloadToken]);

  const liveAuctions = useMemo(
    () => shuffleItems(auctions.filter((a) => a.status === "Active")).slice(0, 6),
    [auctions]
  );

  const featuredAuctions = useMemo(
    () => shuffleItems(auctions.filter((a) => a.status === "Scheduled")).slice(0, 6),
    [auctions]
  );

  const SectionHeader = ({ title, sub, cta, ctaLink, icon }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#38bdf8", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
          {icon}{sub}
        </div>
        <h2 style={{ color: t.textPri, fontSize: "32px", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>{title}</h2>
      </div>
      {cta && (
        <Link to={ctaLink} style={{ display: "flex", alignItems: "center", gap: "4px", color: "#38bdf8", textDecoration: "none", fontSize: "14px", fontWeight: 700, padding: "8px 18px", border: "1px solid rgba(56,189,248,0.3)", borderRadius: "8px", transition: "all 0.2s" }}>
          {cta} {Icons.ArrowR(14)}
        </Link>
      )}
    </div>
  );

  const renderCards = (items, fallbackCount = 6) => {
    if (loading) return Array.from({ length: fallbackCount }, (_, i) => <SkeletonCard key={i} t={t} />);
    if (error) return (
      <div style={{ gridColumn: "1/-1", color: "#f43f5e", textAlign: "center", padding: "40px", fontSize: "14px" }}>
        <div style={{ marginBottom: "12px" }}>Could not load auctions: {error}</div>
        <button
          onClick={retryLoadAuctions}
          style={{
            border: "1px solid rgba(244,63,94,0.35)",
            background: "rgba(244,63,94,0.12)",
            color: "#f43f5e",
            borderRadius: "8px",
            padding: "8px 14px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
    if (!items.length) return <div style={{ gridColumn: "1/-1", color: t.textMut, textAlign: "center", padding: "40px", fontSize: "14px" }}>No auctions found.</div>;
    return items.map((item, i) => <AuctionCard key={item._id ?? item.id ?? i} item={item} index={i} watchlist={watchlistIds} toggleWatch={toggleWatch} />);
  };

  return (
    <div style={{ background: t.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", transition: "background 0.25s" }}>

      {/* ── HERO ── */}
      <div style={{ position: "relative", minHeight: "88vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: t.isLight ? "linear-gradient(135deg,#90D5FF,#7ec8f5,#90D5FF)" : "#ffffff" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${t.L ? "rgba(56,189,248,0.05)" : "rgba(56,189,248,0.03)"} 1px, transparent 1px), linear-gradient(90deg, ${t.L ? "rgba(56,189,248,0.05)" : "rgba(56,189,248,0.03)"} 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
        <div style={{ position: "absolute", top: "20%", left: "15%", width: "400px", height: "400px", background: `radial-gradient(circle, ${t.L ? "rgba(56,189,248,0.12)" : "rgba(56,189,248,0.08)"} 0%, transparent 70%)`, borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "15%", right: "10%", width: "300px", height: "300px", background: `radial-gradient(circle, ${t.L ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)"} 0%, transparent 70%)`, borderRadius: "50%" }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "40px 20px", opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(30px)", transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(53,50,50,0.34)", border: "1px solid rgba(0,0,0,0)", borderRadius: "50px", padding: "6px 16px", marginBottom: "28px", color: t.isLight ? "#000" : "#fff", fontSize: "13px", fontWeight: 700 }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "100%", background: "#f43f5e", animation: "pulse 1s infinite" }} />
            {loading ? "Loading auctions…" : `${auctions.length || "—"} Auctions Available`}
          </div>
          <h1 style={{ fontSize: "clamp(42px, 7vw, 80px)", fontWeight: 900, color: t.isLight ? "#ffffff" : "#38bdf8", margin: "0 0 20px", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
            Where every bid{" "}
            <span style={{ background: "linear-gradient(135deg, #38bdf8, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: t.isLight ? "#0f172a" : "#000000" }}>brings you closer</span>
            <br />to the best deal!!!
          </h1>
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/browse" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "linear-gradient(135deg, #38bdf8, #6366f1)", color: "white", textDecoration: "none", padding: "14px 32px", borderRadius: "12px", fontSize: "16px", fontWeight: 700, boxShadow: "0 8px 24px rgba(56,189,248,0.35)" }}>
              {Icons.Search(18)} Explore Auctions
            </Link>
            <Link to="/LiveAuctions" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgb(235, 123, 123)", border: "1px solid rgba(227,207,211,0.18)", color: t.isLight ? "#000000" : "#ffffff", textDecoration: "none", padding: "14px 28px", borderRadius: "12px", fontSize: "16px", fontWeight: 700 }}>
              {Icons.Live(18)} Watch Live
            </Link>
          </div>
        </div>
      </div>

      <CategoryStrip auctions={auctions} />
      <StatsSection />

      {/* ── LIVE AUCTIONS ── */}
      <div style={{ background: t.bg, padding: "clamp(32px, 6vw, 72px) clamp(14px, 4vw, 40px)", borderTop: `1px solid ${t.L ? "rgba(244,63,94,0.08)" : "rgba(244,63,94,0.12)"}` }}>
        <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
          <SectionHeader title="Live Auctions" sub="Happening Now" icon={Icons.Live(14)} cta="View All Live" ctaLink="/LiveAuctions" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
            {renderCards(liveAuctions)}
          </div>
        </div>
      </div>

      {/* ── FEATURED ── */}
      <div style={{ background: t.bgSec, padding: "clamp(32px, 6vw, 72px) clamp(14px, 4vw, 40px)" }}>
        <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
          <SectionHeader title="Scheduled Auctions" sub="Coming Soon" icon={Icons.ComingSoon(14)} cta="Browse All" ctaLink="/browse" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
            {renderCards(featuredAuctions)}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{ background: t.bgDark, padding: "clamp(36px, 7vw, 80px) clamp(14px, 4vw, 40px)", borderTop: `1px solid ${t.border}` }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <div style={{ color: "#38bdf8", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Simple Process</div>
            <h2 style={{ color: t.textPri, fontSize: "clamp(28px, 7vw, 36px)", fontWeight: 800, margin: 0 }}>How It Works</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "22px" }}>
            {[
              { n: "01", icon: Icons.Register(40), title: "Register Free",  desc: "Create your account in under 60 seconds. Choose Personal for bidding or Business for selling.", color: "#38bdf8" },
              { n: "02", icon: Icons.Bid(40),      title: "Bid or List",    desc: "Browse thousands of auctions and place bids, or list your items to reach a global audience.", color: "#818cf8" },
              { n: "03", icon: Icons.Trophy(40),   title: "Win & Pay",      desc: "Highest bidder wins. Secure payment, instant confirmation, fast delivery.", color: "#34d399" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "36px 32px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "20px", position: "relative", overflow: "hidden", boxShadow: t.shadowCard }}>
                <div style={{ position: "absolute", top: "-10px", right: "20px", fontSize: "80px", fontWeight: 900, color: t.L ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.02)", lineHeight: 1 }}>{s.n}</div>
                <div style={{ color: s.color, marginBottom: "16px" }}>{s.icon}</div>
                <h3 style={{ color: t.textPri, fontWeight: 700, fontSize: "20px", marginBottom: "12px" }}>{s.title}</h3>
                <p style={{ color: t.textMut, fontSize: "14px", lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
                <div style={{ width: "40px", height: "3px", background: s.color, borderRadius: "2px", marginTop: "20px" }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <TrustSection />

      {/* ── CTA BANNER ── */}
      <div style={{ padding: "clamp(36px, 7vw, 80px) clamp(14px, 4vw, 40px)", background: "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)", textAlign: "center" }}>
        <h2 style={{ color: "white", fontSize: "clamp(30px, 8vw, 40px)", fontWeight: 900, margin: "0 0 16px" }}>Ready to start bidding?</h2>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "clamp(15px, 4vw, 18px)", marginBottom: "28px" }}>Join as bidders and sellers — it's completely free.</p>
        <div style={{ display: "flex", gap: "14px", justifyContent: "center" }}>
          <Link to="/Signup" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "white", color: "#0ea5e9", padding: "14px 36px", borderRadius: "12px", fontSize: "16px", fontWeight: 800, textDecoration: "none" }}>
            {Icons.Register(18)} Create Account
          </Link>
          <Link to="/browse" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.15)", color: "white", padding: "14px 28px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.3)", fontSize: "16px", fontWeight: 700, textDecoration: "none" }}>
            {Icons.Search(18)} Browse Auctions
          </Link>
        </div>
      </div>

      <FooterComponent />

      <style>{`
        @keyframes cardIn   { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse    { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes floatOrb { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-30px); } }
        @keyframes shimmer  { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  );
};

export default HomeComponent;


