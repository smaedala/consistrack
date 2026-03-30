import { useState } from 'react';
import { Logo } from './Logo';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';

// Mock chart data for the preview
const chartData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  equity: 100000 + Math.random() * 10000,
}));

export function RegisterPage({ onNavigateToLogin }: { onNavigateToLogin: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  return (
    <div className="flex h-screen bg-[#101217] overflow-hidden">
      {/* Left Side - Visual Preview */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#15171C] p-12 flex-col justify-between">
        <div>
          <Logo size="lg" variant="dark" />
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-xl">
            <h2 className="text-white text-4xl font-semibold mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Start Your Trading Journey
            </h2>
            <p className="text-[#9CA3AF] text-lg mb-8">
              Join thousands of traders managing their prop firm accounts with precision and confidence.
            </p>
            
            {/* Preview Chart */}
            <div className="bg-[#1E2025] rounded-lg p-6 border border-[#2A2D35]">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="registerGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00F2FE" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#00F2FE" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" vertical={false} />
                  <XAxis stroke="#9CA3AF" tick={false} axisLine={false} />
                  <YAxis stroke="#9CA3AF" tick={false} axisLine={false} />
                  <Area
                    type="monotone"
                    dataKey="equity"
                    stroke="#00F2FE"
                    strokeWidth={2}
                    fill="url(#registerGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Feature List */}
            <div className="mt-8 space-y-3">
              {[
                'Real-time equity tracking',
                'Automatic compliance monitoring',
                'Consistency score analysis',
                'Multi-account management',
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                    <svg className="w-3 h-3 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[#9CA3AF]">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-[#9CA3AF] text-sm">
          © 2026 Smaedala FX. All rights reserved.
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Logo size="lg" variant="dark" />
          </div>

          <h1 className="text-white text-3xl font-semibold mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            Create your account
          </h1>
          <p className="text-[#9CA3AF] mb-8">
            Get started with your free account today
          </p>

          <form className="space-y-5">
            {/* Full Name Input */}
            <div>
              <label className="block text-[#9CA3AF] text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                  className="w-full bg-[#1E2025] border border-[#2A2D35] rounded-lg pl-11 pr-4 py-3 text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#00F2FE] transition-colors"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-[#9CA3AF] text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full bg-[#1E2025] border border-[#2A2D35] rounded-lg pl-11 pr-4 py-3 text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#00F2FE] transition-colors"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-[#9CA3AF] text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-[#1E2025] border border-[#2A2D35] rounded-lg pl-11 pr-11 py-3 text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#00F2FE] transition-colors"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-[#9CA3AF] text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-[#1E2025] border border-[#2A2D35] rounded-lg pl-11 pr-11 py-3 text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#00F2FE] transition-colors"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Terms & Conditions */}
            <label className="flex items-start gap-2">
              <input type="checkbox" className="w-4 h-4 mt-0.5 rounded bg-[#1E2025] border-[#2A2D35]" />
              <span className="text-[#9CA3AF] text-sm">
                I agree to the{' '}
                <button type="button" className="text-[#00F2FE] hover:underline">
                  Terms of Service
                </button>
                {' '}and{' '}
                <button type="button" className="text-[#00F2FE] hover:underline">
                  Privacy Policy
                </button>
              </span>
            </label>

            {/* Create Account Button */}
            <button
              type="submit"
              className="w-full bg-[#00F2FE] hover:bg-[#00D4E6] text-white font-medium py-3 rounded-lg transition-colors"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Create Account
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#2A2D35]"></div>
            <span className="text-[#9CA3AF] text-sm">or continue with</span>
            <div className="flex-1 h-px bg-[#2A2D35]"></div>
          </div>

          {/* Social Auth Buttons */}
          <div className="space-y-3">
            <button className="w-full bg-transparent border border-[#2A2D35] hover:border-[#00F2FE] text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            <button className="w-full bg-transparent border border-[#2A2D35] hover:border-[#00F2FE] text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Continue with Apple
            </button>
          </div>

          {/* Login Link */}
          <p className="text-center text-[#9CA3AF] mt-6">
            Already have an account?{' '}
            <button 
              onClick={onNavigateToLogin}
              className="text-[#00F2FE] hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
