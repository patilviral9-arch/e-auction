import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useThemeStyles } from '../../utils/themeStyles';
import Swal from 'sweetalert2';

/* ─────────── SVG Icons ─────────── */
const Ico = ({ size = 14, sw = 1.75, children, ...p }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }} {...p}>
    {children}
  </svg>
);

const Icons = {
  Live:       <Ico><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/><path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4"/></Ico>,
  Search:     <Ico><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></Ico>,
  Calendar:   <Ico><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Ico>,
  CheckCircle:<Ico><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Ico>,
  Plus:       <Ico><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></Ico>,
  Rules:      <Ico><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></Ico>,
  Shield:     <Ico><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Ico>,
  FileText:   <Ico><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></Ico>,
  Lock:       <Ico><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Ico>,
  MessageSq:  <Ico><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Ico>,
  HelpCircle: <Ico><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></Ico>,
  SSL:        <Ico size={12}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Ico>,
  Apple:      <Ico size={16}><path d="M12 2C9.5 2 8 4 8 4S5 2.5 3.5 5c-2 3.5 0 8 2 10 1 1.5 2 3 3.5 3 1 0 1.5-.5 3-.5s2 .5 3 .5c1.5 0 2.5-1.5 3.5-3 1-1.5 1.5-3 1.5-5 0-3-2-5-5-5 0 0-.5-3-3-3z"/><path d="M12 2c0-1.5 1-2.5 1-2.5" sw={2}/></Ico>,
  Play:       <Ico size={16}><polygon points="5 3 19 12 5 21 5 3" fill="currentColor" strokeWidth="0"/></Ico>,
  // Social
  Twitter:    <Ico size={16}><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></Ico>,
  Facebook:   <Ico size={16}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></Ico>,
  Instagram:  <Ico size={16}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></Ico>,
  LinkedIn:   <Ico size={16}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></Ico>,
  Send:       <Ico size={14}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></Ico>,
  Gavel:      <Ico><path d="M14.5 2.5 19 7l-9 9-4.5-4.5 9-9z"/><path d="m2 22 7-7"/></Ico>,
  Users:      <Ico><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Ico>,
  Info:       <Ico><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/></Ico>,
  Briefcase:  <Ico><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></Ico>,
  Award:      <Ico><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></Ico>,
  Mail:       <Ico><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></Ico>,
  Phone:      <Ico><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l1.27-.8a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></Ico>,
  MapPin:     <Ico><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></Ico>,
};

