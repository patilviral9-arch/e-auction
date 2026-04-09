import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useThemeStyles } from "../utils/themeStyles";
import Footercomponent from "../components/user/FooterComponent";

const AUCTIONS_ENDPOINT = "http://localhost:3000/auction/auctions";

const formatINR = (value) =>
  "₹" + Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const safeNum = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeCategoryText = (value = "") =>
  String(value).trim() ? String(value).trim() : "Uncategorized";

const parseDurationToMs = (auction) => {
  if (auction?.endTime) return new Date(auction.endTime).getTime();
  const base = auction?.startDate || auction?.createdAt;
  const minutes =
    auction?.durationMinutes ??
    (() => {
      const duration = String(auction?.duration || "");
      if (/1\s*hour/i.test(duration)) return 60;
      if (/6\s*hour/i.test(duration)) return 360;
      if (/12\s*hour/i.test(duration)) return 720;
      if (/3\s*day/i.test(duration)) return 4320;
      if (/7\s*day/i.test(duration)) return 10080;
      return 1440;
    })();
  if (base) return new Date(base).getTime() + minutes * 60 * 1000;
  return Date.now() + minutes * 60 * 1000;
};

const resolveStatus = (rawStatus, endTime) => {
  const status = String(rawStatus || "Scheduled").trim().toLowerCase();
  if (status === "completed" || status === "ended") return "Completed";
  if (status === "cancelled" || status === "canceled") return "Cancelled";
  if (status === "active") {
    if (Number.isFinite(endTime) && endTime < Date.now()) return "Completed";
    return "Active";
  }
  return "Scheduled";
};

const resolveAuctionCreator = (createdBy) => {
  if (!createdBy) return "";
  if (typeof createdBy === "string") return String(createdBy);
  return String(createdBy?._id || createdBy?.id || "");
};

const getMonthKey = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
};

