import React, { useState, useEffect } from 'react';
import { 
  CalendarSync, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Tv, 
  Music, 
  Wifi, 
  Activity, 
  ShoppingBag, 
  Cloud, 
  CreditCard,
  PauseCircle,
  PlayCircle
} from 'lucide-react';
import { SpotlightCard } from '../components/react-bits/SpotlightCard';
import { CountUp } from '../components/react-bits/CountUp';
import { FadeContent } from '../components/react-bits/FadeContent';
import { api } from '../services/api';

const ICONS = {
  Tv,
  Music,
  Wifi,
  Activity,
  ShoppingBag,
  Cloud,
  CreditCard
};

export const Subscriptions = () => {
  const [data, setData] = useState({ subscriptions: [], total_active: 0, total_monthly_drain: 0, renewing_soon_count: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New subscription form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Entertainment');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [nextRenewalDate, setNextRenewalDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('UPI Autopay');
  const [icon, setIcon] = useState('Tv');
  const [notes, setNotes] = useState('');

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await api.getSubscriptions();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;

    try {
      await api.addSubscription({
        name: name.trim(),
        category,
        amount: parseFloat(amount),
        billing_cycle: billingCycle,
        next_renewal_date: nextRenewalDate,
        payment_method: paymentMethod,
        icon,
        notes
      });
      setShowAddModal(false);
      setName('');
      setAmount('');
      loadSubscriptions();
    } catch (e) {
      alert("Failed to add subscription: " + e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this recurring subscription?")) return;
    try {
      await api.deleteSubscription(id);
      loadSubscriptions();
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  };

  const handleToggleStatus = async (sub) => {
    const newStatus = sub.status === 'active' ? 'paused' : 'active';
    try {
      await api.updateSubscription(sub.id, { status: newStatus });
      loadSubscriptions();
    } catch (e) {
      alert("Status update failed: " + e.message);
    }
  };

  return (
    <FadeContent className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
            <CalendarSync className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Subscriptions & Recurring Bills
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Manage autopays, renewal schedules, and total monthly recurring drain
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-semibold text-xs tracking-wide shadow-lg shadow-emerald-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Subscription</span>
        </button>
      </div>

      {/* Summary Spotlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <SpotlightCard spotlightColor="rgba(168, 85, 247, 0.2)">
          <span className="block text-xs text-slate-400 mb-1">Monthly Recurring Burn</span>
          <div className="text-2xl lg:text-3xl font-bold text-white font-mono">
            <CountUp to={data.total_monthly_drain} prefix="₹" decimals={0} />
          </div>
          <span className="block text-[11px] text-slate-400 mt-2 font-mono">
            Normalized across monthly & annual plans
          </span>
        </SpotlightCard>

        <SpotlightCard spotlightColor="rgba(52, 211, 153, 0.2)">
          <span className="block text-xs text-slate-400 mb-1">Active Subscriptions</span>
          <div className="text-2xl lg:text-3xl font-bold text-emerald-400 font-mono">
            <CountUp to={data.total_active} decimals={0} />
          </div>
          <span className="block text-[11px] text-slate-400 mt-2">
            Autopays active in current cycle
          </span>
        </SpotlightCard>

        <SpotlightCard spotlightColor="rgba(245, 158, 11, 0.2)">
          <span className="block text-xs text-slate-400 mb-1">Due within 7 Days</span>
          <div className="text-2xl lg:text-3xl font-bold text-amber-400 font-mono">
            <CountUp to={data.renewing_soon_count} decimals={0} />
          </div>
          <span className="block text-[11px] text-slate-400 mt-2">
            Upcoming renewals scheduled
          </span>
        </SpotlightCard>

      </div>

      {/* Subscriptions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.subscriptions.map((sub) => {
          const IconComp = ICONS[sub.icon] || CreditCard;
          const isPaused = sub.status === 'paused';
          const isDueSoon = sub.days_until_renewal !== null && sub.days_until_renewal <= 5 && !isPaused;

          return (
            <SpotlightCard 
              key={sub.id} 
              spotlightColor={isPaused ? "rgba(100, 116, 139, 0.15)" : "rgba(168, 85, 247, 0.18)"}
              className={`p-5 relative ${isPaused ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/20">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">
                      {sub.name}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {sub.payment_method}
                    </span>
                  </div>
                </div>

                {/* Status / Countdown Badge */}
                {isPaused ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                    Paused
                  </span>
                ) : isDueSoon ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 animate-pulse">
                    <Clock className="w-3 h-3" /> Due in {sub.days_until_renewal}d
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                    Renews in {sub.days_until_renewal}d
                  </span>
                )}
              </div>

              {/* Price & Billing Cycle */}
              <div className="flex items-baseline justify-between pt-2 border-t border-white/5">
                <div>
                  <span className="text-xl font-bold font-mono text-white">
                    ₹{sub.amount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-400 font-mono ml-1">
                    /{sub.billing_cycle === 'yearly' ? 'year' : 'mo'}
                  </span>
                </div>

                <span className="text-[11px] text-slate-400 font-mono">
                  Next: {sub.next_renewal_date}
                </span>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-xs text-slate-400">
                <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                  {sub.notes || sub.category}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(sub)}
                    className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title={isPaused ? "Resume Autopay" : "Pause Subscription"}
                  >
                    {isPaused ? <PlayCircle className="w-4 h-4 text-emerald-400" /> : <PauseCircle className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleDelete(sub.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </SpotlightCard>
          );
        })}
      </div>

      {/* Add Subscription Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl">
            <h3 className="font-semibold text-white text-base mb-4">
              Add Recurring Subscription
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Disney+ Hotstar, Cult.fit, Broadband"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="499"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Billing Cycle</label>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Next Renewal Date</label>
                  <input
                    type="date"
                    required
                    value={nextRenewalDate}
                    onChange={(e) => setNextRenewalDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="UPI Autopay">UPI Autopay</option>
                    <option value="HDFC Credit Card">HDFC Credit Card</option>
                    <option value="ICICI NetBanking">ICICI NetBanking</option>
                    <option value="SBI Debit Card">SBI Debit Card</option>
                    <option value="Standing Instruction">Standing Instruction</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Icon Theme</label>
                <div className="grid grid-cols-6 gap-2">
                  {Object.keys(ICONS).map((k) => {
                    const Comp = ICONS[k];
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setIcon(k)}
                        className={`p-2 rounded-xl border flex items-center justify-center ${
                          icon === k ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-slate-950 border-white/5 text-slate-400'
                        }`}
                      >
                        <Comp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 text-white font-bold text-xs shadow-lg shadow-purple-500/20 cursor-pointer"
                >
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </FadeContent>
  );
};

export default Subscriptions;
