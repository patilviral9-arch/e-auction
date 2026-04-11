import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useThemeStyles } from "../utils/themeStyles";
import FooterComponent from "../components/user/FooterComponent";

// ── inline helper (no auctionData dependency) ─────────────────────────────────
const formatINR = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

// ── Mark auction Completed in DB when timer hits zero ─────────────────────────
async function markCompleted(auctionId) {
  try {
    await fetch(`${import.meta.env.VITE_API_URL}/auction/auction/${auctionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Completed" }),
    });
  } catch { /* silent */ }
}

function useCountdown(endTime, auctionId, status, onComplete) {
  const calc = (et) => {
    if (!et) return { h: 0, m: 0, s: 0, urgent: false };
    const diff = Math.max(0, et - Date.now());
    return {
      h:      Math.floor(diff / 3600000),
      m:      Math.floor((diff % 3600000) / 60000),
      s:      Math.floor((diff % 60000) / 1000),
      urgent: diff > 0 && diff < 3600000,
    };
  };
  const [time, setTime] = useState(() => calc(endTime));
  const firedRef = useRef(false);

  useEffect(() => {
    if (!endTime) return;
    setTime(calc(endTime));
    const id = setInterval(() => {
      const next = calc(endTime);
      setTime(next);
      if (next.h === 0 && next.m === 0 && next.s === 0 && !firedRef.current && status === "Active" && auctionId) {
        firedRef.current = true;
        markCompleted(auctionId).then(() => { if (onComplete) onComplete(); });
      }
    }, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return time;
}

function AuthGate({ onClose }) {
  const navigate = useNavigate();
  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#ffffff", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "24px", padding: "48px 40px", width: "100%", maxWidth: "420px", textAlign: "center", boxShadow: "0 40px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ fontSize: "52px", marginBottom: "16px" }}>🔒</div>
        <h2 style={{ color: "#000000", fontSize: "24px", fontWeight: 900, margin: "0 0 10px" }}>Login to Place a Bid</h2>
        <p style={{ color: "#78808b", fontSize: "14px", margin: "0 0 32px", lineHeight: 1.6 }}>You need an account to participate in auctions.</p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button onClick={() => navigate("/Login")} style={{ flex: 1, padding: "13px", borderRadius: "12px", background: "linear-gradient(135deg,#38bdf8,#6366f1)", color: "#000000", fontWeight: 700, fontSize: "15px", border: "none", cursor: "pointer" }}>Log In</button>
          <button onClick={() => navigate("/Signup")} style={{ flex: 1, padding: "13px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#000000", fontWeight: 700, fontSize: "15px", cursor: "pointer" }}>Sign Up</button>
        </div>
        <button onClick={onClose} style={{ marginTop: "20px", background: "none", border: "none", color: "#475569", fontSize: "13px", cursor: "pointer" }}>Maybe later</button>
      </div>
    </div>
  );
}

function BidRow({ bidder, avatar, amount, time, isTop }) {
  const t = useThemeStyles();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: `1px solid ${t.border}` }}>
      <div style={{ width: "34px", height: "34px", borderRadius: "10px", flexShrink: 0, overflow: "hidden", background: isTop ? "linear-gradient(135deg,#38bdf8,#6366f1)" : t.bgCard, border: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, color: isTop ? "white" : t.textSec }}>
        {avatar
          ? <img src={avatar} alt={bidder} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : bidder.charAt(0).toUpperCase()
        }
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: isTop ? "#38bdf8" : t.textSec, fontSize: "13px", fontWeight: 700 }}>{bidder} {isTop && <span style={{ fontSize: "10px", color: "#34d399" }}>👑 Leading</span>}</div>
        <div style={{ color: t.textFaint, fontSize: "11px" }}>{time}</div>
      </div>
      <div style={{ color: t.textPri, fontSize: "14px", fontWeight: 800 }}>{formatINR(amount)}</div>
    </div>
  );
}

// ── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ value, onChange, size = 22, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <div style={{ display: "flex", gap: "3px" }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{
            fontSize: `${size}px`, cursor: readonly ? "default" : "pointer",
            color: star <= display ? "#f59e0b" : "#475569",
            transition: "color .15s, transform .15s",
            transform: !readonly && star <= display ? "scale(1.2)" : "scale(1)",
            display: "inline-block",
          }}
        >★</span>
      ))}
    </div>
  );
}

// ── Seller rating summary (sidebar) ──────────────────────────────────────────
function SellerRatingSummary({ auctionId, t }) {
  const [avg,   setAvg]   = useState(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!auctionId) return;
    fetch(`${import.meta.env.VITE_API_URL}/auction/reviews/${auctionId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const list = Array.isArray(data) ? data : data.reviews ?? [];
        if (list.length) {
          setAvg((list.reduce((s, r) => s + (r.rating || 0), 0) / list.length).toFixed(1));
          setCount(list.length);
        }
      })
      .catch(() => {});
  }, [auctionId]);

  if (!avg) return (
    <div style={{ color: t.textFaint, fontSize: "12px" }}>No reviews yet</div>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <StarRating value={Math.round(avg)} size={14} readonly />
      <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: "13px" }}>{avg}</span>
      <span style={{ color: t.textFaint, fontSize: "12px" }}>({count} review{count !== 1 ? "s" : ""})</span>
    </div>
  );
}

