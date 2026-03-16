import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AUCTIONS, formatINR, formatTime } from "./auctionData";

const TABS = ["Overview", "Active Bids", "Won Auctions", "Watchlist", "Settings"];

// Mock personal user data
const USER = {
  joinDate:     "January 2025",
  totalBids:    47,
  wonAuctions:  8,
  totalSpent:   342000,
  rating:       4.8,
  reviews:      23,
  verified:     true,
  phone:        "+91 98765 43210",
  email:        "user@email.com",
  location:     "Ahmedabad, Gujarat",
  bio:          "Avid collector of electronics and luxury watches. Always looking for the next great deal!",
  avatar:       null,
};

const activeBids = AUCTIONS.slice(0, 4).map((a, i) => ({
  ...a,
  myBid:    a.currentBid - i * 2000,
  status:   i === 0 ? "winning" : i === 1 ? "outbid" : "winning",
}));

const wonAuctions = AUCTIONS.slice(4, 7).map(a => ({
  ...a,
  paidAmount: a.currentBid,
  wonDate:    "Mar " + (10 - AUCTIONS.indexOf(a)) + ", 2026",
  delivered:  AUCTIONS.indexOf(a) > 5,
}));

const watchlist = AUCTIONS.slice(5, 9);

export default function PersonalProfile() {
  const { userName } = useAuth();
  const [tab,     setTab]     = useState(0);
  const [editing, setEditing] = useState(false);
  const [bio,     setBio]     = useState(USER.bio);

  const initial = (userName || "U").charAt(0).toUpperCase();

  return (
    <div style={{ background: "#080e1a", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── COVER + AVATAR ── */}
      <div style={{ position: "relative", height: "200px", background: "linear-gradient(135deg,#0ea5e9 0%,#6366f1 50%,#8b5cf6 100%)" }}>
        {/* animated pattern */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,.06) 0%, transparent 40%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(56,189,248,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.04) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 40px" }}>

        {/* ── PROFILE ROW ── */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "20px", marginTop: "-52px", marginBottom: "28px", flexWrap: "wrap", position: "relative", zIndex: 2 }}>
          {/* Avatar */}
          <div style={{
            width: "96px", height: "96px", borderRadius: "20px",
            background: "linear-gradient(135deg,#38bdf8,#6366f1)",
            border: "5px solid #080e1a",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "36px", fontWeight: 900, color: "white", flexShrink: 0,
            boxShadow: "0 8px 24px rgba(56,189,248,.3)",
          }}>{initial}</div>

          <div style={{ flex: 1, paddingBottom: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1 style={{ color: "white", fontSize: "24px", fontWeight: 900, margin: 0 }}>{userName || "User"}</h1>
              {USER.verified && <span style={{ background: "rgba(56,189,248,.15)", color: "#38bdf8", fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "50px", border: "1px solid rgba(56,189,248,.3)" }}>✓ Verified</span>}
              <span style={{ background: "rgba(56,189,248,.08)", color: "#38bdf8", fontSize: "10px", fontWeight: 700, padding: "3px 9px", borderRadius: "50px", textTransform: "uppercase", letterSpacing: ".05em" }}>👤 Personal</span>
            </div>
            <div style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>📍 {USER.location} · Joined {USER.joinDate}</div>
          </div>

          <button onClick={() => setEditing(e => !e)} style={{
            padding: "9px 20px", borderRadius: "10px",
            border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.05)",
            color: "#94a3b8", fontWeight: 600, fontSize: "13px", cursor: "pointer",
            alignSelf: "flex-end", marginBottom: "6px",
          }}>✏️ Edit Profile</button>
        </div>

        {/* ── STAT STRIP ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "28px" }}>
          {[
            { label: "Total Bids",    value: USER.totalBids,                   icon: "🏷️", color: "#38bdf8" },
            { label: "Auctions Won",  value: USER.wonAuctions,                 icon: "🏆", color: "#f59e0b" },
            { label: "Total Spent",   value: formatINR(USER.totalSpent),       icon: "💰", color: "#34d399" },
            { label: "Seller Rating", value: "★ " + USER.rating,              icon: "⭐", color: "#818cf8" },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: "14px", padding: "18px 20px" }}>
              <div style={{ fontSize: "22px", marginBottom: "8px" }}>{s.icon}</div>
              <div style={{ color: s.color, fontSize: "22px", fontWeight: 800 }}>{s.value}</div>
              <div style={{ color: "#64748b", fontSize: "12px", marginTop: "3px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── TABS ── */}
        <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid rgba(255,255,255,.07)", marginBottom: "28px", overflowX: "auto" }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{
              padding: "10px 20px", background: "transparent", border: "none",
              borderBottom: tab === i ? "2px solid #38bdf8" : "2px solid transparent",
              color: tab === i ? "#38bdf8" : "#64748b",
              fontWeight: 600, fontSize: "14px", cursor: "pointer",
              whiteSpace: "nowrap", transition: "color .2s",
            }}>{t}</button>
          ))}
        </div>

        {/* ── TAB CONTENT ── */}

        {/* Overview */}
        {tab === 0 && (
          <div style={{ animation: "fadeIn .3s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "20px" }}>
              {/* Bio */}
              <div style={card}>
                <CardTitle>About</CardTitle>
                {editing ? (
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4}
                    style={{ width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", borderRadius: "10px", color: "white", fontSize: "14px", padding: "10px 12px", outline: "none", resize: "none", boxSizing: "border-box" }}
                  />
                ) : (
                  <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>{bio}</p>
                )}
                <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    ["📧", "Email",    USER.email],
                    ["📱", "Phone",    USER.phone],
                    ["📍", "Location", USER.location],
                  ].map(([icon, label, val]) => (
                    <div key={label} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <span style={{ fontSize: "16px" }}>{icon}</span>
                      <span style={{ color: "#64748b", fontSize: "13px", width: "64px" }}>{label}</span>
                      <span style={{ color: "#94a3b8", fontSize: "13px" }}>{val}</span>
                    </div>
                  ))}
                </div>
                {editing && (
                  <button onClick={() => setEditing(false)} style={{ marginTop: "14px", padding: "8px 18px", background: "linear-gradient(135deg,#38bdf8,#6366f1)", border: "none", borderRadius: "8px", color: "white", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>Save Changes</button>
                )}
              </div>

              {/* Recent activity */}
              <div style={card}>
                <CardTitle>Recent Activity</CardTitle>
                {activeBids.slice(0, 3).map(a => (
                  <div key={a.id} style={{ display: "flex", gap: "12px", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,.05)", alignItems: "center" }}>
                    <img src={a.img} alt={a.title} style={{ width: "44px", height: "44px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "white", fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.title}</div>
                      <div style={{ color: "#64748b", fontSize: "11px", marginTop: "2px" }}>Your bid: {formatINR(a.myBid)}</div>
                    </div>
                    <span style={{
                      padding: "3px 9px", borderRadius: "50px", fontSize: "10px", fontWeight: 700, flexShrink: 0,
                      background: a.status === "winning" ? "rgba(52,211,153,.15)" : "rgba(244,63,94,.15)",
                      color: a.status === "winning" ? "#34d399" : "#f43f5e",
                    }}>{a.status === "winning" ? "🥇 Winning" : "⚡ Outbid"}</span>
                  </div>
                ))}
                <Link to="/browse" style={{ display: "block", textAlign: "center", marginTop: "14px", color: "#38bdf8", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>Browse more auctions →</Link>
              </div>
            </div>
          </div>
        )}

        {/* Active Bids */}
        {tab === 1 && (
          <div style={{ animation: "fadeIn .3s ease" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {activeBids.map(a => (
                <div key={a.id} style={{ ...card, flexDirection: "row", alignItems: "center", gap: "16px", display: "flex" }}>
                  <img src={a.img} alt={a.title} style={{ width: "72px", height: "72px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "white", fontWeight: 700, fontSize: "15px", marginBottom: "4px" }}>{a.title}</div>
                    <div style={{ color: "#64748b", fontSize: "12px" }}>{a.category} · Ends in {formatTime(a.endsIn)}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ color: "#64748b", fontSize: "11px", marginBottom: "3px" }}>Your Bid</div>
                    <div style={{ color: "#38bdf8", fontSize: "18px", fontWeight: 800 }}>{formatINR(a.myBid)}</div>
                    <span style={{
                      display: "inline-block", marginTop: "4px", padding: "3px 9px", borderRadius: "50px", fontSize: "10px", fontWeight: 700,
                      background: a.status === "winning" ? "rgba(52,211,153,.15)" : "rgba(244,63,94,.15)",
                      color: a.status === "winning" ? "#34d399" : "#f43f5e",
                    }}>{a.status === "winning" ? "🥇 Winning" : "⚡ Outbid — raise bid"}</span>
                  </div>
                  <Link to="/browse" style={{ padding: "9px 18px", background: "linear-gradient(135deg,#38bdf8,#6366f1)", borderRadius: "9px", color: "white", fontWeight: 700, fontSize: "12px", textDecoration: "none", flexShrink: 0 }}>
                    {a.status === "outbid" ? "Raise Bid" : "View"}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Won Auctions */}
        {tab === 2 && (
          <div style={{ animation: "fadeIn .3s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {wonAuctions.map(a => (
                <div key={a.id} style={card}>
                  <img src={a.img} alt={a.title} style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "10px", marginBottom: "14px" }} />
                  <div style={{ color: "#f59e0b", fontSize: "11px", fontWeight: 700, marginBottom: "4px" }}>🏆 WON</div>
                  <div style={{ color: "white", fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>{a.title}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ color: "#64748b", fontSize: "11px" }}>Paid</div>
                      <div style={{ color: "#34d399", fontWeight: 800, fontSize: "16px" }}>{formatINR(a.paidAmount)}</div>
                    </div>
                    <span style={{ padding: "4px 10px", borderRadius: "50px", fontSize: "10px", fontWeight: 700, background: a.delivered ? "rgba(52,211,153,.15)" : "rgba(245,158,11,.15)", color: a.delivered ? "#34d399" : "#f59e0b" }}>
                      {a.delivered ? "✅ Delivered" : "📦 In Transit"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Watchlist */}
        {tab === 3 && (
          <div style={{ animation: "fadeIn .3s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
              {watchlist.map(a => (
                <div key={a.id} style={{ ...card, padding: "0", overflow: "hidden" }}>
                  <img src={a.img} alt={a.title} style={{ width: "100%", height: "150px", objectFit: "cover" }} />
                  <div style={{ padding: "14px" }}>
                    <div style={{ color: "white", fontWeight: 700, fontSize: "14px", marginBottom: "6px" }}>{a.title}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <div style={{ color: "#38bdf8", fontWeight: 800, fontSize: "16px" }}>{formatINR(a.currentBid)}</div>
                      <div style={{ color: "#64748b", fontSize: "12px" }}>{formatTime(a.endsIn)}</div>
                    </div>
                    <Link to="/browse" style={{ display: "block", textAlign: "center", padding: "9px", background: "linear-gradient(135deg,#38bdf8,#6366f1)", borderRadius: "9px", color: "white", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>Bid Now →</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings */}
        {tab === 4 && (
          <div style={{ animation: "fadeIn .3s ease", maxWidth: "560px" }}>
            <div style={card}>
              <CardTitle>Account Settings</CardTitle>
              {[
                ["Full Name",    "text",     userName || ""],
                ["Email",        "email",    USER.email],
                ["Phone",        "tel",      USER.phone],
                ["Location",     "text",     USER.location],
              ].map(([label, type, val]) => (
                <div key={label} style={{ marginBottom: "14px" }}>
                  <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</label>
                  <input type={type} defaultValue={val} style={{ width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "10px", color: "white", fontSize: "14px", padding: "10px 14px", outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
              <button style={{ padding: "11px 24px", background: "linear-gradient(135deg,#38bdf8,#6366f1)", border: "none", borderRadius: "10px", color: "white", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>Save Changes</button>
            </div>

            <div style={{ ...card, marginTop: "16px" }}>
              <CardTitle>Notifications</CardTitle>
              {[
                ["Email me when I'm outbid",         true],
                ["Email me when I win an auction",   true],
                ["SMS for ending soon alerts",       false],
                ["Weekly newsletter",                false],
              ].map(([label, def]) => (
                <Toggle key={label} label={label} defaultOn={def} />
              ))}
            </div>

            <div style={{ ...card, marginTop: "16px", borderColor: "rgba(244,63,94,.2)" }}>
              <CardTitle color="#f43f5e">Danger Zone</CardTitle>
              <button style={{ padding: "10px 20px", background: "rgba(244,63,94,.1)", border: "1px solid rgba(244,63,94,.25)", borderRadius: "9px", color: "#f43f5e", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>Delete Account</button>
            </div>
          </div>
        )}

        <div style={{ height: "60px" }} />
      </div>

      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

/* ── helpers ── */
const card = { background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: "16px", padding: "20px" };

function CardTitle({ children, color }) {
  return <div style={{ color: color || "white", fontWeight: 700, fontSize: "16px", marginBottom: "16px" }}>{children}</div>;
}

function Toggle({ label, defaultOn }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
      <span style={{ color: "#94a3b8", fontSize: "14px" }}>{label}</span>
      <div onClick={() => setOn(o => !o)} style={{ width: "38px", height: "22px", borderRadius: "11px", background: on ? "#38bdf8" : "rgba(255,255,255,.1)", position: "relative", cursor: "pointer", transition: "background .2s" }}>
        <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "white", position: "absolute", top: "3px", left: on ? "19px" : "3px", transition: "left .2s" }} />
      </div>
    </div>
  );
}
