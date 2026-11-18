import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  MessageSquareCode, 
  ScanLine, 
  CalendarSync, 
  TrendingUp, 
  Gauge, 
  Sparkles,
  Plus,
  Menu,
  X,
  Wallet,
  Settings as SettingsIcon,
  User
} from 'lucide-react';
import { ShinyText } from './react-bits/ShinyText';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'sms', label: 'SMS & UPI', icon: MessageSquareCode, badge: 'Smart' },
  { id: 'receipts', label: 'Receipt OCR', icon: ScanLine, badge: 'AI' },
  { id: 'subscriptions', label: 'Subscriptions', icon: CalendarSync },
  { id: 'investments', label: 'Investments', icon: TrendingUp },
  { id: 'predictive', label: 'Predictive', icon: Gauge, badge: 'Run-Rate' },
  { id: 'ai-studio', label: 'AI Studio', icon: Sparkles },
  { id: 'profile', label: 'Profile', icon: User }
];

export const Navbar = ({ activeTab, onSelectTab, onOpenAddModal, onOpenSettings }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-slate-950/70 border-b border-white/[0.08] px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand & Logo + Left Side Settings Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSettings}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900 border border-white/10 hover:border-emerald-500/40 text-slate-300 hover:text-white transition-all cursor-pointer group"
            title="Open Settings"
          >
            <SettingsIcon className="w-5 h-5 group-hover:rotate-45 transition-transform text-slate-300 group-hover:text-emerald-400" />
          </button>

          <div 
            onClick={() => onSelectTab('dashboard')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight text-white font-sans">
                  Spendulum
                </span>
                <span className="px-1.5 py-0.5 text-[10px] uppercase font-mono font-semibold tracking-wider rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Intelligent Financial Engine
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Pill Navigation (React Bits Style) */}
        <nav className="hidden lg:flex items-center p-1.5 rounded-full bg-slate-900/80 border border-white/10 shadow-inner">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-white bg-emerald-500/20 border border-emerald-500/40 shadow-sm shadow-emerald-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                    isActive ? 'bg-emerald-400/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Actions & Mobile Toggle */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-xs tracking-wide shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Transaction</span>
          </button>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 pb-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => {
              onOpenSettings();
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium bg-slate-900/60 text-slate-300 hover:text-white border border-white/5 transition-colors cursor-pointer"
          >
            <SettingsIcon className="w-4 h-4 text-emerald-400" />
            <span>Settings</span>
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
