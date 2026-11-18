import React, { useEffect, useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  PiggyBank, 
  Gauge, 
  Sparkles, 
  ChevronRight,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Receipt,
  ScanLine,
  MessageSquareCode
} from 'lucide-react';
import { SpotlightCard } from '../components/react-bits/SpotlightCard';
import { CountUp } from '../components/react-bits/CountUp';
import { FadeContent } from '../components/react-bits/FadeContent';
import { ShinyText } from '../components/react-bits/ShinyText';
import { api } from '../services/api';

export const Dashboard = ({ onNavigate, onOpenAddModal }) => {
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [trends, setTrends] = useState({ monthly: [], daily: [] });
  const [insights, setInsights] = useState([]);
  const [predictive, setPredictive] = useState(null);
  const [recentTxns, setRecentTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reseeding, setReseeding] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumRes, catRes, trRes, inRes, predRes, txnRes] = await Promise.all([
        api.getSummary(),
        api.getCategories(),
        api.getTrends(),
        api.getInsights(),
        api.getPredictive(),
        api.getTransactions({ limit: 5 })
      ]);
      setSummary(sumRes);
      setCategories(catRes);
      setTrends(trRes);
      setInsights(inRes);
      setPredictive(predRes);
      setRecentTxns(txnRes.items || []);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReseed = async () => {
    if (!window.confirm("Reseed sample transactions to showcase realistic Indian tech employee finances?")) return;
    try {
      setReseeding(true);
      await api.reseedData();
      await loadData();
    } catch (e) {
      alert("Reseed failed: " + e.message);
    } finally {
      setReseeding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400">Loading financial dashboard...</p>
      </div>
    );
  }

  const netCashflow = summary?.net_cashflow || 0;
  const isNetPositive = netCashflow >= 0;

  return (
    <FadeContent className="space-y-8 pb-12">
      
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-900/40 border border-emerald-500/20 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Financial Cockpit
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time tracking, AI categorization, and predictive run-rate forecasting.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleReseed}
            disabled={reseeding}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 text-xs font-medium transition-all cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${reseeding ? 'animate-spin' : ''}`} />
            <span>{reseeding ? 'Reseeding...' : 'Reseed Demo'}</span>
          </button>

          <button
            onClick={() => onNavigate('sms')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 text-xs font-medium transition-all cursor-pointer"
          >
            <MessageSquareCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>Paste SMS</span>
          </button>
        </div>
      </div>

      {/* Hero Metric Cards (SpotlightCard from React Bits) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Net Cash Flow */}
        <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.2)">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Net Cash Flow</span>
            <div className={`p-1.5 rounded-lg ${isNetPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-white font-mono">
            <CountUp 
              to={Math.abs(netCashflow)} 
              prefix={isNetPositive ? "₹" : "-₹"} 
              decimals={0} 
            />
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-slate-400">
            <span className={isNetPositive ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
              {isNetPositive ? '+Positive' : '-Deficit'}
            </span>
            <span>surplus this period</span>
          </div>
        </SpotlightCard>

        {/* Total Income */}
        <SpotlightCard spotlightColor="rgba(52, 211, 153, 0.2)">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Inflow</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-white font-mono">
            <CountUp to={summary?.total_income || 0} prefix="₹" decimals={0} />
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-slate-400">
            <span className="text-emerald-400 font-medium">Salary & Credits</span>
          </div>
        </SpotlightCard>

        {/* Total Expenses */}
        <SpotlightCard spotlightColor="rgba(244, 63, 94, 0.2)">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Outflow</span>
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-white font-mono">
            <CountUp to={summary?.total_expense || 0} prefix="₹" decimals={0} />
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-slate-400">
            <span className="text-slate-400">Across {summary?.transaction_count || 0} transactions</span>
          </div>
        </SpotlightCard>

        {/* Savings Rate */}
        <SpotlightCard spotlightColor="rgba(245, 158, 11, 0.2)">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Savings Discipline</span>
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-white font-mono">
            <CountUp to={summary?.savings_rate || 0} suffix="%" decimals={1} />
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-slate-400">
            <span className="text-amber-400 font-medium">Target: ≥20%</span>
            <span>of monthly income</span>
          </div>
        </SpotlightCard>
      </div>

      {/* Predictive Run-Rate & Velocity Widget */}
      {predictive && (
        <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.15)" className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
                  <Gauge className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-white text-base">
                  Predictive Spend Velocity ({predictive.month})
                </h3>
                <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                  predictive.overall_status === 'Safe' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : predictive.overall_status === 'Warning'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {predictive.overall_status} Run-Rate
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                You are spending an average of <strong className="text-white font-mono">₹{predictive.daily_velocity.toLocaleString('en-IN')}/day</strong>. At this pace, your projected month-end outflow will be <strong className="text-emerald-400 font-mono">₹{predictive.projected_month_end.toLocaleString('en-IN')}</strong> against a limit of ₹{predictive.total_budget.toLocaleString('en-IN')}.
              </p>
            </div>

            {/* Velocity Visual Indicators */}
            <div className="flex items-center gap-6 sm:gap-8 self-start lg:self-center">
              <div>
                <span className="block text-[11px] text-slate-400 uppercase tracking-wider font-mono">Daily Pace</span>
                <span className="text-xl font-bold font-mono text-white">
                  ₹{predictive.daily_velocity.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <span className="block text-[11px] text-slate-400 uppercase tracking-wider font-mono">Projected Total</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  ₹{predictive.projected_month_end.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <span className="block text-[11px] text-slate-400 uppercase tracking-wider font-mono">Month Elapsed</span>
                <span className="text-xl font-bold font-mono text-slate-200">
                  {predictive.days_elapsed} / {predictive.total_days}d
                </span>
              </div>
            </div>

          </div>

          {/* Progress bar */}
          <div className="mt-5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Budget Utilization Forecast</span>
              <span className={predictive.projected_vs_budget_pct > 100 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                {predictive.projected_vs_budget_pct}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  predictive.projected_vs_budget_pct > 100 
                    ? 'bg-rose-500' 
                    : predictive.projected_vs_budget_pct > 85 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(predictive.projected_vs_budget_pct, 100)}%` }}
              />
            </div>
          </div>
        </SpotlightCard>
      )}

      {/* Main Grid: Categories Breakdown & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Breakdown (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/60 border border-white/10 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-white text-base">Expense Distribution</h3>
              <p className="text-xs text-slate-400">Categorical spending allocation</p>
            </div>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {categories.slice(0, 6).map((cat) => (
              <div key={cat.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: cat.color }} 
                    />
                    <span className="text-slate-200 font-medium">{cat.category}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-white font-semibold">₹{cat.amount.toLocaleString('en-IN')}</span>
                    <span className="text-slate-400 text-[11px] w-12 text-right">{cat.percentage}%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Launch & Smart Insights (1 Col) */}
        <div className="space-y-4">
          
          {/* Quick Launch Tiles */}
          <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-5 backdrop-blur-xl space-y-3">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider font-mono text-slate-400">
              Quick Launch Tools
            </h4>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => onNavigate('sms')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-white/5 hover:border-emerald-500/30 text-center transition-all group cursor-pointer"
              >
                <MessageSquareCode className="w-5 h-5 text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-white">SMS Parser</span>
                <span className="text-[10px] text-slate-500">Auto-detect</span>
              </button>

              <button
                onClick={() => onNavigate('receipts')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-white/5 hover:border-emerald-500/30 text-center transition-all group cursor-pointer"
              >
                <ScanLine className="w-5 h-5 text-teal-400 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-white">Receipt OCR</span>
                <span className="text-[10px] text-slate-500">Scan & Itemize</span>
              </button>

              <button
                onClick={() => onNavigate('subscriptions')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-white/5 hover:border-emerald-500/30 text-center transition-all group cursor-pointer"
              >
                <RotateCcw className="w-5 h-5 text-amber-400 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-white">Subscriptions</span>
                <span className="text-[10px] text-slate-500">Cycle alerts</span>
              </button>

              <button
                onClick={() => onNavigate('investments')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-white/5 hover:border-emerald-500/30 text-center transition-all group cursor-pointer"
              >
                <TrendingUp className="w-5 h-5 text-cyan-400 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-white">Investments</span>
                <span className="text-[10px] text-slate-500">Net worth</span>
              </button>
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/50 border border-emerald-500/20 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h4 className="font-semibold text-white text-xs uppercase tracking-wider font-mono">
                AI Observations
              </h4>
            </div>

            <div className="space-y-2.5">
              {insights.map((ins, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs space-y-1">
                  <span className="font-semibold text-emerald-300 block">{ins.title}</span>
                  <p className="text-slate-400 leading-relaxed text-[11px]">{ins.description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Recent Transactions List */}
      <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-white text-base">Recent Activity</h3>
            <p className="text-xs text-slate-400">Latest synced bank, card, and UPI movements</p>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
          >
            <span>All Transactions</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-white/5">
          {recentTxns.map((t) => {
            const isExpense = t.type.toLowerCase() === 'expense';
            return (
              <div key={t.transaction_id} className="py-3.5 flex items-center justify-between gap-4 group">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isExpense ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {isExpense ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      {t.description}
                    </h5>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono">
                      <span>{t.date}</span>
                      <span>•</span>
                      <span className="text-slate-300">{t.category}</span>
                      <span>•</span>
                      <span className="text-emerald-400/80">{t.prediction_source}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className={`text-sm font-bold ${isExpense ? 'text-white' : 'text-emerald-400'}`}>
                    {isExpense ? '-' : '+'}₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </FadeContent>
  );
};

export default Dashboard;
