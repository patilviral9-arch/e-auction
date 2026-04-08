import React, { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import { useThemeStyles } from "../../../utils/themeStyles";
import FooterComponent from "../../user/FooterComponent";

// ── Cloudinary config ─────────────────────────────────────────────────────────
const CLOUDINARY_CLOUD_NAME = "df7qog24u"
const CLOUDINARY_UPLOAD_PRESET = "E-TEST" 

const CATEGORIES = ["Electronics", "Vehicles", "Luxury", "Furniture", "Collectibles", "Real Estate", "Industrial", "Art", "Sports", "Books"];
const CONDITIONS = ["New", "Used – Like New", "Used – Excellent", "Used – Good", "Vintage"]
const DURATIONS  = [
  { label: "1 Hour",   value: 60 },
  { label: "6 Hours",  value: 360 },
  { label: "12 Hours", value: 720 },
  { label: "1 Day",    value: 1440 },
  { label: "3 Days",   value: 4320 },
  { label: "7 Days",   value: 10080 },
]

const STEP_LABELS = ["Item Details", "Pricing & Duration", "Images & Preview", "Review & Publish"]

export default function AddAuction() {
  const navigate = useNavigate()
  const t        = useThemeStyles()
  const { userId } = useAuth()

  const [step,      setStep]      = useState(0)
  const [published, setPublished] = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [apiError,  setApiError]  = useState("")

  // image upload state
  const [images,       setImages]       = useState([]) // [{ id, url, public_id, uploading, error, progress }]
  const [dragOver,     setDragOver]     = useState(false)
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: "", category: "", condition: "", location: "",
    desc: "", startBid: "", reservePrice: "", duration: 1440,
    incrementMin: 100, tags: "",
    scheduleMode: "now",   // "now" | "later"
    scheduledAt: "",       // ISO datetime-local string when mode = "later"
  });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  // ── Cloudinary uploader ───────────────────────────────────────────────────
  const uploadToCloudinary = useCallback(async (file, id) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);

      xhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setImages(prev => prev.map(img => img.id === id ? { ...img, progress: pct } : img));
        }
      };

      const result = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
          else reject(new Error("Upload failed"));
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(data);
      });

      setImages(prev => prev.map(img =>
        img.id === id
          ? { ...img, url: result.secure_url, public_id: result.public_id, uploading: false, progress: 100 }
          : img
      ));
    } catch (err) {
      setImages(prev => prev.map(img =>
        img.id === id ? { ...img, uploading: false, error: err.message } : img
      ));
    }
  }, []);

  const addFiles = useCallback((files) => {
    const newImgs = Array.from(files).map(file => {
      const id = `${Date.now()}-${Math.random()}`;
      const preview = URL.createObjectURL(file);
      const entry = { id, preview, url: null, public_id: null, uploading: true, error: null, progress: 0 };
      uploadToCloudinary(file, id);
      return entry;
    });
    setImages(prev => [...prev, ...newImgs]);
  }, [uploadToCloudinary]);

  const removeImage = (id) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img?.preview) URL.revokeObjectURL(img.preview);
      return prev.filter(i => i.id !== id);
    });
  };

  const retryImage = (id) => {
    // Re-trigger via hidden input isn't feasible after the fact; mark for user re-add
    setImages(prev => prev.filter(i => i.id !== id));
  };

  const progress = [
    form.title && form.category && form.condition && form.location && form.desc,
    form.startBid && form.duration,
    true,
    true,
  ];
  const canNext = progress[step];

  const inp = {
    width: "100%", padding: "10px 14px",
    background: t.bgInput, border: `1px solid ${t.borderMd}`,
    borderRadius: "10px", color: t.textPri, fontSize: "14px",
    outline: "none", boxSizing: "border-box", transition: "border-color .2s",
  };

  // ── Map form fields → AuctionModel fields ──────────────────────────────────
  const buildPayload = () => {
    const isScheduled = form.scheduleMode === "later" && form.scheduledAt;
    const startDate   = isScheduled ? new Date(form.scheduledAt) : new Date();
    const endTime     = new Date(startDate.getTime() + Number(form.duration) * 60 * 1000);
    return {
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
      startDate:       startDate.toISOString(),
      endTime:         endTime.toISOString(),
      tags:            form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      createdBy:       userId || undefined,
      status:          isScheduled ? "Scheduled" : "Active",
      images:          images.filter(i => i.url).map(i => i.url),
    };
  };

  const handlePublish = async () => {
    setApiError("");

    // Block publish if any images are still uploading
    const stillUploading = images.some(i => i.uploading);
    if (stillUploading) {
      setApiError("Please wait — some images are still uploading.");
      return;
    }

    setLoading(true);
    try {
      const payload = buildPayload();
      const res = await axios.post("http://localhost:3000/auction/auction", payload);
      if (res.status === 201) {
        setPublished(true);
        setTimeout(() => navigate("/Business/Listings"), 2200);
      }
    } catch (err) {
      setApiError(err.response?.data?.error || err.response?.data?.message || "Failed to create auction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (published) {
    const isScheduled = form.scheduleMode === "later" && form.scheduledAt;
    return (
      <div style={{ background: t.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", animation: "popIn .5s cubic-bezier(.34,1.56,.64,1)" }}>
          <div style={{ fontSize: "72px", marginBottom: "20px" }}>{isScheduled ? "📅" : "🎉"}</div>
          <h1 style={{ color: t.textPri, fontSize: "32px", fontWeight: 900, marginBottom: "10px" }}>
            {isScheduled ? "Auction Scheduled!" : "Auction Published!"}
          </h1>
          <p style={{ color: t.textMut, fontSize: "16px", marginBottom: "8px" }}>
            "{form.title}" {isScheduled
              ? `will go live on ${new Date(form.scheduledAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}.`
              : "is now live."}
          </p>
          <p style={{ color: "#38bdf8", fontSize: "14px" }}>Redirecting to your listings…</p>
        </div>
        <style>{`@keyframes popIn { from{opacity:0;transform:scale(.6)} to{opacity:1;transform:scale(1)} }`}</style>
      </div>
    );
  }

  return (
    <div style={{ background: t.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", transition: "background 0.25s" }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ background: t.bgSec, borderBottom: `1px solid ${t.border}`, padding: "32px 40px" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <div style={{ color: "#38bdf8", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "6px" }}>🏢 Business Dashboard</div>
          <h1 style={{ color: t.textPri, fontSize: "30px", fontWeight: 900, margin: "0 0 20px", letterSpacing: "-.02em" }}>Create New Auction</h1>

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

        {/* STEP 0 — Item Details */}
        {step === 0 && (
          <div style={{ animation: "slideIn .3s ease" }}>
            <SectionTitle title="Item Details" sub="Tell buyers what you're selling" t={t} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <FormField label="Auction Title *" span={2} t={t}>
                <input value={form.title} onChange={set("title")} placeholder="e.g. Apple iPhone 15 Pro Max 256GB" style={inp} />
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
                <input value={form.tags} onChange={set("tags")} placeholder="e.g. apple, smartphone, sealed" style={inp} />
              </FormField>
              <FormField label="Description *" span={2} t={t}>
                <textarea value={form.desc} onChange={set("desc")} placeholder="Describe the item in detail — condition, age, accessories included, warranty..." rows={5} style={{ ...inp, resize: "vertical", minHeight: "110px" }} />
              </FormField>
            </div>
          </div>
        )}

        {/* STEP 1 — Pricing */}
        {step === 1 && (
          <div style={{ animation: "slideIn .3s ease" }}>
            <SectionTitle title="Pricing & Duration" sub="Set your starting bid and how long the auction runs" t={t} />
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

              {/* ── Schedule Toggle — full width ── */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", color: t.textSec, fontSize: "12px", fontWeight: 600, marginBottom: "10px", textTransform: "uppercase", letterSpacing: ".04em" }}>
                  When to Start *
                </label>
                {/* Toggle pills */}
                <div style={{ display: "flex", gap: "10px", marginBottom: form.scheduleMode === "later" ? "14px" : "0" }}>
                  {[
                    { value: "now",   label: "🚀 Start Immediately", desc: "Goes live as soon as published" },
                    { value: "later", label: "📅 Schedule for Later", desc: "Set a future start date & time" },
                  ].map(opt => {
                    const active = form.scheduleMode === opt.value;
                    return (
                      <div
                        key={opt.value}
                        onClick={() => setForm(f => ({ ...f, scheduleMode: opt.value, scheduledAt: opt.value === "now" ? "" : f.scheduledAt }))}
                        style={{
                          flex: 1, padding: "14px 16px", borderRadius: "12px", cursor: "pointer",
                          border: active ? "2px solid #38bdf8" : `1px solid ${t.border}`,
                          background: active ? "rgba(56,189,248,.06)" : t.bgCard,
                          transition: "all .2s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: `2px solid ${active ? "#38bdf8" : t.borderMd}`, background: active ? "#38bdf8" : "transparent", transition: "all .2s", flexShrink: 0 }} />
                          <span style={{ color: active ? "#38bdf8" : t.textPri, fontWeight: 700, fontSize: "14px" }}>{opt.label}</span>
                        </div>
                        <div style={{ color: t.textFaint, fontSize: "12px", paddingLeft: "22px" }}>{opt.desc}</div>
                      </div>
                    );
                  })}
                </div>

                {/* DateTime picker — only shown when "later" selected */}
                {form.scheduleMode === "later" && (
                  <div style={{ background: "rgba(99,102,241,.05)", border: "1px solid rgba(99,102,241,.2)", borderRadius: "12px", padding: "16px" }}>
                    <div style={{ color: "#6366f1", fontSize: "12px", fontWeight: 700, marginBottom: "10px" }}>📅 Select Start Date & Time</div>
                    <input
                      type="datetime-local"
                      value={form.scheduledAt}
                      min={(() => { const d = new Date(); d.setMinutes(d.getMinutes() + 5); return d.toISOString().slice(0, 16); })()}
                      onChange={set("scheduledAt")}
                      style={{ ...inp, colorScheme: t.L ? "light" : "dark", marginBottom: "10px" }}
                    />
                    {form.scheduledAt && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "8px 14px", fontSize: "12px" }}>
                          <span style={{ color: t.textMut }}>Starts: </span>
                          <span style={{ color: "#6366f1", fontWeight: 700 }}>
                            {new Date(form.scheduledAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "8px 14px", fontSize: "12px" }}>
                          <span style={{ color: t.textMut }}>Ends: </span>
                          <span style={{ color: "#f43f5e", fontWeight: 700 }}>
                            {new Date(new Date(form.scheduledAt).getTime() + Number(form.duration) * 60000).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div style={{ background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.2)", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", color: "#6366f1", fontWeight: 700 }}>
                          ⏳ {Math.round((new Date(form.scheduledAt) - Date.now()) / 60000)} min until start
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
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

        {/* STEP 2 — Images */}
        {step === 2 && (
          <div style={{ animation: "slideIn .3s ease" }}>
            <SectionTitle title="Images" sub="Upload as many images as you like — all stored on Cloudinary" t={t} />

            {/* Hidden file input — accepts any number of files */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              style={{ display: "none" }}
              onChange={e => { addFiles(e.target.files); e.target.value = ""; }}
            />

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
              onPaste={e => { const files = Array.from(e.clipboardData.files).filter(f => f.type.startsWith("image/")); if (files.length) addFiles(files); }}
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
                {dragOver ? "Drop images here!" : "Drag & drop, paste, or click to choose"}
              </div>
              <div style={{ color: t.textMut, fontSize: "13px", marginBottom: "16px" }}>
                PNG, JPG, WEBP, GIF — no limit on count or size
              </div>
              <button
                onClick={e => { e.stopPropagation(); fileInputRef.current.click(); }}
                style={{ padding: "10px 24px", background: "linear-gradient(135deg,#38bdf8,#6366f1)", border: "none", borderRadius: "10px", color: "white", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}
              >
                Choose Files
              </button>
            </div>

            {/* Image grid */}
            {images.length > 0 && (
              <div style={{ marginTop: "24px" }}>
                <div style={{ color: t.textMut, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "14px" }}>
                  {images.length} image{images.length !== 1 ? "s" : ""} · {images.filter(i => i.url).length} uploaded
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "12px" }}>
                  {images.map((img) => (
                    <div key={img.id} style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: `1px solid ${img.error ? "rgba(244,63,94,.4)" : img.url ? "rgba(52,211,153,.3)" : t.border}`, background: t.bgCard, aspectRatio: "1" }}>
                      {/* Preview */}
                      <img
                        src={img.preview}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: img.uploading ? 0.5 : 1, transition: "opacity .3s" }}
                      />

                      {/* Upload progress bar */}
                      {img.uploading && (
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "4px", background: "rgba(0,0,0,.3)" }}>
                          <div style={{ height: "100%", width: `${img.progress}%`, background: "linear-gradient(90deg,#38bdf8,#6366f1)", transition: "width .2s" }} />
                        </div>
                      )}

                      {/* Uploading spinner label */}
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

                      {/* Error state */}
                      {img.error && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(244,63,94,.15)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px", padding: "8px" }}>
                          <div style={{ fontSize: "18px" }}>❌</div>
                          <div style={{ color: "#f43f5e", fontSize: "10px", fontWeight: 600, textAlign: "center" }}>Failed</div>
                          <button onClick={() => retryImage(img.id)} style={{ fontSize: "10px", padding: "2px 8px", border: "1px solid #f43f5e", borderRadius: "6px", background: "transparent", color: "#f43f5e", cursor: "pointer" }}>Remove</button>
                        </div>
                      )}

                      {/* Remove button */}
                      {!img.uploading && !img.error && (
                        <button
                          onClick={() => removeImage(img.id)}
                          style={{ position: "absolute", top: "6px", right: "6px", width: "22px", height: "22px", borderRadius: "50%", background: "rgba(0,0,0,.55)", border: "none", color: "white", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
                        >×</button>
                      )}
                    </div>
                  ))}

                  {/* Add more tile */}
                  <div
                    onClick={() => fileInputRef.current.click()}
                    style={{ aspectRatio: "1", borderRadius: "12px", border: `2px dashed ${t.L ? "rgba(56,189,248,.3)" : "rgba(56,189,248,.2)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: t.textFaint, fontSize: "24px", transition: "border-color .2s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#38bdf8"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = t.L ? "rgba(56,189,248,.3)" : "rgba(56,189,248,.2)"}
                  >
                    <span>+</span>
                    <span style={{ fontSize: "10px", marginTop: "4px", color: t.textFaint }}>Add more</span>
                  </div>
                </div>
              </div>
            )}

            {/* Listing preview */}
            {form.title && (
              <div style={{ marginTop: "28px" }}>
                <div style={{ color: t.textMut, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "14px" }}>Listing Preview</div>
                <div style={{ background: t.bgCardGrad, borderRadius: "16px", overflow: "hidden", border: `1px solid ${t.border}`, maxWidth: "280px", boxShadow: t.shadowCard }}>
                  <div style={{ height: "160px", overflow: "hidden", background: t.L ? "rgba(56,189,248,.06)" : "rgba(56,189,248,.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px" }}>
                    {images.find(i => i.url)
                      ? <img src={images.find(i => i.url).url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : images.find(i => i.preview)
                        ? <img src={images.find(i => i.preview).preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} />
                        : "🖼️"}
                  </div>
                  <div style={{ padding: "16px" }}>
                    <div style={{ color: t.textMut, fontSize: "10px", marginBottom: "4px" }}>{form.category}</div>
                    <div style={{ color: t.textPri, fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>{form.title}</div>
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
            <SectionTitle title="Review & Publish" sub="Check everything before going live" t={t} />
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "16px", overflow: "hidden", boxShadow: t.shadowCard }}>
              {[
                ["Title",         form.title      || "—"],
                ["Category",      form.category   || "—"],
                ["Condition",     form.condition  || "—"],
                ["Location",      form.location   || "—"],
                ["Starting Bid",  "₹" + (Number(form.startBid) || 0).toLocaleString()],
                ["Duration",      DURATIONS.find(d => d.value == form.duration)?.label || "—"],
                ["Launch",        form.scheduleMode === "later" && form.scheduledAt
                                    ? `📅 Scheduled — ${new Date(form.scheduledAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
                                    : "🚀 Immediately (Active)"],
                ...(form.scheduleMode === "later" && form.scheduledAt ? [["Ends At", new Date(new Date(form.scheduledAt).getTime() + Number(form.duration) * 60000).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })]] : []),
                ["Min Increment", "₹" + form.incrementMin],
                ["Images",        images.filter(i => i.url).length + " uploaded"],
              ].map(([label, val], i, arr) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "14px 20px", borderBottom: i < arr.length - 1 ? `1px solid ${t.border}` : "none" }}>
                  <span style={{ color: t.textMut, fontSize: "14px" }}>{label}</span>
                  <span style={{ color: label === "Launch" && form.scheduleMode === "later" ? "#6366f1" : t.textPri, fontSize: "14px", fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{val}</span>
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

            <div style={{ marginTop: "20px", background: "rgba(52,211,153,.05)", border: "1px solid rgba(52,211,153,.2)", borderRadius: "12px", padding: "14px 18px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "18px" }}>ℹ️</span>
              <div style={{ color: t.textSec, fontSize: "13px", lineHeight: 1.6 }}>
                By publishing, you agree to our <span style={{ color: "#38bdf8" }}>Seller Terms</span>. A <b style={{ color: t.textPri }}>5% platform fee</b> is charged on the final sale price.
              </div>
            </div>
          </div>
        )}

        {/* ── NAV BUTTONS ── */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px" }}>
          <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)} style={{ padding: "12px 24px", borderRadius: "10px", border: `1px solid ${t.border}`, background: t.bgCard, color: t.textSec, fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
            {step === 0 ? "← Cancel" : "← Back"}
          </button>

          {step < 3 ? (
            <button onClick={() => canNext && setStep(s => s + 1)} style={{ padding: "12px 32px", borderRadius: "10px", background: canNext ? "linear-gradient(135deg,#38bdf8,#6366f1)" : t.bgCard, border: canNext ? "none" : `1px solid ${t.border}`, color: canNext ? "white" : t.textFaint, fontWeight: 700, fontSize: "14px", cursor: canNext ? "pointer" : "not-allowed", boxShadow: canNext ? "0 4px 14px rgba(56,189,248,.3)" : "none" }}>
              Continue →
            </button>
          ) : (
            (() => {
              const stillUploading = images.some(i => i.uploading);
              const needsDate = form.scheduleMode === "later" && !form.scheduledAt;
              const disabled = loading || stillUploading || needsDate;
              const isScheduled = form.scheduleMode === "later";
              return (
                <button
                  onClick={handlePublish}
                  disabled={disabled}
                  style={{ padding: "12px 32px", borderRadius: "10px", border: "none", background: disabled ? t.bgCard : isScheduled ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "linear-gradient(135deg,#34d399,#059669)", color: disabled ? t.textMut : "white", fontWeight: 700, fontSize: "14px", cursor: disabled ? "not-allowed" : "pointer", boxShadow: disabled ? "none" : isScheduled ? "0 4px 14px rgba(99,102,241,.35)" : "0 4px 14px rgba(52,211,153,.35)", opacity: disabled ? 0.7 : 1 }}>
                  {loading ? "⏳ Saving…" : stillUploading ? `⏳ Uploading ${images.filter(i => i.uploading).length} image…` : needsDate ? "📅 Pick a date first" : isScheduled ? "📅 Schedule Auction" : "🚀 Publish Auction"}
                </button>
              );
            })()
          )}
        </div>
      </div>
       
       <FooterComponent />
       
      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes popIn   { from{opacity:0;transform:scale(.6)} to{opacity:1;transform:scale(1)} }
        select option { background: ${t.bgSec}; color: ${t.textPri}; }
        input::placeholder, textarea::placeholder { color: ${t.textFaint}; }
      `}</style>
    </div>
  );
}

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


