import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Ico = ({ size = 16, sw = 1.75, children }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    {children}
  </svg>
);

const Icons = {
  Globe:     <Ico><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Ico>,
  Briefcase: <Ico><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></Ico>,
  Award:     <Ico><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></Ico>,
  FileText:  <Ico><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></Ico>,
  Newspaper: <Ico><path d="M4 3h16a1 1 0 0 1 1 1v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a1 1 0 0 1 1-1z"/><polyline points="8 8 16 8"/><polyline points="8 12 16 12"/><polyline points="8 16 12 16"/></Ico>,
  Mail:      <Ico><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></Ico>,
  MapPin:    <Ico><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></Ico>,
  // Award SVG icons
  Trophy:    <Ico size={20}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></Ico>,
  Star:      <Ico size={20}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" strokeWidth="0"/></Ico>,
  Shield:    <Ico size={20}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Ico>,
  Medal:     <Ico size={20}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></Ico>,
  Rocket:    <Ico size={20}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></Ico>,
  Palette:   <Ico size={20}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></Ico>,
};

const Section = ({ id, title, icon, children, T }) => (
  <div id={id} style={{ marginBottom: '36px', scrollMarginTop: '80px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '10px', borderBottom: `1px solid ${T.border}` }}>
      <span style={{ color: T.accent, display: 'flex' }}>{icon}</span>
      <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: T.text, letterSpacing: '-0.01em' }}>{title}</h2>
    </div>
    {children}
  </div>
);

