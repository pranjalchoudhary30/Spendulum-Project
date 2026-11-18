import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Filter, 
  Upload, 
  Download, 
  Trash2, 
  Edit3, 
  Sparkles, 
  ArrowDownLeft, 
  ArrowUpRight,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { FadeContent } from '../components/react-bits/FadeContent';
import { api } from '../services/api';

const CATEGORIES = [
  "All",
  "Food and groceries",
  "Housing and utilities",
  "Transport and fuel",
  "Bills",
  "Shopping",
  "Healthcare",
  "Entertainment",
  "Education",
  "Travel",
  "Salary",
  "Freelance",
  "Investments",
  "Other expenses"
];

export const Transactions = ({ onOpenAddModal }) => {
  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [loading, setLoading] = useState(true);
  const [importStatus, setImportStatus] = useState(null);
  const [editingTxn, setEditingTxn] = useState(null);
  const [editCategory, setEditCategory] = useState('');
  const [learnFeedback, setLearnFeedback] = useState(true);

  const fileInputRef = useRef(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.getTransactions({
        search,
        category: selectedCategory,
        type: selectedType,
        limit: 150
      });
      setTransactions(res.items || []);
      setTotalCount(res.total || 0);
    } catch (e) {
      console.error("Failed to fetch transactions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchTransactions();
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, selectedCategory, selectedType]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await api.deleteTransaction(id);
      fetchTransactions();
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  };

  const handleEditSave = async (id) => {
    try {
      await api.updateTransaction(id, {
        category: editCategory,
        learn_feedback: learnFeedback
      });
      setEditingTxn(null);
      fetchTransactions();
    } catch (e) {
      alert("Update failed: " + e.message);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus({ loading: true });
      const res = await api.importCsv(file);
      setImportStatus({
        success: true,
        message: `Imported ${res.imported} transactions successfully (${res.duplicates_skipped} duplicates skipped).`
      });
      fetchTransactions();
    } catch (err) {
      setImportStatus({
        success: false,
        message: err.message || "CSV Import failed."
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <FadeContent className="space-y-6 pb-12">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Transactions Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {totalCount} total verified financial movements
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Import CSV</span>
          </button>

          <a
            href="http://localhost:8000/api/transactions/export-csv"
            download
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-semibold text-xs tracking-wide shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Import Status Alert */}
      {importStatus && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
          importStatus.success 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {importStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{importStatus.message}</span>
          </div>
          <button 
            onClick={() => setImportStatus(null)}
            className="text-slate-400 hover:text-white font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by merchant, narration, or transaction key..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-white/5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-white/5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900 text-white">
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-white/5 text-xs">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900 text-white">All Types</option>
              <option value="Expense" className="bg-slate-900 text-white">Expense Only</option>
              <option value="Income" className="bg-slate-900 text-white">Income Only</option>
            </select>
          </div>

          <button
            onClick={fetchTransactions}
            className="p-2 rounded-xl bg-slate-950 border border-white/5 text-slate-400 hover:text-white hover:border-emerald-500/30 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>

      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/40 text-[11px] font-mono uppercase text-slate-400">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description / Merchant</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">AI Source</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No transactions match your search or filters.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const isExpense = txn.type.toLowerCase() === 'expense';
                  const isEditing = editingTxn === txn.transaction_id;

                  return (
                    <tr key={txn.transaction_id} className="hover:bg-white/[0.02] transition-colors group">
                      
                      {/* Date */}
                      <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                        {txn.date}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 max-w-xs sm:max-w-md">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                            isExpense ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {isExpense ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <span className="font-semibold text-white group-hover:text-emerald-300 transition-colors block truncate">
                              {txn.description}
                            </span>
                            {txn.matched_merchant && txn.matched_merchant !== '—' && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                Merchant: {txn.matched_merchant}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category / Inline Edit */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="px-2 py-1 rounded bg-slate-950 border border-emerald-500 text-xs text-white"
                            >
                              {CATEGORIES.filter(c => c !== 'All').map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleEditSave(txn.transaction_id)}
                              className="px-2 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-[10px]"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingTxn(null)}
                              className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800/80 text-slate-200 border border-white/5">
                            {txn.category}
                          </span>
                        )}
                      </td>

                      {/* AI Source & Confidence */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            txn.prediction_source === 'User Feedback'
                              ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                              : txn.prediction_source === 'Merchant Knowledge Base'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                          }`}>
                            {txn.prediction_source}
                          </span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right font-mono font-semibold whitespace-nowrap">
                        <span className={isExpense ? 'text-white' : 'text-emerald-400 font-bold'}>
                          {isExpense ? '-' : '+'}₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingTxn(txn.transaction_id);
                              setEditCategory(txn.category);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                            title="Edit Category & Feedback"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(txn.transaction_id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </FadeContent>
  );
};

export default Transactions;
