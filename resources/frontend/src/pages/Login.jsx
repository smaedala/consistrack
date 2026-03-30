import React, { useState } from 'react'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  async function handleSubmit(e){
    e.preventDefault()
    try{
      // Get CSRF cookie
      await fetch('/sanctum/csrf-cookie', { credentials: 'include' })

      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })
      const json = await res.json()
      if(!json.success){
        setError(json.message || 'Login failed')
        return
      }
      // store token
      localStorage.setItem('token', json.data.token)
      window.location.href = '/app'
    }catch(err){
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="p-8 bg-white rounded shadow w-full max-w-md">
        <h2 className="text-2xl mb-4">Login</h2>
        {error && <div className="mb-2 text-red-600">{error}</div>}
        <label className="block mb-2">Email
          <input className="w-full border p-2" value={email} onChange={e=>setEmail(e.target.value)} />
        </label>
        <label className="block mb-4">Password
          <input type="password" className="w-full border p-2" value={password} onChange={e=>setPassword(e.target.value)} />
        </label>
        <button className="w-full bg-indigo-600 text-white py-2 rounded">Sign in</button>
      </form>
    </div>
  )
}
