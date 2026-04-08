import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useThemeStyles } from "../utils/themeStyles";

const API = "http://localhost:3000";

// ── SVG Icon Components ───────────────────────────────────────────────────────
const Icon = {
  Hourglass: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 22h14"/><path d="M5 2h14"/>
      <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/>
      <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>
    </svg>
  ),
  Flame: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  ),
  Siren: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 18v-6a5 5 0 1 1 10 0v6"/>
      <path d="M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1z"/>
      <path d="M21 12h1"/><path d="M2 12h1"/><path d="M12 2v1"/>
      <path d="M4.93 4.93l.7.7"/><path d="M18.37 4.93l-.7.7"/>
    </svg>
  ),
  Calendar: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
      <line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/>
      <line x1="3" x2="21" y1="10" y2="10"/>
    </svg>
  ),
  Bell: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
  ),
  Play: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="10 8 16 12 10 16 10 8"/>
    </svg>
  ),
  Trophy: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>
      <path d="M7 4H17L15 12a5 5 0 0 1-10 0Z"/>
      <path d="M5 9H3a2 2 0 0 0 2 2"/><path d="M19 9h2a2 2 0 0 1-2 2"/>
    </svg>
  ),
  CreditCard: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2"/>
      <line x1="2" x2="22" y1="10" y2="10"/>
    </svg>
  ),
  Trash: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  CheckCheck: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>
    </svg>
  ),
  Refresh: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
      <path d="M21 3v5h-5"/>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
      <path d="M8 16H3v5"/>
    </svg>
  ),
  ArrowLeft: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
    </svg>
  ),
  ArrowRight: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  ),
  X: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  ),
  Warning: ({ size = 28, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <path d="M12 9v4"/><path d="M12 17h.01"/>
    </svg>
  ),
  Info: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
  ),
  Layers: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  Gavel: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10"/>
      <path d="m16 16 6-6"/><path d="m8 8 6-6"/>
      <path d="m9 7 8 8"/><path d="m21 11-8-8"/>
    </svg>
  ),
};

// Map notification type to icon component
const TYPE_ICON = {
  ending_3h:   Icon.Hourglass,
  ending_2h:   Icon.Flame,
  ending_1h:   Icon.Siren,
  starting_3h: Icon.Calendar,
  starting_2h: Icon.Bell,
  starting_1h: Icon.Play,
  starting:    Icon.Play,
  won:         Icon.Trophy,
};
const DEFAULT_ICON = Icon.Bell;

// Map filter key to icon component
const FILTER_ICON = {
  all:      Icon.Layers,
  ending:   Icon.Hourglass,
  starting: Icon.Play,
  won:      Icon.Trophy,
};

// ── Milestone config ──────────────────────────────────────────────────────────
const WINDOW_MS        = 20 * 60 * 1000;
const END_MILESTONES   = [3, 2, 1];
const START_MILESTONES = [3, 2, 1];

// ── Notification type metadata (no icon — SVG used instead) ───────────────────
const TYPE_META = {
  ending_3h:   { label: "Ending in 3 Hours",   accent: "#f59e0b", bg: "rgba(245,158,11,.08)",  border: "rgba(245,158,11,.22)",  urgency: 1 },
  ending_2h:   { label: "Ending in 2 Hours",   accent: "#f97316", bg: "rgba(249,115,22,.08)",  border: "rgba(249,115,22,.22)",  urgency: 2 },
  ending_1h:   { label: "Ending in 1 Hour!",   accent: "#f43f5e", bg: "rgba(244,63,94,.08)",   border: "rgba(244,63,94,.22)",   urgency: 3 },
  starting_3h: { label: "Starting in 3 Hours", accent: "#a78bfa", bg: "rgba(167,139,250,.08)", border: "rgba(167,139,250,.22)", urgency: 1 },
  starting_2h: { label: "Starting in 2 Hours", accent: "#38bdf8", bg: "rgba(56,189,248,.08)",  border: "rgba(56,189,248,.22)",  urgency: 2 },
  starting_1h: { label: "Starting in 1 Hour!", accent: "#34d399", bg: "rgba(52,211,153,.08)",  border: "rgba(52,211,153,.22)",  urgency: 3 },
  starting:    { label: "Started Now",          accent: "#34d399", bg: "rgba(52,211,153,.08)",  border: "rgba(52,211,153,.22)",  urgency: 3 },
  won:         { label: "You Won!",             accent: "#38bdf8", bg: "rgba(56,189,248,.08)",  border: "rgba(56,189,248,.22)",  urgency: 3 },
};
const DEFAULT_META = { label: "Notification", accent: "#38bdf8", bg: "rgba(56,189,248,.08)", border: "rgba(56,189,248,.22)", urgency: 1 };

