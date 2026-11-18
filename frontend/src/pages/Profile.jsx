import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  Edit3, 
  Wallet, 
  Briefcase, 
  Landmark, 
  Scale, 
  Sparkles, 
  Sliders, 
  Lock, 
  Copy, 
  Check, 
  TrendingUp, 
  FileText,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { SpotlightCard } from '../components/react-bits/SpotlightCard';
import { CountUp } from '../components/react-bits/CountUp';
import { FadeContent } from '../components/react-bits/FadeContent';
import { ShinyText } from '../components/react-bits/ShinyText';
import { api } from '../services/api';

export const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await api.getProfile();
      setProfile(res);
      setEditForm(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleCopyVpa = (vpa) => {
    navigator.clipboard.writeText(vpa);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await api.updateProfile(editForm);
      setProfile(editForm);
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      alert("Failed to save profile: " + e.message);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400">Loading financial profile & regional data...</p>
      </div>
    );
  }

  const emergencyPct = Math.round((profile.emergency_fund_current / profile.emergency_fund_target) * 100);

  return (
    <FadeContent className="space-y-6 pb-16">
      
      {/* Top Banner / Notification */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Financial persona, regional preferences, and salary baselines updated!</span>
          </div>
        </div>
      )}

      {/* Hero Profile Identity Card (SpotlightCard from React Bits) */}
      <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.2)" className="p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Avatar & Core Bio */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 p-1 shadow-2xl shadow-emerald-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
                  {profile.full_name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-slate-950 shadow-md">
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {profile.full_name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Spendulum Elite
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-white/5">
                  PAN: {profile.pan_mask}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                  Salaried Tech Professional
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {profile.city}
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {profile.email}
                </span>
              </div>

              {/* Primary UPI VPA Chip */}
              <div className="pt-1 flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-mono">Primary UPI:</span>
                <button
                  onClick={() => handleCopyVpa(profile.primary_upi_vpa)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-white/10 text-xs font-mono text-emerald-400 hover:border-emerald-500/40 transition-all cursor-pointer"
                  title="Click to Copy VPA"
                >
                  <span>{profile.primary_upi_vpa}</span>
                  {copiedVpa ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                </button>
              </div>
            </div>
          </div>

          {/* Edit Profile Action */}
          <div className="flex items-center gap-3 self-start lg:self-center">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-semibold text-xs tracking-wide shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Edit Profile & Baselines</span>
            </button>
          </div>

        </div>
      </SpotlightCard>

      {/* Financial Health & Income Blueprint Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Monthly In-Hand Salary */}
        <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.2)">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Monthly Take-Home</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            <CountUp to={profile.monthly_salary} prefix="₹" decimals={0} />
            <span className="text-xs font-normal text-slate-400">/mo</span>
          </div>
          <span className="block text-[11px] text-emerald-400 mt-2 font-mono">
            Direct salary credit on 1st
          </span>
        </SpotlightCard>

        {/* Annual CTC Package */}
        <SpotlightCard spotlightColor="rgba(52, 211, 153, 0.2)">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Annual CTC Package</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            <CountUp to={profile.annual_ctc} prefix="₹" decimals={0} />
          </div>
          <span className="block text-[11px] text-slate-400 mt-2 font-mono">
            ~₹{(profile.annual_ctc / 100000).toFixed(1)} Lakhs gross per annum
          </span>
        </SpotlightCard>

        {/* Emergency Fund */}
        <SpotlightCard spotlightColor="rgba(245, 158, 11, 0.2)">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Emergency Cushion</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            <CountUp to={profile.emergency_fund_current} prefix="₹" decimals={0} />
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Target: ₹{profile.emergency_fund_target.toLocaleString('en-IN')}</span>
            <span className="text-amber-400 font-bold">{emergencyPct}%</span>
          </div>
        </SpotlightCard>

        {/* Tax Regime */}
        <SpotlightCard spotlightColor="rgba(168, 85, 247, 0.2)">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Income Tax Regime</span>
            <Scale className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-bold text-white mt-1 leading-snug">
            {profile.tax_regime}
          </div>
          <span className="block text-[11px] text-purple-300 mt-2 font-mono">
            Standard ₹75,000 deduction active
          </span>
        </SpotlightCard>

      </div>

      {/* Detailed 2-Column Section: Banking Stack & Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Indian Banking & UPI Ecosystem */}
        <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-white text-base">
                Banking & UPI Ecosystem
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">4 Accounts Linked</span>
          </div>

          <div className="space-y-3">
            {[
              {
                bank: 'HDFC Bank Ltd',
                role: 'Primary Salary Account',
                account: 'A/c ending in 4921',
                ifsc: 'HDFC0001234 (Indiranagar, BLR)',
                vpa: 'aarav.sharma@okhdfcbank',
                isPrimary: true
              },
              {
                bank: 'State Bank of India',
                role: 'Secondary / Wealth SIPs',
                account: 'A/c ending in 1084',
                ifsc: 'SBIN0004567 (Koramangala, BLR)',
                vpa: 'aarav.sharma@sbi',
                isPrimary: false
              },
              {
                bank: 'ICICI Bank Credit Card',
                role: 'Amazon Pay & Lifestyle Card',
                account: 'Card ending in 3021',
                ifsc: 'Limit: ₹2,50,000',
                vpa: 'Auto-Debit Active',
                isPrimary: false
              },
              {
                bank: 'Axis Bank Credit Card',
                role: 'Fuel & Travel Rewards Card',
                account: 'Card ending in 7829',
                ifsc: 'Limit: ₹1,80,000',
                vpa: 'Auto-Debit Active',
                isPrimary: false
              }
            ].map((acc, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{acc.bank}</span>
                    {acc.isPrimary && (
                      <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Primary Salary
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">{acc.account}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-0.5">
                  <span>{acc.role}</span>
                  <span className="text-slate-300">{acc.vpa}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Regional Preferences & AI Engine Tuning */}
        <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-teal-400" />
              <h3 className="font-semibold text-white text-base">
                Regional & AI Tuning Standards
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-400">On-Device Active</span>
          </div>

          <div className="space-y-3.5 text-xs">
            
            <div className="p-3 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Currency & Symbol</span>
                <span className="text-[11px] text-slate-400">Indian Rupee standard</span>
              </div>
              <span className="font-mono text-emerald-400 font-bold">{profile.currency}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Number System</span>
                <span className="text-[11px] text-slate-400">Format: 1,00,000 / 1,00,00,000</span>
              </div>
              <span className="font-mono text-slate-200">{profile.number_format}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Financial Year Cycle</span>
                <span className="text-[11px] text-slate-400">Indian tax assessment year</span>
              </div>
              <span className="font-mono text-slate-200">{profile.financial_year}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">AI Decision Confidence</span>
                <span className="text-[11px] text-slate-400">Linear SVM Decision Threshold</span>
              </div>
              <span className="font-mono text-cyan-400">{profile.ai_threshold}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Privacy & Storage Mode</span>
                <span className="text-[11px] text-slate-400">Zero telemetry, local disk storage</span>
              </div>
              <span className="font-mono text-emerald-400 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                {profile.data_storage_mode}
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* Edit Profile & Baselines Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-white text-base mb-1">
              Edit Financial Profile & Baselines
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Configure personal details, salary baselines, and Indian banking credentials
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.full_name || ''}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">City & State</label>
                  <input
                    type="text"
                    value={editForm.city || ''}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">PAN Card Mask</label>
                  <input
                    type="text"
                    value={editForm.pan_mask || ''}
                    onChange={(e) => setEditForm({ ...editForm, pan_mask: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Primary UPI VPA</label>
                  <input
                    type="text"
                    value={editForm.primary_upi_vpa || ''}
                    onChange={(e) => setEditForm({ ...editForm, primary_upi_vpa: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Monthly Salary (₹ In-Hand)</label>
                  <input
                    type="number"
                    step="1000"
                    value={editForm.monthly_salary || 0}
                    onChange={(e) => setEditForm({ ...editForm, monthly_salary: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Annual CTC Package (₹)</label>
                  <input
                    type="number"
                    step="50000"
                    value={editForm.annual_ctc || 0}
                    onChange={(e) => setEditForm({ ...editForm, annual_ctc: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Income Tax Regime</label>
                  <select
                    value={editForm.tax_regime || 'New Tax Regime (Sec 115BAC)'}
                    onChange={(e) => setEditForm({ ...editForm, tax_regime: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="New Tax Regime (Sec 115BAC)">New Tax Regime (Sec 115BAC)</option>
                    <option value="Old Tax Regime with 80C Deductions">Old Tax Regime with 80C Deductions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Emergency Fund Target (₹)</label>
                  <input
                    type="number"
                    step="10000"
                    value={editForm.emergency_fund_target || 0}
                    onChange={(e) => setEditForm({ ...editForm, emergency_fund_target: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </FadeContent>
  );
};

export default Profile;
