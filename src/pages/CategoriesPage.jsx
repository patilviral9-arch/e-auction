import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const CATEGORIES = [
  {
    label: "Electronics",
    icon: "⚡",
    color: "#38bdf8",
    gradient: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
    bg: "rgba(56,189,248,0.08)",
    border: "rgba(56,189,248,0.25)",
    sub: ["Smartphones", "Laptops", "Cameras", "Audio", "Tablets", "Wearables"],
    desc: "Cutting-edge gadgets & tech from top brands",
    count: "1,240+ lots",
  },
  {
    label: "Vehicles",
    icon: "🚗",
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #d97706, #f59e0b)",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.25)",
    sub: ["Motorcycles", "Cars", "Boats", "Trucks", "Parts", "Vintage"],
    desc: "Classic rides to modern machines",
    count: "380+ lots",
  },
  {
    label: "Collectibles",
    icon: "🏺",
    color: "#a78bfa",
    gradient: "linear-gradient(135deg, #7c3aed, #a78bfa)",
    bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.25)",
    sub: ["Coins", "Stamps", "Art", "Antiques", "Comics", "Memorabilia"],
    desc: "Rare treasures for the passionate collector",
    count: "920+ lots",
  },
  {
    label: "Luxury",
    icon: "💎",
    color: "#34d399",
    gradient: "linear-gradient(135deg, #059669, #34d399)",
    bg: "rgba(52,211,153,0.08)",
    border: "rgba(52,211,153,0.25)",
    sub: ["Watches", "Jewellery", "Bags", "Pens", "Sunglasses", "Accessories"],
    desc: "Premium goods from the world's finest houses",
    count: "540+ lots",
  },
  {
    label: "Real Estate",
    icon: "🏠",
    color: "#f43f5e",
    gradient: "linear-gradient(135deg, #e11d48, #f43f5e)",
    bg: "rgba(244,63,94,0.08)",
    border: "rgba(244,63,94,0.25)",
    sub: ["Residential", "Commercial", "Land", "Villas", "Plots", "Industrial"],
    desc: "Properties & land across prime locations",
    count: "210+ lots",
  },
  {
    label: "Industrial",
    icon: "🏭",
    color: "#fb923c",
    gradient: "linear-gradient(135deg, #ea580c, #fb923c)",
    bg: "rgba(251,146,60,0.08)",
    border: "rgba(251,146,60,0.25)",
    sub: ["Machinery", "Tools", "Equipment", "Plants", "Agriculture", "Marine"],
    desc: "Heavy equipment & industrial assets",
    count: "670+ lots",
  },
  {
    label: "Art & Decor",
    icon: "🎨",
    color: "#e879f9",
    gradient: "linear-gradient(135deg, #c026d3, #e879f9)",
    bg: "rgba(232,121,249,0.08)",
    border: "rgba(232,121,249,0.25)",
    sub: ["Paintings", "Sculptures", "Prints", "Photography", "Ceramics", "Textiles"],
    desc: "Original works by established & emerging artists",
    count: "460+ lots",
  },
  {
    label: "Fashion",
    icon: "👗",
    color: "#38bdf8",
    gradient: "linear-gradient(135deg, #6366f1, #38bdf8)",
    bg: "rgba(99,102,241,0.08)",
    border: "rgba(99,102,241,0.25)",
    sub: ["Designer Wear", "Shoes", "Streetwear", "Vintage", "Accessories", "Couture"],
    desc: "Curated fashion from heritage to hypebeast",
    count: "830+ lots",
  },
  {
    label: "Sports",
    icon: "⚽",
    color: "#4ade80",
    gradient: "linear-gradient(135deg, #16a34a, #4ade80)",
    bg: "rgba(74,222,128,0.08)",
    border: "rgba(74,222,128,0.25)",
    sub: ["Memorabilia", "Equipment", "Jerseys", "Cards", "Trophies", "Outdoor"],
    desc: "Everything for sports fans & athletes",
    count: "310+ lots",
  },
];

