import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../../src/context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { toast, Toaster } from "react-hot-toast";
import FooterComponent from "../components/user/FooterComponent";

const BASE = String(import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

/* ── Icon helper ── */
const Icon = ({ d, size = 18, strokeWidth = 1.75, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {d}
  </svg>
);

const Icons = {
  Wallet:     <Icon d={<><rect x="2" y="6" width="20" height="14" rx="3"/><path d="M16 14a1 1 0 1 0 2 0 1 1 0 0 0-2 0"/><path d="M22 10H2"/><path d="M6 6V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2"/></>} />,
  Plus:       <Icon d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />,
  ArrowUp:    <Icon d={<><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>} />,
  ArrowDown:  <Icon d={<><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>} />,
  Check:      <Icon d={<polyline points="20 6 9 17 4 12"/>} size={14} strokeWidth={2.5} />,
  X:          <Icon d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} size={14} />,
  Shield:     <Icon d={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>} />,
  History:    <Icon d={<><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></>} />,
  Zap:        <Icon d={<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor"/></>} size={14} />,
  Spinner:    <Icon d={<><path d="M21 12a9 9 0 1 1-6.219-8.56"/></>} size={18} strokeWidth={2.5} />,
};

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2500, 5000];

/* ── Razorpay loader ── */
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

export default function Wallet() {
  const { theme } = useTheme();
  const { userId } = useAuth();
  const isLight = theme === "light";

  /* ── state ── */
  const [balance,        setBalance]        = useState(0);
  const [transactions,   setTransactions]   = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [addMoneyOpen,   setAddMoneyOpen]   = useState(false);
  const [customAmount,   setCustomAmount]   = useState("");
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [paying,         setPaying]         = useState(false);
  const [userName,       setUserName]       = useState("");
  const [userEmail,      setUserEmail]      = useState("");
  const [lockedBalance,  setLockedBalance]  = useState(0);

  const finalAmount = selectedAmount || parseFloat(customAmount) || 0;

  /* ── SSE ref — keeps the EventSource instance across renders ── */
  const sseRef = useRef(null);

  /* ── fetch wallet + transactions ── */
  const fetchAll = async () => {
    if (!userId) return;
    try {
      const [wRes, tRes, uRes] = await Promise.all([
        fetch(`${BASE}/wallet/${userId}/wallet`),
        fetch(`${BASE}/wallet/${userId}/transactions`),
        fetch(`${BASE}/user/getuser/${userId}`),
      ]);

      if (wRes.ok) {
        const json = await wRes.json();
        setBalance(json.balance ?? 0);
        setLockedBalance(json.lockedBalance ?? 0);
        if (json.userName) setUserName(json.userName);
      }

      if (tRes.ok) {
        const json = await tRes.json();
        const list = json.transactions ?? json.data ?? (Array.isArray(json) ? json : []);
        setTransactions(list);
      }

      if (uRes.ok) {
        const u    = await uRes.json();
        const user = u.data ?? u.user ?? u;
        const isBusiness = user.role === "business" || user.accountType === "business";
        const name = isBusiness
          ? (user.businessName || user.companyName || "")
          : ((user.firstName || user.first_name || "") + " " + (user.lastName || user.last_name || "")).trim()
            || user.name || user.username || "";
        setUserName(prev => prev || name);
        setUserEmail(user.email || "");
      }
    } catch (err) {
      toast.error("Failed to load wallet data.", {
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
      });
    }
  };

  /* ── Initial load ── */
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, [userId]);

  /* ── SSE: open one persistent connection per userId ── */
  useEffect(() => {
    if (!userId) return;

    // Close any existing connection first (e.g. userId changed)
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }

    const es = new EventSource(`${BASE}/wallet/${userId}/events`);
    sseRef.current = es;

    // Server pushes this whenever balance/lockedBalance changes
    es.addEventListener("wallet_update", () => {
      fetchAll(); // re-fetch fresh data from server
    });

    es.addEventListener("connected", () => {
      console.log("[SSE] Wallet stream connected for", userId);
    });

    es.onerror = () => {
      // EventSource auto-reconnects on error — no action needed.
      // Uncomment the line below if you want to see reconnection attempts:
      // console.warn("[SSE] Connection lost — browser will retry automatically.");
    };

    // Cleanup on unmount or userId change
    return () => {
      es.close();
      sseRef.current = null;
    };
  }, [userId]);

  /* ── Add Money via Razorpay ── */
  const handleAddMoney = async () => {
    if (finalAmount < 10) return;
    setPaying(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error("Failed to load Razorpay. Check your internet connection.");
        setPaying(false);
        return;
      }

      const res = await fetch(`${BASE}/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount }),
      });
      const responseJson = await res.json().catch(() => ({}));
      if (!res.ok) {
        const serverMessage = responseJson?.message || responseJson?.error;
        throw new Error(serverMessage || `Server error: ${res.status}`);
      }
      const order = responseJson.data || responseJson;
      const razorpayKey = responseJson.key || order.key || order.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID;
      const orderId = order.id || order.order_id;
      if (!razorpayKey || !orderId) throw new Error("Invalid order response from server.");

      const options = {
        key: razorpayKey,
        amount: order.amount_due || order.amount,
        currency: order.currency || "INR",
        name: "Wallet",
        description: `Add ₹${finalAmount.toLocaleString()} to Wallet`,
        order_id: orderId,
        handler: async (response) => {
          setAddMoneyOpen(false);
          setSelectedAmount(null);
          setCustomAmount("");
          setPaying(false);

          try {
            const addRes = await fetch(`${BASE}/wallet/${userId}/wallet/add`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                amount:    finalAmount,
                paymentId: response.razorpay_payment_id,
                orderId:   response.razorpay_order_id,
                signature: response.razorpay_signature,
              }),
            });
            if (!addRes.ok) throw new Error("Wallet credit failed");
            toast.success(`₹${finalAmount.toLocaleString()} added to your wallet!`, {
              duration: 5000,
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
            });
            // SSE will trigger fetchAll() automatically — no need to call it manually here
          } catch {
            toast.error(
              `Payment received (ID: ${response.razorpay_payment_id}) but wallet update failed. Please contact support.`,
              { duration: 8000 }
            );
            fetchAll(); // fallback manual refresh
          }
        },
        prefill: { name: userName, email: userEmail, contact: "" },
        theme: { color: "#004D40" },
        modal: {
          confirm_close: true,
          animation: true,
          backdropclose: false,
          ondismiss: () => {
            setPaying(false);
            toast("Payment cancelled.", {
              duration: 3000,
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
            });
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        setPaying(false);
        toast.error(response.error.description || "Payment failed.", {
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
        });
      });

      rzp.open();

    } catch (err) {
      setPaying(false);
      toast.error(err?.message || "Payment initiation failed. Please try again.");
    }
  };

  /* ── helpers ── */
  const totalAdded = transactions.filter(t => t.type === "credit").reduce((s, t) => s + (t.amount || 0), 0);
  const totalSpent = transactions.filter(t => t.type === "debit").reduce((s, t)  => s + (t.amount || 0), 0);

  const formatTxDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  /* ── styles ── */
  const s = {
    page: { minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)", fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "32px 24px 64px" },
    container: { maxWidth: "900px", margin: "0 auto" },
    card: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "20px", padding: "24px", boxShadow: isLight ? "0 2px 16px rgba(0,0,0,0.06)" : "none" },
    btn: (variant = "primary") => ({
      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
      padding: "10px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: 600,
      cursor: "pointer", border: "none", transition: "all 0.15s",
      ...(variant === "primary" ? { background: "linear-gradient(135deg, #38bdf8, #6366f1)", color: "#ffffff", boxShadow: "0 4px 14px rgba(56,189,248,0.3)" }
        : variant === "ghost"   ? { background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)", color: "var(--text-secondary)" }
        : variant === "danger"  ? { background: "rgba(244,63,94,0.1)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.2)" }
        : {}),
    }),
  };

  if (loading) return (
    <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px", animation: "spin 1s linear infinite", display: "inline-block" }}>💳</div>
        <div style={{ fontSize: "16px", fontWeight: 600 }}>Loading wallet…</div>
      </div>
    </div>
  );

  return (
    <>
    <div style={s.page}>
      <div style={s.container}>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>Wallet</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: "6px 0 0" }}>Manage your wallet and transactions</p>
        </div>

        {/* ── Wallet Balance Hero ── */}
        <div style={{ ...s.card, background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)", border: "1px solid rgba(99,102,241,0.3)", marginBottom: "24px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(99,102,241,0.15)", filter: "blur(40px)" }}/>
          <div style={{ position: "absolute", bottom: "-20px", left: "30%", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(56,189,248,0.1)", filter: "blur(30px)" }}/>
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(56,189,248,0.2)", border: "1px solid rgba(56,189,248,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#38bdf8" }}>{Icons.Wallet}</div>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Wallet Balance</span>
              </div>
              <div style={{ fontSize: "42px", fontWeight: 900, color: "#ffffff", letterSpacing: "-1px", lineHeight: 1 }}>
                ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div style={{ marginTop: "8px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>Available for bidding</span>
                {lockedBalance > 0 && (
                  <span style={{ fontSize: "12px", color: "#f59e0b", display: "flex", alignItems: "center", gap: "4px" }}>
                    🔒 ₹{lockedBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })} locked
                  </span>
                )}
                <span style={{ fontSize: "12px", color: "#34d399", display: "flex", alignItems: "center", gap: "4px" }}>{Icons.Shield} Secured</span>
              </div>
            </div>
            <button style={{ ...s.btn("primary"), padding: "12px 24px", fontSize: "15px" }}
              onClick={() => setAddMoneyOpen(true)}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "none"}>
              {Icons.Plus} Add Money
            </button>
          </div>

          {/* Quick stats */}
          <div style={{ position: "relative", display: "flex", gap: "1px", marginTop: "24px", background: "rgba(255,255,255,0.06)", borderRadius: "12px", overflow: "hidden" }}>
            {[
              { label: "Total Added",  value: `₹${totalAdded.toLocaleString("en-IN")}`,                                         icon: Icons.ArrowDown, color: "#34d399" },
              { label: "Total Spent",  value: `₹${totalSpent.toLocaleString("en-IN")}`,                                          icon: Icons.ArrowUp,   color: "#f43f5e" },
              { label: "Locked",       value: `₹${(lockedBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,  icon: Icons.Shield,    color: "#f59e0b" },
              { label: "Transactions", value: transactions.length,                                                                 icon: Icons.History,   color: "#38bdf8" },
            ].map((stat, i) => (
              <div key={i} style={{ flex: 1, padding: "14px 16px", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ color: stat.color }}>{stat.icon}</span>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{stat.label}</div>
                  <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "16px" }}>{stat.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Transaction History ── */}
        {(
          <div style={s.card}>
            <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: 700 }}>Recent Transactions</h3>
            {transactions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
                <div style={{ fontWeight: 600 }}>No transactions yet</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {transactions.map((tx) => (
                  <div key={tx._id || tx.id}
                    style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 12px", borderRadius: "12px", transition: "background 0.15s", cursor: "default" }}
                    onMouseEnter={e => e.currentTarget.style.background = isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "12px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      background: tx.category === "lock"    ? "rgba(245,158,11,0.14)"  :
                                  tx.category === "unlock"  ? "rgba(52,211,153,0.12)"  :
                                  tx.category === "penalty" ? "rgba(244,63,94,0.15)"   :
                                  tx.type === "credit"      ? "rgba(52,211,153,0.12)"  : "rgba(244,63,94,0.12)",
                      color:      tx.category === "lock"    ? "#f59e0b" :
                                  tx.category === "unlock"  ? "#34d399" :
                                  tx.category === "penalty" ? "#f43f5e" :
                                  tx.type === "credit"      ? "#34d399" : "#f43f5e",
                      fontSize: "18px" }}>
                      {tx.category === "lock"    ? "🔒" :
                       tx.category === "unlock"  ? "🔓" :
                       tx.category === "penalty" ? "⚠️" :
                       tx.type === "credit"      ? Icons.ArrowDown : Icons.ArrowUp}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tx.label || tx.description || tx.type}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>{tx.date ? tx.date : formatTxDate(tx.createdAt)}</span>
                        {tx.category && tx.category !== "other" && (
                          <span style={{ padding: "1px 7px", borderRadius: "50px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
                            background: tx.category === "lock" ? "rgba(245,158,11,0.12)" : tx.category === "unlock" ? "rgba(52,211,153,0.1)" : tx.category === "penalty" ? "rgba(244,63,94,0.1)" : tx.category === "add_money" ? "rgba(56,189,248,0.1)" : "rgba(148,163,184,0.1)",
                            color:      tx.category === "lock" ? "#f59e0b"               : tx.category === "unlock" ? "#34d399"               : tx.category === "penalty" ? "#f43f5e"               : tx.category === "add_money" ? "#38bdf8"               : "#94a3b8" }}>
                            {tx.category.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "15px", flexShrink: 0,
                      color: tx.category === "lock"    ? "#f59e0b" :
                             tx.category === "unlock"  ? "#34d399" :
                             tx.category === "penalty" ? "#f43f5e" :
                             tx.type === "credit"      ? "#34d399" : "#f43f5e" }}>
                      {tx.category === "lock" ? "🔒 " : tx.category === "penalty" ? "⚠️ " : tx.type === "credit" ? "+" : "-"}₹{(tx.amount || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ══ ADD MONEY MODAL ══ */}
      {addMoneyOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={() => setAddMoneyOpen(false)}>
          <div style={{ background: "var(--bg-secondary)", borderRadius: "24px", border: "1px solid var(--border)", width: "100%", maxWidth: "460px", boxShadow: "0 32px 64px rgba(0,0,0,0.4)", animation: "popIn 0.25s ease" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: "24px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800 }}>Add Money</h2>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-muted)" }}>Pay securely via Razorpay</p>
              </div>
              <button onClick={() => setAddMoneyOpen(false)} style={{ ...s.btn("ghost"), padding: "8px", borderRadius: "8px" }}>{Icons.X}</button>
            </div>

            <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Quick amounts */}
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Quick Select</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  {QUICK_AMOUNTS.map(amt => (
                    <button key={amt} onClick={() => { setSelectedAmount(amt); setCustomAmount(""); }}
                      style={{ padding: "12px", borderRadius: "10px", border: "1px solid", fontSize: "14px", fontWeight: 700, cursor: "pointer", transition: "all 0.15s", borderColor: selectedAmount === amt ? "#38bdf8" : "var(--border)", background: selectedAmount === amt ? "rgba(56,189,248,0.12)" : "transparent", color: selectedAmount === amt ? "#38bdf8" : "var(--text-primary)" }}>
                      ₹{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom amount */}
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Custom Amount</div>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontWeight: 700 }}>₹</span>
                  <input type="number" placeholder="Enter amount" min="10" value={customAmount}
                    onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                    style={{ width: "100%", padding: "12px 14px 12px 28px", background: "var(--bg-input)", border: "1px solid var(--border-input)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "15px", fontWeight: 600, outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "#38bdf8"}
                    onBlur={e => e.target.style.borderColor = "var(--border-input)"} />
                </div>
              </div>

              {/* Summary */}
              {finalAmount >= 10 && (
                <div style={{ background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: "12px", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Amount to add</div>
                    <div style={{ fontWeight: 800, fontSize: "20px", color: "#38bdf8" }}>₹{finalAmount.toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>New balance</div>
                    <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-primary)" }}>₹{(balance + finalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>
              )}

              <button onClick={handleAddMoney} disabled={finalAmount < 10 || paying}
                style={{ ...s.btn("primary"), padding: "14px", fontSize: "15px", opacity: finalAmount < 10 || paying ? 0.5 : 1, cursor: finalAmount < 10 || paying ? "not-allowed" : "pointer" }}
                onMouseEnter={e => finalAmount >= 10 && !paying && (e.currentTarget.style.transform = "translateY(-1px)")}
                onMouseLeave={e => e.currentTarget.style.transform = "none"}>
                {paying ? Icons.Spinner : Icons.Zap}
                {paying ? "Opening Razorpay…" : `Add ₹${finalAmount >= 10 ? finalAmount.toLocaleString() : "---"} to Wallet`}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-right" toastOptions={{
        style: { borderRadius: "12px", fontFamily: "'Segoe UI', system-ui, sans-serif", fontWeight: 600, fontSize: "14px", padding: "14px 18px" },
        success: { style: { background: "#0f172a", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" } },
        error:   { style: { background: "#0f172a", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.3)" } },
        blank:   { style: { background: "#0f172a", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.2)" } },
      }} />

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes popIn   { from { opacity: 0; transform: scale(0.95);      } to { opacity: 1; transform: scale(1);    } }
        @keyframes spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
    <FooterComponent />
    </>
  );
}

