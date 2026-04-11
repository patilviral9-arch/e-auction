import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMaintenanceMode } from "../hooks/useMaintenanceMode";
import { apiPost } from "../utils/apiClient";

// ── Hardcoded light theme tokens ─────────────────────────────────────────────
const T = {
  bgPage:       "#f8fafc",
  bgCard:       "#ffffff",
  bgInput:      "#f1f5f9",
  border:       "#e2e8f0",
  borderInput:  "#cbd5e1",
  textPrimary:  "#0f172a",
  textSecondary:"#475569",
  textMuted:    "#94a3b8",
  textFaint:    "#cbd5e1",
  shadow:       "0 8px 40px rgba(0,0,0,0.10)",
  input: {
    width: "100%", padding: "12px 14px",
    background: "#f1f5f9", border: "1px solid #cbd5e1",
    borderRadius: "10px", color: "#0f172a",
    fontSize: "14px", outline: "none", boxSizing: "border-box",
  },
};

// ── SVG Icon Components ──────────────────────────────────────────────────────

const IconMail = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="M2 7l10 7 10-7"/>
  </svg>
);

const IconLock = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconEyeOff = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const IconEye = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconWarning = ({ size = 14, color = "#f43f5e" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const IconError = ({ size = 15, color = "#f43f5e" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const IconArrowRight = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const IconLoader = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

// ────────────────────────────────────────────────────────────────────────────

export const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const { login } = useAuth();
  const maintenanceMode = useMaintenanceMode();

  const [loading,  setLoading]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);
  const [apiError, setApiError] = useState("");

  const validationschema = {
    email: {
      required: "Email is required",
      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address" },
    },
    password: {
      required: "Password is required",
      minLength: { value: 6, message: "Minimum 6 characters required" },
    },
  };

  const decodeRoleFromToken = (token) => {
    try {
      if (!token) return "";
      const base64Payload = token.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/");
      if (!base64Payload) return "";
      const payload = JSON.parse(atob(base64Payload));
      return String(payload?.role || payload?.userRole || payload?.user_type || "").trim();
    } catch {
      return "";
    }
  };

  const submitHandler = async (data) => {
    setApiError("");
    setLoading(true);
    try {
      const res = await apiPost("/user/login", data, { timeout: 25000 });
      if (res.status === 200) {
        const token = res.data?.token;
        if (!token) {
          setApiError("Login response is invalid. Please try again.");
          return;
        }

        const responseRole = String(res.data?.role || decodeRoleFromToken(token) || "").trim();
        const normalizedRole = responseRole.toLowerCase();
        const isAdminLogin = normalizedRole === "admin";

        if (maintenanceMode && !isAdminLogin) {
          setApiError("Website is in maintenance. Only admin login is allowed right now.");
          return;
        }

        // ✅ Only token + role — AuthContext decodes everything else from JWT
        login(token, responseRole || "guest");

        // Derive display name for the toast from the response (not stored anywhere)
        const userData = res.data.data;
        const toastName = userData?.firstName && userData?.lastName
          ? `${userData.firstName} ${userData.lastName}`
          : userData?.firstName || userData?.businessName || "User";

        toast(
          <div style={{
            display: "flex", alignItems: "center", gap: "14px",
            padding: "4px 2px",
          }}>
            <div style={{
              width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0,
              background: "linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a", letterSpacing: "-0.01em" }}>
                Welcome back, {toastName}!
              </span>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
                You're now signed in to E-Auction
              </span>
            </div>
          </div>,
          {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: true,
            closeButton: false,
            icon: false,
            style: {
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
              padding: "12px 16px",
              minWidth: "300px",
            },
          }
        );

        if (normalizedRole === "admin") navigate("/admin");
        else navigate("/");
      }
    } catch (err) {
      setApiError(err.response?.data?.message || err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

        {/* Form */}
        <form onSubmit={handleSubmit(submitHandler)} noValidate>
          {maintenanceMode && (
            <div style={{
              background: "rgba(245,158,11,.10)",
              border: "1px solid rgba(245,158,11,.35)",
              borderRadius: "10px",
              padding: "10px 12px",
              color: "#b45309",
              fontSize: "13px",
              fontWeight: 700,
              marginBottom: "16px",
            }}>
              Website is in maintenance mode. Personal and business login is disabled.
            </div>
          )}

          {/* Email */}
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
                {...register("email", validationschema.email)}
                style={{
                  ...T.input,
                  paddingLeft: "42px",
                  border: errors.email ? "1px solid rgba(244,63,94,.6)" : `1px solid ${T.borderInput}`,
                }}
              />
            </div>
            {errors.email && (
              <p style={{ color: "#f43f5e", fontSize: "12px", margin: "6px 0 0", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
                <IconWarning size={13} /> {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", color: T.textSecondary, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: "8px" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", alignItems: "center", color: T.textMuted }}>
                <IconLock size={17} />
              </span>
              <input
                type={showPwd ? "text" : "password"}
                placeholder="Enter your password"
                {...register("password", validationschema.password)}
                style={{
                  ...T.input,
                  paddingLeft: "42px",
                  paddingRight: "42px",
                  border: errors.password ? "1px solid rgba(244,63,94,.6)" : `1px solid ${T.borderInput}`,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 0, display: "flex", alignItems: "center" }}
              >
                {showPwd ? <IconEyeOff size={19} /> : <IconEye size={19} />}
              </button>
            </div>
            {errors.password && (
              <p style={{ color: "#f43f5e", fontSize: "12px", margin: "6px 0 0", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
                <IconWarning size={13} /> {errors.password.message}
              </p>
            )}
          </div>

          {/* Forgot link */}
          <div style={{ textAlign: "right", marginBottom: "20px", marginTop: "-10px" }}>
            <Link to="/Forgotpassword" style={{ color: "#38bdf8", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
              Forgot password?
            </Link>
          </div>

          {/* API error */}
          {apiError && (
            <div style={{ background: "rgba(244,63,94,.08)", border: "1px solid rgba(244,63,94,.3)", borderRadius: "10px", padding: "12px 14px", color: "#f43f5e", fontSize: "13px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <IconError size={15} /> {apiError}
            </div>
          )}

          {/* Submit */}
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
              marginBottom: "24px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            {loading
              ? <><IconLoader size={18} color={T.textMuted} /> Signing in…</>
              : <>Sign In <IconArrowRight size={17} color="white" /></>
            }
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ flex: 1, height: "1px", background: T.border }} />
            <span style={{ margin: "0 12px", fontSize: "12px", color: T.textMuted, fontWeight: 500 }}>or continue with</span>
            <div style={{ flex: 1, height: "1px", background: T.border }} />
          </div>

          {/* Sign up link */}
          <div style={{ textAlign: "center" }}>
            <span style={{ color: T.textMuted, fontSize: "14px" }}>Don't have an account? </span>
            <Link to="/Signup" style={{ color: "#38bdf8", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>
              Sign Up
            </Link>
          </div>

        </form>
      </div>

      <style>{`
        @keyframes popIn { from{opacity:0;transform:scale(.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        input::placeholder { color: #cbd5e1; }
      `}</style>
    </div>
  );
};
