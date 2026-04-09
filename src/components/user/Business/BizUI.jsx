import React from "react";
import { styles } from "./bizConstants";

const API_BASE = `${import.meta.env.VITE_API_URL}/user`;

export async function updateUserAPI(userId, data) {
  try {
    const res = await fetch(`${API_BASE}/updateuser/${userId}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Update failed");
    return { success: true, data: result.data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Status badge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    live:      ["rgba(244,63,94,.15)",   "#f43f5e", "🔴 Live"],
    ended:     ["rgba(100,116,139,.15)", "#64748b", "✓ Ended"],
    scheduled: ["rgba(245,158,11,.15)",  "#f59e0b", "📅 Scheduled"],
  };
  const [bg, col, label] = map[status] || map.ended;
  return (
    <span style={{ display: "inline-block", marginTop: "4px", padding: "3px 9px", borderRadius: "50px", fontSize: "10px", fontWeight: 700, background: bg, color: col }}>
      {label}
    </span>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({ label, defaultOn, on: controlledOn, onChange }) {
  const [localOn, setLocalOn] = React.useState(defaultOn);
  const on = controlledOn !== undefined ? controlledOn : localOn;
  const handleClick = () => {
    if (onChange) onChange(!on);
    else setLocalOn(o => !o);
  };
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: "var(--text-primary)", fontSize: "14px" }}>{label}</span>
      <div onClick={handleClick} style={{ width: "38px", height: "22px", borderRadius: "11px", background: on ? "#6366f1" : "var(--border-input)", position: "relative", cursor: "pointer", transition: "background .2s" }}>
        <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "white", position: "absolute", top: "3px", left: on ? "19px" : "3px", transition: "left .2s" }} />
      </div>
    </div>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────────
export function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center", padding: "6px 0" }}>
      <span style={{ fontSize: "14px", width: "18px", textAlign: "center" }}>{icon}</span>
      <span style={{ color: "var(--text-muted)", fontSize: "12px", width: "120px", flexShrink: 0 }}>{label}</span>
      <span style={{ color: "var(--text-primary)", fontSize: "13px", wordBreak: "break-all", flex: 1 }}>{value || "—"}</span>
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
export function SectionCard({ title, rows, onEdit, children }) {
  return (
    <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "16px" }}>{title}</div>
        {onEdit && (
          <button onClick={onEdit} style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
            ✏️ Edit
          </button>
        )}
      </div>
      {rows && rows.map(([icon, label, val]) => (
        <InfoRow key={label} icon={icon} label={label} value={val} />
      ))}
      {children}
    </div>
  );
}

// ── Settings row ──────────────────────────────────────────────────────────────
export function SettingsRow({ label, value, locked }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: "var(--text-muted)", fontSize: "13px", width: "150px", flexShrink: 0 }}>{label}</span>
      <span style={{ color: "var(--text-primary)", fontSize: "13px", flex: 1 }}>{value || "—"}</span>
      {locked && <span style={{ fontSize: "13px" }}>🔒</span>}
    </div>
  );
}

// ── Settings section ──────────────────────────────────────────────────────────
export function SettingsSection({ title, rows, onEdit }) {
  return (
    <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "16px" }}>{title}</div>
        <button onClick={onEdit} style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
          ✏️ Edit
        </button>
      </div>
      {rows.map(({ label, value }) => (
        <SettingsRow key={label} label={label} value={value} />
      ))}
    </div>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────
export function EditModal({ title, fields, values, onSave, onClose, userId }) {
  const [draft,   setDraft]   = React.useState({ ...values });
  const [loading, setLoading] = React.useState(false);
  const [toast,   setToast]   = React.useState(null);

  const handleChange = (key, val) => setDraft((d) => ({ ...d, [key]: val }));

  const handleSave = async () => {
    const { businessName, _email, ...apiPayload } = draft;
    const { line1, line2, city, state, pincode, country, ...rest1 } = apiPayload;
    const withAddress = (line1 !== undefined || city !== undefined)
      ? { ...rest1, address: { line1, line2, city, state, pincode, country } }
      : apiPayload;
    const { accountHolder, bankName, accountNumber, ifsc, upi, ...rest2 } = withAddress;
    const finalPayload = (accountHolder !== undefined || bankName !== undefined)
      ? { ...rest2, bank: { accountHolder, bankName, accountNumber, ifsc, upi } }
      : withAddress;

    setLoading(true);
    setToast(null);
    let apiSuccess = false;

    if (userId) {
      const result = await updateUserAPI(userId, finalPayload);
      if (result.success) {
        apiSuccess = true;
        setToast({ type: "success", msg: "Saved successfully!" });
      } else {
        setToast({ type: "error", msg: result.error || "Update failed" });
      }
    } else {
      setToast({ type: "error", msg: "User ID missing — changes saved locally only." });
    }

    setLoading(false);
    onSave(draft);
    if (apiSuccess) setTimeout(onClose, 800);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--bg-secondary)", borderRadius: "20px", width: "100%", maxWidth: "480px", boxShadow: "0 24px 64px rgba(0,0,0,0.3)", border: "1px solid var(--border)", animation: "modalIn .2s ease" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "17px" }}>{title}</span>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "18px", cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{ margin: "12px 24px 0", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, background: toast.type === "success" ? "rgba(52,211,153,.15)" : "rgba(244,63,94,.15)", color: toast.type === "success" ? "#10b981" : "#f43f5e", border: `1px solid ${toast.type === "success" ? "rgba(52,211,153,.3)" : "rgba(244,63,94,.3)"}` }}>
            {toast.type === "success" ? "✅ " : "❌ "}{toast.msg}
          </div>
        )}

        {/* Fields */}
        <div style={{ padding: "20px 24px", maxHeight: "60vh", overflowY: "auto" }}>
          {fields.map(({ key, label, type = "text", locked }) => (
            <div key={key} style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {label}
                {locked && <span style={{ marginLeft: "8px", background: "rgba(99,102,241,.1)", color: "#6366f1", fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "10px" }}>🔒 From Login</span>}
              </label>
              <input
                type={type}
                value={draft[key] ?? ""}
                onChange={(e) => !locked && handleChange(key, e.target.value)}
                disabled={locked}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: locked ? "1px solid var(--border)" : "1px solid #6366f1", background: locked ? "var(--bg-input)" : "var(--bg-card)", color: "var(--text-primary)", fontSize: "14px", outline: "none", boxSizing: "border-box", opacity: locked ? 0.6 : 1 }}
              />
              {locked && <p style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "4px" }}>This field is tied to your account login and cannot be changed here.</p>}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
          <button onClick={onClose} disabled={loading} style={{ padding: "10px 20px", borderRadius: "10px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", fontSize: "14px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "⏳ Saving..." : "💾 Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

