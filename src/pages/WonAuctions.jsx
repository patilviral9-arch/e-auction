import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useThemeStyles } from "../utils/themeStyles";
import FooterComponent from "../components/user/FooterComponent";
import { toast, Toaster } from "react-hot-toast";

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
  return et ? Date.now() > et : false;
}

function isResultPaid(result) {
  const status = String(result?.paymentStatus || "").toLowerCase();
  return status === "paid" || status === "completed";
}

function getAuctionId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id || value.id || "");
}

/* ── Inline SVG icon helper ── */
const Ico = ({ d, size = 16, sw = 1.75, fill = "none", vb = "0 0 24 24", children, ...p }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={vb}
    fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }} {...p}>
    {children || <path d={d} />}
  </svg>
);

const SvgIcons = {
  Tag:        (s = 11) => <Ico size={s}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></Ico>,
  Clock:      (s = 11) => <Ico size={s}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Ico>,
  Users:      (s = 13) => <Ico size={s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Ico>,
  CreditCard: (s = 15) => <Ico size={s}><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></Ico>,
};

/* ── WonCard ── */
function WonCard({ result, t, loadRazorpay, walletBalance, refetchWallet, userId }) {
  const [hov, setHov] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(isResultPaid(result));

  const auction      = result.auction;
  const auctionTitle = result.auctionTitle || auction?.title || "Untitled Auction";
  const endedAt      = resolveEndTime(auction);

  const imgs = Array.isArray(auction?.images) ? auction.images : [];
  const img  = imgs.length
    ? (typeof imgs[0] === "string" ? imgs[0] : imgs[0]?.url || imgs[0]?.secure_url || "")
    : "https://placehold.co/400x300?text=No+Image";

  useEffect(() => {
    setPaid(isResultPaid(result));
  }, [result?._id, result?.paymentStatus]);

  // ── Helper: credit seller's payout wallet (5% fee deducted server-side) ──
  const creditSeller = async () => {
    // result.sellerId is injected server-side by getResultsByWinner
    // auction.seller / createdBy / user are also populated — try all paths
    const sellerRaw =
      result?.sellerId ||
      auction?.seller?._id ||
      auction?.seller ||
      auction?.createdBy?._id ||
      auction?.createdBy ||
      auction?.user?._id ||
      auction?.user ||
      auction?.sellerId ||
      null;

    const sellerId = sellerRaw ? String(sellerRaw) : null;

    if (!sellerId) {
      console.warn("creditSeller: sellerId not found. auction:", auction);
      return;
    }

    const auctionId = getAuctionId(auction);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/payout/credit/${sellerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auctionId,
          auctionTitle,
          amount: result.winningBid,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.error("Payout credit failed:", errJson.message || res.status);
      }
    } catch (err) {
      console.error("creditSeller network error:", err.message);
    }
  };

  // ✅ Shared handler: call verify-payment, credit seller, and mark as paid
  const handleVerifyAndSave = async (razorpayResponse) => {
    const verifyRes = await fetch(`${import.meta.env.VITE_API_URL}/payment/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_order_id:   razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature:  razorpayResponse.razorpay_signature,
        amount:              result.winningBid,
        user:                userId,
        // product field maps to the auction id since there's no separate product here
        product:             getAuctionId(auction),
      }),
    });

    const verifyJson = await verifyRes.json();

    if (!verifyRes.ok || !verifyJson.success) {
      throw new Error(verifyJson.message || "Verification failed");
    }

    // ── Credit the seller's payout wallet (net of 5% platform fee) ──
    await creditSeller();

    // ✅ Mark this card as paid so the button turns green
    setPaid(true);
    toast.success(`Payment verified & saved! ID: ${razorpayResponse.razorpay_payment_id}`, { duration: 6000 });
  };

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: paid
          ? "linear-gradient(135deg, rgba(148,163,184,0.14), rgba(100,116,139,0.1))"
          : "linear-gradient(135deg, rgba(52,211,153,0.06), rgba(56,189,248,0.04))",
        borderRadius: "20px",
        overflow: "hidden",
        border: paid
          ? "1px solid rgba(148,163,184,0.42)"
          : hov
          ? "1px solid rgba(52,211,153,0.45)"
          : "1px solid rgba(52,211,153,0.22)",
        transform: !paid && hov ? "translateY(-6px)" : "translateY(0)",
        boxShadow: paid
          ? "0 6px 20px rgba(15,23,42,0.1)"
          : hov
          ? "0 24px 48px rgba(52,211,153,0.15), 0 8px 24px rgba(0,0,0,0.15)"
          : "0 4px 20px rgba(0,0,0,0.08)",
        transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        width: "100%",
        filter: paid ? "grayscale(1)" : "none",
        opacity: paid ? 0.88 : 1,
      }}>

      {/* Image */}
      <div style={{ position: "relative", height: "200px", background: t.bgCardGrad, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img
          src={img}
          alt={auctionTitle}
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: !paid && hov ? "scale(1.07)" : "scale(1)", transition: "transform 0.5s ease" }}
          onError={e => { e.target.src = "https://placehold.co/400x300/1e293b/38bdf8?text=No+Image"; }}
        />
        <div style={{
          position: "absolute",
          inset: 0,
          background: paid
            ? "linear-gradient(to bottom, transparent 58%, rgba(51,65,85,0.64))"
            : hov
            ? `linear-gradient(to bottom, transparent 50%, ${t.L ? "rgba(248,250,252,0.8)" : "rgba(15,23,42,0.8)"})`
            : `linear-gradient(to bottom, transparent 60%, ${t.L ? "rgba(248,250,252,0.5)" : "rgba(15,23,42,0.5)"})`,
          transition: "all 0.3s",
        }} />

        {/* WON badge */}
        <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", alignItems: "center", gap: "5px", background: "rgba(52,211,153,0.92)", color: "white", borderRadius: "8px", padding: "4px 10px", fontSize: "11px", fontWeight: 800 }}>
          🏆 WON
        </div>

        {/* Category pill */}
        <div style={{ position: "absolute", bottom: "12px", left: "12px", background: t.L ? "rgba(255,255,255,0.85)" : "rgba(15,23,42,0.8)", backdropFilter: "blur(8px)", border: `1px solid ${t.borderMd}`, borderRadius: "6px", padding: "3px 8px", fontSize: "11px", color: t.textSec, fontWeight: 600 }}>
          {auction?.category || "—"}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "20px" }}>

        {/* Title */}
        <h3 style={{ color: t.textPri, fontWeight: 700, fontSize: "15px", margin: "0 0 12px", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {auctionTitle}
        </h3>

        {/* Winner name */}
        <div style={{ marginBottom: "6px", fontSize: "12px", color: t.textMut }}>
          Winner: <span style={{ color: t.textSec, fontWeight: 700 }}>{result.winnerName || "—"}</span>
        </div>

        {/* Seller name */}
        {result.sellerName && (
          <div style={{ marginBottom: "10px", fontSize: "12px", color: t.textMut }}>
            Seller:{" "}
            <span style={{ color: t.textFaint, fontWeight: 600 }}>{result.sellerName}</span>
          </div>
        )}

        {/* Winning bid + Ended row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: t.textMut, fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>
              {SvgIcons.Tag(11)} Winning Bid
            </div>
            <div style={{ color: "#34d399", fontSize: "22px", fontWeight: 800 }}>
              {formatINR(result.winningBid)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px", color: t.textMut, fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>
              {SvgIcons.Clock(11)} Ended
            </div>
            <div style={{ color: t.textMut, fontSize: "13px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {endedAt ? formatDate(new Date(endedAt).toISOString()).split(",")[0] : "—"}
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: t.textMut, fontSize: "12px" }}>
            {SvgIcons.Users(13)} {auction?.totalBids ?? 0} bids
          </div>
          <div style={{ fontSize: "12px", color: t.textFaint }}>
            Started {formatINR(auction?.startingBid ?? 0)}
          </div>
        </div>

        {auction?.condition && (
          <div style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
            <span style={{ color: t.textMut }}>Condition</span>
            <span style={{ color: t.textSec, fontWeight: 600 }}>{auction.condition}</span>
          </div>
        )}

        {/* Wallet balance strip */}
        <div style={{ marginBottom: "10px", padding: "8px 12px", background: "rgba(56,189,248,0.07)", border: "1px solid rgba(56,189,248,0.18)", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted, #94a3b8)", fontWeight: 600 }}>💰 Wallet Balance</span>
          <span style={{ fontSize: "13px", fontWeight: 800, color: walletBalance >= result.winningBid ? "#34d399" : "#f43f5e" }}>
            ₹{Number(walletBalance || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </span>
        </div>

        {/* ✅ PAID badge — shown instead of buttons once payment is complete */}
        {paid ? (
          <div style={{
            width: "100%", padding: "13px", borderRadius: "12px",
            background: "rgba(100,116,139,0.18)", border: "1px solid rgba(100,116,139,0.55)",
            color: "#475569", fontWeight: 800, fontSize: "14px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          }}>
            Paid
          </div>
        ) : (
          <>
            {/* Pay with Wallet */}
            {walletBalance >= result.winningBid && (
              <button
                disabled={paying}
                onClick={async () => {
                  setPaying(true);
                  try {
                    const auctionId = getAuctionId(auction);
                    if (!auctionId) throw new Error("Auction id missing");
                    const res = await fetch(`${import.meta.env.VITE_API_URL}/wallet/${userId}/wallet/debit`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        amount: result.winningBid,
                        label: `Auction won: ${auctionTitle}`,
                        category: "auction_won",
                        referenceId: auctionId,
                      }),
                    });
                    if (!res.ok) {
                      const errJson = await res.json().catch(() => ({}));
                      throw new Error(errJson.message || "Wallet payment failed");
                    }
                    refetchWallet();

                    // ── Credit the seller's payout wallet (net of 5% platform fee) ──
                    await creditSeller();

                    // ✅ Mark as paid after successful wallet payment too
                    setPaid(true);
                    toast.success("Paid from wallet successfully!", { duration: 5000 });
                  } catch (err) {
                    toast.error(err.message || "Wallet payment failed. Try Razorpay instead.");
                  } finally {
                    setPaying(false);
                  }
                }}
                style={{ width: "100%", padding: "11px", borderRadius: "12px", border: "1px solid rgba(52,211,153,0.35)", background: "rgba(52,211,153,0.1)", color: "#34d399", fontWeight: 700, fontSize: "13px", cursor: paying ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", opacity: paying ? 0.6 : 1, marginBottom: "8px" }}>
                💰 Pay from Wallet
              </button>
            )}

            {/* Pay with Razorpay */}
            <button
              disabled={paying}
              onClick={async () => {
                setPaying(true);
                try {
                  const auctionId = getAuctionId(auction);
                  if (!auctionId) throw new Error("Auction id missing");
                  const loaded = await loadRazorpay();
                  if (!loaded) { toast.error("Failed to load Razorpay."); setPaying(false); return; }

                  const res = await fetch(`${import.meta.env.VITE_API_URL}/payment/create-order`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      amount: result.winningBid,
                      auctionId,
                    }),
                  });
                  if (!res.ok) throw new Error(`Server error: ${res.status}`);
                  const responseJson = await res.json();
                  const order = responseJson.data || responseJson;
                  const razorpayKey = responseJson.key || order.key || import.meta.env.VITE_RAZORPAY_KEY_ID;
                  const orderId = order.id || order.order_id;
                  if (!razorpayKey || !orderId) throw new Error("Invalid payment order response.");

                  const options = {
                    key: razorpayKey,
                    amount: order.amount_due || order.amount,
                    currency: order.currency || "INR",
                    name: "E-Auction",
                    description: `Winning bid: ${auctionTitle}`,
                    order_id: orderId,
                    handler: async (razorpayResponse) => {
                      try {
                        // Verify Razorpay payment; backend marks result as paid.
                        await handleVerifyAndSave(razorpayResponse);
                        await refetchWallet();
                        setPaying(false);
                      } catch (err) {
                        toast.error(err.message || "Payment verification failed.");
                        setPaying(false);
                      }
                    },
                    prefill: { name: "", email: "", contact: "" },
                    theme: { color: "#060d1a" },
                    modal: {
                      confirm_close: true,
                      ondismiss: () => { toast("Payment cancelled."); setPaying(false); },
                    },
                  };
                  const rzp = new window.Razorpay(options);
                  rzp.on("payment.failed", () => { toast.error("Payment failed. Please try again."); setPaying(false); });
                  rzp.open();
                } catch (err) {
                  toast.error(err.message || "Payment initiation failed. Please try again.");
                  setPaying(false);
                }
              }}
              style={{
                width: "100%", padding: "12px", borderRadius: "12px",
                border: "1px solid rgba(52,211,153,0.35)",
                background: paying ? "rgba(52,211,153,0.04)" : "rgba(52,211,153,0.08)",
                color: "#34d399", fontWeight: 700, fontSize: "14px",
                cursor: paying ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                opacity: paying ? 0.6 : 1, transition: "opacity 0.2s"
              }}>
              {SvgIcons.CreditCard(15)} {paying ? "Processing…" : "Pay Now"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Stats summary ── */
function WonStats({ wonResults, t }) {
  const total      = wonResults.length;
  const totalSpent = wonResults.reduce((s, r) => s + (r.winningBid || 0), 0);
  const categories = [...new Set(wonResults.map(r => r.auction?.category).filter(Boolean))];
  const latest     = wonResults.length ? wonResults[0] : null;

  const stats = [
    { label: "Auctions Won",  value: total,                 color: "#34d399", icon: "🏆" },
    { label: "Total Spent",   value: formatINR(totalSpent),  color: "#38bdf8", icon: "💰" },
    { label: "Categories",    value: categories.length,     color: "#a78bfa", icon: "🗂️" },
    { label: "Latest Win",    value: latest ? formatDate(latest.createdAt).split(",")[0] : "—", color: "#f59e0b", icon: "📅" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "36px" }}>
      {stats.map(({ label, value, color, icon }) => (
        <div key={label} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "20px", boxShadow: t.shadowCard }}>
          <div style={{ fontSize: "22px", marginBottom: "8px" }}>{icon}</div>
          <div style={{ color, fontSize: "22px", fontWeight: 900, lineHeight: 1 }}>{value}</div>
          <div style={{ color: t.textMut, fontSize: "11px", fontWeight: 600, marginTop: "6px" }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Main Page ── */
export default function WonAuctions() {
  const t        = useThemeStyles();
  const navigate = useNavigate();
  const { userId, role } = useAuth();

  const [wonResults,    setWonResults]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [sort,          setSort]          = useState("newest");
  const [search,        setSearch]        = useState("");
  const [walletBalance, setWalletBalance] = useState(0);

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

  useEffect(() => {
    if (!userId || role === "guest") { setLoading(false); return; }
    setLoading(true);
    setError("");
    fetchWallet();
    loadAndSyncWonAuctions();
  }, [userId, role]);

  const loadAndSyncWonAuctions = async () => {
    try {
      const bidsRes = await fetch(`${import.meta.env.VITE_API_URL}/bid/bids/bidder/${userId}`);
      if (!bidsRes.ok) throw new Error(`Server error: ${bidsRes.status}`);
      const bidsData = await bidsRes.json();
      const allBids  = bidsData.data ?? bidsData ?? [];

      const endedBids = allBids.filter(b => isAuctionEnded(b.auction));

      const auctionIds = [...new Set(endedBids.map(b =>
        typeof b.auction === "object" ? String(b.auction?._id || b.auction?.id) : String(b.auction)
      ))];

      const highestByAuction = {};
      await Promise.all(auctionIds.map(async (aid) => {
        try {
          const r = await fetch(`${import.meta.env.VITE_API_URL}/bid/bids/auction/${aid}`);
          if (!r.ok) return;
          const d = await r.json();
          const all = d.data ?? [];
          if (all.length > 0) highestByAuction[aid] = all[0].bidAmount;
        } catch {}
      }));

      const wonBids = endedBids.filter(b => {
        const aid    = typeof b.auction === "object" ? String(b.auction?._id || b.auction?.id) : String(b.auction);
        const topBid = highestByAuction[aid];
        return topBid !== undefined && b.bidAmount >= topBid;
      });

      const seenAuctions = new Set();
      const deduped = wonBids.filter(b => {
        const aid = typeof b.auction === "object" ? String(b.auction?._id || b.auction?.id) : String(b.auction);
        if (seenAuctions.has(aid)) return false;
        seenAuctions.add(aid);
        return true;
      });

      await Promise.all(deduped.map(async (b) => {
        const auctionId = typeof b.auction === "object"
          ? String(b.auction?._id || b.auction?.id)
          : String(b.auction);
        try {
          await fetch(`${import.meta.env.VITE_API_URL}/auctionres/auction`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              auction:    auctionId,
              winner:     userId,
              winningBid: b.bidAmount,
            }),
          });
        } catch {}
      }));

      const resultsRes = await fetch(`${import.meta.env.VITE_API_URL}/auctionres/auctions/winner/${userId}`);
      if (!resultsRes.ok) throw new Error(`Server error: ${resultsRes.status}`);
      const resultsData = await resultsRes.json();
      setWonResults(Array.isArray(resultsData) ? resultsData : resultsData.data ?? []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = wonResults
    .filter(r => {
      if (!search) return true;
      const title = (r.auctionTitle || r.auction?.title || "").toLowerCase();
      const cat   = (r.auction?.category || "").toLowerCase();
      return title.includes(search.toLowerCase()) || cat.includes(search.toLowerCase());
    })
    .sort((a, b) => {
      if (sort === "newest")  return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === "oldest")  return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === "highest") return b.winningBid - a.winningBid;
      if (sort === "lowest")  return a.winningBid - b.winningBid;
      return 0;
    });

  if (!userId || role === "guest") {
    return (
      <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🔒</div>
          <h2 style={{ color: t.textPri, margin: "0 0 8px" }}>Login to See Your Wins</h2>
          <p style={{ color: t.textMut, fontSize: "14px", marginBottom: "24px" }}>You need an account to view won auctions.</p>
          <button onClick={() => navigate("/Login")} style={{ padding: "12px 32px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#38bdf8,#6366f1)", color: "white", fontWeight: 700, fontSize: "15px", cursor: "pointer" }}>
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: t.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", transition: "background 0.25s" }}>

      {/* HEADER */}
      <div style={{ background: t.bgSec, borderBottom: `1px solid ${t.border}`, padding: "40px 40px 32px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ color: "#34d399", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "8px" }}>
                🏆 Victory Board
              </div>
              <h1 style={{ color: t.textPri, fontSize: "36px", fontWeight: 900, margin: 0 }}>Won Auctions</h1>
              <p style={{ color: t.textMut, marginTop: "8px", fontSize: "15px" }}>Every auction you've won — your collection of victories.</p>
              <div style={{ marginTop: "12px", display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: "10px", padding: "6px 14px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="14" rx="3"/><path d="M16 14a1 1 0 1 0 2 0 1 1 0 0 0-2 0"/><path d="M22 10H2"/></svg>
                <span style={{ fontSize: "13px", color: "#34d399", fontWeight: 700 }}>Wallet: ₹{walletBalance.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => navigate("/my-bids")} style={{ padding: "11px 20px", borderRadius: "12px", border: `1px solid ${t.border}`, background: t.bgCard, color: t.textSec, fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
                📋 My Bids
              </button>
              <button onClick={() => navigate("/browse")} style={{ padding: "11px 20px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#38bdf8,#6366f1)", color: "white", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
                Browse Auctions →
              </button>
            </div>
          </div>

          {/* Search + sort */}
          <div style={{ display: "flex", gap: "10px", marginTop: "28px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: t.textMut, fontSize: "15px" }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search won auctions…"
                style={{ background: t.bgInput, border: `1px solid ${t.borderMd}`, borderRadius: "10px", padding: "10px 14px 10px 38px", color: t.textPri, fontSize: "14px", outline: "none", width: "240px" }}
              />
            </div>
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: "50px", border: `1px solid ${t.border}`, background: t.bgCard, color: t.textSec, fontSize: "13px", outline: "none", cursor: "pointer" }}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Bid</option>
              <option value="lowest">Lowest Bid</option>
            </select>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 40px 60px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <div style={{ fontSize: "52px", marginBottom: "16px", animation: "pulse 1s infinite" }}>🏆</div>
            <div style={{ color: t.textSec, fontSize: "16px", fontWeight: 600 }}>Loading your wins…</div>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <div style={{ color: "#f43f5e", fontWeight: 700, fontSize: "16px", marginBottom: "8px" }}>Could not load won auctions</div>
            <div style={{ color: t.textMut, fontSize: "13px" }}>{error}</div>
          </div>
        ) : wonResults.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <div style={{ fontSize: "80px", marginBottom: "20px" }}>🏆</div>
            <h2 style={{ color: t.textPri, fontSize: "26px", fontWeight: 800, marginBottom: "12px" }}>No wins yet</h2>
            <p style={{ color: t.textMut, fontSize: "15px", marginBottom: "32px", maxWidth: "400px", margin: "0 auto 32px" }}>
              You haven't won any auctions yet. Start bidding and claim your first victory!
            </p>
            <button onClick={() => navigate("/LiveAuctions")}
              style={{ padding: "14px 36px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#34d399,#38bdf8)", color: "white", fontWeight: 700, fontSize: "15px", cursor: "pointer", boxShadow: "0 4px 14px rgba(52,211,153,.35)" }}>
              🔴 View Live Auctions
            </button>
          </div>
        ) : (
          <>
            <WonStats wonResults={wonResults} t={t} />
            <div style={{ color: t.textMut, fontSize: "13px", marginBottom: "20px" }}>
              {filtered.length} won auction{filtered.length !== 1 ? "s" : ""}
              {search && ` matching "${search}"`}
            </div>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</div>
                <div style={{ color: t.textSec, fontSize: "16px", fontWeight: 600 }}>No results for "{search}"</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" }}>
                {filtered.map((result) => (
                  <WonCard
                    key={result._id}
                    result={result}
                    t={t}
                    loadRazorpay={loadRazorpay}
                    walletBalance={walletBalance}
                    refetchWallet={fetchWallet}
                    userId={userId}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: "12px", fontFamily: "'Segoe UI', system-ui, sans-serif", fontWeight: 600, fontSize: "14px", padding: "14px 18px" },
          success: { style: { background: "#0f172a", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" } },
          error:   { style: { background: "#0f172a", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.3)" } },
          blank:   { style: { background: "#0f172a", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.2)" } },
        }}
      />
      <FooterComponent />

      <style>{`
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes cardIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        input::placeholder { color: ${t.textFaint}; }
        select option { background: ${t.bgSec}; color: ${t.textPri}; }
      `}</style>
    </div>
  );
}

