import React, { useState, useEffect, useRef } from 'react';
import { 
  ScanLine, 
  UploadCloud, 
  FileText, 
  Check, 
  Sparkles, 
  Plus, 
  Store, 
  Calendar, 
  Hash, 
  Receipt as ReceiptIcon,
  CheckCircle2
} from 'lucide-react';
import { SpotlightCard } from '../components/react-bits/SpotlightCard';
import { FadeContent } from '../components/react-bits/FadeContent';
import { api } from '../services/api';

export const ReceiptScanner = ({ onNavigate }) => {
  const [rawText, setRawText] = useState('');
  const [samples, setSamples] = useState([]);
  const [parsedReceipt, setParsedReceipt] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.getReceiptSamples().then(setSamples).catch(console.error);
  }, []);

  const handleScanText = async () => {
    if (!rawText.trim()) return;
    try {
      setScanning(true);
      setSavedSuccess(false);
      const res = await api.scanReceiptText(rawText);
      setParsedReceipt(res);
    } catch (e) {
      alert("Error parsing receipt: " + e.message);
    } finally {
      setScanning(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setScanning(true);
      setSavedSuccess(false);
      const res = await api.scanReceiptImage(file);
      setParsedReceipt(res);
      if (res.ocr_text) setRawText(res.ocr_text);
    } catch (err) {
      alert("Error scanning image: " + err.message);
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCommit = async () => {
    if (!parsedReceipt) return;
    try {
      setCommitting(true);
      await api.commitReceipt({
        merchant: parsedReceipt.merchant,
        date: parsedReceipt.date,
        total: parsedReceipt.total,
        category: parsedReceipt.category,
        items: parsedReceipt.items
      });
      setSavedSuccess(true);
      setParsedReceipt(null);
      setRawText('');
    } catch (e) {
      alert("Failed to commit receipt transaction: " + e.message);
    } finally {
      setCommitting(false);
    }
  };

  return (
    <FadeContent className="space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
            <ScanLine className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Receipt OCR & Bill Analyzer
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Extract merchants, line items, taxes, and totals from paper receipts, e-invoices, and screenshots
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Receipt transaction recorded into your ledger!</span>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors cursor-pointer"
          >
            Go to Ledger →
          </button>
        </div>
      )}

      {/* Main Grid: Upload & Text Input vs Samples */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Upload and Text Box (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Drag & Drop File Zone */}
          <input
            type="file"
            accept="image/*,.pdf"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-8 rounded-2xl bg-slate-900/40 hover:bg-slate-900/80 border-2 border-dashed border-white/10 hover:border-teal-500/40 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer group"
          >
            <div className="p-3 rounded-full bg-slate-950 text-teal-400 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Upload Receipt Image or Invoice
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                PNG, JPG, or PDF formats supported • Optical Character Recognition enabled
              </p>
            </div>
          </div>

          {/* Or Paste Raw Text */}
          <SpotlightCard spotlightColor="rgba(20, 184, 166, 0.15)" className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                Or Paste Receipt / Invoice Text
              </label>
              <span className="text-[11px] text-slate-400">
                E-commerce, Swiggy/Zomato, or DMart text invoices
              </span>
            </div>

            <textarea
              rows={8}
              placeholder="Paste raw text from receipt email or invoice breakdown..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all resize-none leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setRawText('')}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Clear
              </button>

              <button
                onClick={handleScanText}
                disabled={scanning || !rawText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 text-slate-950 font-semibold text-xs tracking-wide shadow-lg shadow-teal-500/20 transition-all cursor-pointer disabled:opacity-40"
              >
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>{scanning ? 'Extracting Items...' : 'Analyze Receipt'}</span>
              </button>
            </div>
          </SpotlightCard>
        </div>

        {/* Right: Instant Test Receipts */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-3">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider font-mono text-slate-400">
              Demo Receipt Templates
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Test parsing on structured Indian retail formats with 1 click:
            </p>

            <div className="space-y-2.5 pt-1">
              {samples.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => setRawText(s.text)}
                  className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-white/5 hover:border-teal-500/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-teal-400 group-hover:text-teal-300 font-sans">
                      {s.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">+ Load</span>
                  </div>
                  <pre className="text-[10px] text-slate-400 font-mono line-clamp-3 overflow-hidden">
                    {s.text}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Extracted Receipt Itemization Preview */}
      {parsedReceipt && (
        <div className="rounded-2xl bg-slate-900/60 border border-teal-500/30 p-6 backdrop-blur-xl space-y-6 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-300">
          
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-white text-lg">
                  {parsedReceipt.merchant}
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {parsedReceipt.date}
                </span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 font-sans">
                  {parsedReceipt.category}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="block text-[10px] uppercase font-mono text-slate-400">Total Payable</span>
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  ₹{parsedReceipt.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <button
                onClick={handleCommit}
                disabled={committing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{committing ? 'Saving...' : 'Add to Ledger'}</span>
              </button>
            </div>
          </div>

          {/* Line items table */}
          {parsedReceipt.items && parsedReceipt.items.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Extracted Line Items ({parsedReceipt.items.length})
              </h4>
              <div className="divide-y divide-white/5 border border-white/5 rounded-xl bg-slate-950/60 overflow-hidden">
                {parsedReceipt.items.map((it, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-[11px]">{idx + 1}.</span>
                      <span className="text-white font-sans">{it.item}</span>
                      {it.qty > 1 && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[10px]">
                          x{it.qty}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-200 font-semibold">
                      ₹{it.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subtotal & Taxes breakdown */}
          <div className="max-w-xs ml-auto space-y-1.5 pt-2 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span>₹{parsedReceipt.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Taxes / GST</span>
              <span>₹{parsedReceipt.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-white/10">
              <span>Grand Total</span>
              <span className="text-emerald-400">₹{parsedReceipt.total.toFixed(2)}</span>
            </div>
          </div>

        </div>
      )}

    </FadeContent>
  );
};

export default ReceiptScanner;
