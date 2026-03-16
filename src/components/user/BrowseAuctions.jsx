import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AUCTIONS, CATEGORIES, formatINR, formatTime } from "./auctionData";

/* ── live countdown per card ── */
function useCountdown(minutes) {
  const [secs, setSecs] = useState(minutes * 60);
  useEffect(() => {
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (secs === 0) return "Ended";
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

/* ── Bid Modal ── */
function BidModal({ auction, onClose, onBid }) {
  const [amount, setAmount] = useState(auction.currentBid + 500);
  const [placed, setPlaced] = useState(false);
  const min = auction.currentBid + 1;

  const submit = () => {
    if (amount < min) return;
    setPlaced(true);
    setTimeout(() => { onBid(auction.id, amount); onClose(); }, 1200);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeIn .2s ease",
    }} onClick={onClose}>
      <div style={{
        background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "20px", padding: "32px", width: "420px",
        boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
        animation: "slideUp .25s ease",
      }} onClick={e => e.stopPropagation()}>

        {placed ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "52px", marginBottom: "16px" }}>🎉</div>
            <div style={{ color: "#34d399", fontSize: "20px", fontWeight: 800 }}>Bid Placed!</div>
            <div style={{ color: "#64748b", fontSize: "14px", marginTop: "8px" }}>
              {formatINR(amount)} on {auction.title}
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <div style={{ color: "#64748b", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "4px" }}>Place a Bid</div>
                <div style={{ color: "white", fontSize: "16px", fontWeight: 700, maxWidth: "280px", lineHeight: 1.3 }}>{auction.title}</div>
              </div>
              <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#94a3b8", cursor: "pointer", width: "32px", height: "32px", fontSize: "16px" }}>✕</button>
            </div>

            <img src={auction.img} alt={auction.title} style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "12px", marginBottom: "20px" }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              {[
                ["Current Bid", formatINR(auction.currentBid), "#38bdf8"],
                ["Total Bids",  auction.totalBids + " bids",   "#94a3b8"],
                ["Minimum",     formatINR(min),                "#f59e0b"],
                ["Ends In",     useCountdown(auction.endsIn),  auction.live ? "#f43f5e" : "#94a3b8"],
              ].map(([label, val, col]) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "12px" }}>
                  <div style={{ color: "#64748b", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>{label}</div>
                  <div style={{ color: col, fontSize: "15px", fontWeight: 700 }}>{val}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "8px" }}>Your Bid Amount (₹)</label>
              <div style={{ display: "flex", border: "1px solid rgba(56,189,248,0.4)", borderRadius: "12px", overflow: "hidden" }}>
                <span style={{ padding: "12px 16px", background: "rgba(56,189,248,0.08)", color: "#38bdf8", fontWeight: 700, fontSize: "16px" }}>₹</span>
                <input
                  type="number" value={amount} min={min}
                  onChange={e => setAmount(Number(e.target.value))}
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "white", fontSize: "18px", fontWeight: 700, padding: "12px 16px" }}
                />
              </div>
              {amount < min && <div style={{ color: "#f43f5e", fontSize: "12px", marginTop: "6px" }}>Minimum bid is {formatINR(min)}</div>}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={submit} disabled={amount < min} style={{
                flex: 1, padding: "14px", borderRadius: "12px", border: "none",
                background: amount >= min ? "linear-gradient(135deg,#38bdf8,#6366f1)" : "rgba(255,255,255,0.1)",
                color: "white", fontWeight: 700, fontSize: "15px",
                cursor: amount >= min ? "pointer" : "not-allowed",
                transition: "all .2s",
              }}>🏷️ Confirm Bid</button>
              <button onClick={onClose} style={{
                padding: "14px 20px", borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
                color: "#94a3b8", cursor: "pointer", fontWeight: 600,
              }}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Single auction card ── */