// ── Filter tabs ───────────────────────────────────────────────────────────────
const FILTER_TABS = [
  { key: "all",      label: "All"      },
  { key: "ending",   label: "Ending"   },
  { key: "starting", label: "Starting" },
  { key: "won",      label: "Won"      },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function timeUntil(date) {
  const diff = new Date(date).getTime() - Date.now();
  if (diff <= 0) return "Now";
  const m = Math.floor(diff / 60000);
  if (m < 60) return `in ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `in ${h}h ${m % 60}m`;
  return `in ${Math.floor(h / 24)}d`;
}
function formatPrice(n) {
  return "\u20B9" + Number(n || 0).toLocaleString("en-IN");
}

// ── Build notifications from wishlist data ─────────────────────────────────────
function buildNotifications(wishlistAuctions, wonAuctions) {
  const now  = Date.now();
  const list = [];

  wishlistAuctions.forEach((a) => {
    const start = new Date(a.startDate).getTime();
    const end   = new Date(a.endTime).getTime();

    if (start <= now && end > now) {
      END_MILESTONES.forEach((hrs) => {
        const milestoneMs = hrs * 60 * 60 * 1000;
        const timeLeft    = end - now;
        if (timeLeft >= milestoneMs - WINDOW_MS && timeLeft <= milestoneMs + WINDOW_MS) {
          list.push({
            id: `ending_${hrs}h-${a._id}`, type: `ending_${hrs}h`, filterKey: "ending", auction: a,
            timestamp: new Date(end - milestoneMs).toISOString(), timeLabel: timeUntil(a.endTime),
            body: `"${a.title}" is ending in ~${hrs} hour${hrs > 1 ? "s" : ""}! Place your bid before it's too late.`,
          });
        }
      });
    }

    if (start > now) {
      START_MILESTONES.forEach((hrs) => {
        const milestoneMs = hrs * 60 * 60 * 1000;
        const timeToStart = start - now;
        if (timeToStart >= milestoneMs - WINDOW_MS && timeToStart <= milestoneMs + WINDOW_MS) {
          list.push({
            id: `starting_${hrs}h-${a._id}`, type: `starting_${hrs}h`, filterKey: "starting", auction: a,
            timestamp: new Date(start - milestoneMs).toISOString(), timeLabel: timeUntil(a.startDate),
            body: `Your wishlisted auction "${a.title}" starts in ~${hrs} hour${hrs > 1 ? "s" : ""}. Get ready to bid!`,
          });
        }
      });
    }

    if (now - start >= 0 && now - start < 30 * 60 * 1000) {
      list.push({
        id: `starting-${a._id}`, type: "starting", filterKey: "starting", auction: a,
        timestamp: a.startDate, timeLabel: timeAgo(a.startDate),
        body: `Your wishlisted auction "${a.title}" has just started! Place your bid now.`,
      });
    }
  });

  wonAuctions.forEach((result) => {
    const a = result.auction ?? result;
    list.push({
      id: `won-${result._id ?? a._id}`, type: "won", filterKey: "won", auction: a, result,
      timestamp: result.createdAt ?? result.updatedAt ?? new Date().toISOString(),
      timeLabel: timeAgo(result.createdAt ?? new Date()),
      body: `Congratulations! You won "${a.title ?? "an auction"}" with a bid of ${formatPrice(result.winningBid ?? result.finalPrice)}. Complete your payment now.`,
    });
  });

  return list.sort((a, b) => {
    const urgA = TYPE_META[a.type]?.urgency ?? 0;
    const urgB = TYPE_META[b.type]?.urgency ?? 0;
    if (urgB !== urgA) return urgB - urgA;
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const navigate   = useNavigate();
  const t          = useThemeStyles();
  const { userId } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [filter,        setFilter]        = useState("all");
  const [clearingAll,   setClearingAll]   = useState(false);
  const [deletingId,    setDeletingId]    = useState(null);
  const [read,          setRead]          = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("noti_read") || "[]")); }
    catch { return new Set(); }
  });

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${API}/notification/${userId}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setNotifications(data.notifications ?? []);
    } catch (err) {
      setError("Could not load notifications. " + err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);
  useEffect(() => {
    const id = setInterval(fetchNotifications, 60000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const markRead = async (id) => {
    setRead(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem("noti_read", JSON.stringify([...next]));
      return next;
    });
    try { await fetch(`${API}/notification/${id}/read`, { method: "PATCH" }); } catch (_) {}
  };

  const markAllRead = async () => {
    const all = new Set(notifications.map(n => n._id ?? n.id));
    localStorage.setItem("noti_read", JSON.stringify([...all]));
    setRead(all);
    try { await fetch(`${API}/notification/${userId}/read-all`, { method: "PATCH" }); } catch (_) {}
  };

  const deleteOne = async (e, nId) => {
    e.stopPropagation();
    setDeletingId(nId);
    try {
      const res = await fetch(`${API}/notification/${nId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setNotifications(prev => prev.filter(n => (n._id ?? n.id) !== nId));
    } catch (_) {}
    finally { setDeletingId(null); }
  };

  const clearAll = async () => {
    if (!userId || notifications.length === 0) return;
    setClearingAll(true);
    try {
      const res = await fetch(`${API}/notification/${userId}/clear-all`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setNotifications([]);
      setRead(new Set());
      localStorage.removeItem("noti_read");
    } catch (_) {}
    finally { setClearingAll(false); }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const matchesFilter = (n) => {
    if (filter === "all")      return true;
    if (filter === "ending")   return n.type?.startsWith("ending");
    if (filter === "starting") return n.type?.startsWith("starting") || n.type === "starting";
    return n.type === filter || n.filterKey === filter;
  };
  const visible     = notifications.filter(matchesFilter);
  const unreadCount = notifications.filter(n => !read.has(n._id ?? n.id)).length;
  const countOf = (key) => {
    if (key === "all")      return notifications.length;
    if (key === "ending")   return notifications.filter(n => n.type?.startsWith("ending")).length;
    if (key === "starting") return notifications.filter(n => n.type?.startsWith("starting") || n.type === "starting").length;
    return notifications.filter(n => n.type === key || n.filterKey === key).length;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: t.bg, minHeight: "100vh", fontFamily: "system-ui, sans-serif", transition: "background .25s" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "36px 32px 80px" }}>

        {/* ── Page Header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px", paddingBottom: "24px", borderBottom: `1px solid ${t.border}` }}>
          <button onClick={() => navigate(-1)}
            style={{ width: "42px", height: "42px", borderRadius: "12px", border: `1px solid ${t.border}`, background: t.bgCard, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s" }}
            onMouseEnter={e => e.currentTarget.style.background = t.bgHover}
            onMouseLeave={e => e.currentTarget.style.background = t.bgCard}>
            <Icon.ArrowLeft size={18} color={t.textSec} />
          </button>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <h1 style={{ color: t.textPri, fontSize: "28px", fontWeight: 900, margin: 0, letterSpacing: "-.02em" }}>Notifications</h1>
              {unreadCount > 0 && (
                <span style={{ background: "linear-gradient(135deg,#f43f5e,#f97316)", color: "white", fontSize: "11px", fontWeight: 800, padding: "3px 11px", borderRadius: "999px", boxShadow: "0 2px 10px rgba(244,63,94,.4)", letterSpacing: ".05em" }}>
                  {unreadCount} NEW
                </span>
              )}
            </div>
            <p style={{ color: t.textMut, fontSize: "14px", margin: "3px 0 0" }}>Wishlisted auctions · milestones · wins</p>
          </div>

          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                style={{ padding: "9px 16px", borderRadius: "10px", border: "1px solid rgba(56,189,248,.35)", background: "rgba(56,189,248,.08)", color: "#38bdf8", fontWeight: 700, fontSize: "13px", cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "7px" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(56,189,248,.18)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(56,189,248,.08)"}>
                <Icon.CheckCheck size={15} color="#38bdf8" />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={clearAll} disabled={clearingAll}
                style={{ padding: "9px 16px", borderRadius: "10px", border: "1px solid rgba(244,63,94,.35)", background: "rgba(244,63,94,.08)", color: "#f43f5e", fontWeight: 700, fontSize: "13px", cursor: clearingAll ? "not-allowed" : "pointer", opacity: clearingAll ? 0.55 : 1, transition: "all .15s", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "7px" }}
                onMouseEnter={e => { if (!clearingAll) e.currentTarget.style.background = "rgba(244,63,94,.18)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(244,63,94,.08)"; }}>
                <Icon.Trash size={15} color="#f43f5e" />
                {clearingAll ? "Clearing..." : "Clear all"}
              </button>
            )}
            <button onClick={fetchNotifications}
              style={{ width: "40px", height: "40px", borderRadius: "10px", border: `1px solid ${t.border}`, background: t.bgCard, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}
              onMouseEnter={e => e.currentTarget.style.background = t.bgHover}
              onMouseLeave={e => e.currentTarget.style.background = t.bgCard}
              title="Refresh">
              <Icon.Refresh size={16} color={t.textSec} />
            </button>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "28px", alignItems: "start" }}>

          {/* ════ LEFT SIDEBAR ════ */}
          <div style={{ position: "sticky", top: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Stats */}
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "18px", overflow: "hidden", boxShadow: t.shadowCard }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${t.border}` }}>
                <span style={{ color: t.textMut, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>Overview</span>
              </div>
              {[
                { label: "Total",    value: notifications.length,                                                                                       color: t.textPri, Ic: Icon.Bell      },
                { label: "Unread",   value: unreadCount,                                                                                                color: "#f43f5e", Ic: Icon.Siren     },
                { label: "Ending",   value: notifications.filter(n => n.type?.startsWith("ending")).length,                                            color: "#f59e0b", Ic: Icon.Hourglass },
                { label: "Starting", value: notifications.filter(n => n.type?.startsWith("starting") || n.type === "starting").length,                 color: "#34d399", Ic: Icon.Play      },
                { label: "Won",      value: notifications.filter(n => n.type === "won").length,                                                        color: "#38bdf8", Ic: Icon.Trophy    },
              ].map(({ label, value, color, Ic }, i, arr) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 18px", borderBottom: i < arr.length - 1 ? `1px solid ${t.border}` : "none" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Ic size={15} color={color} />
                  </div>
                  <span style={{ color: t.textMut, fontSize: "13px", flex: 1 }}>{label}</span>
                  <span style={{ color, fontSize: "18px", fontWeight: 800 }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "18px", overflow: "hidden", boxShadow: t.shadowCard }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${t.border}` }}>
                <span style={{ color: t.textMut, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>Filter</span>
              </div>
              <div style={{ padding: "10px" }}>
                {FILTER_TABS.map(({ key, label }) => {
                  const cnt    = countOf(key);
                  const active = filter === key;
                  const FIc    = FILTER_ICON[key] ?? Icon.Bell;
                  return (
                    <button key={key} onClick={() => setFilter(key)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", border: "none", background: active ? "linear-gradient(135deg,#38bdf8,#6366f1)" : "transparent", color: active ? "white" : t.textSec, fontWeight: active ? 700 : 500, fontSize: "14px", cursor: "pointer", transition: "all .15s", marginBottom: "2px" }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = t.bgHover; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                      <FIc size={16} color={active ? "white" : t.textMut} />
                      <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
                      {cnt > 0 && (
                        <span style={{ background: active ? "rgba(255,255,255,.25)" : t.bgHover, borderRadius: "999px", padding: "1px 9px", fontSize: "12px", fontWeight: 700, color: active ? "white" : t.textMut }}>
                          {cnt}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Breakdown */}
            {notifications.length > 0 && (
              <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "18px", overflow: "hidden", boxShadow: t.shadowCard }}>
                <div style={{ padding: "14px 18px", borderBottom: `1px solid ${t.border}` }}>
                  <span style={{ color: t.textMut, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>Breakdown</span>
                </div>
                <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "7px" }}>
                  {[
                    { type: "ending_3h",   label: "Ending in 3h"   },
                    { type: "ending_2h",   label: "Ending in 2h"   },
                    { type: "ending_1h",   label: "Ending in 1h"   },
                    { type: "starting_3h", label: "Starting in 3h" },
                    { type: "starting_2h", label: "Starting in 2h" },
                    { type: "starting_1h", label: "Starting in 1h" },
                    { type: "won",         label: "Wins"           },
                  ].map(({ type, label }) => {
                    const meta  = TYPE_META[type] ?? DEFAULT_META;
                    const BIc   = TYPE_ICON[type]  ?? DEFAULT_ICON;
                    const count = notifications.filter(n => n.type === type).length;
                    if (!count) return null;
                    return (
                      <div key={type} style={{ display: "flex", alignItems: "center", gap: "8px", background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: "9px", padding: "8px 11px" }}>
                        <BIc size={14} color={meta.accent} />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: meta.accent, flex: 1 }}>{label}</span>
                        <span style={{ fontSize: "12px", fontWeight: 800, color: meta.accent }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Info */}
            <div style={{ background: "rgba(56,189,248,.04)", border: "1px solid rgba(56,189,248,.15)", borderRadius: "14px", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "8px" }}>
                <Icon.Info size={14} color="#38bdf8" />
                <span style={{ color: "#38bdf8", fontSize: "12px", fontWeight: 700 }}>How it works</span>
              </div>
              <div style={{ color: t.textMut, fontSize: "12px", lineHeight: 1.7 }}>
                Notified at <b style={{ color: t.textSec }}>3h, 2h and 1h</b> before wishlisted auctions <b style={{ color: t.textSec }}>start</b> or <b style={{ color: t.textSec }}>end</b>. Auto-refreshes every <b style={{ color: t.textSec }}>60s</b>.
              </div>
            </div>
          </div>

          {/* ════ RIGHT FEED ════ */}
          <div>

            {/* Skeleton */}
            {loading && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "22px 24px", display: "flex", gap: "16px", opacity: 1 - i * 0.18 }}>
                    <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: t.bgHover, flexShrink: 0, animation: "shimmer 1.4s infinite" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: "12px", width: "35%", background: t.bgHover, borderRadius: "6px", marginBottom: "12px", animation: "shimmer 1.4s infinite" }} />
                      <div style={{ height: "11px", width: "82%", background: t.bgHover, borderRadius: "6px", marginBottom: "10px", animation: "shimmer 1.4s infinite" }} />
                      <div style={{ height: "11px", width: "60%", background: t.bgHover, borderRadius: "6px", animation: "shimmer 1.4s infinite" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div style={{ background: "rgba(244,63,94,.06)", border: "1px solid rgba(244,63,94,.25)", borderRadius: "16px", padding: "24px 28px", display: "flex", gap: "16px", alignItems: "center" }}>
                <Icon.Warning size={32} color="#f43f5e" />
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#f43f5e", fontWeight: 700, fontSize: "16px", marginBottom: "5px" }}>Failed to load</div>
                  <div style={{ color: t.textMut, fontSize: "14px" }}>{error}</div>
                </div>
                <button onClick={fetchNotifications}
                  style={{ padding: "10px 20px", borderRadius: "10px", border: "1px solid rgba(244,63,94,.3)", background: "transparent", color: "#f43f5e", fontWeight: 700, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "7px" }}>
                  <Icon.Refresh size={14} color="#f43f5e" /> Retry
                </button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && visible.length === 0 && (
              <div style={{ textAlign: "center", padding: "100px 0 80px" }}>
                <div style={{ width: "88px", height: "88px", borderRadius: "24px", background: t.bgCard, border: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px" }}>
                  {filter === "won"       ? <Icon.Trophy    size={38} color={t.textFaint} />
                   : filter === "ending"  ? <Icon.Hourglass size={38} color={t.textFaint} />
                   : filter === "starting"? <Icon.Play      size={38} color={t.textFaint} />
                   :                        <Icon.Bell      size={38} color={t.textFaint} />}
                </div>
                <div style={{ color: t.textPri, fontWeight: 800, fontSize: "22px", marginBottom: "10px" }}>
                  {filter === "all" ? "All caught up!" : "No " + filter + " notifications"}
                </div>
                <div style={{ color: t.textMut, fontSize: "15px", lineHeight: 1.7, maxWidth: "380px", margin: "0 auto 28px" }}>
                  {filter === "all"
                    ? "Wishlist some auctions and we will alert you at 3h, 2h, and 1h before they start or end."
                    : "Nothing here right now — notifications fire at 3h, 2h, and 1h milestones."}
                </div>
                {filter === "all" && (
                  <button onClick={() => navigate("/auctions")}
                    style={{ padding: "13px 32px", borderRadius: "12px", background: "linear-gradient(135deg,#38bdf8,#6366f1)", border: "none", color: "white", fontWeight: 700, fontSize: "15px", cursor: "pointer", boxShadow: "0 4px 16px rgba(56,189,248,.35)", display: "inline-flex", alignItems: "center", gap: "9px" }}>
                    <Icon.Gavel size={18} color="white" /> Browse Auctions
                  </button>
                )}
              </div>
            )}

            {/* Feed */}
            {!loading && !error && visible.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ color: t.textMut, fontSize: "13px", marginBottom: "4px" }}>
                  Showing <b style={{ color: t.textSec }}>{visible.length}</b> notification{visible.length !== 1 ? "s" : ""}
                </div>

                {visible.map((n) => {
                  const nId        = n._id ?? n.id;
                  const meta       = TYPE_META[n.type] ?? DEFAULT_META;
                  const NIc        = TYPE_ICON[n.type] ?? DEFAULT_ICON;
                  const isRead     = read.has(nId);
                  const auction    = n.auction;
                  const isDeleting = deletingId === nId;

                  return (
                    <div key={nId}
                      onClick={() => {
                        markRead(nId);
                        if (n.type === "won") navigate(`/payment/${n.result?._id ?? auction?._id}`);
                        else if (auction?._id) navigate(`/auction/${auction._id}`);
                      }}
                      style={{
                        background:   isRead ? t.bgCard : meta.bg,
                        border:       `1px solid ${isRead ? t.border : meta.border}`,
                        borderRadius: "16px",
                        cursor:       "pointer",
                        transition:   "transform .15s, box-shadow .15s, opacity .2s",
                        position:     "relative",
                        overflow:     "hidden",
                        opacity:      isDeleting ? 0.35 : 1,
                        boxShadow:    t.shadowCard,
                      }}
                      onMouseEnter={e => { if (!isDeleting) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 36px rgba(0,0,0,.14)"; } }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = t.shadowCard; }}>

                      {/* Left accent bar */}
                      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: meta.urgency === 3 ? "5px" : "3px", background: meta.accent, boxShadow: meta.urgency === 3 ? `3px 0 16px ${meta.accent}66` : "none", borderRadius: "16px 0 0 16px" }} />

                      <div style={{ padding: "20px 20px 20px 26px", display: "flex", gap: "16px", alignItems: "flex-start" }}>

                        {/* Icon bubble */}
                        <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: isRead ? t.bgHover : meta.bg, border: `1px solid ${isRead ? t.border : meta.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <NIc size={24} color={isRead ? t.textFaint : meta.accent} />
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "11px", fontWeight: 800, color: meta.accent, textTransform: "uppercase", letterSpacing: ".08em" }}>{meta.label}</span>
                            <span style={{ color: t.textFaint, fontSize: "11px" }}>·</span>
                            <span style={{ color: t.textFaint, fontSize: "12px" }}>{n.timeLabel ?? timeAgo(n.createdAt ?? n.timestamp)}</span>
                            {meta.urgency === 3 && !isRead && (
                              <span style={{ fontSize: "10px", fontWeight: 800, color: meta.accent, background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: "999px", padding: "2px 9px", animation: "urgentPulse 1.5s infinite", letterSpacing: ".05em" }}>
                                URGENT
                              </span>
                            )}
                            {!isRead && (
                              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: meta.accent, boxShadow: `0 0 7px ${meta.accent}`, display: "inline-block" }} />
                            )}
                          </div>

                          <p style={{ color: isRead ? t.textSec : t.textPri, fontSize: "14px", fontWeight: isRead ? 400 : 600, margin: "0 0 14px", lineHeight: 1.65 }}>
                            {n.body ?? n.message ?? ""}
                          </p>

                          {auction && (
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "12px 14px" }}>
                              {auction.images?.[0] && (
                                <img
                                  src={typeof auction.images[0] === "string" ? auction.images[0] : auction.images[0]?.url}
                                  alt=""
                                  style={{ width: "44px", height: "44px", borderRadius: "10px", objectFit: "cover", flexShrink: 0, border: `1px solid ${t.border}` }}
                                />
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: t.textPri, fontSize: "14px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {auction.title ?? "—"}
                                </div>
                                <div style={{ color: t.textMut, fontSize: "12px", marginTop: "3px" }}>
                                  {n.type === "won"
                                    ? "Won for: " + formatPrice(n.result?.winningBid ?? n.result?.finalPrice)
                                    : "Starting bid: " + formatPrice(auction.startingBid)}
                                  {auction.category && <span style={{ marginLeft: "10px", opacity: .65 }}>· {auction.category}</span>}
                                </div>
                              </div>
                              <Icon.ArrowRight size={18} color={meta.accent} />
                            </div>
                          )}

                          {n.type === "won" && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markRead(nId); navigate(`/payment/${n.result?._id ?? auction?._id}`); }}
                              style={{ marginTop: "14px", padding: "11px 24px", borderRadius: "10px", background: "linear-gradient(135deg,#38bdf8,#6366f1)", border: "none", color: "white", fontWeight: 700, fontSize: "14px", cursor: "pointer", boxShadow: "0 3px 14px rgba(56,189,248,.35)", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                              <Icon.CreditCard size={17} color="white" /> Pay Now
                            </button>
                          )}
                        </div>

                        {/* Dismiss button */}
                        <button
                          onClick={(e) => deleteOne(e, nId)}
                          disabled={isDeleting}
                          title="Dismiss"
                          style={{ flexShrink: 0, alignSelf: "flex-start", width: "30px", height: "30px", borderRadius: "8px", border: `1px solid ${t.border}`, background: t.bgCard, cursor: isDeleting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}
                          onMouseEnter={e => { if (!isDeleting) { e.currentTarget.style.background = "rgba(244,63,94,.12)"; e.currentTarget.style.borderColor = "rgba(244,63,94,.4)"; } }}
                          onMouseLeave={e => { e.currentTarget.style.background = t.bgCard; e.currentTarget.style.borderColor = t.border; }}>
                          {isDeleting
                            ? <div style={{ width: "12px", height: "12px", border: `2px solid ${t.border}`, borderTopColor: t.textMut, borderRadius: "50%", animation: "spin .6s linear infinite" }} />
                            : <Icon.X size={13} color={t.textFaint} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes urgentPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.65;transform:scale(1.05)} }
        @keyframes shimmer     { 0%,100%{opacity:.55} 50%{opacity:.25} }
        @keyframes spin        { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
