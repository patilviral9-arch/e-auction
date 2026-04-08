// ── Cloudinary ────────────────────────────────────────────────────────────────
export const CLOUDINARY_CLOUD_NAME    = "df7qog24u";
export const CLOUDINARY_UPLOAD_PRESET = "E-TEST";

// ── Dropdown options ──────────────────────────────────────────────────────────
export const CATS = [
  "Electronics","Vehicles","Luxury","Furniture","Collectibles",
  "Real Estate","Industrial","Art","Sports","Books",
];

export const CONDS = [
  "New","Used – Like New","Used – Excellent","Used – Good","Vintage",
];

export const DURS = [
  { l:"1 Hour",  v:60   },
  { l:"6 Hours", v:360  },
  { l:"12 Hours",v:720  },
  { l:"1 Day",   v:1440 },
  { l:"3 Days",  v:4320 },
  { l:"7 Days",  v:10080},
];

export const DUR_LABELS = {
  60:"1 Hour", 360:"6 Hours", 720:"12 Hours",
  1440:"1 Day", 4320:"3 Days", 10080:"7 Days",
};

// ── Empty form state ──────────────────────────────────────────────────────────
export const EMPTY_FORM = {
  title:"", category:"", condition:"", location:"",
  desc:"", startBid:"", reservePrice:"", duration:1440,
  increment:100, tags:"", status:"Scheduled", endTime:"",
};

// ── Formatters ────────────────────────────────────────────────────────────────
export const toINR = (val) => {
  if (val == null || val === "" || isNaN(Number(val))) return "—";
  return new Intl.NumberFormat("en-IN", {
    style:"currency", currency:"INR", maximumFractionDigits:0,
  }).format(Number(val));
};

export const formatEnd = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  return d.toLocaleString("en-IN", {
    day:"numeric", month:"short", year:"numeric",
    hour:"2-digit", minute:"2-digit", hour12:true,
  });
};

export const toLocalDT = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,16);
};

// ── Shared inline styles ──────────────────────────────────────────────────────
export const inp = {
  width:"100%", height:"44px", padding:"0 12px", borderRadius:"10px",
  border:"2px solid #e2e8f0", fontSize:"14px", outline:"none",
  boxSizing:"border-box", fontFamily:"inherit", color:"#1e293b",
};
export const sel = { ...inp, background:"white", cursor:"pointer" };
export const tex = { ...inp, height:"80px", padding:"10px 12px", resize:"vertical" };