export default function BusinessAnalytics() {
  const t = useThemeStyles();
  const { userId } = useAuth();
  const shellPadding = "clamp(16px, 3vw, 40px)";

  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMine = async () => {
    if (!userId) {
      setAuctions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(AUCTIONS_ENDPOINT);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.auctions ?? data.data ?? [];

      const mine = (Array.isArray(list) ? list : [])
        .filter((auction) => resolveAuctionCreator(auction?.createdBy) === String(userId))
        .map((auction) => {
          const endTime = parseDurationToMs(auction);
          const status = resolveStatus(auction?.status, endTime);
          return {
            id: String(auction?._id || auction?.id || ""),
            title: auction?.title || "Untitled Auction",
            category: normalizeCategoryText(auction?.category),
            status,
            startingBid: safeNum(auction?.startingBid),
            currentBid: safeNum(auction?.currentBid ?? auction?.startingBid),
            totalBids: safeNum(auction?.totalBids ?? auction?.bids?.length ?? 0),
            createdAt: auction?.createdAt,
            endTime,
          };
        });

      const enriched = await Promise.all(
        mine.map(async (auction) => {
          try {
            const bidRes = await fetch(`http://localhost:3000/bid/bids/auction/${auction.id}`);
            if (!bidRes.ok) return auction;
            const bidData = await bidRes.json();
            const bids = bidData?.data ?? [];
            if (!Array.isArray(bids) || bids.length === 0) return auction;
            return {
              ...auction,
              currentBid: safeNum(bids[0]?.bidAmount ?? auction.currentBid),
              totalBids: bids.length,
            };
          } catch {
            return auction;
          }
        })
      );

      setAuctions(enriched);
    } catch (err) {
      setError(err.message || "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMine();
  }, [userId]);

  const stats = useMemo(() => {
    const total = auctions.length;
    const active = auctions.filter((a) => a.status === "Active").length;
    const scheduled = auctions.filter((a) => a.status === "Scheduled").length;
    const completed = auctions.filter((a) => a.status === "Completed").length;
    const cancelled = auctions.filter((a) => a.status === "Cancelled").length;
    const totalBids = auctions.reduce((sum, a) => sum + a.totalBids, 0);
    const completedRevenue = auctions
      .filter((a) => a.status === "Completed")
      .reduce((sum, a) => sum + a.currentBid, 0);
    const activePipeline = auctions
      .filter((a) => a.status === "Active" || a.status === "Scheduled")
      .reduce((sum, a) => sum + a.currentBid, 0);

    return {
      total,
      active,
      scheduled,
      completed,
      cancelled,
      totalBids,
      avgBids: total ? (totalBids / total).toFixed(1) : "0.0",
      completedRevenue,
      activePipeline,
    };
  }, [auctions]);

  const statusRows = useMemo(() => {
    const rows = [
      { key: "Active", value: stats.active, color: "#22c55e" },
      { key: "Scheduled", value: stats.scheduled, color: "#f59e0b" },
      { key: "Completed", value: stats.completed, color: "#38bdf8" },
      { key: "Cancelled", value: stats.cancelled, color: "#ef4444" },
    ];
    return rows.map((row) => ({
      ...row,
      percentage: stats.total ? Math.round((row.value / stats.total) * 100) : 0,
    }));
  }, [stats]);

  const categoryRows = useMemo(() => {
    const map = new Map();
    auctions.forEach((auction) => {
      if (!map.has(auction.category)) {
        map.set(auction.category, {
          category: auction.category,
          total: 0,
          active: 0,
          completed: 0,
          bids: 0,
          revenue: 0,
        });
      }
      const row = map.get(auction.category);
      row.total += 1;
      row.bids += auction.totalBids;
      if (auction.status === "Active") row.active += 1;
      if (auction.status === "Completed") {
        row.completed += 1;
        row.revenue += auction.currentBid;
      }
    });

    return [...map.values()].sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.category.localeCompare(b.category);
    });
  }, [auctions]);

  const recentAuctions = useMemo(() => {
    return [...auctions]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 8);
  }, [auctions]);

  const topByBid = useMemo(() => {
    if (!auctions.length) return null;
    return [...auctions].sort((a, b) => b.currentBid - a.currentBid)[0];
  }, [auctions]);

  const topByBids = useMemo(() => {
    if (!auctions.length) return null;
    return [...auctions].sort((a, b) => b.totalBids - a.totalBids)[0];
  }, [auctions]);

  const monthRows = useMemo(() => {
    const map = new Map();
    auctions.forEach((auction) => {
      const monthKey = getMonthKey(auction.createdAt);
      if (!map.has(monthKey)) map.set(monthKey, { month: monthKey, auctions: 0, revenue: 0 });
      const row = map.get(monthKey);
      row.auctions += 1;
      if (auction.status === "Completed") row.revenue += auction.currentBid;
    });
    return [...map.values()].sort((a, b) => {
      if (a.month === "Unknown") return 1;
      if (b.month === "Unknown") return -1;
      return new Date(`01 ${a.month}`).getTime() - new Date(`01 ${b.month}`).getTime();
    });
  }, [auctions]);

  const maxMonthAuctions = useMemo(
    () => Math.max(...monthRows.map((row) => row.auctions), 1),
    [monthRows]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: t.bg,
        color: t.textPri,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          background: t.bgSec,
          borderBottom: `1px solid ${t.border}`,
          padding: `40px ${shellPadding} 32px`,
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "13px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#38bdf8",
                  fontWeight: 700,
                  marginBottom: "6px",
                }}
              >
                Business Performance
              </div>
              <h1 style={{ margin: 0, fontSize: "clamp(30px, 3vw, 36px)", fontWeight: 900, lineHeight: 1.08 }}>
                Auction Analytics
              </h1>
              <p style={{ margin: "8px 0 0", color: t.textMut, fontSize: "clamp(14px, 1.2vw, 16px)" }}>
                Insights from auctions created by your business account.
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={fetchMine}
                disabled={loading}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: `1px solid ${t.borderMd}`,
                  background: t.bgCard,
                  color: t.textSec,
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
              <Link
                to="/business/Listings"
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  background: "linear-gradient(135deg,#38bdf8,#6366f1)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                View My Auctions
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: `32px ${shellPadding} 52px`,
          boxSizing: "border-box",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "100px 0", color: t.textMut }}>Loading analytics...</div>
        ) : error ? (
          <div
            style={{
              border: `1px solid rgba(239,68,68,0.35)`,
              background: "rgba(239,68,68,0.08)",
              color: "#ef4444",
              padding: "14px 16px",
              borderRadius: "12px",
            }}
          >
            {error}
          </div>
        ) : auctions.length === 0 ? (
          <div
            style={{
              background: t.bgSec,
              border: `1px solid ${t.border}`,
              borderRadius: "16px",
              padding: "46px 24px",
              textAlign: "center",
            }}
          >
            <h2 style={{ margin: "0 0 8px", fontSize: "24px", color: t.textPri }}>No analytics yet</h2>
            <p style={{ margin: "0 0 24px", color: t.textMut }}>
              Create your first auction to start seeing business insights.
            </p>
            <Link
              to="/add-auction"
              style={{
                textDecoration: "none",
                background: "linear-gradient(135deg,#38bdf8,#6366f1)",
                color: "#fff",
                padding: "11px 22px",
                borderRadius: "10px",
                fontWeight: 700,
              }}
            >
              Create Auction
            </Link>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "14px",
                marginBottom: "22px",
              }}
            >
              {[
                { label: "Total Auctions", value: stats.total, color: t.textPri },
                { label: "Live Auctions", value: stats.active, color: "#22c55e" },
                { label: "Completed", value: stats.completed, color: "#38bdf8" },
                { label: "Total Bids", value: stats.totalBids, color: "#a78bfa" },
                { label: "Avg Bids/Auction", value: stats.avgBids, color: "#f59e0b" },
                { label: "Realized Revenue", value: formatINR(stats.completedRevenue), color: "#10b981" },
              ].map((card) => (
                <div
                  key={card.label}
                  style={{
                    background: t.bgSec,
                    border: `1px solid ${t.border}`,
                    borderRadius: "14px",
                    padding: "14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: t.textMut,
                      fontWeight: 700,
                    }}
                  >
                    {card.label}
                  </div>
                  <div style={{ fontSize: "clamp(30px, 2.4vw, 36px)", marginTop: "8px", fontWeight: 900, color: card.color, lineHeight: 1.05 }}>
                    {card.value}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "14px",
                marginBottom: "20px",
              }}
            >
              <div style={{ background: t.bgSec, border: `1px solid ${t.border}`, borderRadius: "14px", padding: "18px" }}>
                <h3 style={{ margin: "0 0 12px", fontSize: "20px", fontWeight: 800 }}>Status Distribution</h3>
                <div style={{ display: "grid", gap: "10px" }}>
                  {statusRows.map((row) => (
                    <div key={row.key}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "5px",
                        }}
                      >
                        <span style={{ color: t.textSec, fontSize: "14px", fontWeight: 600 }}>{row.key}</span>
                        <span style={{ color: t.textMut, fontSize: "13px" }}>
                          {row.value} ({row.percentage}%)
                        </span>
                      </div>
                      <div style={{ height: "8px", borderRadius: "999px", background: t.bgInput, overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${row.percentage}%`,
                            minWidth: row.value ? "6px" : 0,
                            background: row.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: t.bgSec, border: `1px solid ${t.border}`, borderRadius: "14px", padding: "18px" }}>
                <h3 style={{ margin: "0 0 12px", fontSize: "20px", fontWeight: 800 }}>Highlights</h3>
                <div style={{ display: "grid", gap: "10px" }}>
                  <div style={{ background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "10px" }}>
                    <div style={{ fontSize: "11px", color: t.textMut, textTransform: "uppercase", fontWeight: 700 }}>
                      Highest Bid Auction
                    </div>
                    <div style={{ fontSize: "15px", color: t.textPri, fontWeight: 700, marginTop: "4px", lineHeight: 1.3 }}>
                      {topByBid?.title || "N/A"}
                    </div>
                    <div style={{ color: "#38bdf8", fontSize: "13px", marginTop: "4px" }}>
                      {formatINR(topByBid?.currentBid || 0)}
                    </div>
                  </div>

                  <div style={{ background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "10px" }}>
                    <div style={{ fontSize: "11px", color: t.textMut, textTransform: "uppercase", fontWeight: 700 }}>
                      Most Competitive Auction
                    </div>
                    <div style={{ fontSize: "15px", color: t.textPri, fontWeight: 700, marginTop: "4px", lineHeight: 1.3 }}>
                      {topByBids?.title || "N/A"}
                    </div>
                    <div style={{ color: "#a78bfa", fontSize: "13px", marginTop: "4px" }}>
                      {safeNum(topByBids?.totalBids)} bids
                    </div>
                  </div>

                  <div style={{ background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "10px" }}>
                    <div style={{ fontSize: "11px", color: t.textMut, textTransform: "uppercase", fontWeight: 700 }}>
                      Active Pipeline Value
                    </div>
                    <div style={{ fontSize: "20px", color: "#10b981", fontWeight: 800, marginTop: "6px" }}>
                      {formatINR(stats.activePipeline)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: t.bgSec, border: `1px solid ${t.border}`, borderRadius: "14px", padding: "18px", marginBottom: "20px" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: "20px", fontWeight: 800 }}>Category Performance</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "680px" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                      {["Category", "Total", "Live", "Completed", "Total Bids", "Revenue"].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: h === "Category" ? "left" : "center",
                            padding: "10px 8px",
                            color: t.textMut,
                            fontSize: "12px",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categoryRows.map((row) => (
                      <tr key={row.category} style={{ borderBottom: `1px solid ${t.border}` }}>
                        <td style={{ padding: "12px 8px", color: t.textPri, fontWeight: 700, fontSize: "14px" }}>{row.category}</td>
                        <td style={{ padding: "12px 8px", color: t.textSec, textAlign: "center", fontSize: "14px" }}>{row.total}</td>
                        <td style={{ padding: "12px 8px", color: "#22c55e", textAlign: "center", fontWeight: 700, fontSize: "14px" }}>
                          {row.active}
                        </td>
                        <td style={{ padding: "12px 8px", color: "#38bdf8", textAlign: "center", fontWeight: 700, fontSize: "14px" }}>
                          {row.completed}
                        </td>
                        <td style={{ padding: "12px 8px", color: "#a78bfa", textAlign: "center", fontWeight: 700, fontSize: "14px" }}>
                          {row.bids}
                        </td>
                        <td style={{ padding: "12px 8px", color: "#10b981", textAlign: "center", fontWeight: 700, fontSize: "14px" }}>
                          {formatINR(row.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "14px",
              }}
            >
              <div style={{ background: t.bgSec, border: `1px solid ${t.border}`, borderRadius: "14px", padding: "18px" }}>
                <h3 style={{ margin: "0 0 12px", fontSize: "20px", fontWeight: 800 }}>Monthly Activity</h3>
                <div style={{ display: "grid", gap: "10px" }}>
                  {monthRows.length === 0 ? (
                    <div style={{ color: t.textMut, fontSize: "14px" }}>No dated activity.</div>
                  ) : (
                    monthRows.map((row) => (
                      <div key={row.month}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                          <span style={{ color: t.textSec, fontSize: "14px", fontWeight: 600 }}>{row.month}</span>
                          <span style={{ color: t.textMut, fontSize: "13px" }}>
                            {row.auctions} auctions | {formatINR(row.revenue)}
                          </span>
                        </div>
                        <div style={{ height: "8px", borderRadius: "999px", overflow: "hidden", background: t.bgInput }}>
                          <div
                            style={{
                              height: "100%",
                              width: `${Math.max(4, Math.round((row.auctions / maxMonthAuctions) * 100))}%`,
                              background: "linear-gradient(90deg,#38bdf8,#6366f1)",
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ background: t.bgSec, border: `1px solid ${t.border}`, borderRadius: "14px", padding: "18px" }}>
                <h3 style={{ margin: "0 0 12px", fontSize: "20px", fontWeight: 800 }}>Recent Auctions</h3>
                <div style={{ display: "grid", gap: "8px" }}>
                  {recentAuctions.map((auction) => (
                    <div
                      key={auction.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: "8px",
                        alignItems: "center",
                        padding: "10px",
                        border: `1px solid ${t.border}`,
                        borderRadius: "10px",
                        background: t.bgInput,
                      }}
                      >
                      <div>
                        <div style={{ fontSize: "14px", color: t.textPri, fontWeight: 700 }}>{auction.title}</div>
                        <div style={{ fontSize: "13px", color: t.textMut }}>
                          {auction.category} | {auction.status}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "13px", color: "#38bdf8", fontWeight: 700 }}>
                          {formatINR(auction.currentBid)}
                        </div>
                        <div style={{ fontSize: "12px", color: t.textMut }}>{auction.totalBids} bids</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <Footercomponent />
    </div>
  );
}
