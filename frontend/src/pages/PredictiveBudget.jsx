import React, { useState, useEffect } from 'react';
import { 
  Gauge, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Calendar, 
  ShieldAlert, 
  Sliders, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { SpotlightCard } from '../components/react-bits/SpotlightCard';
import { CountUp } from '../components/react-bits/CountUp';
import { FadeContent } from '../components/react-bits/FadeContent';
import { api } from '../services/api';

export const PredictiveBudget = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetValues, setBudgetValues] = useState({});

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getPredictive();
      setData(res);

      // Prepopulate budget editor
      const bMap = {};
      res.category_pacing.forEach((cp) => {
        bMap[cp.category] = cp.budget_limit;
      });
      bMap["_monthly_total"] = res.total_budget;
      setBudgetValues(bMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveBudgets = async (e) => {
    e.preventDefault();
    try {
      await api.updateBudgets(budgetValues);
      setEditingBudget(false);
      loadData();
    } catch (e) {
      alert("Failed to update budgets: " + e.message);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400">Computing real-time velocity metrics...</p>
      </div>
    );
  }

  const isCritical = data.overall_status === 'Critical';
  const isWarning = data.overall_status === 'Warning';

  return (
    <FadeContent className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Predictive Budgeting & Run-Rate
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Real-time daily velocity tracking and end-of-month financial trajectory forecast
            </p>
          </div>
        </div>

        <button
          onClick={() => setEditingBudget(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer self-start sm:self-auto"
        >
          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
          <span>Adjust Budget Limits</span>
        </button>
      </div>

      {/* Hero Projection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Daily Velocity */}
        <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.2)">
          <span className="block text-xs text-slate-400 mb-1">Daily Spend Velocity</span>
          <div className="text-2xl lg:text-3xl font-bold text-white font-mono">
            <CountUp to={data.daily_velocity} prefix="₹" decimals={0} />
            <span className="text-xs text-slate-400 font-normal">/day</span>
          </div>
          <span className="block text-[11px] text-emerald-400 mt-2 font-mono">
            Avg speed across {data.days_elapsed} days elapsed
          </span>
        </SpotlightCard>

        {/* Projected Month-End */}
        <SpotlightCard spotlightColor={isCritical ? "rgba(244, 63, 94, 0.2)" : "rgba(52, 211, 153, 0.2)"}>
          <span className="block text-xs text-slate-400 mb-1">Projected Month-End</span>
          <div className={`text-2xl lg:text-3xl font-bold font-mono ${isCritical ? 'text-rose-400' : 'text-emerald-400'}`}>
            <CountUp to={data.projected_month_end} prefix="₹" decimals={0} />
          </div>
          <span className="block text-[11px] text-slate-400 mt-2 font-mono">
            At current velocity for {data.days_remaining} remaining days
          </span>
        </SpotlightCard>

        {/* Total Monthly Limit */}
        <SpotlightCard spotlightColor="rgba(100, 116, 139, 0.2)">
          <span className="block text-xs text-slate-400 mb-1">Configured Monthly Limit</span>
          <div className="text-2xl lg:text-3xl font-bold text-slate-200 font-mono">
            <CountUp to={data.total_budget} prefix="₹" decimals={0} />
          </div>
          <span className="block text-[11px] text-slate-400 mt-2 font-mono">
            Target envelope for {data.month}
          </span>
        </SpotlightCard>

        {/* Projected Utilization */}
        <SpotlightCard spotlightColor={isCritical ? "rgba(244, 63, 94, 0.2)" : "rgba(245, 158, 11, 0.2)"}>
          <span className="block text-xs text-slate-400 mb-1">Utilization Forecast</span>
          <div className={`text-2xl lg:text-3xl font-bold font-mono ${
            isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            <CountUp to={data.projected_vs_budget_pct} suffix="%" decimals={1} />
          </div>
          <div className="flex items-center gap-1 mt-2 text-[11px] font-mono">
            <span className={`font-semibold ${isCritical ? 'text-rose-400' : 'text-emerald-400'}`}>
              {data.overall_status} Status
            </span>
          </div>
        </SpotlightCard>

      </div>

      {/* Proactive Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900/60 border border-emerald-500/20 backdrop-blur-xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider font-mono">
            <Sparkles className="w-4 h-4" />
            <span>AI Predictive Advisory</span>
          </div>
          {data.recommendations.map((rec, i) => (
            <p key={i} className="text-xs text-slate-300 leading-relaxed">
              • {rec}
            </p>
          ))}
        </div>
      )}

      {/* Category Pacing Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white text-sm">Category Pacing Breakdown</h3>
            <p className="text-xs text-slate-400">Current spend velocity vs assigned category caps</p>
          </div>
          <span className="text-xs font-mono text-slate-400">Sorted by risk level</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/40 text-[10px] font-mono uppercase text-slate-400">
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Limit (₹)</th>
                <th className="py-3 px-4 text-right">Spent (₹)</th>
                <th className="py-3 px-4 text-right">Velocity (₹/day)</th>
                <th className="py-3 px-4 text-right">Projected (₹)</th>
                <th className="py-3 px-4 text-right">Forecast %</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {data.category_pacing.map((cp) => {
                const isCrit = cp.status === 'Critical';
                const isWarn = cp.status === 'Warning';

                return (
                  <tr key={cp.category} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 text-white font-sans font-semibold">
                      {cp.category}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      ₹{cp.budget_limit.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-200">
                      ₹{cp.spent.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300">
                      ₹{cp.daily_velocity.toLocaleString('en-IN')}
                    </td>
                    <td className={`py-3 px-4 text-right font-bold ${
                      isCrit ? 'text-rose-400' : isWarn ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      ₹{cp.projected.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-bold">
                      {cp.pacing_pct}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        isCrit
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : isWarn
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                      }`}>
                        {cp.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Anomalies Section */}
      {data.anomalies && data.anomalies.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-rose-500/20 backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h3 className="font-semibold text-white text-sm">
              Detected Spending Outliers & Anomalies ({data.anomalies.length})
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Transactions that exceed 2.5x the typical category average for this billing cycle:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.anomalies.map((anom, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white truncate max-w-[180px]">{anom.description}</span>
                  <span className="text-rose-400 font-bold font-mono">₹{anom.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Avg: ₹{anom.avg_category_amount}</span>
                  <span className="px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-300">
                    {anom.multiplier}x Spike
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Adjustment Modal */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <h3 className="font-semibold text-white text-base mb-1">
              Configure Monthly Category Limits
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Set monthly spending thresholds to power predictive pacing calculations
            </p>

            <form onSubmit={handleSaveBudgets} className="space-y-3">
              {Object.keys(budgetValues).map((cat) => (
                <div key={cat} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-950 border border-white/5">
                  <label className="text-xs font-medium text-slate-300">
                    {cat === '_monthly_total' ? 'Overall Monthly Total' : cat}
                  </label>
                  <div className="relative w-36">
                    <span className="absolute left-3 top-2 text-slate-500 text-xs font-mono">₹</span>
                    <input
                      type="number"
                      step="100"
                      value={budgetValues[cat]}
                      onChange={(e) => setBudgetValues({ ...budgetValues, [cat]: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-6 pr-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingBudget(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  Save New Limits
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </FadeContent>
  );
};

export default PredictiveBudget;
