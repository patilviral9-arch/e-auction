import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useThemeStyles } from "../utils/themeStyles";
import FooterComponent from "../components/user/FooterComponent";
import { toast, Toaster } from "react-hot-toast";

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const formatINR = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const formatDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

function resolveEndTime(a) {
  if (!a) return null;
  if (a.endTime) return new Date(a.endTime).getTime();
  const base = a.startDate || a.createdAt;
  if (a.durationMinutes && base)
    return new Date(base).getTime() + a.durationMinutes * 60 * 1000;
  if (a.duration && base) {
    const str = a.duration.toLowerCase();
    let mins = 1440;
    if      (/1\s*hour/i.test(str))  mins = 60;
    else if (/6\s*hour/i.test(str))  mins = 360;
    else if (/12\s*hour/i.test(str)) mins = 720;
    else if (/1\s*day/i.test(str))   mins = 1440;
    else if (/3\s*day/i.test(str))   mins = 4320;
    else if (/7\s*day/i.test(str))   mins = 10080;
    return new Date(base).getTime() + mins * 60 * 1000;
  }
  return null;
}

function isAuctionEnded(auction) {
  if (!auction) return false;
  if (auction.status === "Completed" || auction.status === "ended") return true;
  const et = resolveEndTime(auction);
  if (et) return Date.now() > et;
  return false;
}

function isPaidStatus(status) {
  const s = String(status || "").toLowerCase();
  return s === "paid" || s === "completed";
}

function getAuctionId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id || value.id || "");
}

