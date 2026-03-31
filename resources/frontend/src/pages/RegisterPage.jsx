import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12.6a4.3 4.3 0 1 1 0-8.6 4.3 4.3 0 0 1 0 8.6Zm0-2A2.3 2.3 0 1 0 12 6a2.3 2.3 0 0 0 0 4.6Zm0 3c5.06 0 8.5 2.69 8.5 6.4v1h-17v-1c0-3.71 3.44-6.4 8.5-6.4Zm0 2c-3.93 0-6.18 1.9-6.45 3.4h12.9c-.27-1.5-2.52-3.4-6.45-3.4Z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6.8A2.8 2.8 0 0 1 5.8 4h12.4A2.8 2.8 0 0 1 21 6.8v10.4a2.8 2.8 0 0 1-2.8 2.8H5.8A2.8 2.8 0 0 1 3 17.2V6.8Zm2 1.02V17.2c0 .44.36.8.8.8h12.4a.8.8 0 0 0 .8-.8V7.82l-6.2 4.3a1.4 1.4 0 0 1-1.6 0L5 7.82Zm1.35-1.82L12 9.97 17.65 6H6.35Z" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.5 10V7.75a4.5 4.5 0 1 1 9 0V10h.7A2.8 2.8 0 0 1 20 12.8v6.4a2.8 2.8 0 0 1-2.8 2.8H6.8A2.8 2.8 0 0 1 4 19.2v-6.4A2.8 2.8 0 0 1 6.8 10h.7Zm2 0h5V7.75a2.5 2.5 0 1 0-5 0V10Z" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5c5.73 0 9.28 4.69 10.56 6.68a.6.6 0 0 1 0 .64C21.28 14.31 17.73 19 12 19s-9.28-4.69-10.56-6.68a.6.6 0 0 1 0-.64C2.72 9.69 6.27 5 12 5Zm0 2C7.95 7 5.03 10.1 3.5 12 5.03 13.9 7.95 17 12 17s6.97-3.1 8.5-5C18.97 10.1 16.05 7 12 7Zm0 1.8a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4Zm0 2a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M21.8 12.23c0-.75-.07-1.47-.2-2.16H12v4.08h5.5a4.7 4.7 0 0 1-2.03 3.08v2.54h3.29c1.92-1.77 3.04-4.38 3.04-7.54Z" />
      <path fill="currentColor" d="M12 22c2.75 0 5.05-.91 6.73-2.47l-3.29-2.54c-.9.61-2.06.98-3.44.98-2.64 0-4.9-1.79-5.59-4.2H2.99v2.6A9.99 9.99 0 0 0 12 22Z" />
      <path fill="currentColor" d="M6.41 13.77A5.99 5.99 0 0 1 6.09 12c0-.62.11-1.22.32-1.77V7.63H2.99A10 10 0 0 0 2 12c0 1.62.39 3.15 1.09 4.37l3.32-2.6Z" />
      <path fill="currentColor" d="M12 6.03c1.49 0 2.82.51 3.87 1.5l2.9-2.9C17.05 3.04 14.75 2 12 2a9.99 9.99 0 0 0-9.01 5.63l3.42 2.6c.68-2.42 2.95-4.2 5.59-4.2Z" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M16.96 12.36c.02 2.05 1.8 2.73 1.82 2.74-.01.05-.28.95-.9 1.88-.54.82-1.1 1.62-1.99 1.63-.87.02-1.15-.5-2.14-.5-1 0-1.31.49-2.12.52-.83.03-1.46-.84-2-1.66-1.1-1.7-1.94-4.8-.8-6.76.57-.98 1.57-1.6 2.66-1.62.83-.02 1.62.56 2.13.56.5 0 1.44-.7 2.42-.6.41.02 1.56.17 2.3 1.25-.06.04-1.37.8-1.35 2.56Zm-1.78-5.47c.45-.54.76-1.29.68-2.04-.65.03-1.43.43-1.89.97-.42.49-.79 1.27-.7 2.01.72.06 1.45-.37 1.91-.94Z" />
    </svg>
  )
}

function BackArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m13.83 19.41-1.41 1.41L3.59 12l8.83-8.83 1.41 1.41L7.41 11H21v2H7.41l6.42 6.41Z" />
    </svg>
  )
}

