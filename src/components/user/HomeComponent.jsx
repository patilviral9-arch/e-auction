import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import FooterComponent from "./FooterComponent";

/* ── Countdown timer hook ── */
function useCountdown(endMinutes) {
  const [time, setTime] = useState(endMinutes * 60);
  useEffect(() => {
    const t = setInterval(() => setTime(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(time / 3600);
  const m = Math.floor((time % 3600) / 60);
  const s = time % 60;
  return `${h > 0 ? h + "h " : ""}${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

/* ── Animated number ── */
function AnimatedNum({ target, prefix = "", suffix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = target / 60;
        const t = setInterval(() => {
          start = Math.min(start + step, target);
          setVal(Math.floor(start));
          if (start >= target) clearInterval(t);
        }, 16);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

/* ── Individual auction card countdown ── */
function CardCountdown({ minutes }) {
  return <span style={{ fontVariantNumeric: "tabular-nums" }}>{useCountdown(minutes)}</span>;
}

/* ── Auction card ── */
function AuctionCard({ item, index }) {
  const [hovered, setHovered] = useState(false);
  const [bidPulse, setBidPulse] = useState(false);

  const handleBid = () => {
    setBidPulse(true);
    setTimeout(() => setBidPulse(false), 600);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "linear-gradient(145deg, #1e293b, #0f172a)",
        borderRadius: "20px",
        overflow: "hidden",
        border: hovered ? "1px solid rgba(56,189,248,0.3)" : "1px solid rgba(255,255,255,0.07)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 24px 48px rgba(0,0,0,0.5), 0 0 32px rgba(56,189,248,0.08)"
          : "0 4px 20px rgba(0,0,0,0.3)",
        transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        animation: `cardIn 0.5s ease ${index * 0.1}s both`,
        width: "100%",
      }}
    >
      {/* Image area */}
      <div style={{
        position: "relative", height: "200px",
        background: "linear-gradient(135deg, #1e293b, #0f172a)",
        overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <img
          src={item.img}
          alt={item.title}
          style={{
            width: "100%", height: "100%", objectFit: "contain",
            padding: "16px",
            transform: hovered ? "scale(1.07)" : "scale(1)",
            transition: "transform 0.5s ease",
          }}
        />
        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: hovered
            ? "linear-gradient(to bottom, transparent 50%, rgba(15,23,42,0.8))"
            : "linear-gradient(to bottom, transparent 60%, rgba(15,23,42,0.5))",
          transition: "all 0.3s",
        }} />

        {/* Badges */}
        {item.live && (
          <div style={{
            position: "absolute", top: "12px", left: "12px",
            display: "flex", alignItems: "center", gap: "6px",
            background: "#f43f5e", color: "white",
            borderRadius: "8px", padding: "4px 10px",
            fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em",
          }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "white", animation: "pulse 1s infinite" }}></span>
            LIVE
          </div>
        )}
        {item.hot && (
          <div style={{
            position: "absolute", top: "12px", right: "12px",
            background: "rgba(15,23,42,0.8)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "8px", padding: "4px 10px",
            fontSize: "16px",
          }}>🔥</div>
        )}

        {/* Category chip */}
        <div style={{
          position: "absolute", bottom: "12px", left: "12px",
          background: "rgba(15,23,42,0.8)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "6px", padding: "3px 8px",
          fontSize: "11px", color: "#94a3b8", fontWeight: 600,
        }}>{item.category}</div>
      </div>

      {/* Content */}
      <div style={{ padding: "20px" }}>
        <h3 style={{ color: "white", fontWeight: 700, fontSize: "16px", margin: "0 0 12px", lineHeight: 1.3 }}>{item.title}</h3>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "14px" }}>
          <div>
            <div style={{ color: "#64748b", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>
              {item.live ? "Current Bid" : "Starting Bid"}
            </div>
            <div style={{ color: "#38bdf8", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em" }}>{item.bid}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#64748b", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>Ends in</div>
            <div style={{ color: item.live ? "#f43f5e" : "#94a3b8", fontSize: "13px", fontWeight: 700 }}>
              <CardCountdown minutes={item.minutes} />
            </div>
          </div>
        </div>

        {/* Bidders */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <div style={{ display: "flex" }}>
            {["a","b","c","d"].slice(0, item.bidders || 3).map((u, i) => (
              <img key={u} src={`https://i.pravatar.cc/32?u=${u}${item.id}`}
                style={{ width: "24px", height: "24px", borderRadius: "50%", border: "2px solid #1e293b", marginLeft: i > 0 ? "-8px" : "0" }}
                alt="bidder"
              />
            ))}
          </div>
          <span style={{ color: "#64748b", fontSize: "12px" }}>{item.totalBids || 12} bids</span>
          {/* Bid activity bar */}
          <div style={{ flex: 1, height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${item.activity || 60}%`,
              background: "linear-gradient(90deg, #38bdf8, #6366f1)",
              borderRadius: "2px",
              transition: "width 1s ease",
            }} />
          </div>
        </div>

        <Link to={item.live ? "/live" : `/auction/${item.id}`} onClick={handleBid}>
          <button style={{
            width: "100%", padding: "12px",
            background: item.live
              ? "linear-gradient(135deg, #f43f5e, #dc2626)"
              : "linear-gradient(135deg, #38bdf8, #6366f1)",
            color: "white", border: "none", borderRadius: "12px",
            fontSize: "14px", fontWeight: 700, cursor: "pointer",
            letterSpacing: "0.02em",
            boxShadow: item.live ? "0 4px 14px rgba(244,63,94,0.3)" : "0 4px 14px rgba(56,189,248,0.25)",
            transform: bidPulse ? "scale(0.97)" : "scale(1)",
            transition: "all 0.15s",
          }}>
            {item.live ? "🔴 Join Live Auction" : "Place Bid →"}
          </button>
        </Link>
      </div>
    </div>
  );
}

/* ── STATS SECTION ── */
function StatsSection() {
  const stats = [
    { value: 48200, label: "Auctions Completed", suffix: "+", icon: "🔨" },
    { value: 3800,  label: "Registered Bidders", suffix: "+", icon: "👥" },
    { value: 94,    label: "Million in Sales",   prefix: "$", suffix: "M+", icon: "💰" },
    { value: 99,    label: "Satisfaction Rate",  suffix: "%", icon: "⭐" },
  ];

  return (
    <div style={{
      background: "linear-gradient(135deg, #0f172a, #1e293b)",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      padding: "60px 40px",
    }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "32px" }}>
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: "center", animation: `cardIn 0.5s ease ${i * 0.1}s both` }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>{s.icon}</div>
            <div style={{
              fontSize: "40px", fontWeight: 800, color: "white",
              letterSpacing: "-0.03em", lineHeight: 1,
              background: "linear-gradient(135deg, #38bdf8, #818cf8)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              <AnimatedNum target={s.value} prefix={s.prefix || ""} suffix={s.suffix || ""} />
            </div>
            <div style={{ color: "#64748b", fontSize: "14px", fontWeight: 600, marginTop: "6px" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── CATEGORY STRIP ── */
function CategoryStrip() {
  const cats = [
    { icon: "⚡", label: "Electronics", count: 843 },
    { icon: "🚗", label: "Vehicles",    count: 312 },
    { icon: "🏺", label: "Collectibles",count: 560 },
    { icon: "💎", label: "Luxury",      count: 229 },
    { icon: "🏠", label: "Real Estate", count: 87  },
    { icon: "🏭", label: "Industrial",  count: 194 },
    { icon: "📱", label: "Mobiles",     count: 421 },
    { icon: "🎨", label: "Art",         count: 178 },
  ];
  const [hov, setHov] = useState(null);
  return (
    <div style={{ background: "#0f172a", padding: "32px 40px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          {cats.map((c, i) => (
            <Link key={c.label} to={`/category/${c.label.toLowerCase()}`} style={{ textDecoration: "none" }}>
              <div
                onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "10px 18px",
                  background: hov === i ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.04)",
                  border: hov === i ? "1px solid rgba(56,189,248,0.35)" : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "50px",
                  color: hov === i ? "#38bdf8" : "#94a3b8",
                  fontSize: "13px", fontWeight: 600,
                  transition: "all 0.2s",
                  cursor: "pointer",
                  animation: `cardIn 0.4s ease ${i * 0.05}s both`,
                }}
              >
                <span style={{ fontSize: "18px" }}>{c.icon}</span>
                {c.label}
                <span style={{
                  background: hov === i ? "rgba(56,189,248,0.2)" : "rgba(255,255,255,0.08)",
                  borderRadius: "50px", padding: "1px 7px",
                  fontSize: "11px", color: hov === i ? "#38bdf8" : "#64748b",
                  transition: "all 0.2s",
                }}>{c.count}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── TRUST BADGES ── */
function TrustSection() {
  const badges = [
    { icon: "🔐", title: "Bank-grade Security", desc: "256-bit SSL on every transaction" },
    { icon: "🛡️", title: "Buyer Protection",    desc: "Full refund if item not as described" },
    { icon: "⚡", title: "Instant Payments",    desc: "Funds released within 24 hours" },
    { icon: "🌍", title: "Global Reach",        desc: "Buyers & sellers from 80+ countries" },
  ];
  return (
    <div style={{ background: "#0f172a", padding: "60px 40px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "24px" }}>
          {badges.map((b, i) => (
            <div key={i} style={{
              padding: "28px 24px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "16px",
              textAlign: "center",
              animation: `cardIn 0.5s ease ${i * 0.1}s both`,
            }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>{b.icon}</div>
              <div style={{ color: "white", fontWeight: 700, fontSize: "15px", marginBottom: "6px" }}>{b.title}</div>
              <div style={{ color: "#64748b", fontSize: "13px", lineHeight: 1.5 }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── MAIN COMPONENT ── */
export const HomeComponent = () => {
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const featured = [
    { id: 1, title: "iPhone 15 Pro Max – 256GB Natural Titanium", bid: "₹72,000",   minutes: 134, hot: true,  live: false, category: "Electronics", bidders: 4, totalBids: 28, activity: 72, img: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80" },
    { id: 2, title: "Asus ROG Zephyrus G14 (2024)",               bid: "₹3,45,000", minutes: 48,  hot: false, live: false, category: "Laptops",     bidders: 3, totalBids: 16, activity: 55, img: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&q=80" },
    { id: 3, title: "Royal Enfield Classic 350 – Chrome Edition",  bid: "₹1,18,000", minutes: 210, hot: false, live: false, category: "Vehicles",    bidders: 4, totalBids: 34, activity: 80, img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
    { id: 7, title: "Sony PlayStation 5 – Disc Edition",           bid: "₹42,000",   minutes: 96,  hot: true,  live: false, category: "Gaming",      bidders: 4, totalBids: 22, activity: 68, img: "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400&q=80" },
    { id: 8, title: "Louis Vuitton Neverfull MM",                  bid: "₹95,000",   minutes: 300, hot: false, live: false, category: "Luxury",      bidders: 3, totalBids: 11, activity: 45, img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80" },
  ];

  const live = [
    { id: 4, title: "Apple Watch Ultra 2 – Ocean Band",   bid: "₹52,500",   minutes: 12, hot: false, live: true, category: "Wearables", bidders: 4, totalBids: 61, activity: 95, img: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&q=80" },
    { id: 5, title: "Canon EOS R5 Body – Mint Condition", bid: "₹38,000",   minutes: 24, hot: false, live: true, category: "Cameras",   bidders: 3, totalBids: 43, activity: 88, img: "https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=400&q=80" },
    { id: 6, title: "Vintage Rolex Submariner 1978",      bid: "₹8,40,000", minutes: 8,  hot: true,  live: true, category: "Luxury",    bidders: 4, totalBids: 89, activity: 98, img: "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=400&q=80" },
    { id: 9, title: "DJI Mavic 3 Pro – Fly More Combo",   bid: "₹1,15,000", minutes: 35, hot: false, live: true, category: "Drones",    bidders: 3, totalBids: 27, activity: 74, img: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&q=80" },
    { id: 10, title: "Herman Miller Aeron Chair",         bid: "₹68,000",   minutes: 55, hot: false, live: true, category: "Furniture", bidders: 3, totalBids: 19, activity: 62, img: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400&q=80" },
  ];

  const SectionHeader = ({ title, sub, cta, ctaLink }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
      <div>
        <div style={{ color: "#38bdf8", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
          {sub}
        </div>
        <h2 style={{ color: "white", fontSize: "32px", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>{title}</h2>
      </div>
      {cta && (
        <Link to={ctaLink} style={{
          color: "#38bdf8", textDecoration: "none", fontSize: "14px", fontWeight: 700,
          padding: "8px 18px",
          border: "1px solid rgba(56,189,248,0.3)",
          borderRadius: "8px",
          transition: "all 0.2s",
        }}>
          {cta} →
        </Link>
      )}
    </div>
  );

  return (
    <div style={{ background: "#0a0f1a", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── HERO ── */}
      <div style={{
        position: "relative",
        minHeight: "88vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
        background: "linear-gradient(135deg, #060d1a 0%, #0f172a 50%, #0a1628 100%)",
      }}>
        {/* Animated background grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(56,189,248,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          animation: "gridMove 20s linear infinite",
        }} />

        {/* Glow orbs */}
        <div style={{ position: "absolute", top: "20%", left: "15%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)", borderRadius: "50%", animation: "floatOrb 8s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "15%", right: "10%", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)", borderRadius: "50%", animation: "floatOrb 10s ease-in-out infinite reverse" }} />

        <div style={{
          position: "relative", zIndex: 1,
          textAlign: "center",
          padding: "40px 20px",
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          {/* Live badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)",
            borderRadius: "50px", padding: "6px 16px", marginBottom: "28px",
            color: "#f87171", fontSize: "13px", fontWeight: 700,
            animation: "cardIn 0.6s ease 0.1s both",
          }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f43f5e", animation: "pulse 1s infinite" }}></span>
            143 Live Auctions Right Now
          </div>

          <h1 style={{
            fontSize: "clamp(42px, 7vw, 80px)",
            fontWeight: 900,
            color: "white",
            margin: "0 0 20px",
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            animation: "cardIn 0.6s ease 0.2s both",
          }}>
          Where every bid{" "}
            <span style={{ background: "linear-gradient(135deg, #38bdf8, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              brings you closer
            </span>
            <br />to the best deal!!!
          </h1>

          <p style={{
            fontSize: "20px", color: "#64748b", maxWidth: "560px", margin: "0 auto 40px",
            lineHeight: 1.6,
            animation: "cardIn 0.6s ease 0.3s both",
          }}>
            The world's most trusted platform for premium auctions. From electronics to luxury — find it, bid it, own it.
          </p>

          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap", animation: "cardIn 0.6s ease 0.4s both" }}>
            <Link to="/browse" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "linear-gradient(135deg, #38bdf8, #6366f1)",
              color: "white", textDecoration: "none",
              padding: "14px 32px", borderRadius: "12px",
              fontSize: "16px", fontWeight: 700,
              boxShadow: "0 8px 24px rgba(56,189,248,0.35)",
              transition: "all 0.2s",
            }}>
              🔍 Explore Auctions
            </Link>
            <Link to="/live" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)",
              color: "#f87171", textDecoration: "none",
              padding: "14px 28px", borderRadius: "12px",
              fontSize: "16px", fontWeight: 700,
              transition: "all 0.2s",
            }}>
              🔴 Watch Live
            </Link>
          </div>

          {/* Scrolling trust line */}
          <div style={{ marginTop: "56px", display: "flex", alignItems: "center", gap: "24px", justifyContent: "center", animation: "cardIn 0.6s ease 0.5s both" }}>
            {["🔐 SSL Secured", "🛡️ Buyer Protected", "⭐ 4.9/5 Rated", "🌍 80+ Countries"].map((t, i) => (
              <span key={i} style={{ color: "#475569", fontSize: "13px", fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── CATEGORIES STRIP ── */}
      <CategoryStrip />

      {/* ── STATS ── */}
      <StatsSection />

      {/* ── LIVE AUCTIONS ── */}
      <div style={{ background: "#080e1a", padding: "72px 40px", borderTop: "1px solid rgba(244,63,94,0.12)" }}>
        <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
          <SectionHeader title="Live Auctions" sub="🔴 Happening Now" cta="View All Live" ctaLink="/live" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>
            {live.map((item, i) => <AuctionCard key={item.id} item={item} index={i} />)}
          </div>
        </div>
      </div>

      {/* ── FEATURED ── */}
      <div style={{ background: "#0a1020", padding: "72px 40px" }}>
        <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
          <SectionHeader title="Featured Auctions" sub="✨ Hand-Picked" cta="Browse All" ctaLink="/browse" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>
            {featured.map((item, i) => <AuctionCard key={item.id} item={item} index={i} />)}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{ background: "#070c17", padding: "80px 40px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <div style={{ color: "#38bdf8", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Simple Process</div>
            <h2 style={{ color: "white", fontSize: "36px", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>How It Works</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "32px" }}>
            {[
              { n: "01", icon: "📝", title: "Register Free",  desc: "Create your account in under 60 seconds. Choose Personal for bidding or Business for selling.", color: "#38bdf8" },
              { n: "02", icon: "🎯", title: "Bid or List",    desc: "Browse thousands of auctions and place bids, or list your items to reach a global audience.", color: "#818cf8" },
              { n: "03", icon: "🏆", title: "Win & Pay",      desc: "Highest bidder wins. Secure payment, instant confirmation, fast delivery.", color: "#34d399" },
            ].map((s, i) => (
              <div key={i} style={{
                padding: "36px 32px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "20px",
                position: "relative",
                overflow: "hidden",
                animation: `cardIn 0.5s ease ${i * 0.15}s both`,
              }}>
                <div style={{
                  position: "absolute", top: "-10px", right: "20px",
                  fontSize: "80px", fontWeight: 900, color: "rgba(255,255,255,0.02)",
                  lineHeight: 1, fontVariantNumeric: "tabular-nums",
                }}>{s.n}</div>
                <div style={{ fontSize: "40px", marginBottom: "16px" }}>{s.icon}</div>
                <h3 style={{ color: "white", fontWeight: 700, fontSize: "20px", marginBottom: "12px" }}>{s.title}</h3>
                <p style={{ color: "#64748b", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
                <div style={{ width: "40px", height: "3px", background: s.color, borderRadius: "2px", marginTop: "20px" }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TRUST ── */}
      <TrustSection />

      {/* ── CTA BANNER ── */}
      <div style={{
        margin: "0", padding: "80px 40px",
        background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
        textAlign: "center",
      }}>
        <h2 style={{ color: "white", fontSize: "40px", fontWeight: 900, margin: "0 0 16px", letterSpacing: "-0.03em" }}>
          Ready to start bidding?
        </h2>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "18px", marginBottom: "36px" }}>
          Join 3,800+ bidders and sellers — it's completely free.
        </p>
        <div style={{ display: "flex", gap: "14px", justifyContent: "center" }}>
          <Link to="/register" style={{
            background: "white", color: "#0ea5e9",
            padding: "14px 36px", borderRadius: "12px",
            fontSize: "16px", fontWeight: 800, textDecoration: "none",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            transition: "all 0.2s",
          }}>Create Free Account</Link>
          <Link to="/browse" style={{
            background: "rgba(255,255,255,0.15)", color: "white",
            padding: "14px 28px", borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.3)",
            fontSize: "16px", fontWeight: 700, textDecoration: "none",
            transition: "all 0.2s",
          }}>Browse Auctions</Link>
        </div>
      </div>

      <FooterComponent />

      <style>{`
        @keyframes cardIn    { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse     { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes floatOrb  { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-30px); } }
        @keyframes gridMove  { from { backgroundPosition: 0 0; } to { backgroundPosition: 60px 60px; } }
      `}</style>
    </div>
  );
};

export default HomeComponent;
