import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AUCTIONS, formatINR } from "./auctionData";

const TABS = ["Dashboard", "My Listings", "Analytics", "Payouts", "Settings"];

const BIZ = {
  businessName:  "TechVault Pvt Ltd",
  gst:           "27AABCU9603R1ZX",
  category:      "Electronics",
  joinDate:      "October 2024",
  totalListings: 38,
  activeBids:    143,
  totalRevenue:  2840000,
  rating:        4.9,
  reviews:       112,
  verified:      true,
  phone:         "+91 87654 32109",
  email:         "seller@techvault.com",
  location:      "Mumbai, Maharashtra",
  website:       "www.techvault.in",
  bio:           "Premium electronics reseller with 5+ years of experience. All items verified and warranted. 100% authentic products.",
};

// business's own listings = first 5 auctions
const myListings = AUCTIONS.slice(0, 5).map((a, i) => ({
  ...a,
  status:   i === 0 || i === 3 ? "live" : i === 1 ? "ended" : "scheduled",
  views:    Math.floor(Math.random() * 400) + 100,
  revenue:  i === 1 ? a.currentBid : null,
}));

const monthlyRevenue = [
  { month: "Oct", rev: 180000 },
  { month: "Nov", rev: 240000 },
  { month: "Dec", rev: 320000 },
  { month: "Jan", rev: 290000 },
  { month: "Feb", rev: 410000 },
  { month: "Mar", rev: 520000 },
];
const maxRev = Math.max(...monthlyRevenue.map(m => m.rev));

