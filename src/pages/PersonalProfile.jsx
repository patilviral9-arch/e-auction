import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { formatINR } from "../components/user/auctionData";
import Swal from "sweetalert2";
import { useLocation } from "react-router-dom";

const CLOUDINARY_CLOUD  = "df7qog24u";
const CLOUDINARY_PRESET = "E-TEST";
const TABS = ["Overview", "Settings"];

async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append("file", file); fd.append("upload_preset", CLOUDINARY_PRESET); fd.append("cloud_name", CLOUDINARY_CLOUD);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: "POST", body: fd });
  return (await res.json()).secure_url;
}

async function saveToMongo(userId, payload) {
  const res = await fetch(`http://localhost:3000/user/updateuser/${userId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  return res.json();
}

export default function PersonalProfile() {
  const navigate = useNavigate();
  const { userName, userEmail, userId, logout, setAvatar: setContextAvatar } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [tab,          setTab]          = useState(0);
  const [avatar,       setAvatar]       = useState(null);
  const [uploadingAvt, setUploadingAvt] = useState(false);
  const [saveStatus,   setSaveStatus]   = useState("");

  const [profile, setProfile] = useState({ bio: "", phone: "", address: "" });
  const [draft,   setDraft]   = useState({ bio: "", phone: "", address: "" });

  const [bidStats, setBidStats] = useState({ totalBids: 0, totalSpent: 0 });

  const location = useLocation();
  const avatarInputRef = useRef(null);
  const settingsRef = useRef(null);

  useEffect(() => {
    if (location.state?.tab !== undefined) setTab(location.state.tab);
  }, [location.state]);

  useEffect(() => {
    if (!userId) return;
    fetch(`http://localhost:3000/user/getuser/${userId}`)
      .then(r => r.json())
      .then(({ data }) => {
        if (!data) return;
        if (data.avatar) setAvatar(data.avatar);
        const fetched = {
          bio:     data.bio   || "",
          phone:   data.phone || "",
          address: data.address?.city
            ? `${data.address.city}${data.address.state ? ", " + data.address.state : ""}`
            : (typeof data.address === "string" ? data.address : ""),
        };
        setProfile(fetched); setDraft(fetched);
      })
      .catch(console.error);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetch(`http://localhost:3000/bid/bids/bidder/${userId}`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => {
        const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        const totalBids = list.length;
        const highestPerAuction = {};
        list.forEach(b => {
          const auctionId = b.auction && typeof b.auction === "object"
            ? String(b.auction._id || b.auction.id || "")
            : String(b.auction || "");
          if (!auctionId) return;
          const amt = Number(b.bidAmount) || 0;
          if (!highestPerAuction[auctionId] || amt > highestPerAuction[auctionId])
            highestPerAuction[auctionId] = amt;
        });
        const totalSpent = Object.values(highestPerAuction).reduce((sum, amt) => sum + amt, 0);
        setBidStats({ totalBids, totalSpent });
      })
      .catch(console.error);
  }, [userId]);

  useEffect(() => {
    if (tab === 1 && settingsRef.current) {
      setTimeout(() => settingsRef.current.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [tab]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setAvatar(URL.createObjectURL(file)); setUploadingAvt(true);
    try { const url = await uploadToCloudinary(file); await saveToMongo(userId, { avatar: url }); setAvatar(url); setContextAvatar(url); }
    catch (err) { console.error(err); } finally { setUploadingAvt(false); e.target.value = ""; }
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await saveToMongo(userId, { bio: draft.bio, phone: draft.phone, address: { city: draft.address } });
      setProfile({ ...draft });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2500);
    } catch { setSaveStatus("error"); setTimeout(() => setSaveStatus(""), 2500); }
  };

  const initial = (userName || "U").charAt(0).toUpperCase();

  // ── Theme-aware styles ──
  const card = {
    background: "var(--bg-secondary)",
    borderRadius: "20px",
    padding: "22px",
    boxShadow: isLight ? "0 2px 12px rgba(0,0,0,0.06)" : "0 2px 12px rgba(0,0,0,0.3)",
    border: "1px solid var(--border)",
  };

  const inputStyle = {
    width: "100%",
    background: isLight ? "#f8fafc" : "rgba(255,255,255,0.05)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    color: "var(--text-primary)",
    fontSize: "14px",
    padding: "10px 14px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.2s",
  };

  const lockedStyle = {
    ...inputStyle,
    background: isLight ? "#f1f5f9" : "rgba(255,255,255,0.03)",
    color: "var(--text-muted)",
    cursor: "not-allowed",
  };

  const labelStyle = {
    color: "var(--text-muted)",
    fontSize: "12px",
    fontWeight: 600,
    display: "block",
    marginBottom: "7px",
    textTransform: "uppercase",
    letterSpacing: ".04em",
  };

  const pageBg   = isLight ? "#f5f4f0" : "var(--bg-primary)";
  const heroBg   = isLight ? "#0f0e17" : "#070711";
  const bannerFade = isLight
    ? "linear-gradient(to top, #f5f4f0, transparent)"
    : "linear-gradient(to top, var(--bg-primary), transparent)";
  const tabBarBg  = isLight ? "#ebebeb" : "rgba(255,255,255,0.06)";
  const tabActive = isLight ? "#ffffff"  : "rgba(255,255,255,0.12)";
  const tabActiveTxt = "var(--text-primary)";
  const tabInactiveTxt = "var(--text-muted)";
  const headingColor   = "var(--text-primary)";
  const subColor       = "var(--text-secondary)";
  const metaColor      = "var(--text-muted)";
  const bodyTextColor  = "var(--text-secondary)";
  const avatarBorder   = isLight ? "#f5f4f0" : "var(--bg-primary)";
  const dividerColor   = "var(--border)";
  const lockedBadgeBg  = isLight ? "#f1f5f9" : "rgba(255,255,255,0.07)";

  return (
    <div style={{ background: pageBg, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        .per-tab-btn { transition: all 0.2s; }
        .per-tab-btn:hover { background: ${tabActive} !important; }
        .per-avatar-wrap:hover .per-avatar-overlay { opacity: 1 !important; }
        .per-input-focus:focus { border-color: rgba(56,189,248,0.5) !important; }
      `}</style>

      <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />

      {/* ── Hero Banner ── */}
      <div style={{ position: "relative", height: "220px", overflow: "hidden", background: heroBg }}>
        <div style={{ position:"absolute", top:"-60px", left:"-40px",  width:"320px", height:"320px", borderRadius:"50%", background:"radial-gradient(circle, #38bdf8 0%, transparent 70%)", opacity:0.5,  filter:"blur(60px)" }} />
        <div style={{ position:"absolute", top:"-40px", left:"30%",    width:"280px", height:"280px", borderRadius:"50%", background:"radial-gradient(circle, #6366f1 0%, transparent 70%)", opacity:0.45, filter:"blur(60px)" }} />
        <div style={{ position:"absolute", top:"-30px", right:"10%",   width:"300px", height:"300px", borderRadius:"50%", background:"radial-gradient(circle, #8b5cf6 0%, transparent 70%)", opacity:0.4,  filter:"blur(60px)" }} />
        <div style={{ position:"absolute", bottom:"-40px", left:"55%", width:"260px", height:"260px", borderRadius:"50%", background:"radial-gradient(circle, #06b6d4 0%, transparent 70%)", opacity:0.35, filter:"blur(55px)" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)", backgroundSize:"28px 28px", opacity:0.6 }} />
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"80px", background: bannerFade }} />
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 32px" }}>

        {/* ── Profile Row ── */}
        <div style={{ display:"flex", alignItems:"center", gap:"20px", marginTop:"-60px", marginBottom:"32px", flexWrap:"wrap", position:"relative", zIndex:2, animation:"fadeUp .5s ease both" }}>

          <div className="per-avatar-wrap" onClick={() => avatarInputRef.current?.click()}
            style={{ position:"relative", width:"110px", height:"110px", borderRadius:"50%", flexShrink:0, cursor:"pointer", border:`5px solid ${avatarBorder}`, boxShadow:"0 8px 32px rgba(56,189,248,0.35)", overflow:"hidden" }}>
            {avatar
              ? <img src={avatar} alt="Avatar" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
              : <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#38bdf8,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"40px", fontWeight:900, color:"white", fontFamily:"system-ui, sans-serif" }}>{initial}</div>
            }
            <div className="per-avatar-overlay" style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", opacity: uploadingAvt ? 1 : 0, transition:"opacity .2s" }}>
              <div style={{ color:"white", fontSize:"11px", fontWeight:700 }}>{uploadingAvt ? "Uploading…" : "📷 Change"}</div>
            </div>
          </div>

          <div style={{ flex:1, paddingBottom:"8px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap" }}>
              <h1 style={{ fontFamily:"system-ui, sans-serif", color: headingColor, fontSize:"28px", fontWeight:800, margin:0, letterSpacing:"-0.5px" }}>{userName || "User"}</h1>
              <span style={{ background:"linear-gradient(135deg,#38bdf8,#6366f1)", color:"white", fontSize:"11px", fontWeight:700, padding:"3px 10px", borderRadius:"20px", letterSpacing:"0.5px" }}>PERSONAL</span>
            </div>
            <div style={{ color: metaColor, fontSize:"13px", marginTop:"6px", display:"flex", gap:"6px", flexWrap:"wrap" }}>
              {profile.address && <><span>📍 {profile.address}</span><span style={{ color: dividerColor }}>·</span></>}
              <span>Joined January 2025</span>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:"flex", gap:"6px", marginBottom:"28px", background: tabBarBg, borderRadius:"16px", padding:"6px", width:"fit-content", animation:"fadeUp .5s .2s ease both" }}>
          {TABS.map((tb, i) => (
            <button key={tb} className="per-tab-btn" onClick={() => setTab(i)}
              style={{ padding:"9px 20px", background: tab === i ? tabActive : "transparent", border:"none", borderRadius:"12px", color: tab === i ? tabActiveTxt : tabInactiveTxt, fontWeight: tab === i ? 700 : 500, fontSize:"14px", cursor:"pointer", whiteSpace:"nowrap", boxShadow: tab === i ? "0 2px 8px rgba(0,0,0,0.1)" : "none", fontFamily:"system-ui, sans-serif" }}
            >{tb}</button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div style={{ animation:"fadeUp .4s .05s ease both" }}>

          {/* OVERVIEW */}
          {tab === 0 && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:"20px" }}>

              {/* About */}
              <div style={card}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
                  <div style={{ fontFamily:"system-ui, sans-serif", color: headingColor, fontWeight:700, fontSize:"16px" }}>About</div>
                  <button onClick={() => { setDraft({ ...profile }); setTab(1); }}
                    style={{ background:"none", border:`1px solid var(--border)`, borderRadius:"8px", color: subColor, fontSize:"11px", padding:"4px 10px", cursor:"pointer" }}>
                    ✏️ Edit
                  </button>
                </div>
                <p style={{ color: bodyTextColor, fontSize:"14px", lineHeight:1.7, margin:"0 0 16px" }}>{profile.bio || "No bio yet. Click Edit to add one."}</p>
                <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                  {[
                    ["📧", "Email",   userEmail || "—"],
                    ["📱", "Phone",   profile.phone || "—"],
                    ["📍", "Address", profile.address || "—"],
                  ].map(([icon, label, val]) => (
                    <div key={label} style={{ display:"flex", gap:"10px", alignItems:"center" }}>
                      <span style={{ fontSize:"14px", width:"18px", textAlign:"center" }}>{icon}</span>
                      <span style={{ color: metaColor, fontSize:"12px", width:"70px", flexShrink:0 }}>{label}</span>
                      <span style={{ color: bodyTextColor, fontSize:"13px", wordBreak:"break-all" }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bidding Summary */}
              <div style={card}>
                <div style={{ fontFamily:"system-ui, sans-serif", color: headingColor, fontWeight:700, fontSize:"16px", marginBottom:"20px" }}>Bidding Summary</div>
                <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", background:"linear-gradient(135deg,rgba(56,189,248,0.06),rgba(99,102,241,0.06))", borderRadius:"14px", border:"1px solid rgba(56,189,248,0.15)" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                      <span style={{ fontSize:"22px" }}>🏷️</span>
                      <span style={{ color: subColor, fontSize:"13px", fontWeight:600 }}>Total Bids Placed</span>
                    </div>
                    <span style={{ background:"linear-gradient(135deg,#38bdf8,#6366f1)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", fontSize:"20px", fontWeight:800, fontFamily:"system-ui, sans-serif" }}>{bidStats.totalBids}</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", background:"linear-gradient(135deg,rgba(16,185,129,0.06),rgba(6,182,212,0.06))", borderRadius:"14px", border:"1px solid rgba(16,185,129,0.15)" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                      <span style={{ fontSize:"22px" }}>💰</span>
                      <span style={{ color: subColor, fontSize:"13px", fontWeight:600 }}>Total Spent</span>
                    </div>
                    <span style={{ background:"linear-gradient(135deg,#10b981,#06b6d4)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", fontSize:"20px", fontWeight:800, fontFamily:"system-ui, sans-serif" }}>{formatINR(bidStats.totalSpent)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {tab === 1 && (
            <div ref={settingsRef} style={{ maxWidth:"560px" }}>

              {/* Account Settings */}
              <div style={card}>
                <div style={{ fontFamily:"system-ui, sans-serif", color: headingColor, fontWeight:800, fontSize:"18px", marginBottom:"20px" }}>Account Settings</div>

                {/* Full Name — locked */}
                <div style={{ marginBottom:"16px" }}>
                  <label style={{ ...labelStyle, display:"flex", alignItems:"center", gap:"8px" }}>
                    Full Name
                    <span style={{ background: lockedBadgeBg, color: metaColor, fontSize:"9px", padding:"2px 7px", borderRadius:"4px", fontWeight:700 }}>🔒 From Login</span>
                  </label>
                  <input type="text" value={userName || ""} disabled style={lockedStyle} />
                  <p style={{ color: metaColor, fontSize:"11px", margin:"4px 0 0" }}>This field is tied to your login and cannot be changed here.</p>
                </div>

                {/* Email — locked */}
                <div style={{ marginBottom:"16px" }}>
                  <label style={{ ...labelStyle, display:"flex", alignItems:"center", gap:"8px" }}>
                    Email
                    <span style={{ background: lockedBadgeBg, color: metaColor, fontSize:"9px", padding:"2px 7px", borderRadius:"4px", fontWeight:700 }}>🔒 From Login</span>
                  </label>
                  <input type="email" value={userEmail || ""} disabled style={lockedStyle} />
                  <p style={{ color: metaColor, fontSize:"11px", margin:"4px 0 0" }}>This field is tied to your login and cannot be changed here.</p>
                </div>

                {/* Phone */}
                <div style={{ marginBottom:"16px" }}>
                  <label style={labelStyle}>Phone</label>
                  <input className="per-input-focus" type="tel" value={draft.phone} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} placeholder="+91 98765 43210" style={inputStyle} />
                </div>

                {/* Address */}
                <div style={{ marginBottom:"16px" }}>
                  <label style={labelStyle}>Address</label>
                  <input className="per-input-focus" type="text" value={draft.address} onChange={e => setDraft(d => ({ ...d, address: e.target.value }))} placeholder="e.g. Ahmedabad, Gujarat" style={inputStyle} />
                </div>

                {/* Bio */}
                <div style={{ marginBottom:"20px" }}>
                  <label style={labelStyle}>Bio</label>
                  <textarea className="per-input-focus" value={draft.bio} onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))} rows={4}
                    style={{ ...inputStyle, resize:"vertical", minHeight:"90px" }} />
                </div>

                <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
                  <button onClick={handleSave} disabled={saveStatus === "saving"}
                    style={{ padding:"11px 28px", background:"linear-gradient(135deg,#38bdf8,#6366f1)", border:"none", borderRadius:"12px", color:"white", fontWeight:700, fontSize:"14px", cursor: saveStatus === "saving" ? "not-allowed" : "pointer", opacity: saveStatus === "saving" ? 0.7 : 1, fontFamily:"system-ui, sans-serif" }}>
                    {saveStatus === "saving" ? "⏳ Saving…" : "💾 Save Changes"}
                  </button>
                  {saveStatus === "saved" && <span style={{ color:"#10b981", fontSize:"13px", fontWeight:600 }}>✅ Saved!</span>}
                  {saveStatus === "error"  && <span style={{ color:"#f43f5e", fontSize:"13px", fontWeight:600 }}>❌ Failed. Try again.</span>}
                </div>
              </div>

              {/* Notifications */}
              <div style={{ ...card, marginTop:"16px" }}>
                <div style={{ fontFamily:"system-ui, sans-serif", color: headingColor, fontWeight:700, fontSize:"16px", marginBottom:"16px" }}>Notifications</div>
                {[["Email me when I'm outbid",true],["Email me when I win an auction",true],["SMS for ending soon alerts",false],["Weekly newsletter",false]].map(([label, def]) => (
                  <Toggle key={label} label={label} defaultOn={def} isLight={isLight} />
                ))}
              </div>

              {/* Danger Zone */}
              <div style={{ ...card, marginTop:"16px", borderColor:"rgba(244,63,94,.2)" }}>
                <div style={{ color:"#f43f5e", fontWeight:700, fontSize:"16px", marginBottom:"16px", fontFamily:"system-ui, sans-serif" }}>Danger Zone</div>
                <button onClick={async () => {
                  const result = await Swal.fire({
                    title: "Delete Account?",
                    text: "This will permanently delete your account and all your data. This cannot be undone.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#e11d48",
                    cancelButtonColor: "#475569",
                    confirmButtonText: "Yes, delete it",
                    cancelButtonText: "Cancel",
                    background: isLight ? "#ffffff" : "#1e293b",
                    color: isLight ? "#0f172a" : "#f1f5f9",
                  });
                  if (!result.isConfirmed) return;
                  try {
                    const res = await fetch(`http://localhost:3000/user/deleteuser/${userId}`, { method: "DELETE" });
                    if (!res.ok) throw new Error("Delete failed");
                    await Swal.fire({ title: "Deleted!", text: "Your account has been deleted.", icon: "success", background: isLight ? "#ffffff" : "#1e293b", color: isLight ? "#0f172a" : "#f1f5f9", confirmButtonColor: "#38bdf8", timer: 2000, showConfirmButton: false, allowOutsideClick: false });
                    logout(); navigate("/");
                  } catch (err) {
                    Swal.fire({ title: "Error", text: err.message, icon: "error", background: isLight ? "#ffffff" : "#1e293b", color: isLight ? "#0f172a" : "#f1f5f9" });
                  }
                }}
                style={{ padding:"10px 20px", background:"rgba(244,63,94,.08)", border:"1px solid rgba(244,63,94,.25)", borderRadius:"10px", color:"#f43f5e", fontWeight:700, fontSize:"13px", cursor:"pointer", fontFamily:"system-ui, sans-serif" }}>
                  🗑️ Delete Account
                </button>
              </div>

            </div>
          )}
        </div>
        
        <div style={{ height:"60px" }} />
      </div>
    </div>
  );
}

function Toggle({ label, defaultOn, isLight }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
      <span style={{ color:"var(--text-secondary)", fontSize:"14px" }}>{label}</span>
      <div onClick={() => setOn(o => !o)} style={{ width:"38px", height:"22px", borderRadius:"11px", background: on ? "#38bdf8" : isLight ? "#e2e8f0" : "rgba(255,255,255,0.12)", position:"relative", cursor:"pointer", transition:"background .2s" }}>
        <div style={{ width:"16px", height:"16px", borderRadius:"50%", background:"white", position:"absolute", top:"3px", left: on ? "19px" : "3px", transition:"left .2s", boxShadow:"0 1px 4px rgba(0,0,0,0.15)" }} />
      </div>
    </div>
  );
}

