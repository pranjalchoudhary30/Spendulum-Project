import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Search, 
  ChevronRight, 
  Wallet, 
  Settings as SettingsIcon, 
  Repeat, 
  Ticket, 
  User, 
  Gift, 
  HelpCircle, 
  ShieldCheck, 
  Moon, 
  ArrowLeft,
  Check,
  Download,
  Database,
  Lock,
  Smartphone,
  CreditCard,
  Bell,
  Sparkles
} from 'lucide-react';
import { SpotlightCard } from './react-bits/SpotlightCard';
import { api } from '../services/api';

export const SettingsDrawer = ({ isOpen, onClose, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState(null);
  const [settings, setSettings] = useState({
    currency: "INR",
    currency_symbol: "₹",
    date_format: "DD-MM-YYYY",
    number_system: "Indian (Lakhs / Crores)",
    run_rate_alert_threshold: "85",
    auto_learn_ai: "true",
    security_shield_active: "true",
    dark_mode: "obsidian",
    upi_primary_vpa: "user@hdfcbank"
  });
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getSettings().then(setSettings).catch(console.error);
    }
  }, [isOpen]);

  const handleUpdate = async (key, val) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    try {
      await api.updateSettings({ [key]: val });
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Setting items matching the user's reference screenshot layout
  const SETTING_ITEMS = [
    {
      id: 'pocket-money',
      title: 'Pocket Money',
      badge: 'New',
      badgeColor: 'bg-amber-400 text-slate-950',
      subtitle: 'Give your dependents UPI access with UPI Circle — fully under your control',
      icon: (
        <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/20 text-amber-400 flex items-center justify-center">
          <Wallet className="w-5 h-5" />
        </div>
      ),
      action: () => setActiveSubMenu('pocket-money')
    },
    {
      id: 'upi-payments',
      title: 'UPI & Payment Settings',
      subtitle: 'UPI PIN, Bank Accounts & more',
      icon: (
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <SettingsIcon className="w-5 h-5" />
        </div>
      ),
      action: () => setActiveSubMenu('upi-payments')
    },
    {
      id: 'automatic-payments',
      title: 'Automatic Payments',
      subtitle: 'Manage all your UPI Automatic Payments',
      icon: (
        <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/20 text-teal-400 flex items-center justify-center">
          <Repeat className="w-5 h-5" />
        </div>
      ),
      action: () => {
        onClose();
        onNavigate('subscriptions');
      }
    },
    {
      id: 'orders-bookings',
      title: 'Orders & Bookings',
      subtitle: 'Payments, Recharge, Travel & Others',
      icon: (
        <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
          <Ticket className="w-5 h-5" />
        </div>
      ),
      action: () => {
        onClose();
        onNavigate('transactions');
      }
    },
    {
      id: 'profile',
      title: 'Profile & Regional',
      subtitle: 'Currency, Indian Number System & Data',
      icon: (
        <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/20 text-blue-400 flex items-center justify-center">
          <User className="w-5 h-5" />
        </div>
      ),
      action: () => {
        onClose();
        onNavigate('profile');
      }
    },
    {
      id: 'refer-win',
      title: 'Refer & Win',
      subtitle: 'Assured ₹450 with Spendulum Circles',
      icon: (
        <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/20 text-rose-400 flex items-center justify-center">
          <Gift className="w-5 h-5" />
        </div>
      ),
      action: () => setActiveSubMenu('refer-win')
    },
    {
      id: 'help-support',
      title: 'Help & Support',
      subtitle: 'Documentation, FAQs & Knowledge Base',
      icon: (
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
          <HelpCircle className="w-5 h-5" />
        </div>
      ),
      action: () => setActiveSubMenu('help-support')
    },
    {
      id: 'my-upi',
      title: 'MyUPI & Banking Stack',
      subtitle: 'Help for Payments, Mandates & Services',
      icon: (
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-white to-emerald-500 p-0.5 flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <span className="font-bold text-[11px] font-mono text-emerald-400">UPI</span>
          </div>
        </div>
      ),
      action: () => setActiveSubMenu('my-upi')
    },
    {
      id: 'appearance',
      title: 'Appearance',
      subtitle: 'Experience Dark Mode (Beta) & Visual Themes',
      icon: (
        <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/20 text-purple-400 flex items-center justify-center">
          <Moon className="w-5 h-5" />
        </div>
      ),
      action: () => setActiveSubMenu('appearance')
    }
  ];

  const filteredItems = SETTING_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm cursor-pointer"
          />

          {/* Pop-out Drawer from Left (React Bits Animated Drawer) */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 240 }}
            className="relative z-10 w-full max-w-sm sm:max-w-md h-full bg-slate-900 border-r border-white/10 shadow-2xl flex flex-col overflow-hidden"
          >
            
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/40">
              {activeSubMenu ? (
                <button
                  onClick={() => setActiveSubMenu(null)}
                  className="flex items-center gap-2 text-slate-300 hover:text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold tracking-tight text-white font-sans">
                    Settings
                  </h2>
                  {savedFeedback && (
                    <span className="text-[11px] text-emerald-400 font-mono animate-pulse">
                      Saved ✓
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                {!activeSubMenu && (
                  <button
                    onClick={() => setIsSearching(!isSearching)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    title="Search Settings"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Expandable Search Input */}
            {isSearching && !activeSubMenu && (
              <div className="px-4 py-2.5 bg-slate-950 border-b border-white/5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search settings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-4 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 divide-y divide-white/5">
              
              {/* Main Menu View */}
              {!activeSubMenu ? (
                <div className="space-y-1">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={item.action}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/[0.04] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 flex-1 pr-2">
                        {item.icon}
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm group-hover:text-emerald-400 transition-colors">
                              {item.title}
                            </span>
                            {item.badge && (
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${item.badgeColor || 'bg-emerald-500 text-slate-950'}`}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Sub-menu 1: Appearance */}
              {activeSubMenu === 'appearance' && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                    Color Theme & Style
                  </h3>
                  <div className="space-y-2">
                    {[
                      { id: 'obsidian', name: 'Obsidian Emerald (Default)', desc: 'Luxury deep dark background with emerald accents' },
                      { id: 'cyber', name: 'Cyber Neon Dark', desc: 'High contrast cyan and electric teal highlights' },
                      { id: 'midnight', name: 'Midnight Slate', desc: 'Subtle slate blue with gold highlights' }
                    ].map((theme) => (
                      <div
                        key={theme.id}
                        onClick={() => handleUpdate('dark_mode', theme.id)}
                        className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          settings.dark_mode === theme.id
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-950 border-white/5 text-slate-300 hover:border-white/10'
                        }`}
                      >
                        <div>
                          <span className="font-semibold text-xs block">{theme.name}</span>
                          <span className="text-[11px] text-slate-400">{theme.desc}</span>
                        </div>
                        {settings.dark_mode === theme.id && <Check className="w-4 h-4 text-emerald-400" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-menu 2: UPI & Payment Settings */}
              {activeSubMenu === 'upi-payments' && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                    Linked Bank Handles & VPAs
                  </h3>

                  <div className="space-y-2.5">
                    {[
                      { bank: 'HDFC Bank', vpa: 'user@hdfcbank', mask: 'A/c **4921', status: 'Primary' },
                      { bank: 'State Bank of India', vpa: 'user@okhdfcbank', mask: 'A/c **1084', status: 'Active' },
                      { bank: 'ICICI Bank', vpa: 'user@icici', mask: 'Credit Card **3021', status: 'Active' },
                      { bank: 'Axis Bank', vpa: 'user@axisbank', mask: 'A/c **7829', status: 'Active' }
                    ].map((acc, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-slate-950 border border-white/5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white text-xs">{acc.bank}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {acc.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span>{acc.vpa}</span>
                          <span>{acc.mask}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Primary UPI VPA Handle
                    </label>
                    <input
                      type="text"
                      value={settings.upi_primary_vpa}
                      onChange={(e) => handleUpdate('upi_primary_vpa', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Sub-menu 3: Profile & Regional */}
              {activeSubMenu === 'profile' && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                    Localization & Regional Currency
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Currency Symbol</label>
                      <select
                        value={settings.currency}
                        onChange={(e) => handleUpdate('currency', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                      >
                        <option value="INR">₹ INR — Indian Rupee</option>
                        <option value="USD">$ USD — US Dollar</option>
                        <option value="EUR">€ EUR — Euro</option>
                        <option value="GBP">£ GBP — British Pound</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Number Formatting</label>
                      <select
                        value={settings.number_system}
                        onChange={(e) => handleUpdate('number_system', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Indian (Lakhs / Crores)">Indian System (1,00,000 / 1 Crore)</option>
                        <option value="International (Millions)">International System (100,000 / 1 Million)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Date Format</label>
                      <select
                        value={settings.date_format}
                        onChange={(e) => handleUpdate('date_format', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                      >
                        <option value="DD-MM-YYYY">DD-MM-YYYY (02-11-2026)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (2026-11-02)</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY (02/11/2026)</option>
                      </select>
                    </div>

                    {/* Database Backup download button */}
                    <div className="pt-3 border-t border-white/5 space-y-2">
                      <h4 className="text-xs font-semibold text-white font-mono uppercase">Data Backup</h4>
                      <a
                        href={api.getBackupDbUrl()}
                        download="spendulum_backup.db"
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-950 border border-white/10 hover:border-emerald-500/40 text-emerald-400 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Database className="w-4 h-4" />
                        <span>Download SQLite Database (.db)</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-menu 4: Pocket Money */}
              {activeSubMenu === 'pocket-money' && (
                <div className="space-y-4 pt-2">
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
                    <strong>UPI Circle Pocket Money:</strong> Set allowances for family members or dependents while maintaining complete monthly oversight.
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { name: 'Arjun (College Allowance)', limit: '₹6,000/mo', spent: '₹2,450', mask: 'UPI Circle #1' },
                      { name: 'Pooja (Family Groceries)', limit: '₹12,000/mo', spent: '₹5,820', mask: 'UPI Circle #2' }
                    ].map((m, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-white/5 space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-white">{m.name}</span>
                          <span className="text-amber-400 font-mono font-bold">{m.limit}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                          <span>{m.mask}</span>
                          <span>Spent so far: {m.spent}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-menu 5: Help & Support */}
              {activeSubMenu === 'help-support' && (
                <div className="space-y-3 pt-2 text-xs text-slate-400 leading-relaxed">
                  <h4 className="font-semibold text-white text-sm">Spendulum 2.0 Docs & FAQs</h4>
                  <p>
                    • <strong>SMS Parser:</strong> Works with all major Indian banks. You can paste multiple alerts at once.
                  </p>
                  <p>
                    • <strong>AI Learning:</strong> Correcting a category in the Transactions view automatically trains the hybrid classifier.
                  </p>
                  <p>
                    • <strong>Privacy:</strong> All SQLite data and ML inferences run 100% locally on this computer.
                  </p>
                </div>
              )}

              {/* Sub-menu 6: Refer & Win */}
              {activeSubMenu === 'refer-win' && (
                <div className="space-y-3 pt-2 text-center p-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-2">
                    <Gift className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-white text-base">Invite Friends to Spendulum</h4>
                  <p className="text-xs text-slate-400">
                    Share smart AI budgeting with your friends and unlock premium predictive insights!
                  </p>
                  <div className="p-3 rounded-xl bg-slate-950 border border-white/10 font-mono text-xs text-emerald-400 mt-3 select-all">
                    SPENDULUM-VIP-2026
                  </div>
                </div>
              )}

              {/* Sub-menu 7: MyUPI */}
              {activeSubMenu === 'my-upi' && (
                <div className="space-y-3 pt-2 text-xs">
                  <h4 className="font-semibold text-white text-sm">NPCI & Banking Mandates</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Spendulum complies with RBI recurring mandate guidelines (e-mandates up to ₹15,000 without OTP friction).
                  </p>
                </div>
              )}

            </div>

            {/* Bottom Security Shield Card (Matching user screenshot) */}
            <div className="p-4 border-t border-white/10 bg-slate-950/60">
              <SpotlightCard 
                spotlightColor="rgba(16, 185, 129, 0.25)"
                className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border-emerald-500/30 flex items-center justify-between gap-3 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs">
                      Spendulum Security Shield
                    </h5>
                    <p className="text-[10px] text-slate-400">
                      100% On-Device Local Privacy
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleUpdate('security_shield_active', settings.security_shield_active === 'true' ? 'false' : 'true')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    settings.security_shield_active === 'true'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {settings.security_shield_active === 'true' ? 'Active ✓' : 'Activate'}
                </button>
              </SpotlightCard>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SettingsDrawer;