export default function BusinessProfile() {
  const { userName } = useAuth();
  const [tab,     setTab]     = useState(0);
  const [editing, setEditing] = useState(false);

  const displayName = userName || BIZ.businessName;
  const initial     = displayName.charAt(0).toUpperCase();

  return (
    <div style={{ background: "#080e1a", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── COVER ── */}
      <div style={{ position: "relative", height: "200px", background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,102,241,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.06) 1px,transparent 1px)", backgroundSize: "50px 50px" }} />
        <div style={{ position: "absolute", top: "20%", left: "5%", width: "300px", height: "300px", background: "radial-gradient(circle,rgba(99,102,241,.12) 0%,transparent 70%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", top: "-10%", right: "10%", width: "200px", height: "200px", background: "radial-gradient(circle,rgba(56,189,248,.08) 0%,transparent 70%)", borderRadius: "50%" }} />
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 40px" }}>

        {/* ── PROFILE ROW ── */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "20px", marginTop: "-52px", marginBottom: "28px", flexWrap: "wrap", position: "relative", zIndex: 2 }}>
          <div style={{
            width: "96px", height: "96px", borderRadius: "20px",
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            border: "5px solid #080e1a",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "36px", fontWeight: 900, color: "white", flexShrink: 0,
            boxShadow: "0 8px 24px rgba(99,102,241,.35)",
          }}>🏢</div>

          <div style={{ flex: 1, paddingBottom: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1 style={{ color: "white", fontSize: "24px", fontWeight: 900, margin: 0 }}>{displayName}</h1>
              {BIZ.verified && <span style={{ background: "rgba(52,211,153,.15)", color: "#34d399", fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "50px", border: "1px solid rgba(52,211,153,.3)" }}>✓ Verified Seller</span>}
              <span style={{ background: "rgba(99,102,241,.1)", color: "#818cf8", fontSize: "10px", fontWeight: 700, padding: "3px 9px", borderRadius: "50px", textTransform: "uppercase", letterSpacing: ".05em" }}>🏢 Business</span>
            </div>
            <div style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>
              📍 {BIZ.location} · {BIZ.category} · ★ {BIZ.rating} ({BIZ.reviews} reviews)
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignSelf: "flex-end", marginBottom: "6px" }}>
            <button onClick={() => setEditing(e => !e)} style={{ padding: "9px 18px", borderRadius: "10px", border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.05)", color: "#94a3b8", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>✏️ Edit</button>
            <Link to="/create-auction" style={{ padding: "9px 18px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#38bdf8,#6366f1)", color: "white", fontWeight: 700, fontSize: "13px", textDecoration: "none", display: "flex", alignItems: "center" }}>➕ New Auction</Link>
          </div>
        </div>

        {/* ── STAT STRIP ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "28px" }}>
          {[
            { label: "Total Listings",  value: BIZ.totalListings,            icon: "📋", color: "#818cf8" },
            { label: "Active Bids",     value: BIZ.activeBids,               icon: "🔴", color: "#f43f5e" },
            { label: "Total Revenue",   value: formatINR(BIZ.totalRevenue),  icon: "💰", color: "#34d399" },
            { label: "Seller Rating",   value: "★ " + BIZ.rating,           icon: "⭐", color: "#f59e0b" },
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
              borderBottom: tab === i ? "2px solid #818cf8" : "2px solid transparent",
              color: tab === i ? "#818cf8" : "#64748b",
              fontWeight: 600, fontSize: "14px", cursor: "pointer",
              whiteSpace: "nowrap", transition: "color .2s",
            }}>{t}</button>
          ))}
        </div>

        {/* ── TAB CONTENT ── */}

        {/* Dashboard */}
        {tab === 0 && (
          <div style={{ animation: "fadeIn .3s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "20px" }}>
              {/* Business info */}
              <div style={card}>
                <CardTitle>Business Info</CardTitle>
                {editing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[["Business Name", BIZ.businessName], ["GST Number", BIZ.gst], ["Website", BIZ.website], ["Location", BIZ.location]].map(([l, v]) => (
                      <div key={l}>
                        <label style={{ color: "#64748b", fontSize: "11px", display: "block", marginBottom: "4px" }}>{l}</label>
                        <input defaultValue={v} style={{ width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "8px", color: "white", fontSize: "13px", padding: "8px 12px", outline: "none", boxSizing: "border-box" }} />
                      </div>
                    ))}
                    <button onClick={() => setEditing(false)} style={{ padding: "8px 18px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: "8px", color: "white", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>Save</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      ["🏢", "Business",  BIZ.businessName],
                      ["🔖", "GST",       BIZ.gst],
                      ["🌐", "Website",   BIZ.website],
                      ["📧", "Email",     BIZ.email],
                      ["📱", "Phone",     BIZ.phone],
                      ["📍", "Location",  BIZ.location],
                    ].map(([icon, label, val]) => (
                      <div key={label} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <span style={{ fontSize: "14px" }}>{icon}</span>
                        <span style={{ color: "#64748b", fontSize: "12px", width: "60px", flexShrink: 0 }}>{label}</span>
                        <span style={{ color: "#94a3b8", fontSize: "13px", wordBreak: "break-all" }}>{val}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick stats + recent */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={card}>
                  <CardTitle>Recent Listings</CardTitle>
                  {myListings.slice(0, 3).map(a => (
                    <div key={a.id} style={{ display: "flex", gap: "12px", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.05)", alignItems: "center" }}>
                      <img src={a.img} alt={a.title} style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: "white", fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.title}</div>
                        <div style={{ color: "#64748b", fontSize: "11px" }}>{a.totalBids} bids · {formatINR(a.currentBid)}</div>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  ))}
                </div>

                <div style={{ ...card, background: "linear-gradient(135deg,rgba(99,102,241,.1),rgba(56,189,248,.05))", borderColor: "rgba(99,102,241,.2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "4px" }}>This Month's Revenue</div>
                      <div style={{ color: "white", fontSize: "28px", fontWeight: 900 }}>{formatINR(520000)}</div>
                      <div style={{ color: "#34d399", fontSize: "12px", marginTop: "4px" }}>↑ 26% vs last month</div>
                    </div>
                    <div style={{ fontSize: "40px" }}>💰</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Listings */}
        {tab === 1 && (
          <div style={{ animation: "fadeIn .3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ color: "#64748b", fontSize: "14px" }}>{myListings.length} listings</div>
              <Link to="/create-auction" style={{ padding: "9px 20px", background: "linear-gradient(135deg,#38bdf8,#6366f1)", borderRadius: "10px", color: "white", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>➕ New Auction</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {myListings.map(a => (
                <div key={a.id} style={{ ...card, display: "flex", gap: "16px", alignItems: "center" }}>
                  <img src={a.img} alt={a.title} style={{ width: "72px", height: "72px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "white", fontWeight: 700, fontSize: "15px", marginBottom: "4px" }}>{a.title}</div>
                    <div style={{ color: "#64748b", fontSize: "12px" }}>{a.category} · {a.totalBids} bids · {a.views} views</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ color: "#38bdf8", fontSize: "18px", fontWeight: 800 }}>{formatINR(a.currentBid)}</div>
                    <StatusBadge status={a.status} />
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    <button style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "#94a3b8", fontSize: "12px", cursor: "pointer" }}>Edit</button>
                    {a.status === "live" && (
                      <button style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(244,63,94,.3)", background: "rgba(244,63,94,.1)", color: "#f43f5e", fontSize: "12px", cursor: "pointer" }}>End</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics */}
        {tab === 2 && (
          <div style={{ animation: "fadeIn .3s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* Revenue chart */}
              <div style={{ ...card, gridColumn: "1/-1" }}>
                <CardTitle>Monthly Revenue (Oct 2025 – Mar 2026)</CardTitle>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", height: "140px" }}>
                  {monthlyRevenue.map(m => (
                    <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                      <div style={{ color: "#64748b", fontSize: "10px" }}>{formatINR(m.rev)}</div>
                      <div style={{ width: "100%", height: `${(m.rev / maxRev) * 100}px`, background: "linear-gradient(to top,#6366f1,#38bdf8)", borderRadius: "6px 6px 0 0", transition: "height .5s ease", minHeight: "4px" }} />
                      <div style={{ color: "#64748b", fontSize: "11px", fontWeight: 600 }}>{m.month}</div>
                    </div>
                  ))}
                </div>
              </div>

              {[
                { label: "Avg Sale Price", value: formatINR(74500), icon: "📈", change: "+12%" },
                { label: "Conversion Rate", value: "68%",           icon: "🎯", change: "+5%" },
                { label: "Repeat Buyers",  value: "43%",            icon: "🔁", change: "+8%" },
                { label: "Avg Bids/Item",  value: "28",             icon: "🏷️", change: "+3%" },
              ].map(s => (
                <div key={s.label} style={card}>
                  <div style={{ fontSize: "24px", marginBottom: "10px" }}>{s.icon}</div>
                  <div style={{ color: "white", fontSize: "24px", fontWeight: 800 }}>{s.value}</div>
                  <div style={{ color: "#64748b", fontSize: "13px" }}>{s.label}</div>
                  <div style={{ color: "#34d399", fontSize: "12px", marginTop: "6px" }}>↑ {s.change} this month</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payouts */}
        {tab === 3 && (
          <div style={{ animation: "fadeIn .3s ease", maxWidth: "620px" }}>
            <div style={{ ...card, background: "linear-gradient(135deg,rgba(52,211,153,.08),rgba(56,189,248,.05))", borderColor: "rgba(52,211,153,.2)", marginBottom: "16px" }}>
              <div style={{ color: "#64748b", fontSize: "13px", marginBottom: "6px" }}>Available Balance</div>
              <div style={{ color: "#34d399", fontSize: "36px", fontWeight: 900, marginBottom: "4px" }}>{formatINR(248000)}</div>
              <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "16px" }}>Next payout: March 20, 2026</div>
              <button style={{ padding: "10px 24px", background: "linear-gradient(135deg,#34d399,#059669)", border: "none", borderRadius: "10px", color: "white", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>💸 Withdraw Now</button>
            </div>

            <div style={card}>
              <CardTitle>Payout History</CardTitle>
              {[
                { date: "Mar 1, 2026",  amount: 312000, status: "completed" },
                { date: "Feb 1, 2026",  amount: 280000, status: "completed" },
                { date: "Jan 1, 2026",  amount: 195000, status: "completed" },
                { date: "Dec 1, 2025",  amount: 223000, status: "completed" },
              ].map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,.05)" : "none" }}>
                  <div>
                    <div style={{ color: "white", fontSize: "14px", fontWeight: 600 }}>{formatINR(p.amount)}</div>
                    <div style={{ color: "#64748b", fontSize: "12px" }}>{p.date}</div>
                  </div>
                  <span style={{ padding: "3px 10px", borderRadius: "50px", fontSize: "11px", fontWeight: 700, background: "rgba(52,211,153,.1)", color: "#34d399" }}>✓ Paid</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings */}
        {tab === 4 && (
          <div style={{ animation: "fadeIn .3s ease", maxWidth: "560px" }}>
            <div style={card}>
              <CardTitle>Business Settings</CardTitle>
              {[
                ["Business Name",  "text",  BIZ.businessName],
                ["GST Number",     "text",  BIZ.gst],
                ["Contact Email",  "email", BIZ.email],
                ["Phone",          "tel",   BIZ.phone],
                ["Website",        "url",   BIZ.website],
                ["Location",       "text",  BIZ.location],
              ].map(([label, type, val]) => (
                <div key={label} style={{ marginBottom: "14px" }}>
                  <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</label>
                  <input type={type} defaultValue={val} style={{ width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "10px", color: "white", fontSize: "14px", padding: "10px 14px", outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
              <button style={{ padding: "11px 24px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: "10px", color: "white", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>Save Changes</button>
            </div>

            <div style={{ ...card, marginTop: "16px" }}>
              <CardTitle>Seller Notifications</CardTitle>
              {[
                ["Email when I get a new bid",    true],
                ["Email when auction ends",       true],
                ["Weekly performance report",     true],
                ["New buyer messages",            true],
              ].map(([label, def]) => (
                <Toggle key={label} label={label} defaultOn={def} />
              ))}
            </div>
          </div>
        )}

        <div style={{ height: "60px" }} />
      </div>

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

/* ── helpers ── */
const card = { background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: "16px", padding: "20px" };

function CardTitle({ children, color }) {
  return <div style={{ color: color || "white", fontWeight: 700, fontSize: "16px", marginBottom: "16px" }}>{children}</div>;
}

function StatusBadge({ status }) {
  const map = { live: ["rgba(244,63,94,.15)", "#f43f5e", "🔴 Live"], ended: ["rgba(100,116,139,.15)", "#64748b", "✓ Ended"], scheduled: ["rgba(245,158,11,.15)", "#f59e0b", "📅 Scheduled"] };
  const [bg, col, label] = map[status] || map.ended;
  return <span style={{ display: "inline-block", marginTop: "4px", padding: "3px 9px", borderRadius: "50px", fontSize: "10px", fontWeight: 700, background: bg, color: col }}>{label}</span>;
}

function Toggle({ label, defaultOn }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
      <span style={{ color: "#94a3b8", fontSize: "14px" }}>{label}</span>
      <div onClick={() => setOn(o => !o)} style={{ width: "38px", height: "22px", borderRadius: "11px", background: on ? "#6366f1" : "rgba(255,255,255,.1)", position: "relative", cursor: "pointer", transition: "background .2s" }}>
        <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "white", position: "absolute", top: "3px", left: on ? "19px" : "3px", transition: "left .2s" }} />
      </div>
    </div>
  );
}
