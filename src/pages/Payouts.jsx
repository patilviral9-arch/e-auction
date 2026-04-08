import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useThemeStyles } from "../utils/themeStyles";
import { useAuth } from "../context/AuthContext";
import FooterComponent from "../components/user/FooterComponent";

const API = "http://localhost:3000";

// ── helpers ───────────────────────────────────────────────────────────────────
const formatINR = (n) =>
  "\u20B9" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const formatDate = (dateStr) => {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// ── inline SVG helper (mirrors BrowseAuctions / MyWishlist) ──────────────────
const dedupeTransactions = (list = []) => {
  const seen = new Set();
  return list.filter((tx, index) => {
    const key =
      tx?._id ||
      tx?.id ||
      tx?.payoutId ||
      (tx?.auctionId ? `${tx.auctionId}-${tx.status || ""}-${tx.amount || 0}` : `idx-${index}`);
    const normalized = String(key || "");
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};

const dedupeBanks = (list = []) => {
  const seen = new Set();
  return list.filter((bank, index) => {
    const name = String(bank?.name || "").trim().toLowerCase();
    const accountNum = String(bank?.accountNum || "").trim();
    const upi = accountNum.includes("@") ? accountNum.toLowerCase() : "";
    const digits = accountNum.replace(/\D/g, "");
    const tail4 = digits.slice(-4);
    const normalizedAccount = upi || (tail4 ? `****${tail4}` : accountNum.toLowerCase());
    const key = (name || normalizedAccount)
      ? `${name}-${normalizedAccount}`
      : String(bank?._id || bank?.bankId || bank?.id || `idx-${index}`);
    const normalized = String(key || "");
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};

const maskAccount = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.includes("@")) return raw;
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 4) return `XXXX XXXX ${digits.slice(-4)}`;
  return raw;
};

const getBankUiId = (bank, fallback = "") =>
  String(bank?._id || bank?.id || bank?.bankId || fallback || "");

const getProfileBanksFromUser = (userInfo) => {
  const bank = userInfo?.bank;
  if (!bank) return [];

  const profileBanks = [];

  if (bank.bankName && bank.accountNumber) {
    profileBanks.push({
      id: "profile-bank",
      logoText: String(bank.bankName).slice(0, 4).toUpperCase(),
      name: bank.bankName,
      accountNum: bank.accountNumber,
      ifsc: bank.ifsc || "",
      isDefault: true,
      isProfileFallback: true,
      bankId: bank.bankId || bank._id || null,
    });
  }

  if (bank.upi) {
    profileBanks.push({
      id: "profile-upi",
      logoText: "UPI",
      name: "UPI / " + (String(bank.upi).split("@")[1]?.toUpperCase() || "UPI"),
      accountNum: bank.upi,
      upi: bank.upi,
      isDefault: profileBanks.length === 0,
      isProfileFallback: true,
      bankId: bank.upiId || null,
    });
  }

  return profileBanks;
};

const Ico = ({ d, size = 16, sw = 1.75, fill = "none", vb = "0 0 24 24", children, ...p }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size} height={size}
    viewBox={vb}
    fill={fill}
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
    {...p}
  >
    {children || <path d={d} />}
  </svg>
);

const Icons = {
  Wallet:      <Ico size={18}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></Ico>,
  TrendUp:     <Ico size={18}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></Ico>,
  Clock:       <Ico size={18}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Ico>,
  CheckCircle: <Ico size={18}><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></Ico>,
  Bank:        <Ico size={16}><rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 9l9-6 9 6"/><line x1="12" y1="9" x2="12" y2="21"/><line x1="7" y1="9" x2="7" y2="21"/><line x1="17" y1="9" x2="17" y2="21"/></Ico>,
  Plus:        <Ico size={14}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Ico>,
  Trash:       <Ico size={13}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></Ico>,
  Star:        <Ico size={12} fill="currentColor" sw={0}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Ico>,
  Receipt:     <Ico size={14}><path d="M4 2v20l3-2 2 2 3-2 3 2 2-2 3 2V2"/><path d="M8 7h8M8 11h8M8 15h5"/></Ico>,
  Download:    <Ico size={14}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Ico>,
  Filter:      <Ico size={14}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></Ico>,
  ChevronRight:<Ico size={13} sw={2.5}><polyline points="9 18 15 12 9 6"/></Ico>,
  Alert:       <Ico size={16}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></Ico>,
  UPI:         <Ico size={16}><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></Ico>,
  Gavel:       <Ico size={15}><path d="M14.5 2.5 19 7l-9 9-4.5-4.5 9-9z"/><path d="m2 22 7-7"/><path d="M14.5 2.5 12 5"/></Ico>,
};

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    Paid:       { bg: "rgba(52,211,153,.12)",  color: "#34d399", label: "Paid" },
    Pending:    { bg: "rgba(251,191,36,.12)",  color: "#fbbf24", label: "Pending" },
    Processing: { bg: "rgba(56,189,248,.12)",  color: "#38bdf8", label: "Processing" },
    Failed:     { bg: "rgba(244,63,94,.12)",   color: "#f43f5e", label: "Failed" },
  };
  const s = map[status] || map["Pending"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "3px 10px", borderRadius: "50px",
      background: s.bg, color: s.color,
      fontSize: "11px", fontWeight: 700, letterSpacing: ".03em",
    }}>{s.label}</span>
  );
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, subColor, accentColor, t }) => (
  <div style={{
    background: t.bgCard,
    border: `1px solid ${t.border}`,
    borderRadius: "16px",
    padding: "20px",
    boxShadow: t.shadow,
    position: "relative",
    overflow: "hidden",
    transition: "border-color .2s, transform .2s",
  }}
  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(56,189,248,.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
  onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.transform = "translateY(0)"; }}
  >
    {/* accent line */}
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: accentColor, borderRadius: "16px 16px 0 0" }} />
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
      <div style={{ color: accentColor, display: "flex", alignItems: "center", background: `${accentColor}18`, borderRadius: "10px", padding: "8px" }}>
        {icon}
      </div>
      <span style={{ color: t.textMut, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em" }}>{label}</span>
    </div>
    <div style={{ color: t.textPri, fontSize: "26px", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ color: subColor || t.textMut, fontSize: "12px", marginTop: "6px", fontWeight: 600 }}>{sub}</div>}
  </div>
);