const FEATURED = CATEGORIES.slice(0, 3);

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = CATEGORIES.filter(c =>
    c.label.toLowerCase().includes(search.toLowerCase()) ||
    c.sub.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ background: "#f5f4f0", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.15)} }
        .cat-card { transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), box-shadow 0.25s ease, border-color 0.25s ease; }
        .cat-card:hover { transform: translateY(-6px); }
        .cat-feat { transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s ease; }
        .cat-feat:hover { transform: translateY(-8px) scale(1.01); }
        .sub-pill { transition: all 0.15s; }
        .sub-pill:hover { transform: translateY(-2px); }
        .search-input:focus { outline: none; border-color: rgba(56,189,248,0.6) !important; box-shadow: 0 0 0 3px rgba(56,189,248,0.12); }
      `}</style>

      {/* ── Hero Banner ── */}
      <div style={{ position: "relative", height: "260px", overflow: "hidden", background: "#0f0e17" }}>
        <div style={{ position:"absolute", top:"-60px", left:"-40px",  width:"360px", height:"360px", borderRadius:"50%", background:"radial-gradient(circle, #38bdf8 0%, transparent 70%)", opacity:0.45, filter:"blur(60px)" }} />
        <div style={{ position:"absolute", top:"-40px", left:"35%",    width:"300px", height:"300px", borderRadius:"50%", background:"radial-gradient(circle, #6366f1 0%, transparent 70%)", opacity:0.4, filter:"blur(60px)" }} />
        <div style={{ position:"absolute", top:"-30px", right:"5%",    width:"320px", height:"320px", borderRadius:"50%", background:"radial-gradient(circle, #a78bfa 0%, transparent 70%)", opacity:0.35, filter:"blur(65px)" }} />
        <div style={{ position:"absolute", bottom:"-40px", left:"60%", width:"260px", height:"260px", borderRadius:"50%", background:"radial-gradient(circle, #f43f5e 0%, transparent 70%)", opacity:0.25, filter:"blur(55px)" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize:"28px 28px", opacity:0.5 }} />
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"90px", background:"linear-gradient(to top, #f5f4f0, transparent)" }} />

        {/* Hero text */}
        <div style={{ position:"relative", zIndex:2, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:"12px", padding:"0 32px", textAlign:"center", animation:"fadeUp .5s ease both" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#38bdf8", display:"inline-block", animation:"pulse 1.5s infinite" }} />
            <span style={{ color:"#38bdf8", fontSize:"12px", fontWeight:700, textTransform:"uppercase", letterSpacing:".1em" }}>Browse by Category</span>
          </div>
          <h1 style={{ color:"white", fontSize:"42px", fontWeight:900, margin:0, letterSpacing:"-0.03em", lineHeight:1.1 }}>
            Find What You're<br />
            <span style={{ background:"linear-gradient(135deg,#38bdf8,#a78bfa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Bidding For</span>
          </h1>
          <p style={{ color:"rgba(255,255,255,0.55)", fontSize:"15px", margin:0, maxWidth:"460px" }}>
            Thousands of verified lots across every category — from rare collectibles to industrial machinery.
          </p>
        </div>
      </div>

      <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"0 32px 80px" }}>

        {/* ── Search Bar ── */}
        <div style={{ marginTop:"32px", marginBottom:"40px", animation:"fadeUp .5s .1s ease both" }}>
          <div style={{ position:"relative", maxWidth:"520px", margin:"0 auto" }}>
            <span style={{ position:"absolute", left:"16px", top:"50%", transform:"translateY(-50%)", fontSize:"16px", pointerEvents:"none" }}>🔍</span>
            <input
              className="search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search categories or subcategories…"
              style={{ width:"100%", padding:"14px 16px 14px 46px", borderRadius:"14px", border:"1.5px solid rgba(0,0,0,0.1)", background:"#ffffff", fontSize:"14px", fontFamily:"system-ui, sans-serif", color:"#0f172a", boxSizing:"border-box", boxShadow:"0 2px 12px rgba(0,0,0,0.06)", transition:"all 0.2s" }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position:"absolute", right:"14px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#9ca3af", fontSize:"16px" }}>✕</button>
            )}
          </div>
        </div>

        {/* ── Featured (top 3) — only when not searching ── */}
        {!search && (
          <div style={{ marginBottom:"48px", animation:"fadeUp .5s .15s ease both" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px" }}>
              <div>
                <div style={{ color:"#38bdf8", fontSize:"11px", fontWeight:700, textTransform:"uppercase", letterSpacing:".1em", marginBottom:"4px" }}>🔥 Most Active</div>
                <h2 style={{ color:"#0f0e17", fontSize:"22px", fontWeight:800, margin:0 }}>Featured Categories</h2>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"18px" }}>
              {FEATURED.map((cat, i) => (
                <Link key={cat.label} to={`/browse?category=${cat.label}`} style={{ textDecoration:"none" }}>
                  <div
                    className="cat-feat"
                    style={{
                      background:"#ffffff",
                      borderRadius:"20px",
                      padding:"28px 24px",
                      border:`1.5px solid ${cat.border}`,
                      boxShadow:`0 4px 20px ${cat.bg}`,
                      cursor:"pointer",
                      position:"relative",
                      overflow:"hidden",
                      animation:`fadeUp .5s ${0.15 + i * 0.08}s ease both`,
                    }}
                  >
                    {/* Gradient blob */}
                    <div style={{ position:"absolute", top:"-30px", right:"-30px", width:"120px", height:"120px", borderRadius:"50%", background:cat.gradient, opacity:0.12, filter:"blur(20px)" }} />
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:"3px", background:cat.gradient, borderRadius:"20px 20px 0 0" }} />

                    <div style={{ fontSize:"40px", marginBottom:"14px" }}>{cat.icon}</div>
                    <h3 style={{ color:"#0f0e17", fontWeight:800, fontSize:"20px", margin:"0 0 6px" }}>{cat.label}</h3>
                    <p style={{ color:"#6b7280", fontSize:"13px", lineHeight:1.5, margin:"0 0 16px" }}>{cat.desc}</p>

                    <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginBottom:"16px" }}>
                      {cat.sub.slice(0, 4).map(s => (
                        <span key={s} className="sub-pill" style={{ background:cat.bg, color:cat.color, fontSize:"11px", fontWeight:600, padding:"3px 10px", borderRadius:"50px", border:`1px solid ${cat.border}` }}>{s}</span>
                      ))}
                    </div>

                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <span style={{ color:"#9ca3af", fontSize:"12px", fontWeight:600 }}>{cat.count}</span>
                      <span style={{ color:cat.color, fontWeight:700, fontSize:"13px" }}>Explore →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── All Categories Grid ── */}
        <div style={{ animation:"fadeUp .5s .25s ease both" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px" }}>
            <div>
              {search
                ? <h2 style={{ color:"#0f0e17", fontSize:"20px", fontWeight:800, margin:0 }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{search}"</h2>
                : (
                  <>
                    <div style={{ color:"#6366f1", fontSize:"11px", fontWeight:700, textTransform:"uppercase", letterSpacing:".1em", marginBottom:"4px" }}>All Categories</div>
                    <h2 style={{ color:"#0f0e17", fontSize:"22px", fontWeight:800, margin:0 }}>Browse Everything</h2>
                  </>
                )
              }
            </div>
            <Link to="/browse" style={{ padding:"9px 20px", borderRadius:"10px", background:"#0f0e17", color:"white", fontWeight:700, fontSize:"13px", textDecoration:"none" }}>
              View All Auctions →
            </Link>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"80px 20px" }}>
              <div style={{ fontSize:"56px", marginBottom:"16px" }}>🔍</div>
              <div style={{ color:"#374151", fontWeight:700, fontSize:"18px", marginBottom:"8px" }}>No categories found</div>
              <div style={{ color:"#9ca3af", fontSize:"14px" }}>Try a different search term</div>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px,1fr))", gap:"16px" }}>
              {filtered.map((cat, i) => (
                <Link key={cat.label} to={`/browse?category=${cat.label}`} style={{ textDecoration:"none" }}>
                  <div
                    className="cat-card"
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    style={{
                      background:"#ffffff",
                      borderRadius:"18px",
                      padding:"22px",
                      border: hoveredIdx === i ? `1.5px solid ${cat.border}` : "1.5px solid rgba(0,0,0,0.06)",
                      boxShadow: hoveredIdx === i ? `0 16px 40px ${cat.bg}, 0 2px 8px rgba(0,0,0,0.04)` : "0 2px 8px rgba(0,0,0,0.05)",
                      cursor:"pointer",
                      position:"relative",
                      overflow:"hidden",
                      animation:`fadeUp .4s ${0.05 * (i % 4)}s ease both`,
                    }}
                  >
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:"3px", background: hoveredIdx === i ? cat.gradient : "transparent", borderRadius:"18px 18px 0 0", transition:"background 0.25s" }} />

                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"14px" }}>
                      <div style={{ fontSize:"34px", lineHeight:1 }}>{cat.icon}</div>
                      <span style={{ color:"#9ca3af", fontSize:"11px", fontWeight:600, background:"#f1f5f9", padding:"3px 9px", borderRadius:"50px" }}>{cat.count}</span>
                    </div>

                    <h3 style={{ color:"#0f0e17", fontWeight:800, fontSize:"17px", margin:"0 0 5px" }}>{cat.label}</h3>
                    <p style={{ color:"#9ca3af", fontSize:"12px", margin:"0 0 14px", lineHeight:1.5 }}>{cat.desc}</p>

                    <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
                      {cat.sub.map(s => (
                        <span key={s} style={{
                          background: hoveredIdx === i ? cat.bg : "#f8fafc",
                          color: hoveredIdx === i ? cat.color : "#6b7280",
                          fontSize:"11px", fontWeight:600,
                          padding:"3px 9px", borderRadius:"50px",
                          border: hoveredIdx === i ? `1px solid ${cat.border}` : "1px solid transparent",
                          transition:"all 0.2s",
                        }}>{s}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Bottom CTA ── */}
        {!search && (
          <div style={{ marginTop:"60px", borderRadius:"24px", background:"#0f0e17", padding:"48px 40px", textAlign:"center", position:"relative", overflow:"hidden", animation:"fadeUp .5s .3s ease both" }}>
            <div style={{ position:"absolute", top:"-40px", left:"10%", width:"220px", height:"220px", borderRadius:"50%", background:"radial-gradient(circle, #38bdf8, transparent 70%)", opacity:0.2, filter:"blur(40px)" }} />
            <div style={{ position:"absolute", top:"-40px", right:"10%", width:"220px", height:"220px", borderRadius:"50%", background:"radial-gradient(circle, #6366f1, transparent 70%)", opacity:0.2, filter:"blur(40px)" }} />
            <div style={{ position:"relative", zIndex:1 }}>
              <div style={{ fontSize:"40px", marginBottom:"16px" }}>🔴</div>
              <h2 style={{ color:"white", fontSize:"28px", fontWeight:900, margin:"0 0 10px", letterSpacing:"-0.02em" }}>Live Auctions Happening Now</h2>
              <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"15px", margin:"0 0 28px", maxWidth:"400px", marginLeft:"auto", marginRight:"auto" }}>
                Don't miss out — real-time bidding across all categories, ending soon.
              </p>
              <div style={{ display:"flex", gap:"12px", justifyContent:"center", flexWrap:"wrap" }}>
                <Link to="/LiveAuctions" style={{ padding:"13px 30px", borderRadius:"12px", background:"linear-gradient(135deg,#38bdf8,#6366f1)", color:"white", fontWeight:700, fontSize:"15px", textDecoration:"none", boxShadow:"0 4px 16px rgba(56,189,248,0.35)" }}>
                  🔴 View Live Auctions
                </Link>
                <Link to="/browse" style={{ padding:"13px 30px", borderRadius:"12px", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", color:"white", fontWeight:700, fontSize:"15px", textDecoration:"none" }}>
                  Browse All →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
