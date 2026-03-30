import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const supportedFirms = ['FTMO', 'Topstep', 'MyFundedFX', 'FundedNext', 'E8 Markets']

const challengeCards = [
  {
    title: 'The Consistency Rule.',
    text: 'One huge win can breach your account. We flag your risk daily.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 2.4 20h19.2L12 3Zm0 5.2 5.4 9.6H6.6L12 8.2ZM11 11v4h2v-4h-2Zm0 5.5v2h2v-2h-2Z" />
      </svg>
    ),
  },
  {
    title: 'Precision Risk Management.',
    text: 'Never guess your remaining loss buffer. See it in real-time.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2 4 6v6c0 5.2 3.4 9.7 8 11 4.6-1.3 8-5.8 8-11V6l-8-4Zm0 2.2 6 3v4.8c0 4.2-2.6 8.2-6 9.3-3.4-1.1-6-5.1-6-9.3V7.2l6-3Zm-1 4.8v4h6v-2h-4V9h-2Zm-2.8 8.4 1.4 1.4 2.4-2.4-1.4-1.4-2.4 2.4Z" />
      </svg>
    ),
  },
  {
    title: 'MT4/5 Integration.',
    text: 'Sync your trades automatically. Focus on trading, not spreadsheets.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 3h2v18H3V3Zm4 10h4v8H7v-8Zm6-6h4v14h-4V7Zm6 3h2v11h-2V10Z" />
      </svg>
    ),
  },
]

const proFeatures = [
  'Role-Based Access (for groups)',
  'Multi-Account Tracking',
  'Strategy Tagging',
]

const pricingTiers = [
  {
    name: 'Free',
    subtitle: 'The Evaluator',
    price: '$0/mo',
    features: ['Basic trade tracking', '1 account'],
    cta: 'Get Started',
  },
  {
    name: 'Pro',
    subtitle: 'The Funded Trader',
    price: '$29/mo',
    features: ['Full consistency analytics', 'MT4/5 sync', 'Unlimited accounts'],
    cta: 'Start Tracking',
    popular: true,
  },
  {
    name: 'Team',
    subtitle: 'For Prop Firms/Groups',
    price: 'Contact Us',
    features: ['All Pro features', 'Admin panel', 'Custom rules', 'White-label options'],
    cta: 'Talk to Sales',
  },
]

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9.2 16.6 4.8 12.2l1.4-1.4 3 3 8.6-8.6 1.4 1.4-10 10Z" />
    </svg>
  )
}

