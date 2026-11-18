import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Trash2, 
  Edit3, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  Landmark, 
  Coins, 
  Gem,
  Briefcase
} from 'lucide-react';
import { SpotlightCard } from '../components/react-bits/SpotlightCard';
import { CountUp } from '../components/react-bits/CountUp';
import { FadeContent } from '../components/react-bits/FadeContent';
import { api } from '../services/api';

const ASSET_CLASSES = [
  "Mutual Fund",
  "Stock",
  "Fixed Deposit",
  "Gold",
  "EPF/PPF",
  "Crypto",
  "Real Estate"
];

export const Investments = () => {
  const [data, setData] = useState({
    holdings: [],
    total_invested: 0,
    total_current_value: 0,
    total_unrealized_gain: 0,
    gain_percentage: 0,
    monthly_sip_commitment: 0,
    asset_allocation: []
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [assetClass, setAssetClass] = useState('Mutual Fund');
  const [investedAmount, setInvestedAmount] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [monthlySip, setMonthlySip] = useState('0');
  const [institution, setInstitution] = useState('Groww');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getInvestments();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !investedAmount || !currentValue) return;

    try {
      await api.addInvestment({
        name: name.trim(),
        asset_class: assetClass,
        invested_amount: parseFloat(investedAmount),
        current_value: parseFloat(currentValue),
        monthly_sip: parseFloat(monthlySip) || 0.0,
        institution
      });
      setShowAddModal(false);
      setName('');
      setInvestedAmount('');
      setCurrentValue('');
      loadData();
    } catch (e) {
      alert("Failed to add holding: " + e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this investment asset?")) return;
    try {
      await api.deleteInvestment(id);
      loadData();
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  };

  return (
    <FadeContent className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Investments & Net Worth
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Track portfolio valuation, monthly SIPs, and capital asset distribution
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-semibold text-xs tracking-wide shadow-lg shadow-emerald-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Asset</span>
        </button>
      </div>

      {/* Portfolio Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Current Portfolio */}
        <SpotlightCard spotlightColor="rgba(6, 182, 212, 0.2)">
          <span className="block text-xs text-slate-400 mb-1">Portfolio Valuation</span>
          <div className="text-2xl lg:text-3xl font-bold text-white font-mono">
            <CountUp to={data.total_current_value} prefix="₹" decimals={0} />
          </div>
          <span className="block text-[11px] text-cyan-400 mt-2 font-mono">
            Current market liquidation value
          </span>
        </SpotlightCard>

        {/* Total Capital Invested */}
        <SpotlightCard spotlightColor="rgba(100, 116, 139, 0.2)">
          <span className="block text-xs text-slate-400 mb-1">Cost Basis (Invested)</span>
          <div className="text-2xl lg:text-3xl font-bold text-slate-200 font-mono">
            <CountUp to={data.total_invested} prefix="₹" decimals={0} />
          </div>
          <span className="block text-[11px] text-slate-400 mt-2 font-mono">
            Total principal deposited
          </span>
        </SpotlightCard>

        {/* Unrealized Gain */}
        <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.2)">
          <span className="block text-xs text-slate-400 mb-1">Unrealized Growth</span>
          <div className="text-2xl lg:text-3xl font-bold text-emerald-400 font-mono">
            <CountUp to={data.total_unrealized_gain} prefix="+₹" decimals={0} />
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
            <span className="text-emerald-400 font-bold font-mono">
              +{data.gain_percentage}%
            </span>
            <span className="text-slate-400">overall return</span>
          </div>
        </SpotlightCard>

        {/* Monthly SIP Commitment */}
        <SpotlightCard spotlightColor="rgba(245, 158, 11, 0.2)">
          <span className="block text-xs text-slate-400 mb-1">Monthly SIP Flow</span>
          <div className="text-2xl lg:text-3xl font-bold text-amber-400 font-mono">
            <CountUp to={data.monthly_sip_commitment} prefix="₹" decimals={0} />
          </div>
          <span className="block text-[11px] text-slate-400 mt-2">
            Auto-invested monthly across funds
          </span>
        </SpotlightCard>

      </div>

      {/* Asset Allocation Breakdown */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-white text-sm">Asset Class Diversification</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">{data.asset_allocation.length} Asset Classes</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {data.asset_allocation.map((al) => (
            <div key={al.asset_class} className="p-3.5 rounded-xl bg-slate-950/80 border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: al.color }} />
                <span>{al.asset_class}</span>
              </div>
              <div className="text-sm font-bold text-white font-mono">
                ₹{al.value.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {al.percentage}% of portfolio
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Holdings Registry Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-semibold text-white text-sm">Detailed Holdings</h3>
          <span className="text-xs text-slate-400">{data.holdings.length} assets recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/40 text-[10px] font-mono uppercase text-slate-400">
                <th className="py-3 px-4">Asset / Fund</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Platform</th>
                <th className="py-3 px-4 text-right">Invested (₹)</th>
                <th className="py-3 px-4 text-right">Current (₹)</th>
                <th className="py-3 px-4 text-right">Gain / ROI</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {data.holdings.map((h) => {
                const gain = h.current_value - h.invested_amount;
                const gainPct = h.invested_amount > 0 ? (gain / h.invested_amount * 100).toFixed(1) : '0.0';
                const isPositive = gain >= 0;

                return (
                  <tr key={h.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 text-white font-sans font-semibold">
                      {h.name}
                      {h.monthly_sip > 0 && (
                        <span className="ml-2 text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20">
                          SIP ₹{h.monthly_sip}/mo
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-sans">
                      {h.asset_class}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-sans">
                      {h.institution || '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300">
                      ₹{h.invested_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right text-white font-bold">
                      ₹{h.current_value.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center gap-0.5 font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? '+' : ''}₹{gain.toLocaleString('en-IN')} ({gainPct}%)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(h.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Holding Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl">
            <h3 className="font-semibold text-white text-base mb-4">
              Add Investment Holding
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Asset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parag Parikh Flexi Cap Fund, HDFC Bank Equity"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Asset Class</label>
                  <select
                    value={assetClass}
                    onChange={(e) => setAssetClass(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-500"
                  >
                    {ASSET_CLASSES.map((ac) => (
                      <option key={ac} value={ac}>{ac}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Platform / Broker</label>
                  <input
                    type="text"
                    placeholder="e.g. Zerodha, Groww, INDmoney"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Invested Principal (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="50000"
                    value={investedAmount}
                    onChange={(e) => setInvestedAmount(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Current Valuation (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="62000"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Monthly SIP (₹) (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="5000"
                  value={monthlySip}
                  onChange={(e) => setMonthlySip(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  Record Holding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </FadeContent>
  );
};

export default Investments;