function resolveSellerId(record) {
  const auction = record?.auction && typeof record.auction === "object" ? record.auction : null;
  const sellerRaw =
    record?.sellerId ||
    auction?.seller?._id ||
    auction?.seller ||
    auction?.createdBy?._id ||
    auction?.createdBy ||
    auction?.user?._id ||
    auction?.user ||
    auction?.sellerId ||
    null;
  return sellerRaw ? String(sellerRaw) : "";
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
  Live:    (s = 12) => <Ico size={s}><circle cx="12" cy="12" r="3" fill="currentColor" /><path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4" /></Ico>,
  Ended:   (s = 12) => <Ico size={s}><polyline points="20 6 9 17 4 12" /></Ico>,
  Tag:     (s = 11) => <Ico size={s}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></Ico>,
  Clock:   (s = 11) => <Ico size={s}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Ico>,
  Users:   (s = 13) => <Ico size={s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Ico>,
  Gavel:   (s = 14) => <Ico size={s}><path d="M14.5 2.5 19 7l-9 9-4.5-4.5 9-9z" /><path d="m2 22 7-7" /><path d="M14.5 2.5 12 5" /></Ico>,
  Trophy:  (s = 14) => <Ico size={s}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2z" /></Ico>,
  Warning: (s = 14) => <Ico size={s}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></Ico>,
};

/* ── Countdown hook (mirrors BrowseAuctions) ── */
function useCountdown(endTime) {
  const calc = () => {
    const diff = Math.max(0, (endTime || 0) - Date.now());
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { diff, h, m, s };
  };
  const [state, setState] = useState(calc);
  useEffect(() => {
    if (!endTime) return;
    setState(calc());
    const t = setInterval(() => setState(calc()), 1000);
    return () => clearInterval(t);
  }, [endTime]);
  if (!endTime || state.diff === 0) return "Ended";
  if (state.h > 0) return `${state.h}h ${String(state.m).padStart(2, "0")}m`;
  return `${String(state.m).padStart(2, "0")}m ${String(state.s).padStart(2, "0")}s`;
}

/* ── BidCard styled like BrowseAuctions AuctionCard ── */
function BidCard({ bid, navigate, t, walletBalance, refetchWallet, userId, onMarkPaid, isMobile = false }) {
  const [hov, setHov] = useState(false);
  const [paying, setPaying] = useState(false);
  const compact = isMobile;

  const auction    = bid.auction && typeof bid.auction === "object" ? bid.auction : null;
  const isEnded    = isAuctionEnded(auction);
  const isWinner   = bid.isHighest && isEnded;
  const isPaid     = isWinner && isPaidStatus(bid.paymentStatus);
  const isOutbid   = !bid.isHighest && !isEnded;
  const isLive     = !isEnded;

  const endTime    = resolveEndTime(auction);
  const timeText   = useCountdown(endTime);

  const imgs = Array.isArray(auction?.images) ? auction.images : [];
  const img  = imgs.length
    ? (typeof imgs[0] === "string" ? imgs[0] : imgs[0]?.url || imgs[0]?.secure_url || "")
    : "https://placehold.co/400x300?text=No+Image";

  const auctionId    = getAuctionId(auction || bid.auction);
  const auctionTitle = bid.auctionTitle || auction?.title || "Untitled Auction";

  const creditSeller = async () => {
    if (!auctionId) return;
    const sellerId = resolveSellerId(bid);
    if (!sellerId) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/payout/credit/${sellerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auctionId,
          auctionTitle,
          amount: bid.bidAmount,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.error("Payout credit failed:", errJson.message || res.status);
      }
    } catch (err) {
      console.error("Payout credit error:", err.message);
    }
  };

  const bidLabel  = isLive ? "Your Bid" : isWinner ? "Winning Bid" : "Your Bid";
  const timeLabel = isLive ? "Ends In" : "Ended";
  const timeColor = isLive ? "#f43f5e" : t.textMut;
  const timeValue = isLive ? timeText : "Ended";

  const borderColor = isPaid
    ? "1px solid rgba(148,163,184,0.42)"
    : isWinner
    ? "1px solid rgba(52,211,153,0.35)"
    : hov ? "1px solid rgba(56,189,248,0.3)"
    : `1px solid ${t.border}`;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => { if (isWinner) return; if (auctionId) navigate(`/auction/${auctionId}`); }}
      style={{
        background: isPaid
          ? "linear-gradient(135deg, rgba(148,163,184,0.14), rgba(100,116,139,0.1))"
          : isWinner
          ? "linear-gradient(135deg, rgba(52,211,153,0.06), rgba(56,189,248,0.04))"
          : t.bgCardGrad,
        borderRadius: compact ? "16px" : "20px",
        overflow: "hidden",
        border: borderColor,
        transform: !isPaid && hov ? "translateY(-6px)" : "translateY(0)",
        boxShadow: isPaid ? "0 6px 20px rgba(15,23,42,0.1)" : hov ? `0 24px 48px ${t.shadow}` : `0 4px 20px ${t.shadow}`,
        transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        opacity: isEnded && !isWinner ? 0.78 : isPaid ? 0.88 : 1,
        cursor: isWinner ? "default" : "pointer",
        width: "100%",
      }}>

      {/* ── Image (same 200px height as BrowseAuctions) ── */}
      <div style={{ position: "relative", height: compact ? "150px" : "200px", background: t.bgCardGrad, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img
          src={img}
          alt={auctionTitle}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: !isPaid && hov ? "scale(1.07)" : "scale(1)",
            transition: "transform 0.5s ease",
            filter: isPaid ? "grayscale(100%)" : isEnded && !isWinner ? "grayscale(30%)" : "none",
          }}
          onError={e => { e.target.src = "https://placehold.co/400x300/1e293b/38bdf8?text=No+Image"; }}
        />
        <div style={{ position: "absolute", inset: 0, background: hov ? `linear-gradient(to bottom, transparent 50%, ${t.L ? "rgba(248,250,252,0.8)" : "rgba(15,23,42,0.8)"})` : `linear-gradient(to bottom, transparent 60%, ${t.L ? "rgba(248,250,252,0.5)" : "rgba(15,23,42,0.5)"})`, transition: "all 0.3s" }} />

        {/* Status badge — top-left (same position/style as BrowseAuctions) */}
        {isPaid ? (
          <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", alignItems: "center", gap: "5px", background: "rgba(100,116,139,0.92)", color: "white", borderRadius: "8px", padding: "4px 10px", fontSize: "11px", fontWeight: 800 }}>
            PAID
          </div>
        ) : isWinner ? (
          <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", alignItems: "center", gap: "5px", background: "rgba(52,211,153,0.92)", color: "white", borderRadius: "8px", padding: "4px 10px", fontSize: "11px", fontWeight: 800 }}>
            🏆 WON
          </div>
        ) : isEnded ? (
          <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", alignItems: "center", gap: "5px", background: "rgba(100,116,139,0.85)", color: "white", borderRadius: "8px", padding: "4px 10px", fontSize: "11px", fontWeight: 800 }}>
            {SvgIcons.Ended(11)} ENDED
          </div>
        ) : isOutbid ? (
          <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", alignItems: "center", gap: "5px", background: "rgba(245,158,11,0.92)", color: "white", borderRadius: "8px", padding: "4px 10px", fontSize: "11px", fontWeight: 800 }}>
            ⚡ OUTBID
          </div>
        ) : (
          <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", alignItems: "center", gap: "6px", background: "#f43f5e", color: "white", borderRadius: "8px", padding: "4px 10px", fontSize: "11px", fontWeight: 800 }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "white", animation: "pulse 1s infinite" }} />
            LIVE
          </div>
        )}

        {/* Category pill — bottom-left (mirrors BrowseAuctions) */}
        <div style={{ position: "absolute", bottom: "12px", left: "12px", background: t.L ? "rgba(255,255,255,0.85)" : "rgba(15,23,42,0.8)", backdropFilter: "blur(8px)", border: `1px solid ${t.borderMd}`, borderRadius: "6px", padding: "3px 8px", fontSize: "11px", color: t.textSec, fontWeight: 600 }}>
          {auction?.category || "—"}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: compact ? "12px" : "20px" }}>

        {/* Title */}
        <h3 style={{ color: t.textPri, fontWeight: 700, fontSize: compact ? "14px" : "15px", margin: `0 0 ${compact ? "9px" : "12px"}`, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {auctionTitle}
        </h3>

        {/* Bid + Timer row (mirrors BrowseAuctions layout exactly) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: compact ? "10px" : "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: t.textMut, fontSize: compact ? "10px" : "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: compact ? "2px" : "3px" }}>
              {SvgIcons.Tag(compact ? 10 : 11)} {bidLabel}
            </div>
            <div style={{ color: isPaid ? "#64748b" : isWinner ? "#34d399" : isEnded ? t.textSec : "#38bdf8", fontSize: compact ? "18px" : "22px", fontWeight: 800 }}>
              {formatINR(bid.bidAmount)}
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

        {/* Progress bar / meta row (mirrors BrowseAuctions) */}
        {isLive ? (
          <div style={{ display: "flex", alignItems: "center", gap: compact ? "6px" : "8px", marginBottom: compact ? "10px" : "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: t.textMut }}>
              {SvgIcons.Users(compact ? 12 : 13)}
              <span style={{ color: t.textMut, fontSize: compact ? "11px" : "12px" }}>{auction?.totalBids ?? 0} bids</span>
            </div>
            <div style={{ flex: 1, height: "3px", background: t.L ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, ((auction?.totalBids ?? 0) / 50) * 100)}%`, background: "linear-gradient(90deg, #38bdf8, #6366f1)", borderRadius: "2px" }} />
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: compact ? "10px" : "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: t.textMut, fontSize: compact ? "11px" : "12px" }}>
              {SvgIcons.Users(compact ? 12 : 13)} {auction?.totalBids ?? 0} bids
            </div>
            <div style={{ fontSize: compact ? "10px" : "11px", color: t.textFaint }}>
              {formatDate(bid.createdAt)}
            </div>
          </div>
        )}

        {/* Outbid alert */}
        {isOutbid && (
          <div style={{ marginBottom: "12px", padding: "7px 12px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "8px", color: "#f59e0b", fontSize: "12px", fontWeight: 600 }}>
            ⚡ You've been outbid — place a higher bid!
          </div>
        )}

        {/* Action button (mirrors BrowseAuctions button style) */}
        {isWinner ? (
          isPaid ? (
            <div style={{ width: "100%", padding: compact ? "10px" : "12px", borderRadius: compact ? "10px" : "12px", border: "1px solid rgba(100,116,139,0.55)", background: "rgba(100,116,139,0.18)", color: "#475569", fontWeight: 800, fontSize: compact ? "13px" : "14px", textAlign: "center" }}>
              Paid
            </div>
          ) : (
          <div>
            {/* Wallet balance strip */}
            <div style={{ marginBottom: "10px", padding: "8px 12px", background: "rgba(56,189,248,0.07)", border: "1px solid rgba(56,189,248,0.18)", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted, #94a3b8)", fontWeight: 600 }}>💰 Wallet</span>
              <span style={{ fontSize: "13px", fontWeight: 800, color: walletBalance >= bid.bidAmount ? "#34d399" : "#f43f5e" }}>
                ₹{Number(walletBalance || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </div>
            {/* Pay from Wallet */}
            {walletBalance >= bid.bidAmount && (
              <button
                disabled={paying}
                onClick={async (e) => {
                  e.stopPropagation();
                  setPaying(true);
                  try {
                    if (!auctionId) throw new Error("Auction id missing");
                    const res = await fetch(`${import.meta.env.VITE_API_URL}/wallet/${userId}/wallet/debit`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        amount: bid.bidAmount,
                        label: `Auction won: ${bid.auctionTitle || auction?.title || "Auction"}`,
                        category: "auction_won",
                        referenceId: auctionId,
                      }),
                    });
                    if (!res.ok) {
                      const errJson = await res.json().catch(() => ({}));
                      throw new Error(errJson.message || "Wallet payment failed");
                    }
                    await creditSeller();
                    onMarkPaid?.({ auctionId, paymentMethod: "Wallet", paymentId: "" });
                    await refetchWallet();
                    toast.success("Paid from wallet successfully!", {
                      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
                    });
                  } catch (err) {
                    toast.error(err.message || "Wallet payment failed. Try Razorpay.");
                  } finally { setPaying(false); }
                }}
                style={{ width: "100%", padding: "10px", borderRadius: "12px", border: "1px solid rgba(52,211,153,0.35)", background: "rgba(52,211,153,0.1)", color: "#34d399", fontWeight: 700, fontSize: "13px", cursor: paying ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", opacity: paying ? 0.6 : 1, marginBottom: "8px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="14" rx="3"/><path d="M16 14a1 1 0 1 0 2 0 1 1 0 0 0-2 0"/><path d="M22 10H2"/></svg>
                Pay from Wallet
              </button>
            )}
            {/* Pay via Razorpay */}
            <button
              disabled={paying}
              onClick={async (e) => {
                e.stopPropagation();
                setPaying(true);
                try {
                  if (!auctionId) throw new Error("Auction id missing");
                  const loaded = await loadRazorpay();
                  if (!loaded) { toast.error("Failed to load Razorpay."); setPaying(false); return; }
                  const res = await fetch(`${import.meta.env.VITE_API_URL}/payment/create-order`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ amount: bid.bidAmount, auctionId, bidId: bid._id }),
                  });
                  if (!res.ok) throw new Error(`Server error: ${res.status}`);
                  const rj = await res.json();
                  const order = rj.data || rj;
                  const razorpayKey = rj.key || order.key || order.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID;
                  const orderId = order.id || order.order_id;
                  if (!razorpayKey || !orderId) throw new Error("Invalid order response.");
                  const options = {
                    key: razorpayKey,
                    amount: order.amount_due || order.amount,
                    currency: order.currency || "INR",
                    name: "E-Auction",
                    description: `Winning bid: ${bid.auctionTitle || auction?.title || "Auction"}`,
                    order_id: orderId,
                    handler: async (response) => {
                      try {
                        if (!auctionId) throw new Error("Auction id missing");
                        const verifyRes = await fetch(`${import.meta.env.VITE_API_URL}/payment/verify-payment`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            amount: bid.bidAmount,
                            user: userId,
                            product: auctionId,
                          }),
                        });
                        const verifyJson = await verifyRes.json().catch(() => ({}));
                        if (!verifyRes.ok || !verifyJson.success) {
                          throw new Error(verifyJson.message || "Payment verification failed");
                        }

                        await creditSeller();

                        onMarkPaid?.({
                          auctionId,
                          paymentMethod: "Razorpay",
                          paymentId: response.razorpay_payment_id,
                        });
                        await refetchWallet();
                        setPaying(false);

                        toast.success(`Payment successful! ID: ${response.razorpay_payment_id}`, {
                          duration: 6000,
                          icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
                        });
                      } catch (err) {
                        setPaying(false);
                        toast.error(err.message || "Payment processing failed.");
                      }
                    },
                    prefill: { name: "", email: "", contact: "" },
                    theme: { color: "#060d1a" },
                    modal: {
                      confirm_close: true, animation: true, backdropclose: false,
                      ondismiss: () => { setPaying(false); toast("Payment cancelled.", { icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> }); },
                    },
                  };
                  const rzp = new window.Razorpay(options);
                  rzp.on("payment.failed", (r) => { setPaying(false); toast.error(r.error.description || "Payment failed.", { icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> }); });
                  rzp.open();
                } catch { setPaying(false); toast.error("Payment initiation failed."); }
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = ".88"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              style={{ width: "100%", padding: compact ? "10px" : "12px", borderRadius: compact ? "10px" : "12px", border: "1px solid rgba(52,211,153,0.35)", background: "rgba(52,211,153,0.08)", color: "#34d399", fontWeight: 700, fontSize: compact ? "13px" : "14px", cursor: paying ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "opacity 0.15s", opacity: paying ? 0.6 : 1 }}>
              {SvgIcons.Trophy(compact ? 13 : 14)} {paying ? "Processing…" : "Pay via Razorpay"}
            </button>
          </div>
          )
        ) : isEnded ? (
          <button
            disabled
            style={{ width: "100%", padding: compact ? "10px" : "12px", borderRadius: compact ? "10px" : "12px", border: `1px solid ${t.border}`, background: "transparent", color: t.textMut, fontWeight: 700, fontSize: compact ? "13px" : "14px", cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            {SvgIcons.Ended(compact ? 13 : 14)} Auction Ended
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); if (auctionId) navigate(`/auction/${auctionId}`); }}
            onMouseEnter={e => e.currentTarget.style.opacity = ".88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            style={{ width: "100%", padding: compact ? "10px" : "12px", borderRadius: compact ? "10px" : "12px", border: "none", background: "linear-gradient(135deg,#f43f5e,#dc2626)", color: "white", fontWeight: 700, fontSize: compact ? "13px" : "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "opacity 0.15s" }}>
            {SvgIcons.Live(compact ? 13 : 14)} Bid Again
          </button>
        )}
      </div>
    </div>
  );
}

function StatsBar({ bids, t }) {
  const total      = bids.length;
  const won        = bids.filter(b => b.isHighest && isAuctionEnded(b.auction)).length;
  const live       = bids.filter(b => !isAuctionEnded(b.auction)).length;
  const outbid     = bids.filter(b => !b.isHighest && !isAuctionEnded(b.auction)).length;
  const totalWon   = bids.filter(b => b.isHighest && isAuctionEnded(b.auction)).reduce((s, b) => s + (b.bidAmount || 0), 0);

  const stats = [
    { label: "Total Bids",      value: total,               color: "#38bdf8", icon: "🏷️" },
    { label: "Auctions Won",    value: won,                 color: "#34d399", icon: "🏆" },
    { label: "Live Bids",       value: live,                color: "#f43f5e", icon: "🔴" },
    { label: "Outbid",          value: outbid,              color: "#f59e0b", icon: "⚡" },
    { label: "Total Won Value", value: formatINR(totalWon), color: "#a78bfa", icon: "💰" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "32px" }}>
      {stats.map(({ label, value, color, icon }) => (
        <div key={label} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "14px", padding: "16px", boxShadow: t.shadowCard }}>
          <div style={{ fontSize: "20px", marginBottom: "6px" }}>{icon}</div>
          <div style={{ color, fontSize: "22px", fontWeight: 900, lineHeight: 1 }}>{value}</div>
          <div style={{ color: t.textMut, fontSize: "11px", fontWeight: 600, marginTop: "4px" }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

export default function MyBids() {
  const t = useThemeStyles();
  const navigate = useNavigate();
  const { userId, role } = useAuth();

  const [bids,         setBids]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [filter,       setFilter]       = useState("all");
  const [sort,         setSort]         = useState("newest");
  const [walletBalance, setWalletBalance] = useState(0);
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

  const fetchWallet = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/wallet/${userId}/wallet`);
      if (res.ok) {
        const json = await res.json();
        const w = json.data ?? json;
        setWalletBalance(w.balance ?? 0);
      }
    } catch {}
  };

  const getAuctionIdFromBid = (b) => {
    if (!b) return "";
    if (b.auction && typeof b.auction === "object") {
      return String(b.auction?._id || b.auction?.id || "");
    }
    return b.auction ? String(b.auction) : "";
  };

  const markBidPaid = ({ auctionId, paymentMethod = "", paymentId = "" }) => {
    const normalizedAuctionId = String(auctionId || "");
    if (!normalizedAuctionId) return;

    setBids((prev) =>
      prev.map((b) => {
        const aid = getAuctionIdFromBid(b);
        if (aid !== normalizedAuctionId) return b;
        return {
          ...b,
          paymentStatus: "Paid",
          paymentMethod: paymentMethod || b.paymentMethod || "",
          paymentId: paymentId || b.paymentId || "",
          paidAt: b.paidAt || new Date().toISOString(),
        };
      })
    );
  };

  useEffect(() => {
    if (!userId || role === "guest") { setLoading(false); return; }
    setLoading(true);
    setError("");
    fetchWallet();

    fetch(`${import.meta.env.VITE_API_URL}/bid/bids/bidder/${userId}`)
      .then(r => { if (!r.ok) throw new Error(`Server error: ${r.status}`); return r.json(); })
      .then(async data => {
        const list = data.data ?? data ?? [];

        const bestByAuction = {};
        list.forEach(b => {
          const aid = b.auction
            ? (typeof b.auction === "object"
                ? String(b.auction?._id || b.auction?.id || "")
                : String(b.auction))
            : "";
          if (!aid) return;
          if (!bestByAuction[aid] || b.bidAmount > bestByAuction[aid].bidAmount) {
            bestByAuction[aid] = b;
          }
        });
        const deduped = Object.values(bestByAuction);

        const auctionIds = Object.keys(bestByAuction);
        const highestByAuction = {};
        const bidCountByAuction = {};
        await Promise.all(auctionIds.map(async (aid) => {
          try {
            const r = await fetch(`${import.meta.env.VITE_API_URL}/bid/bids/auction/${aid}`);
            if (!r.ok) return;
            const d = await r.json();
            const allBids = d.data ?? [];
            bidCountByAuction[aid] = allBids.length;
            if (allBids.length > 0) highestByAuction[aid] = allBids[0].bidAmount;
          } catch { /* skip */ }
        }));

        const paymentByAuction = {};
        try {
          const resultsRes = await fetch(`${import.meta.env.VITE_API_URL}/auctionres/auctions/winner/${userId}`);
          if (resultsRes.ok) {
            const resultsJson = await resultsRes.json();
            const resultsList = Array.isArray(resultsJson) ? resultsJson : resultsJson.data ?? [];
            resultsList.forEach((r) => {
              const aid = r?.auction
                ? (typeof r.auction === "object"
                    ? String(r.auction?._id || r.auction?.id || "")
                    : String(r.auction))
                : "";
              if (aid) paymentByAuction[aid] = r;
            });
          }
        } catch {}

        const tagged = deduped.map(b => {
          const aid = b.auction
            ? (typeof b.auction === "object"
                ? String(b.auction?._id || b.auction?.id || "")
                : String(b.auction))
            : "";
          const topBid = highestByAuction[aid];
          const payment = paymentByAuction[aid];
          // Patch real bid count onto auction object
          if (b.auction && typeof b.auction === "object" && bidCountByAuction[aid] !== undefined) {
            b.auction.totalBids = bidCountByAuction[aid];
          }
          return {
            ...b,
            isHighest: topBid !== undefined ? b.bidAmount >= topBid : false,
            paymentStatus: payment?.paymentStatus || "Pending",
            paymentMethod: payment?.paymentMethod || "",
            paymentId: payment?.paymentId || "",
            paidAt: payment?.paidAt || null,
            sellerId: payment?.sellerId || b.sellerId || "",
          };
        });

        setBids(tagged);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId, role]);

  const FILTERS = [
    { key: "all",    label: "All Bids" },
    { key: "live",   label: "🔴 Live" },
    { key: "won",    label: "🏆 Won" },
    { key: "outbid", label: "⚡ Outbid" },
  ];

  const filtered = bids
    .filter(b => {
      if (filter === "all")    return true;
      if (filter === "live")   return !isAuctionEnded(b.auction);
      if (filter === "won")    return b.isHighest && isAuctionEnded(b.auction);
      if (filter === "outbid") return !b.isHighest && !isAuctionEnded(b.auction);
      return true;
    })
    .sort((a, b) => {
      if (sort === "newest")  return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === "oldest")  return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === "highest") return b.bidAmount - a.bidAmount;
      if (sort === "lowest")  return a.bidAmount - b.bidAmount;
      return 0;
    });

  if (!userId || role === "guest") {
    return (
      <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🔒</div>
          <h2 style={{ color: t.textPri, margin: "0 0 8px" }}>Login to View Your Bids</h2>
          <p style={{ color: t.textMut, fontSize: "14px", marginBottom: "24px" }}>You need an account to see your bid history.</p>
          <button onClick={() => navigate("/Login")} style={{ padding: "12px 32px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#38bdf8,#6366f1)", color: "white", fontWeight: 700, fontSize: "15px", cursor: "pointer" }}>Log In</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: t.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", transition: "background 0.25s" }}>

      {/* ── HEADER ── */}
      <div style={{ background: t.bgSec, borderBottom: `1px solid ${t.border}`, padding: isMobile ? "24px 14px 20px" : "40px 40px 32px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ color: "#38bdf8", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "8px" }}>📋 Bid History</div>
              <h1 style={{ color: t.textPri, fontSize: isMobile ? "28px" : "36px", fontWeight: 900, margin: 0 }}>My Bids</h1>
              <p style={{ color: t.textMut, marginTop: "8px", fontSize: isMobile ? "14px" : "15px" }}>Track all your auction activity in one place.</p>
              <div style={{ marginTop: "12px", display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)", borderRadius: "10px", padding: "6px 14px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="14" rx="3"/><path d="M16 14a1 1 0 1 0 2 0 1 1 0 0 0-2 0"/><path d="M22 10H2"/></svg>
                <span style={{ fontSize: "13px", color: "#38bdf8", fontWeight: 700 }}>Wallet: ₹{walletBalance.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
            <button onClick={() => navigate("/browse")} style={{ padding: "11px 24px", borderRadius: "12px", border: `1px solid ${t.border}`, background: t.bgCard, color: t.textSec, fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>Browse Auctions →</button>
          </div>

          {/* Filter tabs + sort */}
          <div style={{ display: "flex", gap: "8px", marginTop: "28px", alignItems: "center", flexWrap: "wrap" }}>
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{ padding: "7px 16px", borderRadius: "50px", border: filter === f.key ? "1px solid rgba(56,189,248,.5)" : `1px solid ${t.border}`, background: filter === f.key ? "rgba(56,189,248,.12)" : t.bgCard, color: filter === f.key ? "#38bdf8" : t.textMut, fontWeight: 600, fontSize: "13px", cursor: "pointer", transition: "all .2s" }}>
                {f.label}
              </button>
            ))}
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: "50px", border: `1px solid ${t.border}`, background: t.bgCard, color: t.textSec, fontSize: "13px", outline: "none", cursor: "pointer" }}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── GRID ── */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: isMobile ? "18px 14px 28px" : "32px 40px 60px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px", animation: "pulse 1s infinite" }}>⏳</div>
            <div style={{ color: t.textSec, fontSize: "16px", fontWeight: 600 }}>Loading your bids…</div>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <div style={{ color: "#f43f5e", fontWeight: 700, fontSize: "16px", marginBottom: "8px" }}>Could not load bids</div>
            <div style={{ color: t.textMut, fontSize: "13px" }}>{error}</div>
          </div>
        ) : bids.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <div style={{ fontSize: "72px", marginBottom: "20px" }}>🏷️</div>
            <h2 style={{ color: t.textPri, fontSize: "24px", fontWeight: 800, marginBottom: "12px" }}>No bids yet</h2>
            <p style={{ color: t.textMut, fontSize: "15px", marginBottom: "28px" }}>Start bidding on live auctions to see your activity here.</p>
            <button onClick={() => navigate("/browse")} style={{ padding: "13px 32px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#38bdf8,#6366f1)", color: "white", fontWeight: 700, fontSize: "15px", cursor: "pointer", boxShadow: "0 4px 14px rgba(56,189,248,.3)" }}>Browse Auctions →</button>
          </div>
        ) : (
          <>
            <StatsBar bids={bids} t={t} />
            <div style={{ color: t.textMut, fontSize: "13px", marginBottom: "20px" }}>{filtered.length} bid{filtered.length !== 1 ? "s" : ""} found</div>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: t.textFaint }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</div>
                <div style={{ fontSize: "16px", fontWeight: 600, color: t.textSec }}>No bids match this filter</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fill, minmax(240px, 1fr))", gap: isMobile ? "12px" : "20px" }}>
                {filtered.map((bid, i) => <BidCard key={bid._id || i} bid={bid} navigate={navigate} t={t} walletBalance={walletBalance} refetchWallet={fetchWallet} userId={userId} onMarkPaid={markBidPaid} isMobile={isMobile} />)}
              </div>
            )}
          </>
        )}
      </div>

      <Toaster position="top-right" toastOptions={{
        style: { borderRadius: "12px", fontFamily: "'Segoe UI', system-ui, sans-serif", fontWeight: 600, fontSize: "14px", padding: "14px 18px" },
        success: { style: { background: "#0f172a", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" } },
        error:   { style: { background: "#0f172a", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.3)" } },
        blank:   { style: { background: "#0f172a", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.2)" } },
      }} />
      <FooterComponent />

      <style>{`
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes cardIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        select option { background: ${t.bgSec}; color: ${t.textPri}; }
      `}</style>
    </div>
  );
}

