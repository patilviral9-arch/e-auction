import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { formatINR } from "../components/user/auctionData";
import { INITIAL_BIZ, card } from "../components/user/Business/bizConstants";

const TABS = ["Dashboard", "Settings"];
import { EditModal } from "../components/user/Business/BizUI";
import { TabDashboard, TabSettings } from "../components/user/Business/BizTabs";
import { useLocation } from "react-router-dom";

const CLOUDINARY_CLOUD  = "df7qog24u";
const CLOUDINARY_PRESET = "E-TEST";

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_PRESET);
  formData.append("cloud_name", CLOUDINARY_CLOUD);
  const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: "POST", body: formData });
  const data = await res.json();
  return data.secure_url;
}

async function saveToMongo(userId, payload) {
  await fetch(`${import.meta.env.VITE_API_URL}/user/updateuser/${userId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
}

export default function BusinessProfile() {
  const { userName, userEmail, userId, setAvatar: setContextAvatar } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab,          setTab]          = useState(0);
  const [biz,          setBiz]          = useState(INITIAL_BIZ);
  const [modal,        setModal]        = useState(null);
  const [avatar,       setAvatar]       = useState(null);
  const [uploadingAvt, setUploadingAvt] = useState(false);

  const location = useLocation();
  useEffect(() => {
    if (location.state?.tab !== undefined) {
      setTab(location.state.tab);
    }
  }, [location.state]);

  const avatarInputRef = useRef(null);
  const settingsRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    fetch(`${import.meta.env.VITE_API_URL}/user/getuser/${userId}`)
      .then(r => r.json())
      .then(data => {
        if (data.data) {
          setBiz(prev => ({ ...prev, ...data.data }));
          if (data.data.avatar) setAvatar(data.data.avatar);
        }
      })
      .catch(err => console.error("Fetch user error:", err));
  }, [userId]);

  useEffect(() => {
  if (tab === 1 && settingsRef.current) {
    setTimeout(() => {
      settingsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }
}, [tab]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setAvatar(URL.createObjectURL(file)); setUploadingAvt(true);
    try { const url = await uploadToCloudinary(file); await saveToMongo(userId, { avatar: url }); setAvatar(url); setContextAvatar(url); }
    catch (err) { console.error(err); } finally { setUploadingAvt(false); e.target.value = ""; }
  };

  const lockedName  = userName  || biz.businessName;
  const lockedEmail = userEmail || "seller@techvault.com";
  const openModal      = (config) => setModal(config);
  const closeModal     = ()       => setModal(null);
  const handleSave     = (draft)  => setBiz(prev => ({ ...prev, ...draft }));
  const handleBankSave = (draft)  => setBiz(prev => ({ ...prev, bank: { ...prev.bank, ...draft } }));

  const [myListings,     setMyListings]     = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);

  // Fetch this user's auctions from the API
  useEffect(() => {
    if (!userId) return;
    setListingsLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/auction/auctions`)
      .then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then(data => {
        const list = Array.isArray(data) ? data : data.auctions ?? data.data ?? [];
        const mine = list
          .filter(a => {
            const creator = a.createdBy;
            if (!creator) return false;
            if (typeof creator === "string") return creator === userId;
            return String(creator._id || creator) === String(userId);
          })
          .map(a => ({
            id:         String(a._id || a.id),
            title:      a.title,
            category:   a.category,
            img:        (Array.isArray(a.images) && a.images[0])
                          ? (typeof a.images[0] === "string" ? a.images[0] : a.images[0].url || a.images[0].secure_url)
                          : "https://placehold.co/72x72?text=No+Img",
            currentBid: a.currentBid ?? a.startingBid ?? 0,
            totalBids:  a.totalBids ?? a.bids?.length ?? 0,
            views:      a.views ?? 0,
            status:     a.status === "Active" ? "live" : a.status === "Completed" ? "ended" : "scheduled",
            revenue:    a.status === "Completed" ? (a.currentBid ?? a.startingBid ?? 0) : null,
          }));
        setMyListings(mine);
      })
      .catch(err => console.error("Listings fetch error:", err))
      .finally(() => setListingsLoading(false));
  }, [userId]);

  const sharedProps = { biz, setBiz, lockedName, lockedEmail, openModal, handleBankSave, userId, myListings, listingsLoading };

  const stats = [
    { label: "Total Listings", value: biz.totalListings,           icon: "📋", from: "#6366f1", to: "#8b5cf6" },
    { label: "Active Bids",    value: biz.activeBids,              icon: "🔥", from: "#f43f5e", to: "#fb923c" },
    { label: "Total Revenue",  value: formatINR(biz.totalRevenue), icon: "💰", from: "#10b981", to: "#06b6d4" },
    { label: "Seller Rating",  value: "★ " + biz.rating,          icon: "⭐", from: "#f59e0b", to: "#eab308" },
  ];

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh", fontFamily: "system-ui, sans-serif", transition: "background 0.25s" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes popIn  { from { opacity:0; transform:scale(.92) } to { opacity:1; transform:scale(1) } }
        @keyframes modalIn { from { opacity:0; transform:scale(.96) translateY(10px) } to { opacity:1; transform:scale(1) translateY(0) } }
        .biz-stat-card { transition: transform 0.2s, box-shadow 0.2s; }
        .biz-stat-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.18) !important; }
        .biz-tab-btn { transition: all 0.2s; }
        .biz-tab-btn:hover { background: var(--bg-card) !important; }
        .biz-avatar-wrap:hover .biz-avatar-overlay { opacity: 1 !important; }
        .new-auction-btn { transition: transform 0.15s, box-shadow 0.15s; }
        .new-auction-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,0.4) !important; }
      `}</style>

      {modal && <EditModal {...modal} userId={userId} onSave={modal.onSave || handleSave} onClose={closeModal} />}
      <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />

      {/* ── Hero Banner ── */}
      <div style={{ position: "relative", height: "220px", overflow: "hidden", background: "#0f0e17" }}>
        {/* Colorful blobs */}
        <div style={{ position:"absolute", top:"-60px", left:"-40px",  width:"320px", height:"320px", borderRadius:"50%", background:"radial-gradient(circle, #6366f1 0%, transparent 70%)", opacity:0.55, filter:"blur(60px)" }} />
        <div style={{ position:"absolute", top:"-40px", left:"30%",    width:"280px", height:"280px", borderRadius:"50%", background:"radial-gradient(circle, #f43f5e 0%, transparent 70%)", opacity:0.4,  filter:"blur(60px)" }} />
        <div style={{ position:"absolute", top:"-30px", right:"10%",   width:"300px", height:"300px", borderRadius:"50%", background:"radial-gradient(circle, #10b981 0%, transparent 70%)", opacity:0.35, filter:"blur(60px)" }} />
        <div style={{ position:"absolute", bottom:"-40px", left:"55%", width:"260px", height:"260px", borderRadius:"50%", background:"radial-gradient(circle, #f59e0b 0%, transparent 70%)", opacity:0.35, filter:"blur(55px)" }} />

        {/* Dot grid overlay */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)", backgroundSize:"28px 28px", opacity:0.6 }} />

        {/* Bottom fade to page bg */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"80px", background:"linear-gradient(to top, var(--bg-primary), transparent)" }} />

      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 32px" }}>

        {/* ── Profile Row ── */}
              <div style={{ 
                display:"flex", 
                alignItems:"center",  // ✅ center vertically
                gap:"20px", 
                marginTop:"-60px", 
                marginBottom:"32px", 
                flexWrap:"wrap", 
                position:"relative", 
                zIndex:2, 
                animation:"fadeUp .5s ease both" 
              }}>
                
          {/* Avatar */}
          <div
                className="biz-avatar-wrap"
                onClick={() => avatarInputRef.current?.click()}
                style={{ 
                  position:"relative", 
                  width:"110px", 
                  height:"110px", 
                  borderRadius:"50%",
                  flexShrink:0, 
                  cursor:"pointer", 
                  border:"5px solid var(--bg-primary)", 
                  boxShadow:"0 8px 32px rgba(99,102,241,0.35)", 
                  overflow:"hidden" 
                }}
              >
            {avatar
              ? <img src={avatar} alt="Avatar" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
              : <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#6366f1,#f43f5e)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"40px", fontWeight:900, color:"white", fontFamily:"system-ui, sans-serif" }}>{lockedName?.charAt(0)?.toUpperCase() || "🏢"}</div>
            }
            <div className="biz-avatar-overlay" style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", opacity: uploadingAvt ? 1 : 0, transition:"opacity .2s" }}>
              <div style={{ color:"white", fontSize:"11px", fontWeight:700 }}>{uploadingAvt ? "Uploading…" : "Change"}</div>
            </div>
          </div>

          {/* Name + meta */}
          <div style={{ flex:1, paddingBottom:"8px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap" }}>
              <h1 style={{ fontFamily:"system-ui, sans-serif", color:"var(--text-primary)", fontSize:"28px", fontWeight:800, margin:0, letterSpacing:"-0.5px" }}>{lockedName}</h1>
              <span style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"white", fontSize:"11px", fontWeight:700, padding:"3px 10px", borderRadius:"20px", letterSpacing:"0.5px" }}>BUSINESS</span>
            </div>
            <div style={{ color:"var(--text-muted)", fontSize:"13px", marginTop:"6px", display:"flex", gap:"6px", flexWrap:"wrap" }}>
              <span>📍 {biz.address?.city}, {biz.address?.state}</span>
              <span style={{ color:"var(--border)" }}>·</span>
              <span>{biz.category}</span>
              <span style={{ color:"var(--border)" }}>·</span>
              <span style={{ color:"#f59e0b", fontWeight:600 }}>★ {biz.rating}</span>
              <span style={{ color:"var(--text-muted)" }}>({biz.reviews} reviews)</span>
            </div>
          </div>

        </div>

        {/* ── Tabs ── */}
        <div style={{ display:"flex", gap:"6px", marginBottom:"28px", background:"var(--bg-input)", borderRadius:"16px", padding:"6px", width:"fit-content", animation:"fadeUp .5s .2s ease both" }}>
          {TABS.map((tb, i) => (
            <button
              key={tb}
              className="biz-tab-btn"
              onClick={() => setTab(i)}
              style={{
                padding:"9px 20px",
                background: tab === i ? "var(--bg-card)" : "transparent",
                border:"none",
                borderRadius:"12px",
                color: tab === i ? "var(--text-primary)" : "var(--text-muted)",
                fontWeight: tab === i ? 700 : 500,
                fontSize:"14px",
                cursor:"pointer",
                whiteSpace:"nowrap",
                boxShadow: tab === i ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                fontFamily:"system-ui, sans-serif",
              }}
            >{tb}</button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div style={{ animation:"fadeUp .4s .05s ease both" }}>
          {tab === 0 && <TabDashboard {...sharedProps} />}
          {tab === 1 && <div ref={settingsRef}><TabSettings {...sharedProps} /></div>}
        </div>

        <div style={{ height:"60px" }} />
      </div>
    </div>
  );
}

