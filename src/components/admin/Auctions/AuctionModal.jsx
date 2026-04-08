import React, { useState, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  CATS, CONDS, DURS, DUR_LABELS, EMPTY_FORM,
  toLocalDT, inp, sel, tex,
} from "./auctionConstants";
import { useImageUploader, ImageGrid } from "./useImageUploader";

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, span, children }) {
  return (
    <div style={{ gridColumn: span === 2 ? "span 2" : "auto" }}>
      <label style={{
        display:"block", fontSize:"11px", fontWeight:800, color:"#64748b",
        textTransform:"uppercase", marginBottom:"6px", letterSpacing:"1px",
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export default function AuctionModal({ mode, auction, onClose, onSaved }) {
  const isEdit    = mode === "edit";
  const fileInput = useRef(null);

  // Seed existing images when editing
  const seedImages = isEdit
    ? (Array.isArray(auction?.images) ? auction.images : auction?.image ? [auction.image] : [])
        .filter(Boolean)
        .map((url, i) => ({ id:`existing-${i}`, preview:url, url, uploading:false, error:null, progress:100 }))
    : [];

  const { images, addFiles, removeImage } = useImageUploader(seedImages);

  const [form, setForm] = useState(() => {
    if (isEdit && auction) {
      return {
        title:        auction.title || "",
        category:     auction.category || "",
        condition:    auction.condition || "",
        location:     auction.location || "",
        desc:         auction.description || "",
        startBid:     auction.startingBid ?? auction.startBid ?? "",
        reservePrice: auction.reservePrice ?? "",
        duration:     auction.durationMinutes ?? 1440,
        increment:    auction.minBidIncrement ?? 100,
        tags:         Array.isArray(auction.tags) ? auction.tags.join(", ") : (auction.tags || ""),
        status:       auction.status || "Scheduled",
        endTime:      toLocalDT(auction.endTime || auction.endDate || auction.endsAt),
      };
    }
    return { ...EMPTY_FORM };
  });

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set            = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const stillUploading = images.some(i => i.uploading);

  const handleSubmit = async () => {
    if (!form.title)    return setError("Title is required");
    if (!form.category) return setError("Category is required");
    if (!form.startBid) return setError("Starting bid is required");
    if (stillUploading) return setError("Please wait for images to finish uploading");
    setError("");

    const startDate = new Date();
    const endISO    = form.endTime
      ? new Date(form.endTime).toISOString()
      : new Date(startDate.getTime() + Number(form.duration) * 60000).toISOString();

    const payload = {
      title:           form.title,
      category:        form.category,
      condition:       form.condition,
      location:        form.location,
      description:     form.desc,
      tags:            form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      startingBid:     Number(form.startBid),
      reservePrice:    form.reservePrice ? Number(form.reservePrice) : undefined,
      minBidIncrement: Number(form.increment) || 100,
      duration:        DUR_LABELS[Number(form.duration)] || "1 Day",
      durationMinutes: Number(form.duration),
      status:          form.status,
      endTime:         endISO,
      images:          images.filter(i => i.url).map(i => i.url),
      ...(!isEdit && { startDate: startDate.toISOString() }),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await axios.put(`http://localhost:3000/auction/auction/${auction._id}`, payload);
        onSaved({ ...auction, ...payload });
        Swal.fire({ icon:"success", title:"Auction Updated!", showConfirmButton:false, timer:1500, toast:true, position:"top-end" });
      } else {
        const res = await axios.post("http://localhost:3000/auction/auctions", payload);
        onSaved(res.data?.auction || res.data?.data || res.data);
        Swal.fire({ icon:"success", title:"Auction Created!", showConfirmButton:false, timer:1500, toast:true, position:"top-end" });
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || (isEdit ? "Update failed" : "Creation failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position:"fixed", inset:0, background:"rgba(15,23,42,.45)", zIndex:9999,
        display:"flex", alignItems:"center", justifyContent:"center", padding:"16px",
      }}
    >
      <div style={{
        background:"#fff", borderRadius:"20px", width:"100%", maxWidth:"680px",
        maxHeight:"90vh", display:"flex", flexDirection:"column",
        boxShadow:"0 25px 60px rgba(0,0,0,.18)",
      }}>

        {/* Header */}
        <div style={{
          padding:"22px 28px 16px", borderBottom:"1px solid #f1f5f9",
          display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0,
        }}>
          <h2 style={{ margin:0, fontWeight:800, fontSize:"20px", color:"#1e293b" }}>
            {isEdit ? "✏️ Edit Auction" : "➕ New Auction"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background:"none", border:"none", fontSize:"24px",
              color:"#94a3b8", cursor:"pointer", lineHeight:1, padding:"0 2px",
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY:"auto", padding:"20px 28px", flex:1 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>

            <Field label="Title *" span={2}>
              <input style={inp} placeholder="Auction title" value={form.title} onChange={set("title")} />
            </Field>

            <Field label="Category *">
              <select style={sel} value={form.category} onChange={set("category")}>
                <option value="">Select category</option>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Condition">
              <select style={sel} value={form.condition} onChange={set("condition")}>
                <option value="">Select condition</option>
                {CONDS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Location">
              <input style={inp} placeholder="e.g. Mumbai, Maharashtra" value={form.location} onChange={set("location")} />
            </Field>

            <Field label="Tags (comma separated)">
              <input style={inp} placeholder="e.g. apple, sealed" value={form.tags} onChange={set("tags")} />
            </Field>

            <Field label="Description" span={2}>
              <textarea style={tex} placeholder="Describe the item…" value={form.desc} onChange={set("desc")} />
            </Field>

            <Field label="Starting Bid (₹) *">
              <input style={inp} type="number" placeholder="0" value={form.startBid} onChange={set("startBid")} />
            </Field>

            <Field label="Reserve Price (₹)">
              <input style={inp} type="number" placeholder="Optional" value={form.reservePrice} onChange={set("reservePrice")} />
            </Field>

            <Field label="Min Bid Increment (₹)">
              <input style={inp} type="number" value={form.increment} onChange={set("increment")} />
            </Field>

            <Field label="Duration">
              <select style={sel} value={form.duration} onChange={set("duration")}>
                {DURS.map(d => <option key={d.v} value={d.v}>{d.l}</option>)}
              </select>
            </Field>

            <Field label="Status">
              <select style={sel} value={form.status} onChange={set("status")}>
                {["Active","Scheduled","Completed","Cancelled"].map(s =>
                  <option key={s} value={s}>{s === "Active" ? "Active (Live)" : s}</option>
                )}
              </select>
            </Field>

            <Field label="End Date & Time">
              <input style={inp} type="datetime-local" value={form.endTime} onChange={set("endTime")} />
            </Field>

            {/* Image uploader */}
            <div style={{ gridColumn:"span 2" }}>
              <ImageGrid
                images={images}
                onAdd={addFiles}
                onRemove={removeImage}
                fileInputRef={fileInput}
              />
            </div>

          </div>

          {error && (
            <div style={{
              marginTop:"14px", background:"rgba(244,63,94,.08)",
              border:"1px solid rgba(244,63,94,.3)", borderRadius:"10px",
              padding:"10px 14px", color:"#f43f5e", fontSize:"13px", fontWeight:600,
            }}>
              ❌ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding:"16px 28px", borderTop:"1px solid #f1f5f9",
          display:"flex", justifyContent:"flex-end", gap:"12px", flexShrink:0,
        }}>
          <button
            onClick={onClose}
            style={{
              padding:"10px 22px", borderRadius:"10px", border:"2px solid #e2e8f0",
              background:"white", color:"#64748b", fontWeight:700, fontSize:"14px", cursor:"pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || stillUploading}
            style={{
              padding:"10px 28px", borderRadius:"10px", border:"none",
              background: (saving || stillUploading) ? "#c7d2fe" : "#4f46e5",
              color:"white", fontWeight:700, fontSize:"14px",
              cursor: (saving || stillUploading) ? "not-allowed" : "pointer",
              transition:"background .2s",
            }}
          >
            {saving
              ? "Saving…"
              : stillUploading
                ? `Uploading ${images.filter(i => i.uploading).length} image…`
                : isEdit ? "💾 Save Changes" : "➕ Create Auction"}
          </button>
        </div>

      </div>
    </div>
  );
}
