import axios from "axios";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
const AUTH_API_BASE = String(
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "/api"
).replace(/\/+$/, "");
const authUrl = (path) => `${AUTH_API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 600000);

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

// ── SVG Icons ────────────────────────────────────────────────────────────────
const IconUser        = ({ size = 16, color = "currentColor" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const IconBuilding    = ({ size = 16, color = "currentColor" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="18" rx="1"/><path d="M9 22V12h6v10"/><path d="M6 7h4"/><path d="M6 11h4"/><path d="M14 7h4"/><path d="M14 11h4"/></svg>);
const IconMail        = ({ size = 17, color = "currentColor" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>);
const IconLock        = ({ size = 17, color = "currentColor" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
const IconGlobe       = ({ size = 17, color = "currentColor" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>);
const IconEyeOff      = ({ size = 20, color = "currentColor" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>);
const IconEye         = ({ size = 20, color = "currentColor" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>);
const IconWarning     = ({ size = 13, color = "#f43f5e" })     => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const IconLoader      = ({ size = 18, color = "currentColor" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>);
const IconArrowRight  = ({ size = 17, color = "currentColor" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>);
const IconChevronDown = ({ size = 16, color = "currentColor" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>);

// ── Main Signup component ────────────────────────────────────────────────────
export const Signup = () => {
  const [loading,      setLoading]      = useState(false);
  const [accountType,  setAccountType]  = useState("personal");
  const [showPwd,      setShowPwd]      = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const navigate = useNavigate();

  const getApiError = (err, fallback) =>
    err?.response?.data?.err ||
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    (err?.request ? `Cannot reach server (${AUTH_API_BASE}).` : null) ||
    fallback;

  const buildPayload = (data) => {
    const payload = { email: data.email, password: data.password, role: accountType };
    if (accountType === "business") {
      payload.businessName = data.businessName;
      payload.businessCountry = data.businessCountry;
    } else {
      payload.firstName = data.firstName;
      payload.lastName = data.lastName;
    }
    return payload;
  };

  // Called when "Create Account" is clicked and form is valid
  const submithandler = async (data) => {
    setLoading(true);
    try {
      const payload = buildPayload(data);
      const res = await axios.post(
        authUrl("/user/register"),
        payload,
        { timeout: REQUEST_TIMEOUT_MS }
      );

      if (res.status === 201) {
        reset();
        toast.success("Account created successfully. Please sign in.");
        navigate("/Login");
      }
    } catch (err) {
      toast.error(getApiError(err, "Failed to create account. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bgPage,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      padding: "20px",
    }}>


      {/* ── Card ── */}
      <div style={{
        width: "100%", maxWidth: "480px",
        background: T.bgCard, border: `1px solid ${T.border}`,
        borderRadius: "24px", padding: "44px 40px",
        boxShadow: T.shadow,
        animation: "popIn .4s cubic-bezier(.34,1.56,.64,1)",
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <span style={{ fontSize: "20px", fontWeight: 800, color: T.textPrimary, letterSpacing: "-0.02em" }}>
            E-<span style={{ color: "#38bdf8" }}>Auction</span>
          </span>
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h1 style={{ color: T.textPrimary, fontSize: "24px", fontWeight: 900, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Create an account
          </h1>
        </div>

        {/* Account type toggle */}
        <div style={{ display: "flex", background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "4px", marginBottom: "28px" }}>
          {["personal", "business"].map(type => (
            <button
              key={type} type="button" onClick={() => setAccountType(type)}
              style={{
                flex: 1, padding: "10px", border: "none", cursor: "pointer",
                fontSize: "14px", fontWeight: 700, borderRadius: "10px",
                background: accountType === type ? "linear-gradient(135deg,#38bdf8,#6366f1)" : "transparent",
                color: accountType === type ? "white" : T.textMuted,
                transition: "all 0.2s",
                boxShadow: accountType === type ? "0 4px 12px rgba(56,189,248,.3)" : "none",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
              }}
            >
              {type === "personal"
                ? <><IconUser size={15} /> Personal</>
                : <><IconBuilding size={15} /> Business</>}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(submithandler)} noValidate>

          {/* Personal fields */}
          {accountType === "personal" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", color: T.textSecondary, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: "8px" }}>First Name</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", alignItems: "center", color: T.textMuted }}><IconUser size={15} /></span>
                    <input type="text" placeholder="First name" {...register("firstName", { required: "First name required" })} style={{ ...T.input, paddingLeft: "36px", border: errors.firstName ? "1px solid rgba(244,63,94,.6)" : `1px solid ${T.borderInput}` }} />
                  </div>
                  {errors.firstName && <p style={{ color: "#f43f5e", fontSize: "11px", margin: "5px 0 0", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><IconWarning size={11} /> {errors.firstName.message}</p>}
                </div>
                <div>
                  <label style={{ display: "block", color: T.textSecondary, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: "8px" }}>Last Name</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", alignItems: "center", color: T.textMuted }}><IconUser size={15} /></span>
                    <input type="text" placeholder="Last name" {...register("lastName", { required: "Last name required" })} style={{ ...T.input, paddingLeft: "36px", border: errors.lastName ? "1px solid rgba(244,63,94,.6)" : `1px solid ${T.borderInput}` }} />
                  </div>
                  {errors.lastName && <p style={{ color: "#f43f5e", fontSize: "11px", margin: "5px 0 0", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><IconWarning size={11} /> {errors.lastName.message}</p>}
                </div>
              </div>
            </>
          )}

          {/* Business Name */}
          {accountType === "business" && (
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", color: T.textSecondary, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: "8px" }}>Business Name</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", alignItems: "center", color: T.textMuted }}><IconBuilding size={17} /></span>
                <input type="text" placeholder="Company name" {...register("businessName", { required: "Business name required" })} style={{ ...T.input, paddingLeft: "42px", border: errors.businessName ? "1px solid rgba(244,63,94,.6)" : `1px solid ${T.borderInput}` }} />
              </div>
              {errors.businessName && <p style={{ color: "#f43f5e", fontSize: "12px", margin: "6px 0 0", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}><IconWarning size={13} /> {errors.businessName.message}</p>}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", color: T.textSecondary, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: "8px" }}>Email Address</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", alignItems: "center", color: T.textMuted }}><IconMail size={17} /></span>
              <input type="email" placeholder="Enter your email" {...register("email", { required: "Email required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" } })} style={{ ...T.input, paddingLeft: "42px", border: errors.email ? "1px solid rgba(244,63,94,.6)" : `1px solid ${T.borderInput}` }} />
            </div>
            {errors.email && <p style={{ color: "#f43f5e", fontSize: "12px", margin: "6px 0 0", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}><IconWarning size={13} /> {errors.email.message}</p>}
          </div>

          {/* Password */}
          <div style={{ marginBottom: accountType === "business" ? "20px" : "24px" }}>
            <label style={{ display: "block", color: T.textSecondary, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: "8px" }}>Password</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", alignItems: "center", color: T.textMuted }}><IconLock size={17} /></span>
              <input type={showPwd ? "text" : "password"} placeholder="Enter the password" {...register("password", { required: "Password required", minLength: { value: 6, message: "Minimum 6 characters" } })} style={{ ...T.input, paddingLeft: "42px", paddingRight: "42px", border: errors.password ? "1px solid rgba(244,63,94,.6)" : `1px solid ${T.borderInput}` }} />
              <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 0, display: "flex", alignItems: "center" }}>
                {showPwd ? <IconEyeOff size={19} /> : <IconEye size={19} />}
              </button>
            </div>
            {errors.password && <p style={{ color: "#f43f5e", fontSize: "12px", margin: "6px 0 0", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}><IconWarning size={13} /> {errors.password.message}</p>}
          </div>

          {/* Business Country */}
          {accountType === "business" && (
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", color: T.textSecondary, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: "8px" }}>Business Country</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", alignItems: "center", color: T.textMuted }}><IconGlobe size={17} /></span>
                <span style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", alignItems: "center", color: T.textMuted }}><IconChevronDown size={15} /></span>
                <select {...register("businessCountry", { required: "Please select your business country" })} style={{ ...T.input, paddingLeft: "42px", paddingRight: "36px", cursor: "pointer", border: errors.businessCountry ? "1px solid rgba(244,63,94,.6)" : `1px solid ${T.borderInput}`, appearance: "none", backgroundColor: "#f1f5f9", color: "#0f172a" }}>
                  <option value="" disabled hidden>Where is your business registered?</option>
                  {["India","United States","United Kingdom","Canada","Australia","Germany","France","Japan","China","Brazil","South Africa"].map(c => (
                    <option key={c} value={c} style={{ background: "#ffffff", color: "#0f172a" }}>{c}</option>
                  ))}
                </select>
              </div>
              {errors.businessCountry && <p style={{ color: "#f43f5e", fontSize: "12px", margin: "6px 0 0", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}><IconWarning size={13} /> {errors.businessCountry.message}</p>}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "14px", borderRadius: "12px", border: "none",
              background: loading ? T.bgInput : "linear-gradient(135deg,#38bdf8,#6366f1)",
              color: loading ? T.textMuted : "white",
              fontWeight: 800, fontSize: "15px",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 6px 20px rgba(56,189,248,.35)",
              opacity: loading ? 0.7 : 1,
              transition: "all .2s", marginBottom: "24px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            {loading
              ? <><IconLoader size={18} color={T.textMuted} /> Creating Account…</>
              : <>Create Account <IconArrowRight size={17} color="white" /></>
            }
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ flex: 1, height: "1px", background: T.border }} />
            <span style={{ margin: "0 12px", fontSize: "12px", color: T.textMuted, fontWeight: 500 }}>or continue with</span>
            <div style={{ flex: 1, height: "1px", background: T.border }} />
          </div>

          {/* Login link */}
          <div style={{ textAlign: "center" }}>
            <span style={{ color: T.textMuted, fontSize: "14px" }}>Already have an account? </span>
            <Link to="/Login" style={{ color: "#38bdf8", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>Sign In</Link>
          </div>

        </form>
      </div>

      <style>{`
        @keyframes popIn  { from{opacity:0;transform:scale(.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        input::placeholder, select::placeholder { color: #cbd5e1; }
        select option { background: #ffffff !important; color: #0f172a !important; }
      `}</style>
    </div>
  );
};



