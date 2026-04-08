import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import { useThemeStyles } from "../../../utils/themeStyles";

// ── Cloudinary config ──────────────────────────────────────────────────────────
const CLOUDINARY_CLOUD_NAME   = "df7qog24u";
const CLOUDINARY_UPLOAD_PRESET = "E-TEST";

const CATEGORIES = ["Electronics","Vehicles","Luxury","Furniture","Collectibles","Real Estate","Industrial","Art","Sports","Books"];
const CONDITIONS = ["New","Used – Like New","Used – Excellent","Used – Good","Vintage"];
const DURATIONS  = [
  { label: "1 Hour",   value: 60   },
  { label: "6 Hours",  value: 360  },
  { label: "12 Hours", value: 720  },
  { label: "1 Day",    value: 1440 },
  { label: "3 Days",   value: 4320 },
  { label: "7 Days",   value: 10080},
];

const STEP_LABELS = ["Item Details", "Pricing & Duration", "Images", "Review & Save"];

// ── helpers ───────────────────────────────────────────────────────────────────
function parseDurationToMinutes(label) {
  if (!label) return 1440;
  const s = label.toLowerCase();
  if (/1\s*hour/i.test(s))   return 60;
  if (/6\s*hour/i.test(s))   return 360;
  if (/12\s*hour/i.test(s))  return 720;
  if (/3\s*day/i.test(s))    return 4320;
  if (/7\s*day/i.test(s))    return 10080;
  return 1440;
}