// ── Reviews Section ───────────────────────────────────────────────────────────
function ReviewsSection({ auctionId, role, userId, t }) {
  const API = `${import.meta.env.VITE_API_URL}/auction/reviews/${auctionId}`;

  const [reviews,      setReviews]      = useState([]);
  const [loadingList,  setLoadingList]  = useState(true);
  const [listError,    setListError]    = useState("");
  const [myRating,     setMyRating]     = useState(0);
  const [myComment,    setMyComment]    = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState("");
  const [submitted,    setSubmitted]    = useState(false);

  // ── GET — fetch all reviews for this auction ──────────────────────────────
  useEffect(() => {
    if (!auctionId) return;
    setLoadingList(true);
    setListError("");

    const fetchAvatar = async (userId) => {
      if (!userId) return "";
      try {
        const r = await fetch(`${import.meta.env.VITE_API_URL}/user/getuser/${userId}`);
        if (!r.ok) return "";
        const d = await r.json();
        return d?.data?.avatar || "";
      } catch { return ""; }
    };

    fetch(API)
      .then(r => {
        if (!r.ok) throw new Error(`Server error: ${r.status}`);
        return r.json();
      })
      .then(async data => {
        const raw = Array.isArray(data) ? data : data.reviews ?? [];
        // Enrich each review's reviewer with their avatar
        const enriched = await Promise.all(raw.map(async (r) => {
          const rev = r.reviewer;
          // Already has avatar in populated object
          if (rev && typeof rev === "object" && rev.avatar) return r;
          // reviewer is a string ID — fetch their profile
          const reviewerId = rev && typeof rev === "object"
            ? String(rev._id || rev.id || "")
            : String(rev || "");
          const avatar = await fetchAvatar(reviewerId);
          return {
            ...r,
            reviewer: rev && typeof rev === "object"
              ? { ...rev, avatar }
              : { _id: reviewerId, avatar },
          };
        }));
        setReviews(enriched);
      })
      .catch(err => setListError(err.message))
      .finally(() => setLoadingList(false));
  }, [auctionId]);

  // ── POST — submit a new review ────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!myRating)         { setSubmitError("Please select a star rating."); return; }
    if (!myComment.trim()) { setSubmitError("Please write a short review."); return; }
    setSubmitError("");
    setSubmitting(true);
    try {
      const res = await fetch(API, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating:   myRating,
          comment:  myComment.trim(),
          reviewer: userId,          // MongoDB ObjectId of logged-in user
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // e.g. "You have already reviewed this auction."
        throw new Error(data.message || "Failed to submit review.");
      }

      // Add the newly saved review (populated from server) to the top of the list
      const saved = data.review ?? {
        rating:    myRating,
        comment:   myComment.trim(),
        createdAt: new Date().toISOString(),
        reviewer:  { name: "You" },
      };

      setReviews(prev => [saved, ...prev]);
      setMyRating(0);
      setMyComment("");
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  const ratingBars = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => Math.round(r.rating) === star).length,
    pct:   reviews.length
      ? Math.round((reviews.filter(r => Math.round(r.rating) === star).length / reviews.length) * 100)
      : 0,
  }));

  // ── Reviewer display name helper ──────────────────────────────────────────
  const reviewerName = (r) => {
    const rev = r.reviewer;
    if (!rev) return "Anonymous";
    if (typeof rev === "string") return rev;
    return rev.businessName || rev.name || rev.email || "Anonymous";
  };

  return (
    <div style={{ marginTop: "32px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <div style={{ color: t.textPri, fontWeight: 800, fontSize: "18px" }}>Reviews & Ratings</div>
        {avgRating && (
          <span style={{ background: "rgba(245,158,11,.12)", border: "1px solid rgba(245,158,11,.3)", borderRadius: "50px", padding: "3px 10px", color: "#f59e0b", fontWeight: 700, fontSize: "13px" }}>
            ★ {avgRating}
          </span>
        )}
        <span style={{ color: t.textFaint, fontSize: "13px" }}>({reviews.length})</span>
      </div>

      {/* Rating overview bars */}
      {reviews.length > 0 && (
        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "20px", marginBottom: "20px", display: "flex", gap: "32px", alignItems: "center", flexWrap: "wrap", boxShadow: t.shadowCard }}>
          <div style={{ textAlign: "center", minWidth: "80px" }}>
            <div style={{ color: t.textPri, fontSize: "48px", fontWeight: 900, lineHeight: 1 }}>{avgRating}</div>
            <StarRating value={Math.round(avgRating)} size={16} readonly />
            <div style={{ color: t.textMut, fontSize: "11px", marginTop: "4px" }}>{reviews.length} review{reviews.length !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ flex: 1, minWidth: "180px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {ratingBars.map(({ star, count, pct }) => (
              <div key={star} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: t.textMut, fontSize: "12px", width: "14px", textAlign: "right" }}>{star}</span>
                <span style={{ color: "#f59e0b", fontSize: "13px" }}>★</span>
                <div style={{ flex: 1, height: "8px", background: t.L ? "rgba(0,0,0,.07)" : "rgba(255,255,255,.07)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: star >= 4 ? "#f59e0b" : star === 3 ? "#38bdf8" : "#f43f5e", borderRadius: "4px", transition: "width .5s" }} />
                </div>
                <span style={{ color: t.textFaint, fontSize: "11px", width: "20px" }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write a review form */}
      {(role && role !== "guest") ? (
        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: t.shadowCard }}>
          {submitted ? (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>🎉</div>
              <div style={{ color: "#34d399", fontWeight: 700, fontSize: "15px" }}>Review submitted — thank you!</div>
              <button onClick={() => setSubmitted(false)} style={{ marginTop: "12px", background: "none", border: "none", color: "#38bdf8", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>Write another</button>
            </div>
          ) : (
            <>
              <div style={{ color: t.textPri, fontWeight: 700, fontSize: "15px", marginBottom: "16px" }}>✍️ Write a Review</div>

              {/* Star picker */}
              <div style={{ marginBottom: "14px" }}>
                <div style={{ color: t.textMut, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: "8px" }}>Your Rating *</div>
                <StarRating value={myRating} onChange={setMyRating} size={30} />
                {myRating > 0 && (
                  <div style={{ color: "#f59e0b", fontSize: "12px", marginTop: "6px", fontWeight: 600 }}>
                    {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][myRating]}
                  </div>
                )}
              </div>

              {/* Comment */}
              <div style={{ marginBottom: "14px" }}>
                <div style={{ color: t.textMut, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: "8px" }}>Your Review *</div>
                <textarea
                  value={myComment}
                  onChange={e => { setMyComment(e.target.value); setSubmitError(""); }}
                  placeholder="Share your experience with this seller or item…"
                  rows={3}
                  style={{ width: "100%", padding: "12px 14px", background: t.bgInput, border: `1px solid ${submitError ? "rgba(244,63,94,.4)" : t.borderMd}`, borderRadius: "10px", color: t.textPri, fontSize: "14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.6 }}
                />
              </div>

              {submitError && (
                <div style={{ background: "rgba(244,63,94,.08)", border: "1px solid rgba(244,63,94,.25)", borderRadius: "8px", padding: "10px 14px", color: "#f43f5e", fontSize: "13px", fontWeight: 600, marginBottom: "12px" }}>
                  ⚠️ {submitError}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ padding: "11px 28px", borderRadius: "10px", border: "none", background: submitting ? t.bgCard : "linear-gradient(135deg,#f59e0b,#d97706)", color: submitting ? t.textMut : "white", fontWeight: 700, fontSize: "14px", cursor: submitting ? "not-allowed" : "pointer", boxShadow: submitting ? "none" : "0 4px 14px rgba(245,158,11,.3)", opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "⏳ Submitting…" : "Submit Review"}
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "14px", padding: "16px 20px", marginBottom: "20px", textAlign: "center" }}>
          <div style={{ color: t.textMut, fontSize: "13px" }}>
            <Link to="/Login" style={{ color: "#38bdf8", fontWeight: 700 }}>Log in</Link> to leave a review
          </div>
        </div>
      )}

      {/* Review list */}
      {loadingList ? (
        <div style={{ textAlign: "center", padding: "24px 0", color: t.textFaint }}>
          <div style={{ fontSize: "24px", animation: "pulse 1s infinite", marginBottom: "8px" }}>⏳</div>
          <div style={{ fontSize: "13px" }}>Loading reviews…</div>
        </div>
      ) : listError ? (
        <div style={{ background: "rgba(244,63,94,.06)", border: "1px solid rgba(244,63,94,.2)", borderRadius: "12px", padding: "14px 18px", color: "#f43f5e", fontSize: "13px" }}>
          ⚠️ Could not load reviews: {listError}
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: t.textFaint }}>
          <div style={{ fontSize: "40px", marginBottom: "10px" }}>💬</div>
          <div style={{ fontSize: "14px" }}>No reviews yet — be the first!</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {reviews.map((r, i) => (
            <div key={r._id || i} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "14px", padding: "16px 20px", boxShadow: t.shadowCard, animation: "fadeIn .3s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", overflow: "hidden", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "15px", fontWeight: 800, flexShrink: 0 }}>
                    {r.reviewer?.avatar
                      ? <img src={r.reviewer.avatar} alt={reviewerName(r)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      : reviewerName(r).charAt(0).toUpperCase()
                    }
                  </div>
                  <div>
                    <div style={{ color: t.textPri, fontWeight: 700, fontSize: "14px" }}>{reviewerName(r)}</div>
                    <StarRating value={Math.round(r.rating)} size={13} readonly />
                  </div>
                </div>
                <div style={{ color: t.textFaint, fontSize: "11px", flexShrink: 0 }}>
                  {r.createdAt
                    ? new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : ""}
                </div>
              </div>
              <p style={{ color: t.textSec, fontSize: "14px", lineHeight: 1.6, margin: 0 }}>{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AuctionDetail() {
  const t = useThemeStyles();
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, userId, userName, name } = useAuth();
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false
  ));

   useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [id]);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const media = window.matchMedia("(max-width: 768px)");
    const onChange = (event) => setIsMobile(event.matches);
    setIsMobile(media.matches);
    if (media.addEventListener) media.addEventListener("change", onChange);
    else media.addListener(onChange);
    return () => {
      if (media.removeEventListener) media.removeEventListener("change", onChange);
      else media.removeListener(onChange);
    };
  }, []);

  const [auction,    setAuction]   = useState(null);
  const [loading,    setLoading]   = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    setLoading(true);
    setFetchError("");
    fetch(`${import.meta.env.VITE_API_URL}/auction/auctions/${id}`)
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        // normalise API shape → component shape
        const a = data.auction ?? data.data ?? data;
        const imgs = Array.isArray(a.images) && a.images.length > 0
          ? a.images.map(i => (typeof i === "string" ? i : i.url || i.secure_url))
          : [];
        setAuction({
          id:              String(a._id || a.id),
          title:           a.title,
          category:        a.category,
          condition:       a.condition,
          location:        a.location,
          description:     a.description,
          seller:          (typeof a.createdBy === "object" && a.createdBy)
                             ? (a.createdBy.businessName || a.createdBy.name || a.createdBy.email || "Unknown")
                             : (a.createdBy || "Unknown"),
          sellerAvatar:    (typeof a.createdBy === "object" && a.createdBy)
                             ? (a.createdBy.avatar || "")
                             : "",
          sellerId:        (typeof a.createdBy === "object" && a.createdBy)
                             ? String(a.createdBy._id || a.createdBy.id || "")
                             : String(a.createdBy || ""),
          currentBid:      a.currentBid ?? a.startingBid ?? 0,
          startingBid:     a.startingBid ?? 0,
          reservePrice:    a.reservePrice,
          minIncrement:    a.minBidIncrement ?? 100,
          totalBids:       a.totalBids ?? a.bids?.length ?? 0,
          duration:        a.duration,
          durationMinutes: a.durationMinutes ?? null,
          startDate:       a.startDate ?? a.createdAt ?? null,
          endTime: (() => {
            // 1. Best case — server stored endTime explicitly
            if (a.endTime) return new Date(a.endTime).getTime();

            // 2. Server stored durationMinutes
            const base = a.startDate ?? a.createdAt;
            if (a.durationMinutes && base)
              return new Date(base).getTime() + a.durationMinutes * 60 * 1000;

            // 3. Parse duration string (e.g. "1 Hour", "3 Days", "7 Days")
            // This handles ALL existing auctions that only have a duration label
            if (a.duration && base) {
              const str = a.duration.toLowerCase();
              let mins = 1440; // default 1 day
              if      (/1\s*hour/i.test(str))   mins = 60;
              else if (/6\s*hour/i.test(str))   mins = 360;
              else if (/12\s*hour/i.test(str))  mins = 720;
              else if (/1\s*day/i.test(str))    mins = 1440;
              else if (/3\s*day/i.test(str))    mins = 4320;
              else if (/7\s*day/i.test(str))    mins = 10080;
              return new Date(base).getTime() + mins * 60 * 1000;
            }

            // 4. Absolute last resort
            return Date.now() + 24 * 60 * 60 * 1000;
          })(),
          status:          a.status,
          tags:            a.tags || [],
          images:          imgs,
          img:             imgs[0] || "https://placehold.co/600x400?text=No+Image",
          live:            a.status === "Active",
        });
      })
      .catch(err => setFetchError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const [selectedImg, setSelectedImg] = useState(0);
  const [bidAmount, setBidAmount]     = useState("");
  const [showAuth, setShowAuth]       = useState(false);
  const [bidPlaced, setBidPlaced]     = useState(false);
  const [bidError, setBidError]       = useState("");
  const [currentBid, setCurrentBid]   = useState(0);
  const [bids, setBids]               = useState([]);
  const [rawBids, setRawBids]         = useState([]); // raw API objects — used to find existing bid ID
  const [watched, setWatched]         = useState(false);
  const [watchMsg, setWatchMsg]       = useState(""); // "added" | "removed" | "error"

  // Lock deposit state
  const [depositLocked, setDepositLocked] = useState(false);
  const [lockAmount,    setLockAmount]    = useState(0);
  const [walletBalance, setWalletBalance] = useState(null);
  const [lockLoading,   setLockLoading]   = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockError,     setLockError]     = useState("");

  // ── Add / remove from watchlist ───────────────────────────────────────────
  const handleWatchlist = async () => {
    if (role === "guest" || !role) { setShowAuth(true); return; }
    if (watched) {
      // Remove
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/wish/wishlist/${userId}/remove/${auction.id}`, { method: "DELETE" });
        setWatched(false);
        setWatchMsg("removed");
      } catch { setWatchMsg("error"); }
    } else {
      // Add
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/wish/wishlist/${userId}/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ auctionId: auction.id }),
        });
        if (!res.ok) throw new Error();
        setWatched(true);
        setWatchMsg("added");
      } catch { setWatchMsg("error"); }
    }
    setTimeout(() => setWatchMsg(""), 3000);
  };

  // ── Pre-check if already in watchlist ────────────────────────────────────
  useEffect(() => {
    if (!userId || !auction?.id) return;
    fetch(`${import.meta.env.VITE_API_URL}/wish/wishlist/${userId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const ids = (data.auctions || []).map(a => String(a._id || a.id || a));
        setWatched(ids.includes(String(auction.id)));
      })
      .catch(() => {});
  }, [userId, auction?.id]);

  // Check lock status when auction loads
  useEffect(() => {
    if (!userId || !auction?.id || role === "guest" || !role) return;
    const computed = +(auction.startingBid * 0.05).toFixed(2);
    setLockAmount(computed);
    fetch(`${import.meta.env.VITE_API_URL}/wallet/${userId}/wallet/lock-status/${auction.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setDepositLocked(data.locked);
          setWalletBalance(data.balance);
        }
      })
      .catch(() => {});
  }, [userId, auction?.id, auction?.startingBid, role]);

  // Lock 5% deposit before bidding
  const handleLockDeposit = async () => {
    if (!userId || !auction) return;
    setLockLoading(true);
    setLockError("");
    try {
      // Fetch current balance first
      const wRes = await fetch(`${import.meta.env.VITE_API_URL}/wallet/${userId}/wallet`);
      const wData = wRes.ok ? await wRes.json() : null;
      const balance = wData?.balance ?? 0;
      setWalletBalance(balance);

      if (balance < lockAmount) {
        setLockError(`Insufficient balance. You need ${formatINR(lockAmount)} but have ${formatINR(balance)}. Please add ${formatINR(+(lockAmount - balance).toFixed(2))} to your wallet.`);
        setLockLoading(false);
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/wallet/${userId}/wallet/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auctionId:    auction.id,
          auctionTitle: auction.title,
          startingBid:  auction.startingBid,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLockError(data.message || "Failed to lock deposit.");
        return;
      }
      setDepositLocked(true);
      setWalletBalance(data.newBalance);
      setShowLockModal(false);
    } catch {
      setLockError("Network error — please try again.");
    } finally {
      setLockLoading(false);
    }
  };

  // ── Keyboard arrow navigation for image slider ────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!auction) return;
      const imgs = auction.images.length > 0 ? auction.images : [auction.img];
      if (e.key === "ArrowLeft")  setSelectedImg(i => (i - 1 + imgs.length) % imgs.length);
      if (e.key === "ArrowRight") setSelectedImg(i => (i + 1) % imgs.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [auction]);

  // ── Fetch real bid history + derive currentBid from it ───────────────────
  useEffect(() => {
    if (!id) return;

    // Helper: fetch a user's avatar by their ID
    const fetchAvatar = async (userId) => {
      if (!userId) return "";
      try {
        const r = await fetch(`${import.meta.env.VITE_API_URL}/user/getuser/${userId}`);
        if (!r.ok) return "";
        const d = await r.json();
        return d?.data?.avatar || "";
      } catch { return ""; }
    };

    fetch(`${import.meta.env.VITE_API_URL}/bid/bids/auction/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(async data => {
        const list = data.data ?? [];
        setRawBids(list);
        if (list.length > 0) {
          setCurrentBid(list[0].bidAmount);
        } else if (auction) {
          setCurrentBid(auction.currentBid ?? auction.startingBid ?? 0);
        }

        const formatted = await Promise.all(list.map(async (b, i) => {
          let displayName = b.userName || "";
          let bidderId = "";
          let avatar = "";

          if (b.bidder && typeof b.bidder === "object") {
            const u = b.bidder;
            bidderId = String(u._id || u.id || "");
            if (!displayName) {
              displayName = u.businessName
                ? u.businessName
                : ((u.firstName || "") + " " + (u.lastName || "")).trim() || u.email || "Unknown";
            }
            avatar = u.avatar || "";
          } else if (typeof b.bidder === "string") {
            bidderId = b.bidder;
          }

          // If avatar not in the populated object, fetch it directly
          if (!avatar && bidderId) avatar = await fetchAvatar(bidderId);

          return {
            bidder:  displayName || "Unknown",
            avatar,
            amount:  b.bidAmount,
            time:    new Date(b.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
            isTop:   i === 0,
            _bidId:  String(b._id || ""),
          };
        }));
        setBids(formatted);
      })
      .catch(() => {
        if (auction) setCurrentBid(auction.currentBid ?? 0);
      });
  }, [id, auction?.id]);

  // ── Lock endTime once when auction loads — useRef never triggers re-render ───
  const endTimeRef = useRef(null);
  if (auction && !endTimeRef.current) {
    endTimeRef.current = auction.endTime; // already fully resolved in setAuction above
  }

  const timer = useCountdown(
    endTimeRef.current,
    auction?.id,
    auction?.status,
    () => setAuction(prev => prev ? { ...prev, status: "Completed", live: false } : prev),
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px", animation: "pulse 1s infinite" }}>⏳</div>
        <div style={{ color: t.textSec, fontSize: "16px", fontWeight: 600 }}>Loading auction…</div>
      </div>
    </div>
  );

  if (fetchError || !auction) return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "64px" }}>🔍</div>
        <h2 style={{ color: t.textPri, margin: "16px 0 8px" }}>Auction not found</h2>
        {fetchError && <div style={{ color: "#f43f5e", fontSize: "13px", marginBottom: "8px" }}>{fetchError}</div>}
        <button onClick={() => navigate("/browse")} style={{ padding: "12px 28px", borderRadius: "10px", background: "linear-gradient(135deg,#38bdf8,#6366f1)", color: "white", fontWeight: 700, fontSize: "14px", border: "none", cursor: "pointer", marginTop: "16px" }}>Browse Auctions</button>
      </div>
    </div>
  );

  const images  = auction.images.length > 0 ? auction.images : [auction.img];
  const minBid  = currentBid + (auction.minIncrement || 100);

  // ── Find the current user's existing bid ID for this auction (from bids state)
  // rawBids holds the original API objects so we can grab _id for PUT
  const myExistingBidId = rawBids.find(
    b => String(b.bidder?._id || b.bidder) === String(userId)
  )?._id || null;

  const handleBid = async () => {
    if (role === "guest" || !role) { setShowAuth(true); return; }
    if (role === "business" && auction.sellerId === String(userId)) return;
    const amount = Number(bidAmount);
    if (!amount || amount < minBid) { setBidError(`Minimum bid is ${formatINR(minBid)}`); return; }
    setBidError("");

    // Must lock 5% deposit before placing first bid
    if (!depositLocked) {
      setShowLockModal(true);
      return;
    }

    // Build userName from localStorage
    let bidderName = "Anonymous";
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (storedUser.businessName) {
        bidderName = storedUser.businessName;
      } else {
        const first = storedUser.firstName || "";
        const last  = storedUser.lastName  || "";
        bidderName  = (first + " " + last).trim() || storedUser.name || userName || "Anonymous";
      }
    } catch {
      bidderName = userName || "Anonymous";
    }

    try {
      let res, data;

      if (myExistingBidId) {
        // ── User already has a bid — UPDATE it via PUT ──────────────────────
        res = await fetch(`${import.meta.env.VITE_API_URL}/bid/bid/${myExistingBidId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bidAmount: amount,
            userName:  bidderName,
          }),
        });
      } else {
        // ── First bid from this user — CREATE via POST ──────────────────────
        res = await fetch(`${import.meta.env.VITE_API_URL}/bid/bid`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auction:      auction.id,
            auctionTitle: auction.title,
            bidder:       userId,
            userName:     bidderName,
            bidAmount:    amount,
          }),
        });
      }

      data = await res.json();
      if (!res.ok) {
        setBidError(data.message || "Failed to place bid. Please try again.");
        return;
      }

      const confirmedName = data.data?.userName || bidderName;

      // Optimistic UI update
      setCurrentBid(amount);
      setAuction((prev) => prev ? { ...prev, currentBid: amount, totalBids: myExistingBidId ? prev.totalBids : (prev.totalBids || 0) + 1 } : prev);
      setBids((prev) => {
        if (myExistingBidId) {
          // Replace the old bid entry with the updated amount, keep it at top
          const others = prev.filter(b => b._bidId !== myExistingBidId);
          return [
            { bidder: confirmedName, amount, time: "Just now", isTop: true, _bidId: myExistingBidId },
            ...others.map(b => ({ ...b, isTop: false })),
          ];
        }
        return [
          { bidder: confirmedName, amount, time: "Just now", isTop: true },
          ...prev.map(b => ({ ...b, isTop: false })),
        ];
      });

      // Re-fetch to confirm from server
      setTimeout(() => {
        fetch(`${import.meta.env.VITE_API_URL}/bid/bids/auction/${id}`)
          .then(r => r.ok ? r.json() : null)
          .then(async bidData => {
            if (!bidData) return;
            const list = bidData.data ?? [];
            if (list.length > 0) {
              setCurrentBid(list[0].bidAmount);
              setAuction((prev) => prev ? { ...prev, currentBid: list[0].bidAmount, totalBids: list.length } : prev);
            }
            // Also refresh rawBids so next bid knows the correct existing ID
            setRawBids(list);
            const fetchAvatar = async (uid) => {
              if (!uid) return "";
              try { const r = await fetch(`${import.meta.env.VITE_API_URL}/user/getuser/${uid}`); if (!r.ok) return ""; const d = await r.json(); return d?.data?.avatar || ""; } catch { return ""; }
            };
            const formatted = await Promise.all(list.map(async (b, i) => {
              let displayName = b.userName || "";
              let bidderId = "";
              let avatar = "";
              if (b.bidder && typeof b.bidder === "object") {
                const u = b.bidder;
                bidderId = String(u._id || u.id || "");
                if (!displayName) { displayName = u.businessName ? u.businessName : ((u.firstName || "") + " " + (u.lastName || "")).trim() || u.email || "Unknown"; }
                avatar = u.avatar || "";
              } else if (typeof b.bidder === "string") { bidderId = b.bidder; }
              if (!avatar && bidderId) avatar = await fetchAvatar(bidderId);
              return { bidder: displayName || "Unknown", avatar, amount: b.bidAmount, time: new Date(b.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }), isTop: i === 0, _bidId: String(b._id || "") };
            }));
            setBids(formatted);
          })
          .catch(() => {});
      }, 800);

      setBidAmount("");
      setBidPlaced(true);
      setTimeout(() => setBidPlaced(false), 3000);
    } catch (err) {
      setBidError("Network error — please try again.");
    }
  };
  const quickBids = [minBid, minBid + 1000, minBid + 5000, minBid + 10000];

  return (
    <div style={{ background: t.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", transition: "background 0.25s" }}>
      {showAuth && <AuthGate onClose={() => setShowAuth(false)} />}

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: isMobile ? "12px 14px 0" : "20px 32px 0" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", fontSize: isMobile ? "12px" : "13px", color: t.textFaint }}>
          <Link to="/" style={{ color: t.textFaint, textDecoration: "none" }}>Home</Link><span>›</span>
          <Link to="/browse" style={{ color: t.textFaint, textDecoration: "none" }}>Browse</Link><span>›</span>
          <span style={{ color: t.textSec }}>{auction.title}</span>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: isMobile ? "16px 14px 36px" : "24px 32px 60px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 420px", gap: isMobile ? "18px" : "32px" }}>
        <div style={{ order: 1 }}>
          <div style={{ borderRadius: isMobile ? "16px" : "20px", overflow: "hidden", border: `1px solid ${t.border}`, aspectRatio: "4/3", position: "relative", background: t.bgCard }}>
            <img src={images[selectedImg]} alt={auction.title} style={{ width: "100%", height: "100%", objectFit: "cover", filter: auction.status === "Cancelled" || auction.status === "Completed" ? "grayscale(20%)" : "none", transition: "opacity 0.2s ease" }} />
            {/* ── FIX: Status badge reflects real auction status ── */}
            {auction.status === "Cancelled" ? (
              <div style={{ position: "absolute", top: isMobile ? "10px" : "16px", left: isMobile ? "10px" : "16px", background: "rgba(239,68,68,0.9)", backdropFilter: "blur(8px)", color: "white", fontWeight: 800, fontSize: isMobile ? "10px" : "12px", padding: isMobile ? "4px 9px" : "5px 12px", borderRadius: "50px" }}>
                🚫 Cancelled
              </div>
            ) : auction.status === "Completed" || (auction.endTime && auction.endTime <= Date.now()) ? (
              <div style={{ position: "absolute", top: isMobile ? "10px" : "16px", left: isMobile ? "10px" : "16px", background: "rgba(100,116,139,0.9)", backdropFilter: "blur(8px)", color: "white", fontWeight: 800, fontSize: isMobile ? "10px" : "12px", padding: isMobile ? "4px 9px" : "5px 12px", borderRadius: "50px" }}>
                ✓ Ended
              </div>
            ) : auction.status === "Scheduled" ? (
              <div style={{ position: "absolute", top: isMobile ? "10px" : "16px", left: isMobile ? "10px" : "16px", background: "rgba(245,158,11,0.9)", backdropFilter: "blur(8px)", color: "white", fontWeight: 800, fontSize: isMobile ? "10px" : "12px", padding: isMobile ? "4px 9px" : "5px 12px", borderRadius: "50px" }}>
                📅 Scheduled
              </div>
            ) : auction.status === "Active" ? (
              <div style={{ position: "absolute", top: isMobile ? "10px" : "16px", left: isMobile ? "10px" : "16px", background: "rgba(244,63,94,0.9)", backdropFilter: "blur(8px)", color: "white", fontWeight: 800, fontSize: isMobile ? "10px" : "12px", padding: isMobile ? "4px 9px" : "5px 12px", borderRadius: "50px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "white", display: "inline-block", animation: "pulse 1s infinite" }} />LIVE
              </div>
            ) : null}
            <div style={{ position: "absolute", top: isMobile ? "10px" : "16px", right: isMobile ? "10px" : "16px", background: "rgba(0,0,0,0.6)", color: "#ffffff", WebkitTextFillColor: "#ffffff", fontSize: isMobile ? "10px" : "12px", fontWeight: 700, padding: isMobile ? "4px 9px" : "5px 12px", borderRadius: "50px" }}>{bids.length} bid{bids.length !== 1 ? "s" : ""}</div>

            {/* ── Slider prev/next arrows ── */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImg(i => (i - 1 + images.length) % images.length)}
                  style={{ position: "absolute", left: isMobile ? "8px" : "12px", top: "50%", transform: "translateY(-50%)", width: isMobile ? "32px" : "38px", height: isMobile ? "32px" : "38px", borderRadius: "50%", background: "rgba(0,0,0,0.52)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.2)", color: "#ffffff", WebkitTextFillColor: "#ffffff", fontSize: isMobile ? "18px" : "20px", lineHeight: 1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, transition: "background .2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.82)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.52)"}
                >‹</button>
                <button
                  onClick={() => setSelectedImg(i => (i + 1) % images.length)}
                  style={{ position: "absolute", right: isMobile ? "8px" : "12px", top: "50%", transform: "translateY(-50%)", width: isMobile ? "32px" : "38px", height: isMobile ? "32px" : "38px", borderRadius: "50%", background: "rgba(0,0,0,0.52)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.2)", color: "#ffffff", WebkitTextFillColor: "#ffffff", fontSize: isMobile ? "18px" : "20px", lineHeight: 1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, transition: "background .2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.82)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.52)"}
                >›</button>

                {/* Image counter + dot strip */}
                <div style={{ position: "absolute", bottom: "14px", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: "6px", zIndex: 2 }}>
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setSelectedImg(i)}
                      style={{ width: selectedImg === i ? "22px" : "8px", height: "8px", borderRadius: "50px", background: selectedImg === i ? "white" : "rgba(255,255,255,0.45)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.25s ease" }}
                    />
                  ))}
                </div>

                {/* Image index counter top-right of badge row */}
                <div style={{ position: "absolute", bottom: "14px", right: "14px", background: "rgba(0,0,0,0.5)", color: "#ffffff", fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "50px", zIndex: 2 }}>
                  {selectedImg + 1} / {images.length}
                </div>
              </>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "12px", overflowX: "auto", paddingBottom: "4px" }}>
            {images.map((img, i) => (
              <div key={i} onClick={() => setSelectedImg(i)}
                style={{ width: isMobile ? "64px" : "80px", height: isMobile ? "64px" : "80px", borderRadius: "12px", overflow: "hidden", border: `2px solid ${selectedImg === i ? "#38bdf8" : t.border}`, cursor: "pointer", flexShrink: 0, boxShadow: selectedImg === i ? "0 0 0 3px rgba(56,189,248,0.25)" : "none", transition: "border-color .2s, box-shadow .2s", opacity: selectedImg === i ? 1 : 0.7 }}>
                <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: isMobile ? "18px" : "28px" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
              <span style={ts("#818cf8","rgba(99,102,241,0.15)")}>{auction.category}</span>
              <span style={ts("#34d399","rgba(52,211,153,0.1)")}>✓ Verified Seller</span>
              {auction.condition && <span style={ts("#f59e0b","rgba(245,158,11,0.1)")}>{auction.condition}</span>}
            </div>
            <h1 style={{ color: t.textPri, fontSize: isMobile ? "22px" : "26px", fontWeight: 900, margin: "0 0 14px", lineHeight: 1.3 }}>{auction.title}</h1>
            <p style={{ color: t.textMut, fontSize: isMobile ? "14px" : "15px", lineHeight: 1.7, margin: "0 0 20px" }}>{auction.description || "Premium auction item in excellent condition. Fully inspected and verified by our team."}</p>
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "16px", padding: isMobile ? "16px" : "20px", boxShadow: t.shadowCard }}>
              <div style={{ color: t.textPri, fontWeight: 700, marginBottom: "14px", fontSize: "15px" }}>Item Details</div>
              {[["Category", auction.category],["Condition", auction.condition||"Excellent"],["Location","Mumbai, Maharashtra"],["Seller", auction.seller||"TechVault Pvt Ltd"],["Listed","3 days ago"],["Item ID",`#AUC-${auction.id}`]].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "10px", padding: "8px 0", borderBottom: `1px solid ${t.border}`, fontSize: isMobile ? "12px" : "13px" }}>
                  <span style={{ color: t.textMut }}>{label}</span>
                  <span style={{ color: t.textSec, fontWeight: 600, textAlign: "right" }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: isMobile ? "18px" : "28px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "16px", padding: isMobile ? "16px" : "20px", boxShadow: t.shadowCard }}>
            <div style={{ color: t.textPri, fontWeight: 700, fontSize: "15px", marginBottom: "16px" }}>Bid History <span style={{ color: t.textMut, fontWeight: 400, fontSize: "13px" }}>({bids.length} bids)</span></div>
            {bids.map((b, i) => <BidRow key={i} {...b} />)}
          </div>

          {/* ── Reviews (desktop here; mobile after bidding panel) ── */}
          {!isMobile && (
            <ReviewsSection
              auctionId={auction.id}
              sellerId={auction.sellerId}
              role={role}
              userId={userId}
              t={t}
            />
          )}
        </div>

        <div style={{ position: isMobile ? "static" : "sticky", top: isMobile ? "auto" : "80px", alignSelf: "start", order: 2 }}>
          <div style={{ background: t.bgCard, border: `1px solid ${t.borderMd}`, borderRadius: isMobile ? "16px" : "20px", overflow: "hidden", boxShadow: t.shadowCard }}>
            <div style={{ background: timer.urgent ? "linear-gradient(135deg,rgba(244,63,94,0.15),rgba(244,63,94,0.05))" : t.L ? "linear-gradient(135deg,rgba(56,189,248,0.08),rgba(99,102,241,0.04))" : "linear-gradient(135deg,rgba(99,102,241,0.1),rgba(56,189,248,0.05))", borderBottom: `1px solid ${t.border}`, padding: isMobile ? "14px" : "20px", textAlign: "center" }}>
              <div style={{ color: t.textMut, fontSize: isMobile ? "11px" : "12px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: isMobile ? "8px" : "10px" }}>⏱ Auction Ends In</div>
              <div style={{ display: "flex", justifyContent: "center", gap: isMobile ? "6px" : "8px" }}>
                {[["h", timer.h], ["m", timer.m], ["s", timer.s]].map(([unit, val]) => (
                  <div key={unit} style={{ textAlign: "center" }}>
                    <div style={{ background: t.L ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)", borderRadius: "10px", padding: isMobile ? "8px 10px" : "10px 14px", minWidth: isMobile ? "44px" : "52px", color: timer.urgent ? "#f43f5e" : t.textPri, fontSize: isMobile ? "22px" : "28px", fontWeight: 900, lineHeight: 1 }}>{String(val).padStart(2,"0")}</div>
                    <div style={{ color: t.textFaint, fontSize: "10px", marginTop: "4px", textTransform: "uppercase" }}>{unit}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: isMobile ? "16px" : "24px" }}>
              <div style={{ marginBottom: isMobile ? "14px" : "20px" }}>
                <div style={{ color: t.textMut, fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Current Bid</div>
                <div style={{ color: t.textPri, fontSize: isMobile ? "30px" : "36px", fontWeight: 900 }}>{formatINR(currentBid)}</div>
                {auction.status === "Active" && <div style={{ color: t.textFaint, fontSize: "12px", marginTop: "2px" }}>Min next bid: {formatINR(minBid)}</div>}
              </div>

              {/* ── FIX: Show status-appropriate panel ── */}
              {auction.status === "Cancelled" ? (
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>🚫</div>
                  <div style={{ color: "#ef4444", fontWeight: 700, fontSize: "15px" }}>Auction Cancelled</div>
                  <div style={{ color: t.textMut, fontSize: "13px", marginTop: "6px" }}>This auction has been cancelled by the seller.</div>
                </div>
              ) : auction.status === "Completed" || (auction.endTime && auction.endTime <= Date.now()) ? (
                <div style={{ background: t.L ? "rgba(0,0,0,.04)" : "rgba(255,255,255,.04)", border: `1px solid ${t.border}`, borderRadius: "12px", padding: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>✅</div>
                  <div style={{ color: t.textSec, fontWeight: 700, fontSize: "15px" }}>Auction Ended</div>
                  <div style={{ color: t.textMut, fontSize: "13px", marginTop: "6px" }}>Bidding is closed for this auction.</div>
                </div>
              ) : auction.status === "Scheduled" ? (
                <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>📅</div>
                  <div style={{ color: "#f59e0b", fontWeight: 700, fontSize: "15px" }}>Auction Scheduled</div>
                  <div style={{ color: t.textMut, fontSize: "13px", marginTop: "6px" }}>This auction hasn't started yet. Check back soon!</div>
                </div>
              ) : (
                // Active — show normal bid UI
                <>
                  {bidPlaced && <div style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", color: "#34d399", fontSize: "13px", fontWeight: 600 }}>✅ Bid placed successfully!</div>}
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: t.textFaint, fontSize: "15px", fontWeight: 700 }}>₹</span>
                      <input type="number" value={bidAmount} onChange={(e) => { setBidAmount(e.target.value); setBidError(""); }} placeholder={String(minBid)}
                        style={{ width: "100%", padding: isMobile ? "12px 12px 12px 28px" : "14px 14px 14px 30px", background: t.bgInput, border: `1px solid ${bidError ? "rgba(244,63,94,0.5)" : t.borderMd}`, borderRadius: "12px", color: t.textPri, fontSize: isMobile ? "16px" : "18px", fontWeight: 700, outline: "none", boxSizing: "border-box" }} />
                    </div>
                    {bidError && <div style={{ color: "#f43f5e", fontSize: "12px", marginTop: "6px" }}>{bidError}</div>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
                    {quickBids.map((amt) => (
                      <button key={amt} onClick={() => setBidAmount(String(amt))} style={{ padding: "8px", borderRadius: "8px", background: bidAmount === String(amt) ? "rgba(56,189,248,0.15)" : t.bgCard, border: `1px solid ${bidAmount === String(amt) ? "rgba(56,189,248,0.4)" : t.border}`, color: bidAmount === String(amt) ? "#38bdf8" : t.textMut, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>{formatINR(amt)}</button>
                    ))}
                  </div>
                  {role === "business" && auction.sellerId === String(userId) ? (
                    <button disabled style={{ width: "100%", padding: isMobile ? "12px" : "15px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.35)", borderRadius: "12px", color: "#6366f1", fontSize: isMobile ? "14px" : "16px", fontWeight: 800, cursor: "not-allowed" }}>
                      🚫 You can't bid on your own auction
                    </button>
                  ) : (
                    <>
                      {/* Deposit lock status indicator */}
                      {(role !== "guest" && role) && (
                        <div style={{ marginBottom: "10px", padding: "8px 12px", borderRadius: "8px", background: depositLocked ? "rgba(52,211,153,0.08)" : "rgba(245,158,11,0.08)", border: `1px solid ${depositLocked ? "rgba(52,211,153,0.25)" : "rgba(245,158,11,0.25)"}`, display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 600 }}>
                          <span>{depositLocked ? "✅" : "⚠️"}</span>
                          <span style={{ color: depositLocked ? "#34d399" : "#f59e0b" }}>
                            {depositLocked
                              ? `${formatINR(lockAmount)} deposit locked — you're in!`
                              : `Requires ${formatINR(lockAmount)} deposit (5% of starting bid)`}
                          </span>
                        </div>
                      )}
                      <button onClick={handleBid} style={{ width: "100%", padding: isMobile ? "12px" : "15px", background: "linear-gradient(135deg,#38bdf8,#6366f1)", border: "none", borderRadius: "12px", color: "white", fontSize: isMobile ? "14px" : "16px", fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 24px rgba(56,189,248,0.25)" }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
                        {(role === "guest" || !role) ? "🔒 Login to Bid" : depositLocked ? "⚡ Place Bid" : "🔐 Lock Deposit & Bid"}
                      </button>
                    </>
                  )}
                  {(role === "guest" || !role) && <p style={{ color: t.textFaint, fontSize: "12px", textAlign: "center", marginTop: "10px" }}><Link to="/Login" style={{ color: "#38bdf8" }}>Log in</Link> or <Link to="/Signup" style={{ color: "#38bdf8" }}>sign up</Link> to participate</p>}
                  {watchMsg === "added" && <div style={{ marginTop: "10px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: "10px", padding: "8px 12px", color: "#34d399", fontSize: "12px", fontWeight: 600, textAlign: "center" }}>❤️ Added to wishlist!</div>}
                  {watchMsg === "removed" && <div style={{ marginTop: "10px", background: "rgba(100,116,139,0.1)", border: `1px solid ${t.border}`, borderRadius: "10px", padding: "8px 12px", color: t.textMut, fontSize: "12px", fontWeight: 600, textAlign: "center" }}>Removed from wishlist</div>}
                  {watchMsg === "error" && <div style={{ marginTop: "10px", background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)", borderRadius: "10px", padding: "8px 12px", color: "#f43f5e", fontSize: "12px", fontWeight: 600, textAlign: "center" }}>⚠️ Something went wrong, try again</div>}
                  <button onClick={handleWatchlist}
                    style={{ width: "100%", marginTop: "10px", padding: isMobile ? "10px" : "12px", background: watched ? "rgba(244,63,94,0.08)" : "transparent", border: `1px solid ${watched ? "rgba(244,63,94,0.4)" : t.border}`, borderRadius: "12px", color: watched ? "#f43f5e" : t.textSec, fontSize: isMobile ? "13px" : "14px", fontWeight: 600, cursor: "pointer", transition: "all .2s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = watched ? "rgba(244,63,94,0.15)" : t.bgHover; }}
                    onMouseLeave={e => { e.currentTarget.style.background = watched ? "rgba(244,63,94,0.08)" : "transparent"; }}>
                    {watched ? "❤️ Wishlisted" : "🤍 Add to Wishlist"}
                  </button>
                </>
              )}
              <div style={{ marginTop: "20px", padding: isMobile ? "12px" : "16px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                    {auction.sellerAvatar
                      ? <img src={auction.sellerAvatar} alt={auction.seller} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      : "🏢"
                    }
                  </div>
                  <div>
                    <div style={{ color: t.textPri, fontWeight: 700, fontSize: "14px" }}>{auction.seller || "TechVault Pvt Ltd"}</div>
                    <div style={{ color: "#34d399", fontSize: "12px" }}>✓ Verified Seller</div>
                  </div>
                </div>
                {/* Live star rating summary */}
                <SellerRatingSummary auctionId={auction.id} t={t} />
              </div>
            </div>
          </div>
          <div style={{ marginTop: "12px", padding: isMobile ? "12px 14px" : "14px 16px", background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.15)", borderRadius: "12px" }}>
            <div style={{ color: "#34d399", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>🛡 Buyer Protection</div>
            <div style={{ color: t.textFaint, fontSize: "12px", lineHeight: 1.5 }}>All transactions secured. Money held in escrow until delivery confirmed.</div>
          </div>
        </div>

        {isMobile && (
          <div style={{ order: 3 }}>
            <ReviewsSection
              auctionId={auction.id}
              sellerId={auction.sellerId}
              role={role}
              userId={userId}
              t={t}
            />
          </div>
        )}
      </div>

      {/* ══ LOCK DEPOSIT MODAL ══ */}
      {showLockModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowLockModal(false); }}
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
        >
          <div style={{ background: "#ffffff", borderRadius: "24px", width: "100%", maxWidth: "440px", boxShadow: "0 40px 80px rgba(0,0,0,0.5)", animation: "popIn 0.25s ease", overflow: "hidden" }}>

            {/* Header */}
            <div style={{ background: "linear-gradient(135deg, #0f172a, #1e1b4b)", padding: "28px 28px 24px" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔐</div>
              <div style={{ color: "#ffffff", fontSize: "20px", fontWeight: 900, marginBottom: "6px" }}>Security Deposit Required</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", lineHeight: 1.6 }}>
                To participate in this auction, a refundable deposit of <strong style={{ color: "#38bdf8" }}>5% of the starting bid</strong> is required.
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "24px 28px 28px" }}>
              {/* Deposit breakdown */}
              <div style={{ background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: "14px", padding: "16px 18px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span style={{ color: "#64748b", fontSize: "13px" }}>Starting Bid</span>
                  <span style={{ color: "#0f172a", fontWeight: 700, fontSize: "13px" }}>{formatINR(auction?.startingBid)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span style={{ color: "#64748b", fontSize: "13px" }}>Deposit (5%)</span>
                  <span style={{ color: "#38bdf8", fontWeight: 800, fontSize: "16px" }}>{formatINR(lockAmount)}</span>
                </div>
                <div style={{ borderTop: "1px solid rgba(56,189,248,0.2)", paddingTop: "10px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b", fontSize: "13px" }}>Your Wallet Balance</span>
                  <span style={{ color: walletBalance !== null && walletBalance < lockAmount ? "#f43f5e" : "#34d399", fontWeight: 700, fontSize: "13px" }}>
                    {walletBalance !== null ? formatINR(walletBalance) : "Loading…"}
                  </span>
                </div>
              </div>

              {/* What happens info */}
              <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { icon: "✅", text: "Deposit is fully refunded if you don't win" },
                  { icon: "🏆", text: "If you win, deposit is applied toward your payment" },
                  { icon: "⚠️", text: "Deposit is forfeited if you refuse to pay after winning" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "12px", color: "#475569" }}>
                    <span style={{ fontSize: "14px", flexShrink: 0 }}>{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Error */}
              {lockError && (
                <div style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)", borderRadius: "10px", padding: "12px 14px", color: "#f43f5e", fontSize: "13px", fontWeight: 600, marginBottom: "16px", lineHeight: 1.5 }}>
                  ⚠️ {lockError}
                  {walletBalance !== null && walletBalance < lockAmount && (
                    <div style={{ marginTop: "8px" }}>
                      <a href="/wallet" style={{ color: "#38bdf8", fontWeight: 700, textDecoration: "none" }}>→ Add money to Wallet</a>
                    </div>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => { setShowLockModal(false); setLockError(""); }}
                  style={{ flex: 1, padding: "13px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "transparent", color: "#64748b", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLockDeposit}
                  disabled={lockLoading}
                  style={{ flex: 2, padding: "13px", borderRadius: "12px", border: "none", background: lockLoading ? "#e2e8f0" : "linear-gradient(135deg, #38bdf8, #6366f1)", color: lockLoading ? "#94a3b8" : "white", fontWeight: 800, fontSize: "14px", cursor: lockLoading ? "not-allowed" : "pointer", boxShadow: lockLoading ? "none" : "0 6px 20px rgba(56,189,248,0.35)", transition: "all 0.2s" }}
                >
                  {lockLoading ? "⏳ Locking…" : `🔒 Lock ${formatINR(lockAmount)} & Join`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <FooterComponent/>

      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn  { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
      `}</style>
    </div>
  );
}
const ts = (color, bg) => ({ display: "inline-block", padding: "4px 10px", borderRadius: "50px", background: bg, color, fontSize: "11px", fontWeight: 700, border: `1px solid ${color}40` });


