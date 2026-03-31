import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import axios from 'axios'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard from './pages/Dashboard'
import HomePage from './pages/HomePage'
import TradeLogPage from './pages/TradeLogPage'
import RiskSettingsPage from './pages/RiskSettingsPage'
import AlertsPage from './pages/AlertsPage'
import './index.css'

axios.defaults.baseURL = '/api/v1'
const token = localStorage.getItem('api_token')
if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage/>} />
        <Route path="/login" element={<LoginPage/>} />
        <Route path="/register" element={<RegisterPage/>} />
        <Route path="/dashboard" element={<Dashboard/>} />
        <Route path="/trade-log" element={<TradeLogPage/>} />
        <Route path="/risk-settings" element={<RiskSettingsPage/>} />
        <Route path="/alerts" element={<AlertsPage/>} />
        <Route path="*" element={<Navigate to='/' />} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App />)