export default function EditAuction() {
  const navigate   = useNavigate();
  const { id }     = useParams();
  const t          = useThemeStyles();
  const { userId } = useAuth();

  // ── page state ───────────────────────────────────────────────────────────────
  const [step,      setStep]      = useState(0);
  const [saved,     setSaved]     = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [fetching,  setFetching]  = useState(true);
  const [fetchErr,  setFetchErr]  = useState("");
  const [apiError,  setApiError]  = useState("");

  // ── image state ──────────────────────────────────────────────────────────────
  // Each entry: { id, preview, url, public_id, uploading, error, progress }
  const [images,   setImages]   = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // ── form state (pre-filled after fetch) ──────────────────────────────────────
  const [form, setForm] = useState({
    title: "", category: "", condition: "", location: "",
    desc: "", startBid: "", reservePrice: "", duration: 1440,
    incrementMin: 100, tags: "", startDate: "",
  });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  // ── track original images so we can delete removed ones on save ─────────────
  const originalImagesRef = React.useRef([]);  // populated after fetch

  // ── fetch existing auction ────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setFetching(true);
    fetch(`http://localhost:3000/auction/auctions/${id}`)
      .then(r => { if (!r.ok) throw new Error(`Server error: ${r.status}`); return r.json(); })
      .then(data => {
        const a = data.auction ?? data.data ?? data;

        // Parse startDate for datetime-local input
        // MUST use local time — toISOString() gives UTC which makes the input show wrong time
        const toLocalDatetimeStr = (d) => {
          const dt = new Date(d);
          const pad = n => String(n).padStart(2, "0");
          return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
        };
        const rawStart = a.startDate ?? a.createdAt ?? null;
        const startDateLocal = rawStart
          ? toLocalDatetimeStr(rawStart)
          : toLocalDatetimeStr(new Date());

        // Resolve duration minutes
        const durMins = a.durationMinutes ?? parseDurationToMinutes(a.duration);

        setForm({
          title:       a.title        || "",
          category:    a.category     || "",
          condition:   a.condition    || "",
          location:    a.location     || "",
          desc:        a.description  || "",
          startBid:    String(a.startingBid  ?? a.currentBid ?? 0),
          reservePrice:String(a.reservePrice ?? ""),
          duration:    durMins,
          incrementMin:String(a.minBidIncrement ?? 100),
          tags:        (a.tags || []).join(", "),
          startDate:   startDateLocal,
        });

        // Pre-populate existing images — extract public_id from the Cloudinary URL
        // so removeImage can delete them server-side later.
        if (Array.isArray(a.images) && a.images.length > 0) {
          const existing = a.images.map((img, i) => {
            const url = typeof img === "string" ? img : img.url || img.secure_url || "";
            // Extract public_id from Cloudinary URL:
            // e.g. ".../upload/v1234/folder/abc123.jpg" → "folder/abc123"
            const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
            const public_id = match ? match[1] : null;
            return { id: `existing-${i}`, preview: url, url, public_id, uploading: false, error: null, progress: 100 };
          });
          setImages(existing);
          originalImagesRef.current = existing; // remember originals for save-time cleanup
        }
      })
      .catch(err => setFetchErr(err.message))
      .finally(() => setFetching(false));
  }, [id]);

  // ── Cloudinary uploader ──────────────────────────────────────────────────────
  const uploadToCloudinary = useCallback(async (file, imgId) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setImages(prev => prev.map(i => i.id === imgId ? { ...i, progress: pct } : i));
        }
      };
      const result = await new Promise((resolve, reject) => {
        xhr.onload  = () => xhr.status === 200 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error("Upload failed"));
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(data);
      });
      setImages(prev => prev.map(i =>
        i.id === imgId
          ? { ...i, url: result.secure_url, public_id: result.public_id, uploading: false, progress: 100 }
          : i
      ));
    } catch (err) {
      setImages(prev => prev.map(i => i.id === imgId ? { ...i, uploading: false, error: err.message } : i));
    }
  }, []);

  const addFiles = useCallback((files) => {
    const newImgs = Array.from(files).map(file => {
      const imgId   = `${Date.now()}-${Math.random()}`;
      const preview = URL.createObjectURL(file);
      uploadToCloudinary(file, imgId);
      return { id: imgId, preview, url: null, public_id: null, uploading: true, error: null, progress: 0 };
    });
    setImages(prev => [...prev, ...newImgs]);
  }, [uploadToCloudinary]);

  const removeImage = (imgId) => {
    setImages(prev => {
      const img = prev.find(i => i.id === imgId);
      if (!img) return prev;

      // Revoke blob preview URL to free memory
      if (img.preview && img.preview.startsWith("blob:")) URL.revokeObjectURL(img.preview);

      // Delete from Cloudinary server-side (non-blocking — errors are non-fatal)
      if (img.public_id) {
        fetch("http://localhost:3000/auction/auction/image", {
          method:  "DELETE",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ public_id: img.public_id }),
        }).catch(err => console.warn("⚠️ Could not delete image from Cloudinary:", err.message));
      }

      return prev.filter(i => i.id !== imgId);
    });
  };

  // ── step validation ──────────────────────────────────────────────────────────
  const progress = [
    form.title && form.category && form.condition && form.location && form.desc,
    form.startBid && form.duration,
    true,
    true,
  ];
  const canNext = progress[step];

  // ── shared input style ───────────────────────────────────────────────────────
  const inp = {
    width: "100%", padding: "10px 14px",
    background: t.bgInput, border: `1px solid ${t.borderMd}`,
    borderRadius: "10px", color: t.textPri, fontSize: "14px",
    outline: "none", boxSizing: "border-box", transition: "border-color .2s",
  };


  // ── compute status from start/end ms ─────────────────────────────────────────
  const computeStatus = (startMs, endMs) => {
    const now = Date.now();
    if (endMs   <= now) return "Completed";
    if (startMs <= now) return "Active";
    return "Scheduled";
  };

  // ── save ──────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setApiError("");
    const stillUploading = images.some(i => i.uploading);
    if (stillUploading) { setApiError("Please wait — some images are still uploading."); return; }

    // form.startDate is a datetime-local string like "2026-03-29T10:30"
    // new Date("2026-03-29T10:30") — browser interprets this as LOCAL time ✓
    const startObj = form.startDate ? new Date(form.startDate) : new Date();
    const startMs  = startObj.getTime();
    const endMs    = startMs + Number(form.duration) * 60 * 1000;
    const endObj   = new Date(endMs);
    const status   = computeStatus(startMs, endMs);

    const payload = {
      title:           form.title,
      category:        form.category,
      condition:       form.condition,
      location:        form.location,
      description:     form.desc,
      startingBid:     Number(form.startBid),
      reservePrice:    form.reservePrice ? Number(form.reservePrice) : undefined,
      minBidIncrement: Number(form.incrementMin) || 100,
      duration:        DURATIONS.find(d => d.value == form.duration)?.label || "1 Day",
      durationMinutes: Number(form.duration),
      startDate:       startObj.toISOString(),  // stored as UTC ISO in DB ✓
      endTime:         endObj.toISOString(),     // stored as UTC ISO in DB ✓
      status,
      tags:            form.tags ? form.tags.split(",").map(s => s.trim()).filter(Boolean) : [],
      images:          images.filter(i => i.url).map(i => i.url),
    };

    console.log("📦 Payload being sent:", JSON.stringify({ startDate: payload.startDate, endTime: payload.endTime, status: payload.status }, null, 2));

    setLoading(true);
    try {
      // 1. Save the updated auction
      const res = await fetch(`http://localhost:3000/auction/auction/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      console.log("✅ Server response:", data);
      if (!res.ok) throw new Error(data.message || data.error || `Server error: ${res.status}`);

      // 2. Delete all existing bids for this auction (runs in background — errors are non-fatal)
      try {
        await fetch(`http://localhost:3000/bid/bids/auction/${id}`, { method: "DELETE" });
        console.log("🗑️ Bids cleared for auction", id);
      } catch (bidErr) {
        console.warn("⚠️ Could not clear bids:", bidErr.message);
      }

      // 3. Release all locked deposits back to every bidder (runs in background — non-fatal)
      try {
        await fetch(`http://localhost:3000/wallet/auction/${id}/release-all-bids`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ auctionTitle: form.title }),
        });
        console.log("🔓 Deposits released for auction", id);
      } catch (walletErr) {
        console.warn("⚠️ Could not release deposits:", walletErr.message);
      }

      setSaved(true);
      setTimeout(() => navigate("/Business/Listings"), 2200);
    } catch (err) {
      console.error("❌ Save error:", err);
      setApiError(err.message || "Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── loading / error screens ───────────────────────────────────────────────────
  if (fetching) return (
    <div style={{ background: t.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px", animation: "pulse 1s infinite" }}>⏳</div>
        <div style={{ color: t.textSec, fontSize: "16px", fontWeight: 600 }}>Loading auction…</div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );

  if (fetchErr) return (
    <div style={{ background: t.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "52px", marginBottom: "16px" }}>⚠️</div>
        <div style={{ color: "#f43f5e", fontWeight: 700, fontSize: "16px", marginBottom: "8px" }}>Could not load auction</div>
        <div style={{ color: t.textMut, fontSize: "13px", marginBottom: "20px" }}>{fetchErr}</div>
        <button onClick={() => navigate(-1)} style={{ padding: "10px 24px", borderRadius: "10px", background: "linear-gradient(135deg,#38bdf8,#6366f1)", border: "none", color: "white", fontWeight: 700, cursor: "pointer" }}>← Go Back</button>
      </div>
    </div>
  );

  // ── success screen ────────────────────────────────────────────────────────────
  if (saved) return (
    <div style={{ background: t.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ textAlign: "center", animation: "popIn .5s cubic-bezier(.34,1.56,.64,1)" }}>
        <div style={{ fontSize: "72px", marginBottom: "20px" }}>✅</div>
        <h1 style={{ color: t.textPri, fontSize: "32px", fontWeight: 900, marginBottom: "10px" }}>Auction Updated!</h1>
        <p style={{ color: t.textMut, fontSize: "16px", marginBottom: "8px" }}>"{form.title}" has been saved.</p>
        <p style={{ color: "#38bdf8", fontSize: "14px" }}>Redirecting to your listings…</p>
      </div>
      <style>{`@keyframes popIn{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );

  // ── main render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ background: t.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", transition: "background 0.25s" }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ background: t.bgSec, borderBottom: `1px solid ${t.border}`, padding: "32px 40px" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <div style={{ color: "#38bdf8", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "6px" }}>✏️ Edit Auction</div>
          <h1 style={{ color: t.textPri, fontSize: "30px", fontWeight: 900, margin: "0 0 20px", letterSpacing: "-.02em" }}>
            {form.title || "Edit Auction"}
          </h1>

          {/* Stepper */}
          <div style={{ display: "flex", position: "relative" }}>
            {STEP_LABELS.map((label, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                {i < STEP_LABELS.length - 1 && (
                  <div style={{ position: "absolute", top: "15px", left: "50%", width: "100%", height: "2px", background: i < step ? "#38bdf8" : t.border, transition: "background .3s" }} />
                )}
                <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: i < step ? "#38bdf8" : i === step ? "linear-gradient(135deg,#38bdf8,#6366f1)" : t.bgCard, border: i <= step ? "none" : `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: i <= step ? "white" : t.textFaint, fontSize: "12px", fontWeight: 700, zIndex: 1, transition: "all .3s" }}>
                  {i < step ? "✓" : i + 1}
                </div>
                <div style={{ color: i === step ? "#38bdf8" : i < step ? t.textMut : t.textFaint, fontSize: "11px", fontWeight: 600, marginTop: "6px", textAlign: "center", whiteSpace: "nowrap" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FORM BODY ── */}
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "40px" }}>

        {/* ── STEP 0 — Item Details ── */}
        {step === 0 && (
          <div style={{ animation: "slideIn .3s ease" }}>
            <SectionTitle title="Item Details" sub="Update the details buyers will see" t={t} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <FormField label="Auction Title *" span={2} t={t}>
                <input value={form.title} onChange={set("title")} placeholder="e.g. Apple MacBook Pro M3" style={inp} />
              </FormField>
              <FormField label="Category *" t={t}>
                <select value={form.category} onChange={set("category")} style={{ ...inp, cursor: "pointer" }}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Condition *" t={t}>
                <select value={form.condition} onChange={set("condition")} style={{ ...inp, cursor: "pointer" }}>
                  <option value="">Select condition</option>
                  {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Location *" t={t}>
                <input value={form.location} onChange={set("location")} placeholder="e.g. Mumbai, Maharashtra" style={inp} />
              </FormField>
              <FormField label="Tags (comma separated)" t={t}>
                <input value={form.tags} onChange={set("tags")} placeholder="e.g. apple, laptop, m3" style={inp} />
              </FormField>
              <FormField label="Description *" span={2} t={t}>
                <textarea value={form.desc} onChange={set("desc")} placeholder="Describe the item in detail…" rows={5} style={{ ...inp, resize: "vertical", minHeight: "110px" }} />
              </FormField>
            </div>
          </div>
        )}

        {/* ── STEP 1 — Pricing & Duration ── */}
        {step === 1 && (
          <div style={{ animation: "slideIn .3s ease" }}>
            <SectionTitle title="Pricing & Duration" sub="Update bid settings and auction schedule" t={t} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <FormField label="Starting Bid (₹) *" t={t}>
                <div style={{ display: "flex", border: `1px solid ${t.borderMd}`, borderRadius: "10px", overflow: "hidden" }}>
                  <span style={{ padding: "10px 14px", background: "rgba(56,189,248,.08)", color: "#38bdf8", fontWeight: 700 }}>₹</span>
                  <input type="number" value={form.startBid} onChange={set("startBid")} placeholder="0" style={{ ...inp, border: "none", borderRadius: "0", flex: 1 }} />
                </div>
              </FormField>
              <FormField label="Reserve Price (₹) — optional" t={t}>
                <div style={{ display: "flex", border: `1px solid ${t.borderMd}`, borderRadius: "10px", overflow: "hidden" }}>
                  <span style={{ padding: "10px 14px", background: t.bgCard, color: t.textMut, fontWeight: 700 }}>₹</span>
                  <input type="number" value={form.reservePrice} onChange={set("reservePrice")} placeholder="Minimum to sell" style={{ ...inp, border: "none", borderRadius: "0", flex: 1 }} />
                </div>
              </FormField>
              <FormField label="Minimum Bid Increment (₹)" t={t}>
                <input type="number" value={form.incrementMin} onChange={set("incrementMin")} style={inp} />
              </FormField>
              <FormField label="Auction Duration *" t={t}>
                <select value={form.duration} onChange={set("duration")} style={{ ...inp, cursor: "pointer" }}>
                  {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </FormField>
              <FormField label="Start Date & Time *" span={2} t={t}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={set("startDate")}
                    style={{ ...inp, flex: 1, minWidth: "200px", colorScheme: t.L ? "light" : "dark" }}
                  />
                  {form.startDate && form.duration && (() => {
                    const now = Date.now();
                    const s   = new Date(form.startDate).getTime(); // local-time-aware ✓
                    const e   = s + Number(form.duration) * 60000;
                    const st  = e <= now ? "Completed" : s <= now ? "Active" : "Scheduled";
                    const cfg = {
                      Active:    { color: "#f43f5e", bg: "rgba(244,63,94,.10)",   icon: "🔴" },
                      Scheduled: { color: "#f59e0b", bg: "rgba(245,158,11,.10)",  icon: "📅" },
                      Completed: { color: "#94a3b8", bg: "rgba(100,116,139,.10)", icon: "✓"  },
                    }[st];
                    return (
                      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ background: "rgba(56,189,248,.06)", border: "1px solid rgba(56,189,248,.2)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: t.textSec, whiteSpace: "nowrap" }}>
                          ⏰ Ends: <span style={{ color: "#38bdf8", fontWeight: 700 }}>{new Date(e).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <div style={{ background: cfg.bg, border: `1px solid ${cfg.color}55`, borderRadius: "10px", padding: "10px 14px", fontSize: "13px", fontWeight: 700, color: cfg.color, whiteSpace: "nowrap" }}>
                          {cfg.icon} Status will be: <span style={{ textDecoration: "underline dotted" }}>{st}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </FormField>
            </div>

            {form.startBid && (
              <div style={{ marginTop: "24px", background: t.L ? "rgba(56,189,248,.06)" : "rgba(56,189,248,.05)", border: "1px solid rgba(56,189,248,.15)", borderRadius: "14px", padding: "20px" }}>
                <div style={{ color: "#38bdf8", fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>💡 Pricing Preview</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
                  {[
                    ["Starting Bid",      "₹" + Number(form.startBid).toLocaleString()],
                    ["Platform Fee (5%)", "₹" + Math.round(form.startBid * 0.05).toLocaleString()],
                    ["You Receive",       "₹" + Math.round(form.startBid * 0.95).toLocaleString()],
                  ].map(([l, v]) => (
                    <div key={l} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "12px", boxShadow: t.shadowCard }}>
                      <div style={{ color: t.textMut, fontSize: "11px", marginBottom: "4px" }}>{l}</div>
                      <div style={{ color: t.textPri, fontSize: "16px", fontWeight: 700 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2 — Images ── */}
        {step === 2 && (
          <div style={{ animation: "slideIn .3s ease" }}>
            <SectionTitle title="Images" sub="Add, remove or replace images for this auction" t={t} />

            <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: "none" }}
              onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
              tabIndex={0}
              style={{
                border: `2px dashed ${dragOver ? "#38bdf8" : t.L ? "rgba(56,189,248,.3)" : "rgba(56,189,248,.25)"}`,
                borderRadius: "16px", padding: "40px", textAlign: "center", cursor: "pointer",
                background: dragOver ? (t.L ? "rgba(56,189,248,.08)" : "rgba(56,189,248,.06)") : (t.L ? "rgba(56,189,248,.04)" : "rgba(56,189,248,.03)"),
                transition: "all .2s", outline: "none",
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📷</div>
              <div style={{ color: t.textPri, fontWeight: 700, fontSize: "16px", marginBottom: "8px" }}>
                {dragOver ? "Drop images here!" : "Drag & drop, paste, or click to add"}
              </div>
              <div style={{ color: t.textMut, fontSize: "13px", marginBottom: "16px" }}>PNG, JPG, WEBP — existing images shown below</div>
              <button onClick={e => { e.stopPropagation(); fileInputRef.current.click(); }}
                style={{ padding: "10px 24px", background: "linear-gradient(135deg,#38bdf8,#6366f1)", border: "none", borderRadius: "10px", color: "white", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}>
                Choose Files
              </button>
            </div>

            {/* Image grid */}
            {images.length > 0 && (
              <div style={{ marginTop: "24px" }}>
                <div style={{ color: t.textMut, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "14px" }}>
                  {images.length} image{images.length !== 1 ? "s" : ""} · {images.filter(i => i.url).length} ready
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px,1fr))", gap: "12px" }}>
                  {images.map(img => (
                    <div key={img.id} style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: `1px solid ${img.error ? "rgba(244,63,94,.4)" : img.url ? "rgba(52,211,153,.3)" : t.border}`, background: t.bgCard, aspectRatio: "1" }}>
                      <img src={img.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: img.uploading ? 0.5 : 1, transition: "opacity .3s" }} />

                      {/* Progress bar */}
                      {img.uploading && (
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "4px", background: "rgba(0,0,0,.3)" }}>
                          <div style={{ height: "100%", width: `${img.progress}%`, background: "linear-gradient(90deg,#38bdf8,#6366f1)", transition: "width .2s" }} />
                        </div>
                      )}
                      {img.uploading && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                          <div style={{ fontSize: "20px" }}>⏳</div>
                          <div style={{ color: "white", fontSize: "11px", fontWeight: 600, textShadow: "0 1px 3px rgba(0,0,0,.6)" }}>{img.progress}%</div>
                        </div>
                      )}

                      {/* Success badge */}
                      {img.url && !img.uploading && (
                        <div style={{ position: "absolute", top: "6px", left: "6px", background: "rgba(52,211,153,.85)", borderRadius: "999px", padding: "2px 6px", fontSize: "10px", fontWeight: 700, color: "white" }}>✓</div>
                      )}

                      {/* Error */}
                      {img.error && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(244,63,94,.15)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px", padding: "8px" }}>
                          <div style={{ fontSize: "18px" }}>❌</div>
                          <button onClick={() => removeImage(img.id)} style={{ fontSize: "10px", padding: "2px 8px", border: "1px solid #f43f5e", borderRadius: "6px", background: "transparent", color: "#f43f5e", cursor: "pointer" }}>Remove</button>
                        </div>
                      )}

                      {/* Remove button */}
                      {!img.uploading && !img.error && (
                        <button onClick={() => removeImage(img.id)}
                          style={{ position: "absolute", top: "6px", right: "6px", width: "22px", height: "22px", borderRadius: "50%", background: "rgba(0,0,0,.55)", border: "none", color: "white", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                      )}
                    </div>
                  ))}

                  {/* Add more tile */}
                  <div onClick={() => fileInputRef.current.click()}
                    style={{ aspectRatio: "1", borderRadius: "12px", border: `2px dashed ${t.L ? "rgba(56,189,248,.3)" : "rgba(56,189,248,.2)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: t.textFaint, fontSize: "24px", transition: "border-color .2s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#38bdf8"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = t.L ? "rgba(56,189,248,.3)" : "rgba(56,189,248,.2)"}>
                    <span>+</span>
                    <span style={{ fontSize: "10px", marginTop: "4px", color: t.textFaint }}>Add more</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3 — Review & Save ── */}
        {step === 3 && (
          <div style={{ animation: "slideIn .3s ease" }}>
            <SectionTitle title="Review & Save" sub="Confirm your changes before saving" t={t} />
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "16px", overflow: "hidden", boxShadow: t.shadowCard }}>
              {[
                ["Title",         form.title      || "—"],
                ["Category",      form.category   || "—"],
                ["Condition",     form.condition  || "—"],
                ["Location",      form.location   || "—"],
                ["Starting Bid",  "₹" + (Number(form.startBid) || 0).toLocaleString()],
                ["Duration",      DURATIONS.find(d => d.value == form.duration)?.label || "—"],
                ["Start Date",    form.startDate ? new Date(form.startDate).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"],
                ["End Date",      form.startDate ? new Date(new Date(form.startDate).getTime() + Number(form.duration)*60000).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"],
                ["Status",        (() => { const now=Date.now(), s=new Date(form.startDate).getTime(), e=s+Number(form.duration)*60000; return e<=now?"✓ Completed":s<=now?"🔴 Active":"📅 Scheduled"; })()],
                ["Min Increment", "₹" + form.incrementMin],
                ["Images",        images.filter(i => i.url).length + " ready"],
              ].map(([label, val], i) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "14px 20px", borderBottom: i < 10 ? `1px solid ${t.border}` : "none" }}>
                  <span style={{ color: t.textMut, fontSize: "14px" }}>{label}</span>
                  <span style={{ color: t.textPri, fontSize: "14px", fontWeight: 600 }}>{val}</span>
                </div>
              ))}
            </div>

            {form.desc && (
              <div style={{ marginTop: "16px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "14px", padding: "16px 20px", boxShadow: t.shadowCard }}>
                <div style={{ color: t.textMut, fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>DESCRIPTION</div>
                <div style={{ color: t.textSec, fontSize: "14px", lineHeight: 1.7 }}>{form.desc}</div>
              </div>
            )}

            {images.filter(i => i.url).length > 0 && (
              <div style={{ marginTop: "16px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "14px", padding: "16px 20px", boxShadow: t.shadowCard }}>
                <div style={{ color: t.textMut, fontSize: "12px", fontWeight: 600, marginBottom: "10px" }}>IMAGES ({images.filter(i => i.url).length})</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {images.filter(i => i.url).map(img => (
                    <img key={img.id} src={img.url} alt="" style={{ width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover", border: `1px solid ${t.border}` }} />
                  ))}
                </div>
              </div>
            )}

            {/* API error */}
            {apiError && (
              <div style={{ marginTop: "16px", background: "rgba(244,63,94,.08)", border: "1px solid rgba(244,63,94,.3)", borderRadius: "12px", padding: "14px 18px", color: "#f43f5e", fontSize: "13px", fontWeight: 600 }}>
                ❌ {apiError}
              </div>
            )}

            <div style={{ marginTop: "20px", background: "rgba(56,189,248,.05)", border: "1px solid rgba(56,189,248,.15)", borderRadius: "12px", padding: "14px 18px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "18px" }}>ℹ️</span>
              <div style={{ color: t.textSec, fontSize: "13px", lineHeight: 1.6 }}>
                Saving will update the live auction immediately. <b style={{ color: "#f59e0b" }}>All existing bids will be cleared</b> and locked deposits returned to bidders. The <b style={{ color: t.textPri }}>5% platform fee</b> applies on the final sale price.
              </div>
            </div>
          </div>
        )}

        {/* ── NAV BUTTONS ── */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px" }}>
          <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}
            style={{ padding: "12px 24px", borderRadius: "10px", border: `1px solid ${t.border}`, background: t.bgCard, color: t.textSec, fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
            {step === 0 ? "← Cancel" : "← Back"}
          </button>

          {step < 3 ? (
            <button onClick={() => canNext && setStep(s => s + 1)}
              style={{ padding: "12px 32px", borderRadius: "10px", background: canNext ? "linear-gradient(135deg,#38bdf8,#6366f1)" : t.bgCard, border: canNext ? "none" : `1px solid ${t.border}`, color: canNext ? "white" : t.textFaint, fontWeight: 700, fontSize: "14px", cursor: canNext ? "pointer" : "not-allowed", boxShadow: canNext ? "0 4px 14px rgba(56,189,248,.3)" : "none" }}>
              Continue →
            </button>
          ) : (() => {
            const stillUploading = images.some(i => i.uploading);
            const disabled = loading || stillUploading;
            return (
              <button onClick={handleSave} disabled={disabled}
                style={{ padding: "12px 32px", borderRadius: "10px", border: "none", background: disabled ? t.bgCard : "linear-gradient(135deg,#38bdf8,#6366f1)", color: disabled ? t.textMut : "white", fontWeight: 700, fontSize: "14px", cursor: disabled ? "not-allowed" : "pointer", boxShadow: disabled ? "none" : "0 4px 14px rgba(56,189,248,.3)", opacity: disabled ? 0.7 : 1 }}>
                {loading ? "⏳ Saving…" : stillUploading ? `⏳ Uploading ${images.filter(i => i.uploading).length} image…` : "💾 Save Changes"}
              </button>
            );
          })()}
        </div>
      </div>

      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes popIn   { from{opacity:0;transform:scale(.6)} to{opacity:1;transform:scale(1)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
        select option { background: ${t.bgSec}; color: ${t.textPri}; }
        input::placeholder, textarea::placeholder { color: ${t.textFaint}; }
      `}</style>
    </div>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────
function FormField({ label, children, span, t }) {
  return (
    <div style={{ gridColumn: span === 2 ? "1 / -1" : "auto" }}>
      <label style={{ display: "block", color: t.textSec, fontSize: "12px", fontWeight: 600, marginBottom: "7px", textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</label>
      {children}
    </div>
  );
}

function SectionTitle({ title, sub, t }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h2 style={{ color: t.textPri, fontWeight: 800, fontSize: "22px", margin: "0 0 4px" }}>{title}</h2>
      <p style={{ color: t.textMut, fontSize: "14px", margin: 0 }}>{sub}</p>
    </div>
  );
}
