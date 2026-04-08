import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ThemeProvider, useTheme } from '../figma-dashboard/app/context/ThemeContext'
import { Sidebar } from '../figma-dashboard/app/components/Sidebar'
import { Header } from '../figma-dashboard/app/components/Header'

function DashboardShellInner({ children }) {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isDesktopSidebarExpanded, setIsDesktopSidebarExpanded] = useState(true)
  const [accounts, setAccounts] = useState([])
  const [activeAccountId, setActiveAccountId] = useState(null)
  const [accountLabel, setAccountLabel] = useState('No Account Yet')
  const [helpMode, setHelpMode] = useState(false)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    async function loadAccounts() {
      try {
        const res = await axios.get('/accounts')
        const list = Array.isArray(res.data?.data) ? res.data.data : []
        setAccounts(list)
        if (list.length === 0) {
          setActiveAccountId(null)
          setAccountLabel('No Account Yet')
          localStorage.removeItem('active_account_id')
          return
        }
        const preferredId = Number(localStorage.getItem('active_account_id') || 0)
        const current = list.find((a) => Number(a.id) === preferredId) || list[0]
        setActiveAccountId(current.id)
        setAccountLabel(current.account_name || 'Active Account')
        localStorage.setItem('active_account_id', String(current.id))
      } catch {
        setAccounts([])
        setActiveAccountId(null)
        setAccountLabel('No Account Yet')
      }
    }
    loadAccounts()
  }, [])

  function handleMenuClick() {
    if (window.matchMedia('(max-width: 767px)').matches) {
      setIsMobileSidebarOpen((prev) => !prev)
      return
    }
    setIsDesktopSidebarExpanded((prev) => !prev)
  }

  function handleSelectAccount(id) {
    const found = accounts.find((a) => Number(a.id) === Number(id))
    if (!found) return
    setActiveAccountId(found.id)
    setAccountLabel(found.account_name || 'Active Account')
    localStorage.setItem('active_account_id', String(found.id))
    window.dispatchEvent(new CustomEvent('consistracker:active-account-changed', { detail: { accountId: found.id } }))
  }

  const guideProgress = {
    accountCreated: accounts.length > 0,
    rulesConfigured: true,
    firstTradeAdded: true,
    firstImportCompleted: true,
  }

  return (
    <div className={`flex h-screen overflow-hidden app-shell-themed ${theme === 'dark' ? 'is-dark' : 'is-light'}`}>
      {!isMobile ? <Sidebar expanded={isDesktopSidebarExpanded} /> : null}

      {isMobile ? (
        <div className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar variant="mobile" onNavigateMobile={() => setIsMobileSidebarOpen(false)} />
        </div>
      ) : null}

      {isMobile && isMobileSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      ) : null}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          isMobile={isMobile}
          onMobileMenuClick={handleMenuClick}
          accountLabel={accountLabel}
          accounts={accounts.map((a) => ({ id: a.id, label: `${a.account_name}` }))}
          activeAccountId={activeAccountId}
          onSelectAccount={handleSelectAccount}
          onAddAccount={() => navigate('/dashboard')}
          onOpenGuide={() => navigate('/dashboard')}
          onOpenAddTrade={() => navigate('/dashboard')}
          onOpenImport={() => navigate('/dashboard')}
          helpMode={helpMode}
          onToggleHelpMode={() => setHelpMode((prev) => !prev)}
          guideProgress={guideProgress}
        />
        <div className="flex-1 overflow-y-auto app-shell-content">
          <div className="panel-content-wrap">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardShell({ children }) {
  return (
    <ThemeProvider>
      <DashboardShellInner>{children}</DashboardShellInner>
    </ThemeProvider>
  )
}