export default function HomePage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="home-page">
      <div className="page-orb orb-a" />
      <div className="page-orb orb-b" />

      <header className="nav-wrap">
        <div className="nav-shell">
          <div className="brand">Smaedala FX</div>
          <nav className="nav-links" aria-label="Primary">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#rules">Rules</a>
            <a href="#blog">Blog</a>
          </nav>
          <div className="nav-actions">
            <Link className="btn btn-outline" to="/login">
              Login
            </Link>
            <Link className="btn btn-solid" to="/dashboard">
              Start Tracking
            </Link>
          </div>
          <Link className="nav-mobile-login" to="/login">
            Login
          </Link>
          <button
            type="button"
            className="mobile-nav-toggle"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        <div className={`mobile-nav-panel ${mobileNavOpen ? 'open' : ''}`}>
          <a href="#features" onClick={() => setMobileNavOpen(false)}>Features</a>
          <a href="#pricing" onClick={() => setMobileNavOpen(false)}>Pricing</a>
          <a href="#rules" onClick={() => setMobileNavOpen(false)}>Rules</a>
          <a href="#blog" onClick={() => setMobileNavOpen(false)}>Blog</a>
          <div className="mobile-nav-actions">
            <Link className="btn btn-outline" to="/login" onClick={() => setMobileNavOpen(false)}>
              Login
            </Link>
            <Link className="btn btn-solid" to="/dashboard" onClick={() => setMobileNavOpen(false)}>
              Start Tracking
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero section-shell" id="features">
          <div className="hero-copy reveal-up">
            <p className="eyebrow">Prop Firm Analytics Platform</p>
            <h1>Master Your Prop Firm Evaluation. Stay Consistent. Never Breach.</h1>
            <p>
              Automatically track the 40% rule, manage daily drawdown, and visualize your equity curve with
              the precision tool built by traders, for traders.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-glow" to="/register">
                Start Your Free Trial
              </Link>
            </div>
          </div>

          <div className="hero-dashboard reveal-up delay-1" aria-label="Dashboard preview">
            <div className="preview-top">
              <span>Equity Curve</span>
              <span className="positive">+12.8%</span>
            </div>
            <div className="chart-area">
              <svg viewBox="0 0 460 180" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(0,242,254,0.38)" />
                    <stop offset="100%" stopColor="rgba(0,242,254,0.02)" />
                  </linearGradient>
                </defs>
                <path d="M0 160 C30 154 42 144 65 132 C90 118 108 126 132 102 C158 78 176 70 198 82 C225 98 248 72 278 52 C304 36 332 46 356 32 C380 18 410 20 460 6 L460 180 L0 180 Z" fill="url(#curveFill)" />
                <path d="M0 160 C30 154 42 144 65 132 C90 118 108 126 132 102 C158 78 176 70 198 82 C225 98 248 72 278 52 C304 36 332 46 356 32 C380 18 410 20 460 6" fill="none" stroke="#00F2FE" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <div className="preview-bottom">
              <div className="gauge-card">
                <div>
                  <p>40% Consistency Gauge</p>
                  <strong>32%</strong>
                </div>
                <div className="radial-wrap" aria-hidden="true">
                  <div className="radial-track" />
                  <div className="radial-fill" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="trust-bar" aria-label="Supported firms">
          <div className="section-shell trust-inner">
            <span>Supported Firms</span>
            <div className="logos">
              {supportedFirms.map((firm) => (
                <div key={firm} className="logo-chip">
                  {firm}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-shell challenge" id="rules">
          <div className="section-head reveal-up">
            <p className="eyebrow">Why We Exist</p>
            <h2>The #1 Reason Traders Fail Evaluation?</h2>
          </div>
          <div className="challenge-grid">
            {challengeCards.map((item, index) => (
              <article className="challenge-card reveal-up" style={{ animationDelay: `${index * 0.08 + 0.05}s` }} key={item.title}>
                <div className="icon-box">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-shell analytics">
          <div className="analytics-visual reveal-up">
            <div className="panel-head">
              <h3>Advanced Analytics</h3>
              <span className="tag">Live</span>
            </div>
            <div className="metrics-grid">
              <div className="metric-tile">
                <p>Win Rate by Asset</p>
                <strong>FX 64% / Indices 58%</strong>
              </div>
              <div className="metric-tile">
                <p>Risk-per-Trade Matrix</p>
                <strong>Optimal: 0.75%</strong>
              </div>
              <div className="heat-map" role="img" aria-label="15 and 40 percent consistency heat map">
                {['#10B981', '#10B981', '#10B981', '#f59e0b', '#ef4444', '#10B981', '#f59e0b', '#10B981', '#ef4444'].map(
                  (color, i) => (
                    <span key={i} style={{ backgroundColor: color }} />
                  )
                )}
              </div>
            </div>
          </div>
          <div className="analytics-copy reveal-up delay-1">
            <p className="eyebrow">The Analytics Power</p>
            <h2>Know Your Edge Before the Rule Engine Punishes You.</h2>
            <ul>
              {proFeatures.map((feature) => (
                <li key={feature}>
                  <CheckIcon />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section-shell pricing" id="pricing">
          <div className="section-head reveal-up">
            <p className="eyebrow">Plans</p>
            <h2>Simple Pricing for Serious Traders.</h2>
          </div>
          <div className="pricing-grid">
            {pricingTiers.map((tier, index) => (
              <article
                key={tier.name}
                className={`pricing-card reveal-up ${tier.popular ? 'popular' : ''}`}
                style={{ animationDelay: `${index * 0.07 + 0.03}s` }}
              >
                {tier.popular && <span className="popular-tag">Most Popular</span>}
                <h3>{tier.name}</h3>
                <p className="pricing-subtitle">{tier.subtitle}</p>
                <p className="price">{tier.price}</p>
                <ul>
                  {tier.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <Link className={`btn ${tier.popular ? 'btn-solid' : 'btn-outline'}`} to="/register">
                  {tier.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="final-cta">
          <div className="section-shell cta-inner reveal-up">
            <h2>Ready to Pass Your Next Evaluation?</h2>
            <p>Sign up today and get full analytics access for 7 days.</p>
            <Link className="btn btn-glow" to="/register">
              Secure Your Funded Account
            </Link>
          </div>
        </section>
      </main>

      <footer className="footer" id="blog">
        <div className="section-shell footer-grid">
          <div>
            <div className="brand footer-brand">Smaedala FX</div>
            <div className="socials" aria-label="Social links">
              <a href="#" aria-label="X">
                X
              </a>
              <a href="#" aria-label="LinkedIn">
                LinkedIn
              </a>
              <a href="#" aria-label="Discord">
                Discord
              </a>
            </div>
          </div>
          <div>
            <h4>Platform</h4>
            <a href="#">Dashboard</a>
            <a href="#">Trade Log</a>
            <a href="#">Strategy Journal</a>
            <a href="#">MT4 Sync</a>
          </div>
          <div>
            <h4>Resources</h4>
            <a href="#">Blog</a>
            <a href="#">Prop Firm Rule Guide</a>
            <a href="#">Help Center</a>
            <a href="#">API Docs</a>
          </div>
          <div>
            <h4>Company</h4>
            <a href="#">About Us</a>
            <a href="#">Careers</a>
            <a href="#">Contact</a>
            <a href="#">Press</a>
          </div>
        </div>
        <div className="footer-bottom section-shell">
          <p>Copyright © 2024 Smaedala Technologies.</p>
          <div>
            <a href="#">Privacy Policy</a>
            <span>|</span>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