function TrendLogo() {
  return (
    <div className="authv2-logo">
      <div className="authv2-logo-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M4 18h16v2H2V4h2v14Zm4-3 3.5-3.5 2.8 2.8L20 8.6V12h2V5h-7v2h3.6l-4.3 4.3-2.8-2.8L6 13.6 8 15Z" />
        </svg>
      </div>
      <span>ConsisTracker</span>
    </div>
  )
}

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      await axios.get(window.location.origin + '/sanctum/csrf-cookie')
      const res = await axios.post('/auth/register', { name, email, password })
      const token = res.data.data.token
      localStorage.setItem('api_token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Register failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="authv2-page">
      <aside className="authv2-visual">
        <TrendLogo />

        <div className="authv2-visual-content">
          <h2>Start Your Trading Journey</h2>
          <p>Join thousands of traders managing prop firm accounts with precision and confidence.</p>

          <div className="authv2-chart-card">
            <svg viewBox="0 0 460 200" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="authv2CurveRegister" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(0,242,254,0.35)" />
                  <stop offset="100%" stopColor="rgba(0,242,254,0.04)" />
                </linearGradient>
              </defs>
              <path d="M0 170 C28 166 44 151 72 139 C97 129 114 136 138 112 C162 89 185 94 205 108 C226 122 248 103 271 84 C298 63 320 75 348 53 C373 33 404 24 460 15 L460 200 L0 200 Z" fill="url(#authv2CurveRegister)" />
              <path d="M0 170 C28 166 44 151 72 139 C97 129 114 136 138 112 C162 89 185 94 205 108 C226 122 248 103 271 84 C298 63 320 75 348 53 C373 33 404 24 460 15" fill="none" stroke="#00F2FE" strokeWidth="3" />
            </svg>
          </div>

          <ul className="authv2-feature-list">
            <li>Real-time equity tracking</li>
            <li>Automatic compliance monitoring</li>
            <li>Consistency score analysis</li>
            <li>Multi-account management</li>
          </ul>
        </div>

        <p className="authv2-copyright">© 2026 Smaedala FX. All rights reserved.</p>
      </aside>

      <section className="authv2-form-shell">
        <Link to="/" className="authv2-back-home" aria-label="Back to homepage">
          <BackArrowIcon />
          <span>Back to homepage</span>
        </Link>

        <div className="authv2-mobile-logo">
          <TrendLogo />
        </div>

        <h1>Create your account</h1>
        <p className="authv2-subtitle">Get started with your free account today</p>

        <form className="authv2-form" onSubmit={handleSubmit}>
          {error && <div className="authv2-error">{error}</div>}

          <label htmlFor="reg-name">Full Name</label>
          <div className="authv2-input-wrap">
            <span className="authv2-input-icon" aria-hidden="true"><UserIcon /></span>
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              autoComplete="name"
              required
            />
          </div>

          <label htmlFor="reg-email">Email</label>
          <div className="authv2-input-wrap">
            <span className="authv2-input-icon" aria-hidden="true"><MailIcon /></span>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <label htmlFor="reg-password">Password</label>
          <div className="authv2-input-wrap">
            <span className="authv2-input-icon" aria-hidden="true"><LockIcon /></span>
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
            <button type="button" className="authv2-toggle" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password visibility">
              <EyeIcon />
            </button>
          </div>

          <label htmlFor="reg-confirm-password">Confirm Password</label>
          <div className="authv2-input-wrap">
            <span className="authv2-input-icon" aria-hidden="true"><LockIcon /></span>
            <input
              id="reg-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
            <button type="button" className="authv2-toggle" onClick={() => setShowConfirmPassword((v) => !v)} aria-label="Toggle confirm password visibility">
              <EyeIcon />
            </button>
          </div>

          <label className="authv2-check authv2-terms">
            <input type="checkbox" required />
            <span>
              I agree to the <button type="button" className="authv2-link-btn">Terms of Service</button> and <button type="button" className="authv2-link-btn">Privacy Policy</button>
            </span>
          </label>

          <button className="authv2-submit" type="submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="authv2-divider"><span>or continue with</span></div>

        <div className="authv2-socials">
          <button type="button"><GoogleIcon /> Continue with Google</button>
          <button type="button"><AppleIcon /> Continue with Apple</button>
        </div>

        <p className="authv2-bottom-text">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </div>
  )
}
