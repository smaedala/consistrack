import { useState } from "react";
import {
  AlertTriangle,
  Target,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  Users,
  Shield,
  Brain,
  Camera,
  Calculator,
  Trophy,
  Building2,
} from "lucide-react";
import { PricingCard } from "./components/pricing-card";
import { FeatureCard } from "./components/feature-card";
import { AdvancedFeatureCard } from "./components/advanced-feature-card";
import { ConsistencyCalculatorDemo } from "./components/consistency-calculator-demo";
import { StrategyMatrixDemo } from "./components/strategy-matrix-demo";
import { Footer } from "./components/footer";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#101217" }}>
      {/* Sticky Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-800 bg-[#101217]/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <div className="text-2xl text-[#00F2FE]">Smaedala FX</div>

          {/* Center Navigation Links - Desktop */}
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-gray-300 transition-colors hover:text-[#00F2FE]">
              Features
            </a>
            <a href="#pricing" className="text-sm text-gray-300 transition-colors hover:text-[#00F2FE]">
              Pricing
            </a>
            <a href="#rules" className="text-sm text-gray-300 transition-colors hover:text-[#00F2FE]">
              Rules
            </a>
            <a href="#blog" className="text-sm text-gray-300 transition-colors hover:text-[#00F2FE]">
              Blog
            </a>
          </div>

          {/* Right Buttons */}
          <div className="flex items-center gap-4">
            <button className="hidden rounded-lg border border-[#00F2FE] px-6 py-2 text-sm text-[#00F2FE] transition-all hover:bg-[#00F2FE] hover:text-black md:block">
              Login
            </button>
            <button className="rounded-lg bg-[#00F2FE] px-6 py-2 text-sm text-black transition-all hover:bg-[#00D8E8]">
              Start Tracking
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-32 pb-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left Content */}
          <div>
            <h1 className="mb-6 text-5xl text-white lg:text-6xl">
              Master Your Prop Firm Evaluation.{" "}
              <span className="text-[#00F2FE]">Stay Consistent.</span> Never Breach.
            </h1>
            <p className="mb-8 text-xl text-gray-400">
              Automatically track the 40% rule, manage daily drawdown, and visualize your equity curve with the precision tool built by traders, for traders.
            </p>
            <button className="group rounded-lg bg-[#00F2FE] px-8 py-4 text-lg text-black transition-all hover:bg-[#00D8E8] hover:shadow-lg hover:shadow-[#00F2FE]/30">
              Start Your Free Trial
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                →
              </span>
            </button>
          </div>

          {/* Right Content - Dashboard Preview */}
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-gray-700 shadow-2xl shadow-[#00F2FE]/10">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1634097537825-b446635b2f7f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFkaW5nJTIwZGFzaGJvYXJkJTIwYW5hbHl0aWNzJTIwZGFya3xlbnwxfHx8fDE3NzQ4MTE5ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Smaedala FX Dashboard"
                className="w-full"
              />
            </div>
            {/* Glow Effect */}
            <div className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-r from-[#00F2FE]/20 to-[#10B981]/20 blur-3xl" />
          </div>
        </div>
      </section>

      {/* Social Proof/Trust Bar */}
      <section className="border-y border-gray-800 py-8" style={{ backgroundColor: "#1E2025" }}>
        <div className="container mx-auto px-6">
          <p className="mb-6 text-center text-sm text-gray-400">Trusted by traders at leading prop firms</p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-50 grayscale">
            <div className="text-2xl text-white">FTMO</div>
            <div className="text-2xl text-white">Topstep</div>
            <div className="text-2xl text-white">MyFundedFX</div>
            <div className="text-2xl text-white">The5%ers</div>
            <div className="text-2xl text-white">FundedNext</div>
          </div>
        </div>
      </section>

      {/* Core Challenge Section */}
      <section id="features" className="container mx-auto px-6 py-20">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl text-white lg:text-5xl">
            The #1 Reason Traders <span className="text-[#00F2FE]">Fail Evaluation?</span>
          </h2>
          <p className="text-xl text-gray-400">Hard and soft breaches you never saw coming.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <FeatureCard
            icon={AlertTriangle}
            title="The Consistency Rule"
            description="One huge win can breach your account. We flag your risk daily and show you exactly when you're approaching the 40% threshold."
          />
          <FeatureCard
            icon={Target}
            title="Precision Risk Management"
            description="Never guess your remaining loss buffer. See it in real-time with live calculations of your daily drawdown limits."
          />
          <FeatureCard
            icon={BarChart3}
            title="MT4/5 Integration"
            description="Sync your trades automatically. Focus on trading, not spreadsheets. Direct integration with your MetaTrader platform."
          />
        </div>
      </section>

      {/* Deep Feature Section */}
      <section className="py-20" style={{ backgroundColor: "#1E2025" }}>
        <div className="container mx-auto px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Visual */}
            <div className="order-2 lg:order-1">
              <div className="overflow-hidden rounded-2xl border border-gray-700 shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1736751035793-353baaa416cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW5hbmNpYWwlMjBjaGFydCUyMGFuYWx5dGljcyUyMGdyYXBofGVufDF8fHx8MTc3NDgxMTk4Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Advanced Analytics"
                  className="w-full"
                />
              </div>
            </div>

            {/* Copy */}
            <div className="order-1 lg:order-2">
              <h2 className="mb-6 text-4xl text-white">
                <span className="text-[#00F2FE]">Advanced Analytics</span> That Actually Help
              </h2>
              <p className="mb-8 text-lg text-gray-400">
                Go beyond basic P&L tracking. Get insights that prop firms use to evaluate traders.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-6 w-6 flex-shrink-0 text-[#10B981]" />
                  <div>
                    <h3 className="mb-1 text-lg text-white">Role-Based Access</h3>
                    <p className="text-gray-400">Perfect for trading groups and prop firms with team management.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-6 w-6 flex-shrink-0 text-[#10B981]" />
                  <div>
                    <h3 className="mb-1 text-lg text-white">Multi-Account Tracking</h3>
                    <p className="text-gray-400">Manage unlimited accounts across different prop firms in one dashboard.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-6 w-6 flex-shrink-0 text-[#10B981]" />
                  <div>
                    <h3 className="mb-1 text-lg text-white">Strategy Tagging</h3>
                    <p className="text-gray-400">Label trades by strategy and see which setups actually make money.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-6 w-6 flex-shrink-0 text-[#10B981]" />
                  <div>
                    <h3 className="mb-1 text-lg text-white">15%/40% Consistency Heat Map</h3>
                    <p className="text-gray-400">Visual alerts when you're approaching soft or hard breach thresholds.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Pro Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-block rounded-full bg-[#00F2FE]/10 px-4 py-2">
            <span className="text-sm text-[#00F2FE]">🚀 Pro Tools</span>
          </div>
          <h2 className="mb-4 text-4xl text-white lg:text-5xl">
            Beyond Tracking: <span className="text-[#00F2FE]">Active Performance Coaching</span>
          </h2>
          <p className="text-xl text-gray-400">
            Features that move you from amateur to consistently profitable
          </p>
        </div>

        {/* Advanced Feature Cards Grid */}
        <div className="mb-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <AdvancedFeatureCard
            icon={Brain}
            title="Psychology Journal"
            subtitle="Emotion Mapping & Analysis"
            description="Tag every trade with emotions (Confident, Anxious, FOMO). Get a psychological heatmap showing which emotional states lead to losses. Auto-triggered 'Cool Down Mode' after 3 consecutive emotional trades."
            badge="AI-Powered"
            color="purple"
          />
          <AdvancedFeatureCard
            icon={Camera}
            title="Trade Replay Gallery"
            subtitle="Visual Trade Review"
            description="Upload before/after screenshots for every setup. Build a visual library of winning vs. losing trades. Perfect for weekend review sessions and pattern recognition."
            color="cyan"
          />
          <AdvancedFeatureCard
            icon={Calculator}
            title="Consistency Buffer™"
            subtitle="What-If Simulator"
            description="Live calculator that shows if your next trade will breach the 40% rule. Adjust profit targets in real-time and see instant breach predictions. Never miss a soft breach again."
            badge="Exclusive"
            color="green"
          />
          <AdvancedFeatureCard
            icon={Trophy}
            title="Strategy Win-Rate Matrix"
            subtitle="Setup Performance Breakdown"
            description="Categorize by specific setups (ICT Silver Bullet, London Open, Judas Swing). See which strategies have the highest profit factor. Get AI recommendations on which setups to focus on."
            color="orange"
          />
          <AdvancedFeatureCard
            icon={Building2}
            title="Multi-Firm Rule Profiles"
            subtitle="Pre-Configured Firm Templates"
            description="One-click setup for FTMO, Topstep, MyFundedFX, and 15+ other firms. Automatically adjusts breach sensors to match each firm's specific 15%/40% rules and drawdown limits."
            color="cyan"
          />
          <AdvancedFeatureCard
            icon={TrendingUp}
            title="Real-Time Alerts"
            subtitle="Smart Notification System"
            description="Get instant alerts when approaching consistency thresholds, daily drawdown limits, or when your emotional trading pattern is detected. Available on desktop, mobile, and Discord."
            color="green"
          />
        </div>

        {/* Interactive Demos */}
        <div className="space-y-8">
          {/* Consistency Calculator Demo */}
          <div>
            <div className="mb-8 text-center">
              <h3 className="mb-2 text-3xl text-white">Try It: Interactive Consistency Buffer™</h3>
              <p className="text-gray-400">Adjust the sliders to see real-time breach predictions</p>
            </div>
            <ConsistencyCalculatorDemo />
          </div>

          {/* Strategy Matrix Demo */}
          <div>
            <div className="mb-8 text-center">
              <h3 className="mb-2 text-3xl text-white">Your Strategy Performance Dashboard</h3>
              <p className="text-gray-400">See which setups are making you money (sample data)</p>
            </div>
            <StrategyMatrixDemo />
          </div>
        </div>

        {/* Psychology Section with Image */}
        <div className="mt-16 grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="overflow-hidden rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-500/10">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1549925245-f20a1bac6454?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwc3ljaG9sb2d5JTIwZW1vdGlvbiUyMGJyYWluJTIwdmlzdWFsaXphdGlvbnxlbnwxfHx8fDE3NzQ4MjE1MjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Psychology Mapping"
                className="w-full"
              />
            </div>
          </div>
          <div>
            <div className="mb-4 inline-block rounded-full bg-purple-500/10 px-4 py-2">
              <span className="text-sm text-purple-400">🧠 Trading Psychology</span>
            </div>
            <h3 className="mb-4 text-3xl text-white">
              Master Your <span className="text-purple-400">Mental Game</span>
            </h3>
            <p className="mb-6 text-lg text-gray-400">
              Professional trading is 90% psychology. Our Emotion Mapping system helps you identify and eliminate destructive trading patterns before they breach your account.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-purple-400" />
                <p className="text-gray-300">Track emotional state for every trade (Confident, Anxious, Revenge, FOMO)</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-purple-400" />
                <p className="text-gray-300">See which emotions correlate with your biggest losses</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-purple-400" />
                <p className="text-gray-300">Auto-triggered "Cool Down Mode" after detecting revenge trading patterns</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-purple-400" />
                <p className="text-gray-300">Weekly psychological performance reports with actionable insights</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-6 py-20">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl text-white lg:text-5xl">
            Simple Pricing for <span className="text-[#00F2FE]">Serious Traders</span>
          </h2>
          <p className="text-xl text-gray-400">Choose the plan that fits your trading journey.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <PricingCard
            title="The Evaluator"
            subtitle="Perfect for getting started"
            price="$0"
            ctaText="Get Started Free"
            features={[
              "Basic trade tracking",
              "1 account limit",
              "Equity curve visualization",
              "Daily drawdown calculator",
              "Email support",
            ]}
          />
          <PricingCard
            title="The Funded Trader"
            subtitle="For serious prop traders"
            price="$29"
            isPopular={true}
            ctaText="Start Pro Trial"
            features={[
              "Psychology Journal & Emotion Mapping",
              "Trade Replay Gallery (screenshots)",
              "Consistency Buffer™ Calculator",
              "Strategy Win-Rate Matrix",
              "Multi-Firm Rule Profiles (15+ firms)",
              "Real-time breach alerts (Desktop/Discord)",
              "Unlimited accounts & MT4/5 sync",
              "Priority support",
            ]}
          />
          <PricingCard
            title="For Prop Firms/Groups"
            subtitle="Custom enterprise solution"
            price="Contact Us"
            ctaText="Talk to Sales"
            features={[
              "All Pro features included",
              "Admin dashboard panel",
              "Custom rule configuration",
              "White-label options",
              "Dedicated account manager",
              "API access",
              "Custom integrations",
            ]}
          />
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="py-20"
        style={{
          background: "linear-gradient(135deg, #1E2025 0%, #101217 100%)",
        }}
      >
        <div className="container mx-auto px-6 text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-4 text-5xl text-white lg:text-6xl">
              Ready to Pass Your <span className="text-[#00F2FE]">Next Evaluation?</span>
            </h2>
            <p className="mb-8 text-xl text-gray-400">
              Sign up today and get full analytics access for 7 days.
            </p>
            <button className="group rounded-lg bg-[#00F2FE] px-10 py-5 text-lg text-black shadow-lg shadow-[#00F2FE]/30 transition-all hover:scale-105 hover:bg-[#00D8E8] hover:shadow-[#00F2FE]/50">
              Secure Your Funded Account
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                →
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}