const FooterComponent = () => {
  const t = useThemeStyles();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);

    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange);

    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    };
  }, []);

  // Navigate to /aboutus then scroll to section after a tick
  const goToSection = (sectionId) => (e) => {
    e.preventDefault();
    navigate(`/aboutus#${sectionId}`);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  const handleSub = () => {
    if (email.includes('@')) { setSubscribed(true); setEmail(''); }
  };

  const col = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    alignItems: isMobile ? 'center' : 'flex-start',
  };

  const linkBase = {
    color: '#ffffff',
    fontSize: '14px',
    textDecoration: 'none',
    transition: 'color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: isMobile ? 'center' : 'flex-start',
    textAlign: isMobile ? 'center' : 'left',
    gap: '8px',
    flexWrap: 'wrap',
    wordBreak: 'break-word',
  };

  const SLink = ({ href, children, icon, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <Link
      to={href || '#'}
      onClick={onClick}
      style={{ ...linkBase, color: hov ? '#38bdf8' : '#ffffff' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>{icon}</span>}
      {children}
    </Link>
  );
};

  const socials = [
    { icon: Icons.Twitter,   color: '#1da1f2', bg: 'rgba(29,161,242,0.1)',  href: 'https://x.com/ViralPatil48774' },
    { icon: Icons.Facebook,  color: '#4267B2', bg: 'rgba(66,103,178,0.1)',  href: 'https://www.facebook.com/share/174pnZo1B3/' },
    { icon: Icons.Instagram, color: '#e1306c', bg: 'rgba(225,48,108,0.1)',  href: 'https://www.instagram.com/viral.patil.357?igsh=d291bHpnZWpmamd2' },
    { icon: Icons.LinkedIn,  color: '#0077b5', bg: 'rgba(0,119,181,0.1)',   href: 'https://www.linkedin.com/in/viral-patil-b9402334a' },
  ];

  return (
    <footer style={{ background: '#060d1a', borderTop: '1px solid rgba(255,255,255,0.06)', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Top section */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(28px, 7vw, 64px) clamp(14px, 4vw, 40px) clamp(26px, 6vw, 48px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '24px', justifyItems: isMobile ? 'center' : 'stretch', textAlign: isMobile ? 'center' : 'left' }}>

          {/* Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'center' : 'flex-start' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '18px' }}>
              <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #38bdf8, #6366f1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                {Icons.Gavel}
              </div>
              <span style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.02em' }}>
                <span style={{ color: '#ffffff' }}>E-</span><span style={{ color: '#38bdf8' }}>Auction</span>
              </span>
            </Link>
            <p style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1.7, marginBottom: '20px', maxWidth: '260px', marginLeft: isMobile ? 'auto' : 0, marginRight: isMobile ? 'auto' : 0 }}>
              The world's most trusted marketplace for premium collectibles, industrial assets, and luxury goods. Secure, transparent, and lightning-fast.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: isMobile ? 'center' : 'flex-start' }}>
              {socials.map((s, i) => (
                <a key={i} href={s.href} target="_blank" rel="noreferrer" style={{ width: '36px', height: '36px', borderRadius: '10px', background: s.bg, border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, textDecoration: 'none', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >{s.icon}</a>
              ))}
            </div>
          </div>

          {/* Auctions */}
          <div>
            <h4 style={{ color: '#ffffff', fontWeight: 700, fontSize: '14px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 1 }}>Auctions</h4>
            <div style={col}>
              <SLink href="/LiveAuctions" icon={Icons.Live}>Live Auctions</SLink>
              <SLink href="/browse"       icon={Icons.Search}>Browse All</SLink>
                <SLink
                href={localStorage.getItem('userType') === 'business' ? '/add-auction' : undefined}
                icon={Icons.Plus}
                onClick={localStorage.getItem('userType') !== 'business' ? (e) => {
                e.preventDefault();
                Swal.fire({
                  icon: 'info',
                  title: 'Business Account Required',
                  text: 'Please log in with a Business account to sell items.',
                  confirmButtonText: 'Go to Login',
                  confirmButtonColor: '#38bdf8',
                }).then(result => {
                  if (result.isConfirmed) navigate('/login');
                });
              } : undefined}
              >
                Sell an Item
              </SLink>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 style={{ color: '#ffffff', fontWeight: 700, fontSize: '14px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 1 }}>Categories</h4>
            <div style={col}>
              {['Electronics','Vehicles','Collectibles','Luxury','Real Estate','Industrial'].map(c => (
                <SLink key={c} href={`/browse?category=${encodeURIComponent(c)}`}>{c}</SLink>
              ))}
            </div>
          </div>

          {/* About Us */}
          <div>
            <h4 style={{ color: '#ffffff', fontWeight: 700, fontSize: '14px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 1 }}>About Us</h4>
            <div style={col}>
              <SLink href="/aboutus"  onClick={() => { window.scrollTo({ top: 0, behavior: "instant" }); }}    icon={Icons.Info}>Our Story</SLink>
              <SLink href="/aboutus"  onClick={goToSection('careers')}  icon={Icons.Briefcase}>Careers</SLink>
              <SLink href="/aboutus"  onClick={goToSection('awards')}   icon={Icons.Award}>Awards</SLink>
              <SLink href="/aboutus"  onClick={goToSection('blog')}     icon={Icons.FileText}>Blog</SLink>
              <SLink href="/aboutus"  onClick={goToSection('press')}    icon={Icons.MessageSq}>Press</SLink>
            </div>
          </div>

          {/* Contact Us */}
            <div>
              <h4 style={{ color: '#ffffff', fontWeight: 700, fontSize: '14px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 1 }}>Contact Us</h4>
              <div style={col}>
                <a href="mailto:eauction39@gmail.com" style={{ ...linkBase, color: '#ffffff' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#ffffff'}>
                  <span style={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>{Icons.Mail}</span>
                  eauction39@gmail.com
                </a>
                <a href="tel:+916351704355" style={{ ...linkBase, color: '#ffffff' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#ffffff'}>
                  <span style={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>{Icons.Phone}</span>
                  +91 6351704355
                </a>
                <a href="https://maps.google.com/?q=Ahmedabad,Gujarat,India" target="_blank" rel="noreferrer"
                  style={{ ...linkBase, color: '#ffffff' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#ffffff'}>
                  <span style={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>{Icons.MapPin}</span>
                  Ahmedabad, Gujarat, India
                </a>
              </div>
            </div>

        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

      {/* Bottom bar */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px clamp(14px, 4vw, 40px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', alignItems: 'center', gap: '12px', textAlign: isMobile ? 'center' : 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px 20px', flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '12px', fontWeight: 600 }}>
            {Icons.SSL} SSL Encrypted
          </div>
          <p style={{ color: '#ffffff', fontSize: '12px', margin: 0 }}>© 2026 E-Auction Inc. All rights reserved.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
          {['VISA','MC','STRIPE','PAYPAL','UPI'].map(p => (
            <div key={p} style={{ height: '24px', minWidth: '44px', padding: '0 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>{p}</div>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default FooterComponent;
