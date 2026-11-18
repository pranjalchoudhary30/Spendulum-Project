import React, { useState, useEffect } from 'react';
import { 
  MessageSquareCode, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw,
  Copy,
  PlusCircle,
  HelpCircle
} from 'lucide-react';
import { SpotlightCard } from '../components/react-bits/SpotlightCard';
import { FadeContent } from '../components/react-bits/FadeContent';
import { api } from '../services/api';

export const SmsUpiParser = ({ onNavigate }) => {
  const [rawText, setRawText] = useState('');
  const [samples, setSamples] = useState([]);
  const [parsedResults, setParsedResults] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    api.getSmsSamples().then(setSamples).catch(console.error);
  }, []);

  const handleParse = async () => {
    if (!rawText.trim()) return;
    try {
      setParsing(true);
      setSuccessMessage('');
      const res = await api.parseSms(rawText);
      setParsedResults(res.parsed || []);
    } catch (e) {
      alert("Parsing error: " + e.message);
    } finally {
      setParsing(false);
    }
  };

  const handleLoadSample = (sampleText) => {
    setRawText((prev) => (prev ? `${prev}\n\n${sampleText}` : sampleText));
  };

  const handleCommit = async () => {
    if (parsedResults.length === 0) return;
    try {
      setCommitting(true);
      const res = await api.commitSms(parsedResults);
      setSuccessMessage(`Successfully recorded ${res.imported} transactions into your registry! (${res.duplicates} duplicates skipped)`);
      setParsedResults([]);
      setRawText('');
    } catch (e) {
      alert("Failed to commit transactions: " + e.message);
    } finally {
      setCommitting(false);
    }
  };

  return (
    <FadeContent className="space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <MessageSquareCode className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              SMS & UPI Statement Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Instantly parse bank debit/credit SMS alerts across HDFC, SBI, ICICI, Axis, Kotak, and UPI handles
            </p>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors cursor-pointer"
          >
            View in Registry →
          </button>
        </div>
      )}

      {/* Main Grid: Input Area + Sample Quick Load */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Input Textarea (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.15)" className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                Paste Bank SMS Alert(s)
              </label>
              <span className="text-[11px] text-slate-400">
                Multiple SMS can be separated by blank lines
              </span>
            </div>

            <textarea
              rows={7}
              placeholder={`Example:\nRs 840.00 debited from HDFC Bank A/c **4921 on 02-Nov-26 to SWIGGY UPI: swiggy@icici. Ref 430718293101.\n\nDear SBI User, your A/c ending 1084 credited by Rs 95,000.00 on 01-Nov-26 by UPI/Salary...`}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none leading-relaxed"
            />

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setRawText('')}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Clear
              </button>

              <button
                onClick={handleParse}
                disabled={parsing || !rawText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-semibold text-xs tracking-wide shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-40"
              >
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>{parsing ? 'Parsing...' : 'Analyze & Extract'}</span>
              </button>
            </div>
          </SpotlightCard>
        </div>

        {/* Right: Instant Test Samples */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-3">
            <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold font-mono uppercase tracking-wider">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>Instant Bank Templates</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Click any sample bank alert to load it into the parser:
            </p>

            <div className="space-y-2 pt-1">
              {samples.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => handleLoadSample(s.text)}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-emerald-400 group-hover:text-emerald-300 font-mono">
                      {s.bank}
                    </span>
                    <span className="text-[10px] text-slate-400 group-hover:text-white font-mono">
                      + Insert
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 font-mono">
                    {s.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Extracted Parse Results Preview */}
      {parsedResults.length > 0 && (
        <div className="rounded-2xl bg-slate-900/60 border border-emerald-500/30 p-6 backdrop-blur-xl space-y-4 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="font-semibold text-white text-base flex items-center gap-2">
                <span>Extracted Candidates ({parsedResults.length})</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                  Ready to Commit
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Review parsed amounts, detected banks, and AI categories before saving
              </p>
            </div>

            <button
              onClick={handleCommit}
              disabled={committing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-emerald-500/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{committing ? 'Recording...' : `Commit ${parsedResults.length} Transactions`}</span>
            </button>
          </div>

          <div className="divide-y divide-white/5 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-[10px] font-mono uppercase text-slate-400">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Bank / Account</th>
                  <th className="py-2.5 px-3">Merchant / Beneficiary</th>
                  <th className="py-2.5 px-3">AI Category</th>
                  <th className="py-2.5 px-3">Ref ID</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {parsedResults.map((r, i) => {
                  const isIncome = r.type === 'Income';
                  return (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{r.date}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-white/10 text-white font-medium">
                          {r.bank} {r.account_mask}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-white font-sans font-medium">{r.merchant}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans">
                          {r.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">{r.reference_no}</td>
                      <td className="py-3 px-3 text-right font-bold whitespace-nowrap">
                        <span className={isIncome ? 'text-emerald-400' : 'text-white'}>
                          {isIncome ? '+' : '-'}₹{r.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </FadeContent>
  );
};

export default SmsUpiParser;
