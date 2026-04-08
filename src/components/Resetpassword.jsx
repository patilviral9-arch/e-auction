import axios from 'axios'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams, Link } from 'react-router-dom'

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

const IconKey = ({ size = 48, color = "#38bdf8" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5"/>
    <path d="M21 2l-9.6 9.6"/>
    <path d="M15.5 7.5l3 3L21 8l-3-3"/>
  </svg>
)

const IconCheckCircle = ({ size = 56, color = "#34d399" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)

const IconLock = ({ size = 17, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const IconShield = ({ size = 17, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/>
  </svg>
)

const IconEyeOff = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

const IconEye = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
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

const IconLoader = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
)

const IconArrowRight = ({ size = 17, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
)

const IconArrowLeft = ({ size = 14, color = "currentColor" }) => (
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

// ────────────────────────────────────────────────────────────────────────────

export const Resetpassword = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const navigate = useNavigate()
  const { token } = useParams()

  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)
  const [apiError, setApiError] = useState('')
  const [show,     setShow]     = useState({ new: false, confirm: false })

  const newPassword = watch('newPassword', '')

  const strength = (() => {
    if (!newPassword) return { score: 0, label: '', color: '' }
    let score = 0
    if (newPassword.length >= 8)          score++
    if (/[A-Z]/.test(newPassword))        score++
    if (/[0-9]/.test(newPassword))        score++
    if (/[^A-Za-z0-9]/.test(newPassword)) score++
    const map = [
      { label: '',       color: '' },
      { label: 'Weak',   color: '#f43f5e' },
      { label: 'Fair',   color: '#f59e0b' },
      { label: 'Good',   color: '#38bdf8' },
      { label: 'Strong', color: '#34d399' },
    ]
    return { score, ...map[score] }
  })()

  const submitHandler = async (data) => {
    setApiError('')
    setLoading(true)
    try {
      const res = await axios.post('/user/resetpassword', {
        newPassword: data.newPassword,
        token,
      })
      if (res.status === 200) {
        setDone(true)
        setTimeout(() => navigate('/Login'), 3000)
      }
    } catch (err) {
      setApiError(
        err.response?.data?.message ||
        err.response?.data?.error   ||
        'Something went wrong. The link may have expired.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: T.bgPage,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      padding: '20px',
    }}>

      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: T.bgCard,
        border: `1px solid ${T.border}`,
        borderRadius: '24px',
        padding: '44px 40px',
        boxShadow: T.shadow,
        animation: 'popIn .4s cubic-bezier(.34,1.56,.64,1)',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span style={{ fontSize: '20px', fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.02em' }}>
            E-<span style={{ color: '#38bdf8' }}>Auction</span>
          </span>
        </div>

        {done ? (
          /* ── Success state ── */
          <div style={{ textAlign: 'center', animation: 'popIn .4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <IconCheckCircle size={56} color="#34d399" />
            </div>
            <h2 style={{ color: T.textPrimary, fontSize: '22px', fontWeight: 800, margin: '0 0 10px' }}>
              Password Reset!
            </h2>
            <p style={{ color: T.textMuted, fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px' }}>
              Your password has been updated successfully.<br />
              Redirecting you to login…
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(56,189,248,.06)', border: '1px solid rgba(56,189,248,.2)', borderRadius: '12px', padding: '14px 16px', fontSize: '13px', color: T.textSecondary, marginBottom: '24px', lineHeight: 1.6, textAlign: 'left' }}>
              <span style={{ color: '#38bdf8', marginTop: '1px', flexShrink: 0 }}><IconInfo size={15} color="#38bdf8" /></span>
              You'll be redirected in a few seconds.
            </div>
            <div style={{ height: '4px', background: T.bgInput, borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg,#38bdf8,#6366f1)', animation: 'shrink 3s linear forwards' }} />
            </div>
          </div>

        ) : (
          <>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                <IconKey size={48} color="#38bdf8" />
              </div>
              <h1 style={{ color: T.textPrimary, fontSize: '24px', fontWeight: 900, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                Set New Password
              </h1>
            </div>

            <form onSubmit={handleSubmit(submitHandler)} noValidate>

              {/* New Password */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: T.textSecondary, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '8px' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center', color: T.textMuted }}>
                    <IconLock size={17} />
                  </span>
                  <input
                    type={show.new ? 'text' : 'password'}
                    placeholder='Enter new password'
                    {...register('newPassword', {
                      required: 'New password is required',
                      minLength: { value: 8, message: 'Must be at least 8 characters' },
                    })}
                    style={{
                      ...T.input,
                      paddingLeft: '42px',
                      paddingRight: '42px',
                      border: errors.newPassword
                        ? '1px solid rgba(244,63,94,.6)'
                        : `1px solid ${T.borderInput}`,
                    }}
                  />
                  <button type='button' onClick={() => setShow(s => ({ ...s, new: !s.new }))}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, padding: 0, display: 'flex', alignItems: 'center' }}>
                    {show.new ? <IconEyeOff size={19} /> : <IconEye size={19} />}
                  </button>
                </div>

                {/* Strength bar */}
                {newPassword && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex: 1, height: '4px', borderRadius: '4px', background: i <= strength.score ? strength.color : T.bgInput, transition: 'background .3s' }} />
                      ))}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: strength.color }}>{strength.label}</div>
                  </div>
                )}

                {errors.newPassword && (
                  <p style={{ color: '#f43f5e', fontSize: '12px', margin: '6px 0 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <IconWarning size={13} /> {errors.newPassword.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: T.textSecondary, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '8px' }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center', color: T.textMuted }}>
                    <IconShield size={17} />
                  </span>
                  <input
                    type={show.confirm ? 'text' : 'password'}
                    placeholder='Re-Enter new password'
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: val => val === newPassword || 'Passwords do not match',
                    })}
                    style={{
                      ...T.input,
                      paddingLeft: '42px',
                      paddingRight: '42px',
                      border: errors.confirmPassword
                        ? '1px solid rgba(244,63,94,.6)'
                        : `1px solid ${T.borderInput}`,
                    }}
                  />
                  <button type='button' onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, padding: 0, display: 'flex', alignItems: 'center' }}>
                    {show.confirm ? <IconEyeOff size={19} /> : <IconEye size={19} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p style={{ color: '#f43f5e', fontSize: '12px', margin: '6px 0 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <IconWarning size={13} /> {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* API error */}
              {apiError && (
                <div style={{ background: 'rgba(244,63,94,.08)', border: '1px solid rgba(244,63,94,.3)', borderRadius: '10px', padding: '12px 14px', color: '#f43f5e', fontSize: '13px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconError size={15} /> {apiError}
                </div>
              )}

              {/* Submit */}
              <button
                type='submit'
                disabled={loading}
                style={{
                  width: '100%', padding: '14px',
                  borderRadius: '12px', border: 'none',
                  background: loading ? T.bgInput : 'linear-gradient(135deg,#38bdf8,#6366f1)',
                  color: loading ? T.textMuted : 'white',
                  fontWeight: 800, fontSize: '15px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 6px 20px rgba(56,189,248,.35)',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all .2s',
                  marginBottom: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {loading
                  ? <><IconLoader size={18} color={T.textMuted} /> Resetting…</>
                  : <>Reset Password <IconArrowRight size={17} color="white" /></>
                }
              </button>

              <div style={{ textAlign: 'center' }}>
                <Link to='/Login' style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#38bdf8', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
                  <IconArrowLeft size={14} color="#38bdf8" /> Back to Login
                </Link>
              </div>

            </form>
          </>
        )}
      </div>

      <style>{`
        @keyframes popIn  { from{opacity:0;transform:scale(.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes shrink { from{width:100%} to{width:0%} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        input::placeholder { color: #cbd5e1; }
      `}</style>
    </div>
  )
}
