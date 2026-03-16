import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CATEGORIES = ["Electronics", "Vehicles", "Luxury", "Furniture", "Collectibles", "Real Estate", "Industrial", "Art", "Sports", "Books"];
const CONDITIONS = ["New", "Used – Like New", "Used – Excellent", "Used – Good", "Vintage"];
const DURATIONS  = [
  { label: "1 Hour",   value: 60 },
  { label: "6 Hours",  value: 360 },
  { label: "12 Hours", value: 720 },
  { label: "1 Day",    value: 1440 },
  { label: "3 Days",   value: 4320 },
  { label: "7 Days",   value: 10080 },
];

const STEP_LABELS = ["Item Details", "Pricing & Duration", "Images & Preview", "Review & Publish"];

export default function AddAuction() {
  const navigate = useNavigate();
  const [step,      setStep]      = useState(0);
  const [published, setPublished] = useState(false);

  const [form, setForm] = useState({
    title: "", category: "", condition: "", location: "",
    desc: "", startBid: "", reservePrice: "", duration: 1440,
    incrementMin: 100, images: [], tags: "",
  });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const progress = [
    form.title && form.category && form.condition && form.location && form.desc,
    form.startBid && form.duration,
    true,
    true,
  ];

  const canNext = progress[step];

  const handlePublish = () => {
    setPublished(true);
    setTimeout(() => navigate("/my-listings"), 2200);
  };

  if (published) {
    return (
      <div style={{ background: "#080e1a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", animation: "popIn .5s cubic-bezier(.34,1.56,.64,1)" }}>
          <div style={{ fontSize: "72px", marginBottom: "20px" }}>🎉</div>
          <h1 style={{ color: "white", fontSize: "32px", fontWeight: 900, marginBottom: "10px" }}>Auction Published!</h1>
          <p style={{ color: "#64748b", fontSize: "16px", marginBottom: "8px" }}>"{form.title}" is now live.</p>
          <p style={{ color: "#38bdf8", fontSize: "14px" }}>Redirecting to your listings…</p>
        </div>
        <style>{`@keyframes popIn { from{opacity:0;transform:scale(.6)} to{opacity:1;transform:scale(1)} }`}</style>
      </div>
    );
  }

  return (
    <div style={{ background: "#080e1a", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ background: "linear-gradient(135deg,#060d1a,#0f172a)", borderBottom: "1px solid rgba(255,255,255,.06)", padding: "32px 40px" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <div style={{ color: "#38bdf8", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "6px" }}>🏢 Business Dashboard</div>
          <h1 style={{ color: "white", fontSize: "30px", fontWeight: 900, margin: "0 0 20px", letterSpacing: "-.02em" }}>Create New Auction</h1>

          {/* Stepper */}
          <div style={{ display: "flex", gap: "0", position: "relative" }}>
            {STEP_LABELS.map((label, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                {/* connector line */}
                {i < STEP_LABELS.length - 1 && (
                  <div style={{ position: "absolute", top: "15px", left: "50%", width: "100%", height: "2px", background: i < step ? "#38bdf8" : "rgba(255,255,255,.1)", transition: "background .3s" }} />
                )}
                <div style={{
                  width: "30px", height: "30px", borderRadius: "50%",
                  background: i < step ? "#38bdf8" : i === step ? "linear-gradient(135deg,#38bdf8,#6366f1)" : "rgba(255,255,255,.06)",
                  border: i <= step ? "none" : "1px solid rgba(255,255,255,.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: i <= step ? "white" : "#475569", fontSize: "12px", fontWeight: 700,
                  zIndex: 1, transition: "all .3s",
                }}>{i < step ? "✓" : i + 1}</div>
                <div style={{ color: i === step ? "#38bdf8" : i < step ? "#64748b" : "#475569", fontSize: "11px", fontWeight: 600, marginTop: "6px", textAlign: "center", whiteSpace: "nowrap" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FORM BODY ── */}
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "40px" }}>

        {/* STEP 0 — Item Details */}
        {step === 0 && (
          <div style={{ animation: "slideIn .3s ease" }}>
            <SectionTitle title="Item Details" sub="Tell buyers what you're selling" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <FormField label="Auction Title *" span={2}>
                <input value={form.title} onChange={set("title")} placeholder="e.g. Apple iPhone 15 Pro Max 256GB" style={inp} />
              </FormField>
              <FormField label="Category *">
                <select value={form.category} onChange={set("category")} style={inp}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Condition *">
                <select value={form.condition} onChange={set("condition")} style={inp}>
                  <option value="">Select condition</option>
                  {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Location *">
                <input value={form.location} onChange={set("location")} placeholder="e.g. Mumbai, Maharashtra" style={inp} />
              </FormField>
              <FormField label="Tags (comma separated)">
                <input value={form.tags} onChange={set("tags")} placeholder="e.g. apple, smartphone, sealed" style={inp} />
              </FormField>
              <FormField label="Description *" span={2}>
                <textarea value={form.desc} onChange={set("desc")} placeholder="Describe the item in detail — condition, age, accessories included, warranty..." rows={5} style={{ ...inp, resize: "vertical", minHeight: "110px" }} />
              </FormField>
            </div>
          </div>
        )}

        {/* STEP 1 — Pricing */}
        {step === 1 && (
          <div style={{ animation: "slideIn .3s ease" }}>
            <SectionTitle title="Pricing & Duration" sub="Set your starting bid and how long the auction runs" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <FormField label="Starting Bid (₹) *">
                <div style={{ display: "flex", border: "1px solid rgba(255,255,255,.12)", borderRadius: "10px", overflow: "hidden" }}>
                  <span style={{ padding: "10px 14px", background: "rgba(56,189,248,.08)", color: "#38bdf8", fontWeight: 700 }}>₹</span>
                  <input type="number" value={form.startBid} onChange={set("startBid")} placeholder="0" style={{ ...inp, border: "none", borderRadius: "0", flex: 1 }} />
                </div>
              </FormField>
              <FormField label="Reserve Price (₹) — optional">
                <div style={{ display: "flex", border: "1px solid rgba(255,255,255,.12)", borderRadius: "10px", overflow: "hidden" }}>
                  <span style={{ padding: "10px 14px", background: "rgba(255,255,255,.04)", color: "#64748b", fontWeight: 700 }}>₹</span>
                  <input type="number" value={form.reservePrice} onChange={set("reservePrice")} placeholder="Minimum to sell" style={{ ...inp, border: "none", borderRadius: "0", flex: 1 }} />
                </div>
              </FormField>
              <FormField label="Minimum Bid Increment (₹)">
                <input type="number" value={form.incrementMin} onChange={set("incrementMin")} style={inp} />
              </FormField>
              <FormField label="Auction Duration *">
                <select value={form.duration} onChange={set("duration")} style={inp}>
                  {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </FormField>
            </div>

            {/* Pricing preview */}
            {form.startBid && (
              <div style={{ marginTop: "24px", background: "rgba(56,189,248,.05)", border: "1px solid rgba(56,189,248,.15)", borderRadius: "14px", padding: "20px" }}>
                <div style={{ color: "#38bdf8", fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>💡 Pricing Preview</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
                  {[
                    ["Starting Bid", "₹" + Number(form.startBid).toLocaleString()],
                    ["Platform Fee (5%)", "₹" + Math.round(form.startBid * 0.05).toLocaleString()],
                    ["You Receive", "₹" + Math.round(form.startBid * 0.95).toLocaleString()],
                  ].map(([l, v]) => (
                    <div key={l} style={{ background: "rgba(255,255,255,.04)", borderRadius: "10px", padding: "12px" }}>
                      <div style={{ color: "#64748b", fontSize: "11px", marginBottom: "4px" }}>{l}</div>
                      <div style={{ color: "white", fontSize: "16px", fontWeight: 700 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2 — Images */}
        {step === 2 && (
          <div style={{ animation: "slideIn .3s ease" }}>
            <SectionTitle title="Images" sub="High-quality images get more bids" />
            <div style={{
              border: "2px dashed rgba(56,189,248,.25)", borderRadius: "16px",
              padding: "48px", textAlign: "center", cursor: "pointer",
              background: "rgba(56,189,248,.03)", transition: "all .2s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(56,189,248,.5)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(56,189,248,.25)"}
            >
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📷</div>
              <div style={{ color: "white", fontWeight: 700, fontSize: "16px", marginBottom: "8px" }}>Drag & drop images here</div>
              <div style={{ color: "#64748b", fontSize: "13px", marginBottom: "16px" }}>PNG, JPG, WEBP — max 10MB each · Up to 8 images</div>
              <button style={{ padding: "10px 24px", background: "linear-gradient(135deg,#38bdf8,#6366f1)", border: "none", borderRadius: "10px", color: "white", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}>Choose Files</button>
            </div>

            {/* Preview card */}
            {form.title && (
              <div style={{ marginTop: "28px" }}>
                <div style={{ color: "#64748b", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "14px" }}>Listing Preview</div>
                <div style={{ background: "linear-gradient(145deg,#1e293b,#0f172a)", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,.07)", maxWidth: "280px" }}>
                  <div style={{ height: "160px", background: "rgba(56,189,248,.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px" }}>🖼️</div>
                  <div style={{ padding: "16px" }}>
                    <div style={{ color: "#64748b", fontSize: "10px", marginBottom: "4px" }}>{form.category}</div>
                    <div style={{ color: "white", fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>{form.title}</div>
                    <div style={{ color: "#38bdf8", fontSize: "18px", fontWeight: 800 }}>₹{Number(form.startBid || 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3 — Review */}
        {step === 3 && (
          <div style={{ animation: "slideIn .3s ease" }}>
            <SectionTitle title="Review & Publish" sub="Check everything before going live" />
            <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "16px", overflow: "hidden" }}>
              {[
                ["Title",       form.title      || "—"],
                ["Category",    form.category   || "—"],
                ["Condition",   form.condition  || "—"],
                ["Location",    form.location   || "—"],
                ["Starting Bid","₹" + (Number(form.startBid) || 0).toLocaleString()],
                ["Duration",    DURATIONS.find(d => d.value == form.duration)?.label || "—"],
                ["Min Increment","₹" + form.incrementMin],
              ].map(([label, val], i) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "14px 20px", borderBottom: i < 6 ? "1px solid rgba(255,255,255,.06)" : "none" }}>
                  <span style={{ color: "#64748b", fontSize: "14px" }}>{label}</span>
                  <span style={{ color: "white", fontSize: "14px", fontWeight: 600 }}>{val}</span>
                </div>
              ))}
            </div>

            {form.desc && (
              <div style={{ marginTop: "16px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "14px", padding: "16px 20px" }}>
                <div style={{ color: "#64748b", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>DESCRIPTION</div>
                <div style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.7 }}>{form.desc}</div>
              </div>
            )}

            <div style={{ marginTop: "20px", background: "rgba(52,211,153,.05)", border: "1px solid rgba(52,211,153,.2)", borderRadius: "12px", padding: "14px 18px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "18px" }}>ℹ️</span>
              <div style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.6 }}>
                By publishing, you agree to our <span style={{ color: "#38bdf8" }}>Seller Terms</span>. A <b style={{ color: "white" }}>5% platform fee</b> is charged on the final sale price.
              </div>
            </div>
          </div>
        )}

        {/* ── NAV BUTTONS ── */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px" }}>
          <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)} style={{
            padding: "12px 24px", borderRadius: "10px",
            border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)",
            color: "#94a3b8", fontWeight: 600, fontSize: "14px", cursor: "pointer",
          }}>{step === 0 ? "← Cancel" : "← Back"}</button>

          {step < 3 ? (
            <button onClick={() => canNext && setStep(s => s + 1)} style={{
              padding: "12px 32px", borderRadius: "10px", border: "none",
              background: canNext ? "linear-gradient(135deg,#38bdf8,#6366f1)" : "rgba(255,255,255,.08)",
              color: canNext ? "white" : "#475569",
              fontWeight: 700, fontSize: "14px",
              cursor: canNext ? "pointer" : "not-allowed",
              boxShadow: canNext ? "0 4px 14px rgba(56,189,248,.3)" : "none",
            }}>Continue →</button>
          ) : (
            <button onClick={handlePublish} style={{
              padding: "12px 32px", borderRadius: "10px", border: "none",
              background: "linear-gradient(135deg,#34d399,#059669)",
              color: "white", fontWeight: 700, fontSize: "14px", cursor: "pointer",
              boxShadow: "0 4px 14px rgba(52,211,153,.35)",
            }}>🚀 Publish Auction</button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
        select option { background: #0f172a; }
        input::placeholder,textarea::placeholder { color: #475569; }
      `}</style>
    </div>
  );
}

/* ── helpers ── */
const inp = {
  width: "100%", padding: "10px 14px",
  background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)",
  borderRadius: "10px", color: "white", fontSize: "14px", outline: "none",
  boxSizing: "border-box", transition: "border-color .2s",
};

function FormField({ label, children, span }) {
  return (
    <div style={{ gridColumn: span === 2 ? "1 / -1" : "auto" }}>
      <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: 600, marginBottom: "7px", textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</label>
      {children}
    </div>
  );
}

function SectionTitle({ title, sub }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h2 style={{ color: "white", fontWeight: 800, fontSize: "22px", margin: "0 0 4px" }}>{title}</h2>
      <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>{sub}</p>
    </div>
  );
}