function AuctionCard({ auction, onBid, watchlist, toggleWatch }) {
  const [hov, setHov] = useState(false);
  const time = useCountdown(auction.endsIn);
  const watched = watchlist.includes(auction.id);

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: "linear-gradient(145deg,#1e293b,#0f172a)",
        borderRadius: "16px", overflow: "hidden",
        border: hov ? "1px solid rgba(56,189,248,0.3)" : "1px solid rgba(255,255,255,0.07)",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hov ? "0 20px 40px rgba(0,0,0,0.5)" : "0 4px 16px rgba(0,0,0,0.3)",
        transition: "all .3s cubic-bezier(.34,1.56,.64,1)",
        animation: "cardIn .4s ease both",
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: "180px", background: "#0f172a", overflow: "hidden" }}>
        <img src={auction.img} alt={auction.title} style={{ width: "100%", height: "100%", objectFit: "cover", transform: hov ? "scale(1.06)" : "scale(1)", transition: "transform .5s ease" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(15,23,42,.7))" }} />

        {auction.live && (
          <div style={{ position: "absolute", top: "10px", left: "10px", background: "#f43f5e", color: "white", borderRadius: "6px", padding: "3px 8px", fontSize: "10px", fontWeight: 800, display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "white", animation: "pulse 1s infinite" }}></span>LIVE
          </div>
        )}
        {auction.hot && (
          <div style={{ position: "absolute", top: "10px", right: "40px", background: "rgba(15,23,42,.8)", border: "1px solid rgba(255,255,255,.15)", borderRadius: "6px", padding: "3px 7px", fontSize: "13px" }}>🔥</div>
        )}
        <button
          onClick={() => toggleWatch(auction.id)}
          style={{ position: "absolute", top: "8px", right: "8px", background: watched ? "rgba(56,189,248,.2)" : "rgba(15,23,42,.8)", border: `1px solid ${watched ? "rgba(56,189,248,.4)" : "rgba(255,255,255,.15)"}`, borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >{watched ? "👁️" : "🤍"}</button>
        <div style={{ position: "absolute", bottom: "8px", left: "10px", background: "rgba(15,23,42,.75)", borderRadius: "5px", padding: "2px 8px", fontSize: "10px", color: "#94a3b8", fontWeight: 600 }}>{auction.category}</div>
      </div>

      {/* Body */}
      <div style={{ padding: "16px" }}>
        <div style={{ color: "#64748b", fontSize: "11px", marginBottom: "4px" }}>by {auction.seller}</div>
        <h3 style={{ color: "white", fontWeight: 700, fontSize: "14px", margin: "0 0 12px", lineHeight: 1.3, minHeight: "36px" }}>{auction.title}</h3>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
          <div>
            <div style={{ color: "#64748b", fontSize: "10px", fontWeight: 600, marginBottom: "2px" }}>CURRENT BID</div>
            <div style={{ color: "#38bdf8", fontSize: "18px", fontWeight: 800 }}>{formatINR(auction.currentBid)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#64748b", fontSize: "10px", fontWeight: 600, marginBottom: "2px" }}>ENDS IN</div>
            <div style={{ color: auction.live ? "#f43f5e" : "#94a3b8", fontSize: "13px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{time}</div>
          </div>
        </div>

        {/* Bid activity bar */}
        <div style={{ height: "3px", background: "rgba(255,255,255,.06)", borderRadius: "2px", marginBottom: "14px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(100, (auction.totalBids / 100) * 100)}%`, background: "linear-gradient(90deg,#38bdf8,#6366f1)", borderRadius: "2px" }} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div style={{ color: "#64748b", fontSize: "11px" }}>{auction.totalBids} bids · {auction.condition}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ color: "#f59e0b", fontSize: "11px" }}>★</span>
            <span style={{ color: "#94a3b8", fontSize: "11px" }}>{auction.sellerRating}</span>
          </div>
        </div>

        <button
          onClick={() => onBid(auction)}
          style={{
            width: "100%", padding: "11px", borderRadius: "10px", border: "none",
            background: auction.live ? "linear-gradient(135deg,#f43f5e,#dc2626)" : "linear-gradient(135deg,#38bdf8,#6366f1)",
            color: "white", fontWeight: 700, fontSize: "13px", cursor: "pointer",
            boxShadow: auction.live ? "0 4px 12px rgba(244,63,94,.3)" : "0 4px 12px rgba(56,189,248,.25)",
            transition: "all .15s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = ".88"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          {auction.live ? "🔴 Bid Now" : "🏷️ Place Bid"}
        </button>
      </div>
    </div>
  );
}

/* ── MAIN PAGE ── */
export default function BrowseAuctions() {
  const [auctions, setAuctions]   = useState(AUCTIONS);
  const [activeCat, setActiveCat] = useState("All");
  const [search,    setSearch]    = useState("");
  const [sort,      setSort]      = useState("ending");
  const [modal,     setModal]     = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [liveOnly,  setLiveOnly]  = useState(false);

  const toggleWatch = id => setWatchlist(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]);

  const handleBid = (id, amount) => {
    setAuctions(prev => prev.map(a => a.id === id ? { ...a, currentBid: amount, totalBids: a.totalBids + 1 } : a));
  };

  const filtered = auctions
    .filter(a => activeCat === "All" || a.category === activeCat)
    .filter(a => !liveOnly || a.live)
    .filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "ending")  return a.endsIn - b.endsIn;
      if (sort === "highest") return b.currentBid - a.currentBid;
      if (sort === "lowest")  return a.currentBid - b.currentBid;
      if (sort === "bids")    return b.totalBids - a.totalBids;
      return 0;
    });

  const liveCount = auctions.filter(a => a.live).length;

  return (
    <div style={{ background: "#080e1a", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{ background: "linear-gradient(135deg,#060d1a,#0f172a)", borderBottom: "1px solid rgba(255,255,255,.06)", padding: "40px 40px 32px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ color: "#38bdf8", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "8px" }}>
                🔴 {liveCount} auctions live right now
              </div>
              <h1 style={{ color: "white", fontSize: "36px", fontWeight: 900, margin: 0, letterSpacing: "-.02em" }}>Browse Auctions</h1>
              <p style={{ color: "#64748b", marginTop: "8px", fontSize: "15px" }}>Find your next deal — bid smart, win big.</p>
            </div>

            {/* Search */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "15px" }}>🔍</span>
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search auctions..."
                  style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "10px", padding: "10px 14px 10px 38px", color: "white", fontSize: "14px", outline: "none", width: "240px" }}
                />
              </div>
              <button
                onClick={() => setLiveOnly(l => !l)}
                style={{ padding: "10px 16px", borderRadius: "10px", border: `1px solid ${liveOnly ? "rgba(244,63,94,.4)" : "rgba(255,255,255,.1)"}`, background: liveOnly ? "rgba(244,63,94,.1)" : "rgba(255,255,255,.05)", color: liveOnly ? "#f43f5e" : "#94a3b8", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
                {liveOnly ? "🔴 Live" : "⭕ Live Only"}
              </button>
            </div>
          </div>

          {/* Category tabs */}
          <div style={{ display: "flex", gap: "8px", marginTop: "24px", flexWrap: "wrap" }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCat(cat)} style={{
                padding: "7px 16px", borderRadius: "50px",
                border: activeCat === cat ? "1px solid rgba(56,189,248,.5)" : "1px solid rgba(255,255,255,.08)",
                background: activeCat === cat ? "rgba(56,189,248,.12)" : "rgba(255,255,255,.04)",
                color: activeCat === cat ? "#38bdf8" : "#64748b",
                fontWeight: 600, fontSize: "13px", cursor: "pointer", transition: "all .2s",
              }}>{cat}</button>
            ))}
            <select value={sort} onChange={e => setSort(e.target.value)} style={{
              marginLeft: "auto", padding: "7px 14px", borderRadius: "50px",
              border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.04)",
              color: "#94a3b8", fontSize: "13px", outline: "none", cursor: "pointer",
            }}>
              <option value="ending">Ending Soon</option>
              <option value="highest">Highest Bid</option>
              <option value="lowest">Lowest Bid</option>
              <option value="bids">Most Bids</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── GRID ── */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 40px" }}>
        <div style={{ color: "#64748b", fontSize: "13px", marginBottom: "20px" }}>{filtered.length} auctions found</div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#475569" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
            <div style={{ fontSize: "18px", fontWeight: 600 }}>No auctions found</div>
            <div style={{ fontSize: "14px", marginTop: "8px" }}>Try a different category or search term</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" }}>
            {filtered.map(a => (
              <AuctionCard key={a.id} auction={a} onBid={setModal} watchlist={watchlist} toggleWatch={toggleWatch} />
            ))}
          </div>
        )}
      </div>

      {/* Bid Modal */}
      {modal && <BidModal auction={modal} onClose={() => setModal(null)} onBid={handleBid} />}

      <style>{`
        @keyframes cardIn  { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
        input::placeholder { color: #475569; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
      `}</style>
    </div>
  );
}