// ── Bank account row ──────────────────────────────────────────────────────────
const BankRow = ({ bank, onRemove, onSetDefault, t }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: "14px",
        padding: "14px 16px",
        borderRadius: "12px",
        border: `1px solid ${hov ? "rgba(56,189,248,.3)" : t.border}`,
        background: hov ? (t.bgCard) : "transparent",
        transition: "all .2s", marginBottom: "8px",
      }}
    >
      {/* Logo pill */}
      <div style={{
        width: "44px", height: "28px", borderRadius: "7px",
        background: "linear-gradient(135deg,rgba(56,189,248,.15),rgba(99,102,241,.15))",
        border: `1px solid ${t.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "9px", fontWeight: 800, color: "#38bdf8", letterSpacing: ".04em",
        flexShrink: 0,
      }}>
        {bank.logoText}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: t.textPri, fontWeight: 700, fontSize: "13px" }}>{bank.name}</span>
          {bank.isDefault && (
            <span style={{ fontSize: "9px", fontWeight: 800, background: "rgba(56,189,248,.12)", color: "#38bdf8", border: "1px solid rgba(56,189,248,.25)", borderRadius: "50px", padding: "2px 8px", textTransform: "uppercase", letterSpacing: ".05em" }}>Default</span>
          )}
        </div>
        <div style={{ color: t.textMut, fontSize: "12px", marginTop: "2px", fontFamily: "monospace" }}>{maskAccount(bank.accountNum)}</div>
      </div>
      <div style={{ display: "flex", gap: "6px" }}>
        {!bank.isDefault && (
          <button onClick={() => onSetDefault(getBankUiId(bank))}
            style={{ padding: "5px 10px", borderRadius: "8px", border: `1px solid ${t.border}`, background: "transparent", color: t.textMut, fontSize: "11px", fontWeight: 600, cursor: "pointer", transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#38bdf8"; e.currentTarget.style.color = "#38bdf8"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMut; }}
          >Set default</button>
        )}
        <button onClick={() => onRemove(getBankUiId(bank))}
          style={{ padding: "5px 10px", borderRadius: "8px", border: "1px solid rgba(244,63,94,.25)", background: "transparent", color: "#f43f5e", fontSize: "11px", fontWeight: 600, cursor: "pointer", transition: "all .15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(244,63,94,.08)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>{Icons.Trash} Remove</span>
        </button>
      </div>
    </div>
  );
};

// ── Transaction row ───────────────────────────────────────────────────────────
const TxRow = ({ tx, t }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 120px 110px 90px 90px",
        gap: "12px",
        alignItems: "center",
        padding: "14px 20px",
        borderBottom: `1px solid ${t.border}`,
        background: hov ? (t.bg) : "transparent",
        transition: "background .15s",
      }}
    >
      {/* Item */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
        <div style={{
          width: "38px", height: "38px", borderRadius: "10px", flexShrink: 0,
          background: "linear-gradient(135deg,rgba(56,189,248,.1),rgba(99,102,241,.1))",
          border: `1px solid ${t.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#38bdf8",
        }}>{Icons.Gavel}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: t.textPri, fontWeight: 700, fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tx.auctionTitle}</div>
          <div style={{ color: t.textMut, fontSize: "11px", marginTop: "2px", fontFamily: "monospace" }}>{tx.payoutId} | {tx.method}</div>
        </div>
      </div>
      {/* Date */}
      <div style={{ color: t.textSec, fontSize: "12px" }}>{formatDate(tx.date)}</div>
      {/* Amount */}
      <div style={{ color: t.textPri, fontWeight: 800, fontSize: "14px" }}>{formatINR(tx.amount)}</div>
      {/* Status */}
      <div><StatusBadge status={tx.status} /></div>
      {/* Action */}
      <div>
        {tx.status === "Paid" && (
          <button style={{
            display: "flex", alignItems: "center", gap: "4px",
            padding: "5px 10px", borderRadius: "8px",
            border: `1px solid ${t.border}`, background: "transparent",
            color: t.textMut, fontSize: "11px", fontWeight: 600, cursor: "pointer", transition: "all .15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#38bdf8"; e.currentTarget.style.color = "#38bdf8"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMut; }}
          >{Icons.Receipt} Receipt</button>
        )}
        {tx.status === "Failed" && (
          <button style={{
            display: "flex", alignItems: "center", gap: "4px",
            padding: "5px 10px", borderRadius: "8px",
            border: "1px solid rgba(244,63,94,.3)", background: "transparent",
            color: "#f43f5e", fontSize: "11px", fontWeight: 600, cursor: "pointer",
          }}>Retry</button>
        )}
        {(tx.status === "Pending" || tx.status === "Processing") && (
          <span style={{ color: t.textMut, fontSize: "11px" }}>In progress...</span>
        )}
      </div>
    </div>
  );
};

