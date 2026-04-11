import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import { apiPost } from '../utils/apiClient'

// ── Hardcoded light theme tokens ─────────────────────────────────────────────
const T = {
  bgPage:        "#f8fafc",
  bgCard:        "#ffffff",
  bgInput:       "#f1f5f9",
  border:        "#e2e8f0",
  borderInput:   "#cbd5e1",
  textPrimary:   "#0f172a",
  textSecondary: "#475569",
  textMuted:     "#94a3b8",
  textFaint:     "#cbd5e1",
  shadow:        "0 8px 40px rgba(0,0,0,0.10)",
  input: {
    width: "100%", padding: "12px 14px",
    background: "#f1f5f9", border: "1px solid #cbd5e1",
    borderRadius: "10px", color: "#0f172a",
    fontSize: "14px", outline: "none", boxSizing: "border-box",
  },
};

// ── SVG Icon Components ──────────────────────────────────────────────────────

const IconShieldLock = ({ size = 48, color = "#38bdf8" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/>
    <rect x="9" y="11" width="6" height="5" rx="1"/>
    <path d="M12 11V9a2 2 0 0 1 2-2"/>
    <circle cx="12" cy="13.5" r=".5" fill={color}/>
  </svg>
)

const IconInbox = ({ size = 56, color = "#38bdf8" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
  </svg>
)

const IconMail = ({ size = 17, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="M2 7l10 7 10-7"/>
  </svg>
)

const IconWarning = ({ size = 13, color = "#f43f5e" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

const IconError = ({ size = 15, color = "#f43f5e" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
)

const IconSend = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)

const IconLoader = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
)

const IconArrowLeft = ({ size = 15, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
)

const IconInfo = ({ size = 15, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)

const IconRefresh = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
  </svg>
)

// ────────────────────────────────────────────────────────────────────────────

export const Forgetpassword = () => {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const navigate = useNavigate()

  const [loading,  setLoading]  = useState(false)
  const [sent,     setSent]     = useState(false)
  const [apiError, setApiError] = useState("")
  const [email,    setEmail]    = useState("")

  const submitHandler = async (data) => {
    setApiError("")
    setLoading(true)
    try {
      const res = await apiPost("/user/forgetpassword", data, { timeout: 25000 })
      if (res.status === 200) {
        setEmail(data.email)
        setSent(true)
      }
    } catch (err) {
      setApiError(
        err.response?.data?.message ||
        err.response?.data?.error   ||
        "Something went wrong. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bgPage,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      padding: "20px",
    }}>

      {/* Card */}
      <div style={{
        width: "100%",
        maxWidth: "440px",
        background: T.bgCard,
        border: `1px solid ${T.border}`,
        borderRadius: "24px",
        padding: "44px 40px",
        boxShadow: T.shadow,
        animation: "popIn .4s cubic-bezier(.34,1.56,.64,1)",
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <span style={{ fontSize: "20px", fontWeight: 800, color: T.textPrimary, letterSpacing: "-0.02em" }}>
            E-<span style={{ color: "#38bdf8" }}>Auction</span>
          </span>
        </div>

        {sent ? (
          /* ── Success state ── */
          <div style={{ textAlign: "center", animation: "popIn .4s ease" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
              <IconInbox size={56} color="#38bdf8" />
            </div>
            <h2 style={{ color: T.textPrimary, fontSize: "22px", fontWeight: 800, margin: "0 0 10px" }}>
              Check your inbox
            </h2>
            <p style={{ color: T.textMuted, fontSize: "14px", lineHeight: 1.6, margin: "0 0 28px" }}>
              We've sent a password reset link to<br />
              <strong style={{ color: T.textPrimary }}>{email}</strong>
            </p>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", background: "rgba(56,189,248,.06)", border: "1px solid rgba(56,189,248,.2)", borderRadius: "12px", padding: "14px 16px", fontSize: "13px", color: T.textSecondary, marginBottom: "24px", lineHeight: 1.6, textAlign: "left" }}>
              <span style={{ color: "#38bdf8", marginTop: "1px", flexShrink: 0 }}><IconInfo size={15} color="#38bdf8" /></span>
              Didn't receive it? Check your spam folder or wait a few minutes.
            </div>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              style={{ width: "100%", padding: "13px", borderRadius: "12px", border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, fontSize: "14px", fontWeight: 600, cursor: "pointer", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}
            >
              <IconRefresh size={15} /> Try a different email
            </button>
            <Link to="/Login" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", textAlign: "center", color: "#38bdf8", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
              <IconArrowLeft size={14} color="#38bdf8" /> Back to Login
            </Link>
          </div>

        ) : (
          /* ── Form state ── */
          <>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
                <IconShieldLock size={48} color="#38bdf8" />
              </div>
              <h1 style={{ color: T.textPrimary, fontSize: "24px", fontWeight: 900, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
                Forgot Password?
              </h1>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(submitHandler)} noValidate>

              {/* Email field */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", color: T.textSecondary, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: "8px" }}>
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", alignItems: "center", color: T.textMuted }}>
                    <IconMail size={17} />
                  </span>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address" }
                    })}
                    style={{
                      ...T.input,
                      paddingLeft: "42px",
                      border: errors.email
                        ? "1px solid rgba(244,63,94,.6)"
                        : `1px solid ${T.borderInput}`,
                    }}
                  />
                </div>
                {errors.email && (
                  <p style={{ color: "#f43f5e", fontSize: "12px", margin: "6px 0 0", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
                    <IconWarning size={13} /> {errors.email.message}
                  </p>
                )}
              </div>

              {/* API error */}
              {apiError && (
                <div style={{ background: "rgba(244,63,94,.08)", border: "1px solid rgba(244,63,94,.3)", borderRadius: "10px", padding: "12px 14px", color: "#f43f5e", fontSize: "13px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <IconError size={15} /> {apiError}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "14px",
                  borderRadius: "12px", border: "none",
                  background: loading ? T.bgInput : "linear-gradient(135deg,#38bdf8,#6366f1)",
                  color: loading ? T.textMuted : "white",
                  fontWeight: 800, fontSize: "15px",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 6px 20px rgba(56,189,248,.35)",
                  opacity: loading ? 0.7 : 1,
                  transition: "all .2s",
                  marginBottom: "20px",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {loading
                  ? <><IconLoader size={18} color={T.textMuted} /> Sending…</>
                  : <>Send Reset Link <IconSend size={16} color="white" /></>
                }
              </button>

              {/* Back to login */}
              <div style={{ textAlign: "center" }}>
                <Link to="/Login" style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#38bdf8", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
                  <IconArrowLeft size={14} color="#38bdf8" /> Back to Login
                </Link>
              </div>

            </form>
          </>
        )}
      </div>

      <style>{`
        @keyframes popIn { from{opacity:0;transform:scale(.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        input::placeholder { color: #cbd5e1; }
      `}</style>
    </div>
  )
}