const AboutUs = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const T = {
    bg:        isLight ? '#f8fafc' : '#060d1a',
    bgCard:    isLight ? '#ffffff' : 'rgba(255,255,255,0.03)',
    border:    isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)',
    text:      isLight ? '#0f172a' : '#ffffff',
    textSub:   isLight ? '#475569' : '#94a3b8',
    textMuted: isLight ? '#94a3b8' : '#64748b',
    accent:    '#38bdf8',
    accentBg:  isLight ? 'rgba(56,189,248,0.08)' : 'rgba(56,189,248,0.1)',
    shadow:    isLight ? '0 2px 10px rgba(0,0,0,0.06)' : '0 2px 10px rgba(0,0,0,0.3)',
  };

  const cardHover = (e, enter) => {
    e.currentTarget.style.borderColor = enter ? 'rgba(56,189,248,0.4)' : T.border;
  };

  const openings = [
    { role: 'Senior Full-Stack Engineer', dept: 'Engineering', loc: 'Remote / Ahmedabad' },
    { role: 'Product Designer (UI/UX)',   dept: 'Design',      loc: 'Remote' },
    { role: 'Growth Marketing Manager',   dept: 'Marketing',   loc: 'Ahmedabad' },
    { role: 'Fraud & Trust Analyst',      dept: 'Operations',  loc: 'Hybrid' },
    { role: 'Category Manager — Luxury',  dept: 'Business',    loc: 'Mumbai / Remote' },
  ];

  const awards = [
    { icon: Icons.Trophy,  name: 'Best Marketplace Platform',         org: 'India Fintech Forum', year: '2026', color: '#f59e0b' },
    { icon: Icons.Star,    name: 'Top 50 Startups to Watch',          org: 'Economic Times',      year: '2025', color: '#f59e0b' },
    { icon: Icons.Shield,  name: 'Excellence in Trust & Safety',      org: 'CII Digital Summit',  year: '2025', color: '#38bdf8' },
    { icon: Icons.Medal,   name: 'Best B2C E-commerce Platform',      org: 'Nasscom',             year: '2024', color: '#f59e0b' },
    { icon: Icons.Rocket,  name: 'Emerging Tech Company of the Year', org: 'FICCI',               year: '2023', color: '#f43f5e' },
    { icon: Icons.Palette, name: 'Best UI/UX in Marketplace',         org: 'Design Week India',   year: '2022', color: '#a78bfa' },
  ];

  const posts = [
    { tag: 'Strategy',    title: 'How to Win Live Auctions Without Overpaying' },
    { tag: 'Market',      title: 'Luxury Watch Trends: Q1 2026 Report' },
    { tag: 'Seller Tips', title: 'Writing Listings That Get 3x More Bids' },
    { tag: 'Technology',  title: 'How AI Detects Shill Bidding in Real Time' },
  ];

  const coverage = [
    { outlet: 'Economic Times',   headline: 'E-Auction crosses ₹5,000 Cr in GMV' },
    { outlet: 'YourStory',        headline: 'How this Ahmedabad startup disrupts a ₹2T market' },
    { outlet: 'TechCrunch',       headline: 'E-Auction raises $30M Series B' },
    { outlet: 'Business Standard',headline: 'Top 10 Indian fintech platforms of 2025' },
  ];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif", color: T.text, transition: 'background 0.3s, color 0.3s' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '36px 32px 60px' }}>

        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: T.accentBg, border: '1px solid rgba(56,189,248,0.2)', borderRadius: '100px', padding: '4px 12px', fontSize: '11px', color: T.accent, fontWeight: 700, marginBottom: '10px', letterSpacing: '0.04em' }}>
            {Icons.MapPin}&nbsp;Ahmedabad · Est. 2018
          </div>
          <h1 style={{ fontSize: 'clamp(26px,4vw,36px)', fontWeight: 900, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>
            About&nbsp;<span style={{ background: 'linear-gradient(135deg,#38bdf8,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>E-Auction</span>
          </h1>
        </div>

        {/* ── OUR STORY ── */}
        <Section id="story"    title="Our Story" icon={Icons.Globe} T={T}>
          <p style={{ fontSize: '14px', color: T.textSub, lineHeight: 1.8, margin: 0, maxWidth: '700px' }}>
            Founded in 2018 with a single mission — make premium auctions accessible to everyone. What started as a small industrial surplus platform in Ahmedabad grew into a global marketplace trusted by 2M+ users across 80+ countries. Every bid is secured, every transaction is transparent, and every seller is verified.
          </p>
        </Section>

        {/* ── CAREERS ── */}
        <Section id="careers"  title="Careers" icon={Icons.Briefcase} T={T}>
          <p style={{ fontSize: '14px', color: T.textSub, lineHeight: 1.7, margin: '0 0 16px', maxWidth: '640px' }}>
            We build hard things that matter — real-time bidding, fraud detection, marketplace economics. Remote-friendly, competitive equity, fast-shipping culture.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {openings.map((o, i) => (
              <div key={i} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '12px 16px', boxShadow: T.shadow, transition: 'border-color 0.2s' }}
                onMouseEnter={e => cardHover(e, true)} onMouseLeave={e => cardHover(e, false)}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: T.text }}>{o.role}</div>
                <div style={{ fontSize: '11px', color: T.textMuted, marginTop: '2px' }}>{o.dept} · {o.loc}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── AWARDS ── */}
        <Section id="awards"   title="Awards" icon={Icons.Award} T={T}>
          <p style={{ fontSize: '14px', color: T.textSub, lineHeight: 1.7, margin: '0 0 16px', maxWidth: '640px' }}>
            Recognised by India's leading institutions for innovation, trust, and marketplace excellence.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
            {awards.map((a, i) => (
              <div key={i} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '14px', boxShadow: T.shadow, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ color: a.color, display: 'flex', marginTop: '1px' }}>{a.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '12px', color: T.text, marginBottom: '2px' }}>{a.name}</div>
                  <div style={{ fontSize: '11px', color: T.textMuted }}>{a.org}</div>
                  <div style={{ fontSize: '10px', color: T.accent, fontWeight: 700, marginTop: '3px' }}>{a.year}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── BLOG ── */}
        <Section id="blog"     title="Blog" icon={Icons.FileText} T={T}>
          <p style={{ fontSize: '14px', color: T.textSub, lineHeight: 1.7, margin: '0 0 16px', maxWidth: '640px' }}>
            Expert analysis, seller tips, and market deep-dives from the E-Auction team.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {posts.map((post, i) => (
              <div key={i} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '12px 16px', boxShadow: T.shadow, cursor: 'pointer', transition: 'border-color 0.2s' }}
                onMouseEnter={e => cardHover(e, true)} onMouseLeave={e => cardHover(e, false)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '100px', padding: '2px 8px', whiteSpace: 'nowrap' }}>{post.tag}</span>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: T.text }}>{post.title}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── PRESS ── */}
        <Section id="press"    title="Press" icon={Icons.Newspaper} T={T}>
          <p style={{ fontSize: '14px', color: T.textSub, lineHeight: 1.7, margin: '0 0 16px', maxWidth: '640px' }}>
            For press inquiries or media kits, reach us at press@eauction.com — we respond within 24 hours.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {coverage.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '12px 16px', boxShadow: T.shadow, cursor: 'pointer', transition: 'border-color 0.2s' }}
                onMouseEnter={e => cardHover(e, true)} onMouseLeave={e => cardHover(e, false)}>
                <div style={{ minWidth: '110px', fontWeight: 800, fontSize: '10px', color: T.accent, background: T.accentBg, border: '1px solid rgba(56,189,248,0.2)', borderRadius: '7px', padding: '4px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>{item.outlet}</div>
                <div style={{ fontWeight: 600, fontSize: '13px', color: T.text }}>{item.headline}</div>
              </div>
            ))}
          </div>
        </Section>

      </div>
    </div>
  );
};

export default AboutUs;