// ── Add Bank Modal ────────────────────────────────────────────────────────────
const AddBankModal = ({ onClose, onAdd, t }) => {
  const [form, setForm] = useState({ name: "", accountNum: "", ifsc: "", type: "Savings", upi: "" });
  const [tab, setTab] = useState("bank"); // "bank" | "upi"

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = () => {
    if (tab === "upi") {
      const upi = form.upi.trim();
      if (!upi || !upi.includes("@")) return;
      const provider = upi.split("@")[1]?.toUpperCase() || "UPI";
      onAdd({
        id: Date.now(),
        logoText: "UPI",
        name: `UPI / ${provider}`,
        accountNum: upi,
        ifsc: "",
        accountType: "UPI",
        isDefault: false,
      });
    } else {
      const name = form.name.trim();
      const accountNum = form.accountNum.trim();
      const ifsc = form.ifsc.trim().toUpperCase();
      if (!name || !accountNum || !ifsc) return;
      onAdd({
        id: Date.now(),
        logoText: name.slice(0, 4).toUpperCase(),
        name,
        accountNum,
        ifsc,
        accountType: form.type || "Savings",
        isDefault: false,
      });
    }
    onClose();
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px",
    background: t.bgInput, border: `1px solid ${t.borderMd}`,
    borderRadius: "10px", color: t.textPri, fontSize: "14px",
    outline: "none", fontFamily: "'Segoe UI',system-ui,sans-serif",
    boxSizing: "border-box",
  };
  const labelStyle = { color: t.textSec, fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: t.bgSec, border: `1px solid ${t.borderMd}`, borderRadius: "20px", padding: "28px", width: "420px", boxShadow: `0 32px 64px ${t.shadow}` }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <div style={{ color: t.textMut, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>Add Account</div>
            <div style={{ color: t.textPri, fontWeight: 800, fontSize: "17px", marginTop: "2px" }}>Link a bank or UPI</div>
          </div>
          <button onClick={onClose} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "8px", color: t.textSec, cursor: "pointer", width: "32px", height: "32px", fontSize: "16px" }}>X</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "6px", background: t.bg, borderRadius: "10px", padding: "4px", marginBottom: "20px" }}>
          {[["bank", "Bank Account"], ["upi", "UPI ID"]].map(([val, label]) => (
            <button key={val} onClick={() => setTab(val)} style={{
              flex: 1, padding: "8px", borderRadius: "8px", border: "none",
              background: tab === val ? t.bgSec : "transparent",
              color: tab === val ? t.textPri : t.textMut,
              fontWeight: 700, fontSize: "13px", cursor: "pointer",
              boxShadow: tab === val ? t.shadow : "none",
              transition: "all .15s",
            }}>{label}</button>
          ))}
        </div>

        {tab === "bank" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div><label style={labelStyle}>Bank Name</label><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. State Bank of India" style={inputStyle}/></div>
            <div><label style={labelStyle}>Account Number</label><input value={form.accountNum} onChange={e => set("accountNum", e.target.value)} placeholder="Enter account number" style={inputStyle}/></div>
            <div><label style={labelStyle}>IFSC Code</label><input value={form.ifsc} onChange={e => set("ifsc", e.target.value)} placeholder="e.g. SBIN0001234" style={{ ...inputStyle, textTransform: "uppercase" }}/></div>
            <div><label style={labelStyle}>Account Type</label>
              <select value={form.type} onChange={e => set("type", e.target.value)} style={{ ...inputStyle }}>
                <option>Savings</option><option>Current</option>
              </select>
            </div>
          </div>
        ) : (
          <div>
            <label style={labelStyle}>UPI ID</label>
            <input value={form.upi} onChange={e => set("upi", e.target.value)} placeholder="yourname@upi" style={inputStyle}/>
            <div style={{ color: t.textMut, fontSize: "11px", marginTop: "8px" }}>Supports PhonePe, Google Pay, Paytm, BHIM</div>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", marginTop: "22px" }}>
          <button onClick={handleAdd} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#38bdf8,#6366f1)", color: "white", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>Add Account</button>
          <button onClick={onClose} style={{ padding: "12px 18px", borderRadius: "12px", border: `1px solid ${t.border}`, background: "transparent", color: t.textSec, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ── Withdraw Modal ────────────────────────────────────────────────────────────
const WithdrawModal = ({ balance, banks, onClose, onConfirm, t }) => {
  const [amount, setAmount] = useState(balance);
  const [bankId, setBankId] = useState(() => getBankUiId(banks.find(b => b.isDefault) || banks[0]));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [doneTitle, setDoneTitle] = useState("Withdrawal Initiated!");
  const [doneMessage, setDoneMessage] = useState("Your withdrawal is being processed.");
  const numericAmount = Number(amount || 0);
  const canSubmit = !submitting && Number.isFinite(numericAmount) && numericAmount >= 1 && numericAmount <= balance && banks.length > 0 && !!bankId;

  useEffect(() => {
    if (banks.length === 0) {
      setBankId("");
      return;
    }
    const hasCurrent = banks.some((b, index) => getBankUiId(b, `idx-${index}`) === bankId);
    if (!hasCurrent) {
      setBankId(getBankUiId(banks.find((b) => b.isDefault) || banks[0]));
    }
  }, [banks, bankId]);

  const confirm = async () => {
    if (!canSubmit) return;
    setError("");
    setSubmitting(true);
    const result = await onConfirm({ amount: numericAmount, bankId });
    if (!result?.ok) {
      setError(result?.message || "Withdrawal failed. Please try again.");
      setSubmitting(false);
      return;
    }
    setDoneTitle(result?.title || "Withdrawal Initiated!");
    setDoneMessage(result?.message || `${formatINR(numericAmount)} is now being processed.`);
    setDone(true);
    setTimeout(() => { onClose(); }, 1200);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: t.bgSec, border: `1px solid ${t.borderMd}`, borderRadius: "20px", padding: "32px", width: "420px", boxShadow: `0 32px 64px ${t.shadow}` }} onClick={e => e.stopPropagation()}>
        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ marginBottom: "16px", display: "inline-flex", color: "#34d399" }}>{Icons.CheckCircle}</div>
            <div style={{ color: "#34d399", fontSize: "20px", fontWeight: 800 }}>{doneTitle}</div>
            <div style={{ color: t.textMut, fontSize: "14px", marginTop: "8px" }}>
              {doneMessage}
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px" }}>
              <div>
                <div style={{ color: t.textMut, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>Withdraw Funds</div>
                <div style={{ color: t.textPri, fontWeight: 800, fontSize: "18px", marginTop: "3px" }}>Available: {formatINR(balance)}</div>
              </div>
              <button onClick={onClose} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "8px", color: t.textSec, cursor: "pointer", width: "32px", height: "32px", fontSize: "16px" }}>X</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "18px" }}>
              {[balance, Math.floor(balance * 0.75), Math.floor(balance * 0.5), Math.floor(balance * 0.25)].map(amt => (
                <button key={amt} onClick={() => setAmount(amt)} style={{
                  padding: "10px", borderRadius: "10px",
                  border: amount === amt ? "1px solid rgba(56,189,248,.5)" : `1px solid ${t.border}`,
                  background: amount === amt ? "rgba(56,189,248,.08)" : t.bgCard,
                  color: amount === amt ? "#38bdf8" : t.textSec,
                  fontWeight: 700, fontSize: "13px", cursor: "pointer", transition: "all .15s",
                }}>{formatINR(amt)}</button>
              ))}
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: t.textSec, fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "8px" }}>Custom Amount (INR)</label>
              <div style={{ display: "flex", border: "1px solid rgba(56,189,248,.4)", borderRadius: "12px", overflow: "hidden" }}>
                <span style={{ padding: "12px 16px", background: "rgba(56,189,248,.08)", color: "#38bdf8", fontWeight: 700, fontSize: "16px" }}>{"\u20B9"}</span>
                <input
                  type="number"
                  value={amount}
                  min={1}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      setAmount("");
                      return;
                    }
                    const next = Number(raw);
                    if (!Number.isFinite(next) || next < 0) return;
                    setAmount(next);
                  }}
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: t.textPri, fontSize: "18px", fontWeight: 700, padding: "12px 16px", fontFamily: "'Segoe UI',system-ui,sans-serif" }} />
              </div>
              {numericAmount > balance && <div style={{ color: "#f43f5e", fontSize: "12px", marginTop: "6px" }}>Amount exceeds available balance.</div>}
            </div>

            {banks.length > 0 && (
              <div style={{ marginBottom: "18px" }}>
                <label style={{ color: t.textSec, fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "8px" }}>Transfer To</label>
                {banks.map((b, index) => {
                  const uiId = getBankUiId(b, `idx-${index}`);
                  return (
                  <div key={uiId} onClick={() => setBankId(uiId)} style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "10px 14px", borderRadius: "10px", marginBottom: "6px",
                    border: bankId === uiId ? "1px solid rgba(56,189,248,.4)" : `1px solid ${t.border}`,
                    background: bankId === uiId ? "rgba(56,189,248,.06)" : t.bgCard,
                    cursor: "pointer", transition: "all .15s",
                  }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", border: "2px solid #38bdf8", background: bankId === uiId ? "#38bdf8" : "transparent", transition: "all .15s" }} />
                    <div>
                      <div style={{ color: t.textPri, fontWeight: 700, fontSize: "13px" }}>{b.name}</div>
                      <div style={{ color: t.textMut, fontSize: "11px", fontFamily: "monospace" }}>{maskAccount(b.accountNum)}</div>
                    </div>
                  </div>
                )})}
              </div>
            )}
            {banks.length === 0 && (
              <div style={{ marginBottom: "18px", color: "#f59e0b", fontSize: "12px", fontWeight: 600 }}>
                No linked payout account found. Add or link a bank account first.
              </div>
            )}

            <div style={{ background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.2)", borderRadius: "10px", padding: "10px 14px", marginBottom: "18px", display: "flex", gap: "8px" }}>
              <span style={{ color: "#fbbf24", marginTop: "1px", flexShrink: 0 }}>{Icons.Alert}</span>
              <span style={{ color: "#fbbf24", fontSize: "12px", fontWeight: 600 }}>Platform fee of 5% is already deducted from your earnings. Withdrawals are transferred to your linked account.</span>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={confirm} disabled={!canSubmit}
                style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: canSubmit ? "linear-gradient(135deg,#38bdf8,#6366f1)" : t.bgCard, color: canSubmit ? "white" : t.textMut, fontWeight: 700, fontSize: "15px", cursor: canSubmit ? "pointer" : "not-allowed" }}>
                {submitting ? "Processing..." : "Withdraw Funds"}
              </button>
              <button onClick={onClose} style={{ padding: "14px 20px", borderRadius: "12px", border: `1px solid ${t.border}`, background: "transparent", color: t.textSec, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
            </div>
            {error && (
              <div style={{ color: "#f43f5e", fontSize: "12px", marginTop: "10px", fontWeight: 600 }}>
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
export default function Payouts() {
  const t = useThemeStyles();
  const { userId, role } = useAuth();
  const navigate = useNavigate();

  // ── state ──────────────────────────────────────────────────────────────────
  const [loading, setLoading]           = useState(true);
  const [fetchError, setFetchError]     = useState("");
  const [balance, setBalance]           = useState(0);
  const [totalEarned, setTotalEarned]   = useState(0);
  const [pendingAmt, setPendingAmt]     = useState(0);
  const [totalAuctions, setTotalAuctions] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [banks, setBanks]               = useState([]);
  const [filter, setFilter]             = useState("All");
  const [search, setSearch]             = useState("");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showAddBank, setShowAddBank]   = useState(false);
  const [user, setUser]                 = useState(null);

  // ── redirect if not business ───────────────────────────────────────────────
  useEffect(() => {
    if (!userId) { navigate("/Login"); return; }
    if (role && role !== "business") { navigate("/"); return; }
  }, [userId, role]);

  // ── fetch payout data ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setFetchError("");

    Promise.all([
      fetch(`${API}/payout/seller/${userId}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/payout/banks/${userId}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/user/getuser/${userId}`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([payoutData, bankData, userData]) => {
      const userInfo = userData?.data || null;
      if (userInfo) setUser(userInfo);

      if (payoutData) {
        setBalance(payoutData.availableBalance ?? 0);
        setTotalEarned(payoutData.totalEarned ?? 0);
        setPendingAmt(payoutData.pendingAmount ?? 0);
        setTotalAuctions(payoutData.totalAuctions ?? 0);
        setTransactions(dedupeTransactions(Array.isArray(payoutData.transactions) ? payoutData.transactions : []));
      } else {
        setBalance(124830);
        setTotalEarned(842560);
        setPendingAmt(18400);
        setTotalAuctions(38);
        setTransactions(dedupeTransactions(MOCK_TRANSACTIONS));
      }

      // Priority: payout wallet banks -> user.bank profile
      const payoutBanks = Array.isArray(bankData?.banks) ? bankData.banks : [];
      const profileBanks = getProfileBanksFromUser(userInfo);
      if (payoutBanks.length > 0 || profileBanks.length > 0) {
        setBanks(dedupeBanks([...payoutBanks, ...profileBanks]));
      } else {
        setBanks([]);
      }
    }).catch(() => {
      setFetchError("Could not load payout data.");
      setBalance(124830);
      setTotalEarned(842560);
      setPendingAmt(18400);
      setTotalAuctions(38);
      setTransactions(dedupeTransactions(MOCK_TRANSACTIONS));
      setBanks(dedupeBanks(MOCK_BANKS));
    }).finally(() => setLoading(false));
  }, [userId]);

  // ── bank actions (fully wired to API) ────────────────────────────────────
  const handleRemoveBank = async (id) => {
    // Optimistic update
    setBanks(prev => dedupeBanks(prev.filter(b => getBankUiId(b) !== id)));
    try {
      await fetch(`${API}/payout/banks/${userId}/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("removeBank failed:", err);
    }
  };

  const handleSetDefault = async (id) => {
    // Optimistic update
    setBanks(prev => dedupeBanks(prev.map(b => ({ ...b, isDefault: getBankUiId(b) === id }))));
    try {
      await fetch(`${API}/payout/banks/${userId}/${id}/default`, { method: "PATCH" });
    } catch (err) {
      console.error("setDefault failed:", err);
    }
  };

  const handleAddBank = async (bank) => {
    try {
      const res = await fetch(`${API}/payout/banks/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoText:    bank.logoText,
          name:        bank.name,
          accountNum:  bank.accountNum,
          ifsc:        bank.ifsc || "",
          accountType: bank.accountType || "Savings",
          isDefault:   bank.isDefault || false,
        }),
      });
      if (!res.ok) throw new Error("add bank failed");
      const json = await res.json();
      setBanks(dedupeBanks(json.banks || []));
    } catch (err) {
      console.error("addBank failed:", err);
    }
  };

  const ensurePayoutBankId = async (bank) => {
    if (!bank) return null;
    const existingId = bank?.bankId || bank?._id || null;
    if (existingId) return String(existingId);
    if (!bank?.isProfileFallback) return null;

    try {
      const accountNum = String(bank.accountNum || "").trim();
      const isUpi = accountNum.includes("@");
      const res = await fetch(`${API}/payout/banks/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoText: bank.logoText || (isUpi ? "UPI" : String(bank.name || "").slice(0, 4).toUpperCase()),
          name: bank.name,
          accountNum,
          ifsc: bank.ifsc || "",
          accountType: bank.accountType || (isUpi ? "UPI" : "Savings"),
          isDefault: !!bank.isDefault,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Failed to link profile bank into payout wallet:", json.message || res.status);
        return null;
      }

      const updatedBanks = dedupeBanks(Array.isArray(json.banks) ? json.banks : []);
      setBanks(updatedBanks);
      const normalizedTargetName = String(bank.name || "").trim().toLowerCase();
      const normalizedTargetAccount = String(accountNum).trim().toLowerCase();
      const matched = updatedBanks.find((b) => {
        const sameName = String(b.name || "").trim().toLowerCase() === normalizedTargetName;
        const sameAccount = String(b.accountNum || "").trim().toLowerCase() === normalizedTargetAccount;
        return sameName && sameAccount;
      }) || updatedBanks.find((b) => b.isDefault) || updatedBanks[0];
      return matched ? String(matched._id || matched.bankId || matched.id || "") : null;
    } catch (err) {
      console.error("Failed to link profile bank into payout wallet:", err);
      return null;
    }
  };

  // ?? withdraw (wired to API) ????????????????????????????????????????????????
  const handleWithdraw = async ({ amount, bankId: requestedBankId }) => {
    const selectedBank = banks.find((b, index) => getBankUiId(b, `idx-${index}`) === String(requestedBankId || ""));
    const fallbackBank = banks.find(b => b.isDefault);
    const bank = selectedBank || fallbackBank;
    const bankId = await ensurePayoutBankId(bank);

    if (!bankId) {
      console.error("Withdraw failed: no linked payout bank selected");
      return { ok: false, message: "Please select a linked bank account." };
    }

    try {
      const payload = { amount, bankId };

      const res = await fetch(`${API}/payout/withdraw/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Withdraw failed:", json.message || res.status);
        return { ok: false, message: json.message || "Withdrawal failed." };
      }

      if (typeof json.availableBalance === "number") {
        setBalance(json.availableBalance);
      }
      if (typeof json.pendingAmount === "number") {
        setPendingAmt(json.pendingAmount);
      }
      if (json.transaction) {
        setTransactions(prev => {
          const newId = String(json.transaction._id || json.transaction.id || "");
          if (newId && prev.some(tx => String(tx._id || tx.id || "") === newId)) return prev;
          return dedupeTransactions([json.transaction, ...prev]);
        });
      }

      const txStatus = String(json.transaction?.status || "").toLowerCase();
      const settledNow = txStatus === "paid";

      return {
        ok: true,
        title: settledNow ? "Withdrawal Completed" : "Withdrawal Initiated",
        message:
          json.message ||
          (settledNow
            ? `${formatINR(amount)} was sent successfully via Razorpay.`
            : `${formatINR(amount)} is queued in Razorpay and will settle shortly.`),
      };
    } catch (err) {
      console.error("Withdraw error:", err);
      return { ok: false, message: "Network error while processing withdrawal." };
    }
  };

  // ?? filtered transactions ??????????????????????????????????????????????????
  const filtered = transactions
    .filter(tx => filter === "All" || tx.status === filter)
    .filter(tx => tx.auctionTitle?.toLowerCase().includes(search.toLowerCase()) || tx.payoutId?.toLowerCase().includes(search.toLowerCase()));

  // ── loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ background: t.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "inline-flex", color: t.textSec, marginBottom: "16px", animation: "pulse 1s infinite" }}>{Icons.Clock}</div>
        <div style={{ color: t.textSec, fontSize: "16px", fontWeight: 600 }}>Loading payouts...</div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );

  // ── summary numbers ────────────────────────────────────────────────────────
  const commission = Math.round(totalEarned * 0.05);
  const netEarned  = totalEarned - commission;

  return (
    <div style={{ background: t.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", transition: "background 0.25s" }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ background: t.bgSec, borderBottom: `1px solid ${t.border}`, padding: "40px 40px 32px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
              {/* Avatar */}
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar"
                  style={{ width: "56px", height: "56px", borderRadius: "14px", objectFit: "cover", border: "2px solid rgba(56,189,248,.3)", flexShrink: 0 }} />
              ) : (
                <div style={{ width: "56px", height: "56px", borderRadius: "14px", flexShrink: 0,
                  background: "linear-gradient(135deg,rgba(56,189,248,.2),rgba(99,102,241,.2))",
                  border: "2px solid rgba(56,189,248,.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#38bdf8", fontSize: "22px", fontWeight: 900 }}>
                  {(user?.businessName || user?.firstName || "S")[0].toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ color: "#38bdf8", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "4px" }}>Seller Dashboard</div>
                <h1 style={{ color: t.textPri, fontSize: "32px", fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
                  {user?.businessName || (user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Payouts")}
                </h1>
                <p style={{ color: t.textMut, marginTop: "4px", fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                  {user?.email && <span>Email: {user.email}</span>}
                  {user?.phone && <span>Phone: {user.phone}</span>}
                  {!user?.email && <span>{transactions.length} transactions | {banks.length} linked account{banks.length !== 1 ? "s" : ""}</span>}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                onClick={() => setShowWithdraw(true)}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 22px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#38bdf8,#6366f1)", color: "white", fontWeight: 700, fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 14px rgba(56,189,248,.3)" }}
              >
                {Icons.Wallet} Withdraw Funds
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 40px" }}>

        {fetchError && (
          <div style={{ background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.25)", borderRadius: "12px", padding: "12px 16px", marginBottom: "24px", display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ color: "#fbbf24" }}>{Icons.Alert}</span>
            <span style={{ color: "#fbbf24", fontSize: "13px", fontWeight: 600 }}>Using demo data - {fetchError}</span>
          </div>
        )}

        {/* ── STAT CARDS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "16px", marginBottom: "32px" }}>
          <StatCard icon={Icons.Wallet}      label="Available Balance" value={formatINR(balance)}      sub="Ready to withdraw"         accentColor="#38bdf8" subColor="#38bdf8" t={t} />
          <StatCard icon={Icons.TrendUp}     label="Total Earned"      value={formatINR(totalEarned)}  sub="+11.2% vs last month"     accentColor="#34d399" subColor="#34d399" t={t} />
          <StatCard icon={Icons.Clock}       label="Pending"           value={formatINR(pendingAmt)}   sub={`${transactions.filter(x=>x.status==="Pending").length} settling`} accentColor="#fbbf24" subColor="#fbbf24" t={t} />
          <StatCard icon={Icons.CheckCircle} label="Auctions Sold"     value={totalAuctions}           sub="This month | all time"      accentColor="#a78bfa" t={t} />
        </div>

        {/* ── TWO-COLUMN LAYOUT ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>

          {/* ── LEFT: Balance card + Transactions ── */}
          <div>

            {/* Balance hero card */}
            <div style={{
              background: "linear-gradient(135deg,#0f172a,#1e1b4b)",
              borderRadius: "20px",
              padding: "28px 32px",
              marginBottom: "24px",
              border: "1px solid rgba(99,102,241,.3)",
              boxShadow: "0 8px 32px rgba(99,102,241,.15)",
              position: "relative", overflow: "hidden",
            }}>
              {/* decorative glow */}
              <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle,rgba(56,189,248,.15),transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: "-40px", left: "40px", width: "150px", height: "150px", borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.1),transparent 70%)", pointerEvents: "none" }} />

              <div style={{ position: "relative" }}>
                <div style={{ color: "rgba(255,255,255,.5)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "6px" }}>Available to Withdraw</div>
                <div style={{ color: "#ffffff", fontSize: "42px", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "4px" }}>{formatINR(balance)}</div>
                <div style={{ color: "rgba(255,255,255,.4)", fontSize: "13px", marginBottom: "22px" }}>Withdrawals are auto-settled in about 1-3 minutes</div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button onClick={() => setShowWithdraw(true)} style={{ padding: "11px 22px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#38bdf8,#6366f1)", color: "white", fontWeight: 700, fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 14px rgba(56,189,248,.4)" }}>
                    Withdraw Now
                  </button>
                  <button onClick={() => setShowAddBank(true)} style={{ padding: "11px 18px", borderRadius: "10px", border: "1px solid rgba(255,255,255,.2)", background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.85)", fontWeight: 700, fontSize: "14px", cursor: "pointer", transition: "all .15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.12)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.06)"}
                  >+ Link Bank</button>
                </div>

                {/* mini earnings breakdown */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginTop: "22px", paddingTop: "22px", borderTop: "1px solid rgba(255,255,255,.08)" }}>
                  {[
                    ["Gross (Mar)", formatINR(totalEarned), "rgba(255,255,255,.85)"],
                    ["Commission", `-${formatINR(commission)}`, "#f43f5e"],
                    ["Net", formatINR(netEarned), "#34d399"],
                  ].map(([label, val, col]) => (
                    <div key={label}>
                      <div style={{ color: "rgba(255,255,255,.4)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "4px" }}>{label}</div>
                      <div style={{ color: col, fontSize: "16px", fontWeight: 800 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── TRANSACTIONS ── */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ color: t.textPri, fontSize: "20px", fontWeight: 900, margin: 0 }}>Transaction History</h2>
                <div style={{ color: t.textMut, fontSize: "13px" }}>{filtered.length} of {transactions.length}</div>
              </div>

              {/* Filter + search */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px", alignItems: "center" }}>
                {/* Tab pills */}
                <div style={{ display: "flex", gap: "6px", background: t.bgCard, borderRadius: "50px", padding: "4px", border: `1px solid ${t.border}` }}>
                  {["All", "Paid", "Pending", "Processing", "Failed"].map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                      padding: "6px 14px", borderRadius: "50px", border: "none",
                      background: filter === f ? "linear-gradient(135deg,#38bdf8,#6366f1)" : "transparent",
                      color: filter === f ? "white" : t.textMut,
                      fontWeight: 700, fontSize: "12px", cursor: "pointer", transition: "all .15s",
                    }}>{f} {filter === f && `(${filtered.length})`}</button>
                  ))}
                </div>
              {/* Search */}
              <div style={{ position: "relative", flex: 1, minWidth: "180px" }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search auction or payout ID..."
                  style={{ width: "100%", background: t.bgInput, border: `1px solid ${t.borderMd}`, borderRadius: "10px", padding: "9px 14px", color: t.textPri, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
              </div>
              </div>

              {/* Table */}
              <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "16px", overflow: "hidden", boxShadow: t.shadow }}>
                {/* Header */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 110px 90px 90px", gap: "12px", padding: "12px 20px", borderBottom: `1px solid ${t.border}`, background: t.bg }}>
                  {["Auction", "Date", "Amount", "Status", ""].map((h, i) => (
                    <div key={i} style={{ color: t.textMut, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>{h}</div>
                  ))}
                </div>

                {filtered.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <div style={{ marginBottom: "16px", display: "inline-flex", color: t.textMut }}>{Icons.Receipt}</div>
                    <div style={{ color: t.textSec, fontSize: "16px", fontWeight: 700 }}>No transactions found</div>
                    <div style={{ color: t.textMut, fontSize: "13px", marginTop: "6px" }}>Try a different filter or search term.</div>
                  </div>
                ) : (
                  filtered.map(tx => <TxRow key={tx._id || tx.id || tx.payoutId} tx={tx} t={t} />)
                )}

                {/* Pagination hint */}
                {filtered.length > 0 && (
                  <div style={{ padding: "12px 20px", borderTop: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: t.textMut, fontSize: "12px" }}>Showing {filtered.length} transactions</span>
                    <button style={{ display: "flex", alignItems: "center", gap: "4px", color: "#38bdf8", fontSize: "12px", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>
                      View all {Icons.ChevronRight}
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── RIGHT: Banks + Summary ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Seller Info Card */}
            {user && (
              <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "20px", boxShadow: t.shadow }}>
                <div style={{ color: t.textMut, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "14px" }}>Seller Profile</div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  {user.avatar ? (
                    <img src={user.avatar} alt="avatar" style={{ width: "46px", height: "46px", borderRadius: "12px", objectFit: "cover", border: `1px solid ${t.border}` }} />
                  ) : (
                    <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: "linear-gradient(135deg,rgba(56,189,248,.15),rgba(99,102,241,.15))", border: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#38bdf8", fontSize: "18px", fontWeight: 900, flexShrink: 0 }}>
                      {(user.businessName || user.firstName || "S")[0].toUpperCase()}
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: t.textPri, fontWeight: 800, fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {user.businessName || `${user.firstName || ""} ${user.lastName || ""}`.trim()}
                    </div>
                    <div style={{ color: t.textMut, fontSize: "12px", marginTop: "2px" }}>{user.email}</div>
                  </div>
                </div>
                {[
                  user.phone        && ["Phone",    user.phone],
                  user.businessType && ["Type",     user.businessType],
                  user.category     && ["Category", user.category],
                  user.gst          && ["GST",      user.gst],
                  user.verificationStatus && ["KYC", user.verificationStatus.charAt(0).toUpperCase() + user.verificationStatus.slice(1)],
                ].filter(Boolean).map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: `1px solid ${t.border}` }}>
                    <span style={{ color: t.textMut, fontSize: "12px" }}>{label}</span>
                    <span style={{ color: t.textPri, fontSize: "12px", fontWeight: 700 }}>{val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Earnings summary */}
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "20px", boxShadow: t.shadow }}>
              <div style={{ color: t.textMut, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "4px" }}>Monthly Summary</div>
              <div style={{ color: t.textPri, fontWeight: 800, fontSize: "15px", marginBottom: "16px" }}>March 2026</div>

              {[
                ["Auctions closed",   "14",                null],
                ["Gross earnings",    formatINR(totalEarned), null],
                ["Platform fee (5%)", `-${formatINR(commission)}`, "#f43f5e"],
                ["Processing fees",   `-${formatINR(546)}`, "#f43f5e"],
                ["TDS (1%)",          `-${formatINR(Math.round(totalEarned * 0.01))}`, "#f43f5e"],
                ["Withdrawn",         `-${formatINR(totalEarned - balance - pendingAmt)}`, t.textMut],
              ].map(([label, val, col]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${t.border}` }}>
                  <span style={{ color: t.textSec, fontSize: "13px" }}>{label}</span>
                  <span style={{ color: col || t.textPri, fontWeight: 700, fontSize: "13px", fontFamily: "monospace" }}>{val}</span>
                </div>
              ))}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "14px", marginTop: "4px" }}>
                <span style={{ color: t.textPri, fontWeight: 800, fontSize: "14px" }}>Net Available</span>
                <span style={{ color: "#34d399", fontWeight: 900, fontSize: "18px" }}>{formatINR(balance)}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "20px", boxShadow: t.shadow }}>
              <div style={{ color: t.textMut, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "14px" }}>Quick Actions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button onClick={() => setShowWithdraw(true)} style={{ width: "100%", padding: "11px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#38bdf8,#6366f1)", color: "white", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
                  Withdraw {formatINR(balance)}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <FooterComponent />

      {/* ── Modals ── */}
      {showWithdraw && <WithdrawModal balance={balance} banks={banks} onClose={() => setShowWithdraw(false)} onConfirm={handleWithdraw} t={t} />}
      {showAddBank  && <AddBankModal  onClose={() => setShowAddBank(false)} onAdd={handleAddBank} t={t} />}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes cardIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        input::placeholder { color: ${t.textFaint}; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
        select { appearance: none; }
      `}</style>
    </div>
  );
}

// ── Mock data (used when API is unavailable) ──────────────────────────────────
const MOCK_TRANSACTIONS = [
  { id: 1, payoutId: "PYT-9941", auctionTitle: "Antique Brass Diya Set",        date: "2026-03-29", amount: 28500,  method: "Bank Transfer", status: "Paid" },
  { id: 2, payoutId: "PYT-9938", auctionTitle: "Raja Ravi Varma Print",          date: "2026-03-26", amount: 14200,  method: "UPI",           status: "Paid" },
  { id: 3, payoutId: "PYT-9934", auctionTitle: "Kundan Polki Necklace",          date: "2026-03-24", amount: 62000,  method: "Bank Transfer", status: "Processing" },
  { id: 4, payoutId: "PYT-9929", auctionTitle: "Mughal Manuscript Page",         date: "2026-03-20", amount: 9800,   method: "NEFT",           status: "Pending" },
  { id: 5, payoutId: "PYT-9921", auctionTitle: "Kerala Tholpavakoothu Puppet",   date: "2026-03-16", amount: 5500,   method: "Bank Transfer", status: "Failed" },
  { id: 6, payoutId: "PYT-9914", auctionTitle: "Silver Filigree Paan Box",       date: "2026-03-12", amount: 11750,  method: "UPI",           status: "Paid" },
  { id: 7, payoutId: "PYT-9907", auctionTitle: "Antique Tabla Pair (1940s)",     date: "2026-03-08", amount: 32100,  method: "Bank Transfer", status: "Paid" },
  { id: 8, payoutId: "PYT-9899", auctionTitle: "Madhubani Painting (Original)",  date: "2026-03-04", amount: 7800,   method: "UPI",           status: "Paid" },
  { id: 9, payoutId: "PYT-9888", auctionTitle: "Vintage Banarasi Saree (1960s)", date: "2026-02-28", amount: 19400,  method: "Bank Transfer", status: "Paid" },
];

const MOCK_BANKS = [
  { id: 1, logoText: "SBI",  name: "State Bank of India", accountNum: "XXXX XXXX 7823", isDefault: true  },
  { id: 2, logoText: "HDFC", name: "HDFC Bank",           accountNum: "XXXX XXXX 3391", isDefault: false },
  { id: 3, logoText: "UPI",  name: "PhonePe UPI",         accountNum: "rahul@ybl",       isDefault: false },
];
