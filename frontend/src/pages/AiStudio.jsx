import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  Check, 
  BookOpen, 
  ArrowRight, 
  ShieldCheck, 
  Layers,
  GraduationCap
} from 'lucide-react';
import { SpotlightCard } from '../components/react-bits/SpotlightCard';
import { FadeContent } from '../components/react-bits/FadeContent';
import { api } from '../services/api';

const SAMPLE_QUERIES = [
  "UPI-CHAAYOS-94821",
  "PHONEPE-HEALTHIANS-72819",
  "POS-SKECHERS-MALL-91827",
  "GPAY-YATRA-AIRWAYS-83921",
  "BLINKIT INSTANT GROCERY BANGALORE",
  "ZEPTO LATE NIGHT SNACKS 482",
  "INDIAN OIL FUEL STATION KORAMANGALA",
  "NETFLIX DIGITAL AUTOPAY MUMBAI"
];

const CATEGORIES = [
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

export const AiStudio = () => {
  const [query, setQuery] = useState('UPI-CHAAYOS-94821');
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [correctedCat, setCorrectedCat] = useState('Food and groceries');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  const runPrediction = async (textToPredict) => {
    const text = textToPredict || query;
    if (!text.trim()) return;
    try {
      setPredicting(true);
      setFeedbackSuccess('');
      const res = await api.predictCategory(text);
      setPrediction(res);
      setCorrectedCat(res.category);
    } catch (e) {
      console.error(e);
    } finally {
      setPredicting(false);
    }
  };

  useEffect(() => {
    runPrediction('UPI-CHAAYOS-94821');
  }, []);

  const handleTeachAI = async () => {
    if (!query.trim() || !correctedCat) return;
    try {
      await api.submitFeedback(query, correctedCat);
      setFeedbackSuccess(`AI learned! Future transactions like "${query}" will now be classified as "${correctedCat}".`);
      runPrediction(query);
    } catch (e) {
      alert("Feedback failed: " + e.message);
    }
  };

  return (
    <FadeContent className="space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              AI Classifier Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Interactive sandbox for the 3-tier hybrid pipeline (Feedback Rules → Merchant KB → Linear SVM)
            </p>
          </div>
        </div>
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Input Sandbox & Live Result (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <SpotlightCard spotlightColor="rgba(168, 85, 247, 0.2)" className="p-6 space-y-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Test Transaction Narration
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a narration (e.g. UPI-CHAAYOS-83921, DMART BANGALORE)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runPrediction()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={() => runPrediction()}
                disabled={predicting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 text-white font-semibold text-xs shadow-lg shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{predicting ? 'Classifying...' : 'Predict'}</span>
              </button>
            </div>

            {/* Live Result Details */}
            {prediction && (
              <div className="mt-4 p-5 rounded-xl bg-slate-950/80 border border-white/5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <span className="text-xs text-slate-400 font-mono">Prediction Output</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                    prediction.prediction_source === 'User Feedback'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : prediction.prediction_source === 'Merchant Knowledge Base'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    Source: {prediction.prediction_source}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="block text-[11px] text-slate-500 font-mono uppercase">Category</span>
                    <span className="text-base font-bold text-white font-sans">
                      {prediction.category}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[11px] text-slate-500 font-mono uppercase">Confidence</span>
                    <span className={`text-base font-bold font-mono ${
                      prediction.confidence === 'High' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {prediction.confidence}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[11px] text-slate-500 font-mono uppercase">Score / Margin</span>
                    <span className="text-base font-bold text-white font-mono">
                      {prediction.confidence_score}
                    </span>
                  </div>
                </div>

                {prediction.matched_merchant && prediction.matched_merchant !== '—' && (
                  <div className="text-xs text-slate-400 font-mono pt-1">
                    Matched Merchant Entity: <strong className="text-emerald-400">{prediction.matched_merchant}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Continuous Learning / Teach AI Section */}
            {prediction && (
              <div className="mt-4 p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 space-y-3">
                <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold font-mono uppercase tracking-wider">
                  <GraduationCap className="w-4 h-4" />
                  <span>Correct or Teach the Model</span>
                </div>

                {feedbackSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{feedbackSuccess}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <select
                    value={correctedCat}
                    onChange={(e) => setCorrectedCat(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleTeachAI}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Teach AI Rule</span>
                  </button>
                </div>
              </div>
            )}

          </SpotlightCard>
        </div>

        {/* Right: Quick Benchmark Samples & Pipeline Explanation */}
        <div className="space-y-4">
          
          {/* Quick Query Benchmarks */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-3">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider font-mono text-slate-400">
              Benchmark Test Phrases
            </h4>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SAMPLE_QUERIES.map((sq, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(sq);
                    runPrediction(sq);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-white/5 hover:border-purple-500/40 text-[11px] font-mono text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>

          {/* Architecture Hierarchy Card */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-3">
            <div className="flex items-center gap-2 text-slate-200 text-xs font-semibold font-mono uppercase tracking-wider">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Priority Hierarchy</span>
            </div>

            <ol className="space-y-2 text-xs text-slate-400 list-decimal list-inside leading-relaxed">
              <li>
                <strong className="text-purple-300">User Feedback Rules</strong>: Exact normalized string override from user corrections.
              </li>
              <li>
                <strong className="text-emerald-300">Merchant Knowledge Base</strong>: 44 high-frequency verified Indian merchants.
              </li>
              <li>
                <strong className="text-cyan-300">Linear SVM Model</strong>: TF-IDF vectorizer + Support Vector Machine decision margin.
              </li>
            </ol>
          </div>

        </div>

      </div>

    </FadeContent>
  );
};

export default AiStudio;
