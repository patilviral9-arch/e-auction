import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FooterComponent = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSub = () => {
    if (email.includes('@')) {
      setSubscribed(true);
      setEmail('');
    }
  };

  const col = { display: 'flex', flexDirection: 'column', gap: '10px' };
  const link = {
    color: '#64748b', fontSize: '14px', textDecoration: 'none',
    transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '6px',
  };

  const SLink = ({ href, children, icon }) => (
    <Link to={href || '#'} style={link}
      onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
      onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
    >
      {icon && <span style={{ fontSize: '13px' }}>{icon}</span>}
      {children}
    </Link>
  );

  return (
    <footer style={{
      background: '#060d1a',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Top section */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 40px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr 1.4fr', gap: '40px' }}>

          {/* Brand */}
          <div>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '18px' }}>
              <div style={{
                width: '36px', height: '36px',
                background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px',
              }}></div>
              <span style={{ color: 'white', fontWeight: 800, fontSize: '20px', letterSpacing: '-0.02em' }}>
                E-<span style={{ color: '#38bdf8' }}>Auction</span>
              </span>
            </Link>
            <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.7, marginBottom: '20px', maxWidth: '260px' }}>
              The world's most trusted marketplace for premium collectibles, industrial assets, and luxury goods. Secure, transparent, and lightning-fast.
            </p>
            {/* Social */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { icon: '𝕏',   color: '#1da1f2', bg: 'rgba(29,161,242,0.1)',  href: '#' },
                { icon: 'f',   color: '#4267B2', bg: 'rgba(66,103,178,0.1)', href: '#' },
                { icon: '📷', color: '#e1306c', bg: 'rgba(225,48,108,0.1)',  href: '#' },
                { icon: 'in',  color: '#0077b5', bg: 'rgba(0,119,181,0.1)',  href: '#' },
              ].map((s, i) => (
                <a key={i} href={s.href} style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: s.bg, border: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: s.color, fontSize: '13px', fontWeight: 800,
                  textDecoration: 'none', transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >{s.icon}</a>
              ))}
            </div>
          </div>

          {/* Auctions */}
          <div>
            <h4 style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Auctions</h4>
            <div style={col}>
              <SLink href="/live"     icon="🔴">Live Auctions</SLink>
              <SLink href="/browse"   icon="🔍">Browse All</SLink>
              <SLink href="/upcoming" icon="📅">Upcoming</SLink>
              <SLink href="/closed"   icon="✅">Recently Closed</SLink>
              <SLink href="/create-auction" icon="➕">Sell an Item</SLink>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Categories</h4>
            <div style={col}>
              {['Electronics','Vehicles','Collectibles','Luxury','Real Estate','Industrial'].map(c => (
                <SLink key={c} href={`/category/${c.toLowerCase()}`}>
                  {c}
                </SLink>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Resources</h4>
            <div style={col}>
              <SLink href="#" icon="📋">Bidding Rules</SLink>
              <SLink href="#" icon="🛡️">Buyer Protection</SLink>
              <SLink href="#" icon="📄">Terms of Service</SLink>
              <SLink href="#" icon="🔒">Privacy Policy</SLink>
              <SLink href="#" icon="💬">Contact Support</SLink>
              <SLink href="#" icon="❓">FAQs</SLink>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stay Updated</h4>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px', lineHeight: 1.6 }}>
              Get notified about rare items, upcoming auctions, and exclusive deals.
            </p>
            {subscribed ? (
              <div style={{
                background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)',
                borderRadius: '10px', padding: '12px 16px',
                color: '#34d399', fontSize: '13px', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                ✅ You're subscribed!
              </div>
            ) : (
              <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSub()}
                  placeholder="your@email.com"
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.04)',
                    border: 'none', padding: '10px 14px',
                    color: 'white', fontSize: '13px', outline: 'none',
                  }}
                />
                <button onClick={handleSub} style={{
                  background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
                  border: 'none', padding: '10px 16px',
                  color: 'white', cursor: 'pointer', fontSize: '14px',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >→</button>
              </div>
            )}

            {/* App badges */}
            <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
              {[
                { icon: '🍎', label: 'App Store' },
                { icon: '▶', label: 'Google Play' },
              ].map(a => (
                <a key={a.label} href="#" style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <span style={{ fontSize: '16px' }}>{a.icon}</span>
                  <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>{a.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

      {/* Bottom bar */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '12px', fontWeight: 600 }}>
            <span>🔐</span> SSL Encrypted
          </div>
          <p style={{ color: '#334155', fontSize: '12px', margin: 0 }}>© 2026 BidMaster Inc. All rights reserved.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['VISA','MC','STRIPE','PAYPAL','UPI'].map(p => (
            <div key={p} style={{
              height: '24px', minWidth: '44px', padding: '0 8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '8px', fontWeight: 800, color: '#475569', letterSpacing: '0.04em',
            }}>{p}</div>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default FooterComponent;
