import React, { useState } from 'react';
import { TRADE_IN_DEVICES } from '../data/products';
import { X, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';

interface TradeInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTradeIn?: (credit: number, model: string) => void;
}

export const TradeInModal: React.FC<TradeInModalProps> = ({ isOpen, onClose, onApplyTradeIn }) => {
  if (!isOpen) return null;

  const [selectedDevice, setSelectedDevice] = useState(TRADE_IN_DEVICES[0].model);
  const [condition, setCondition] = useState<'flawless' | 'good' | 'damaged'>('flawless');

  const baseCredit = TRADE_IN_DEVICES.find(d => d.model === selectedDevice)?.credit || 0;
  const finalEstimate = condition === 'flawless' 
    ? baseCredit 
    : condition === 'good' 
    ? Math.round(baseCredit * 0.85) 
    : Math.round(baseCredit * 0.4);

  return (
    <div className="fixed inset-0 z-500 overflow-y-auto bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#f5f5f7] dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col relative border border-black/10 dark:border-white/10">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#2c2c2e]/70 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-[#34c759]" />
            <h2 className="text-xl font-bold tracking-tight">Apple Trade In Calculator</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/20 transition-all text-[#1d1d1f] dark:text-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <p className="text-xs text-[#86868b] leading-relaxed">
            Trade in your eligible smartphone for credit toward a new iPhone, or recycle it responsibly for free.
          </p>

          {/* Device selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">
              Select your current model
            </label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full p-3.5 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#242426] text-sm font-semibold outline-none focus:border-[#0071e3]"
            >
              {TRADE_IN_DEVICES.map((d) => (
                <option key={d.model} value={d.model}>
                  {d.model} (Estimated up to ${d.credit})
                </option>
              ))}
            </select>
          </div>

          {/* Condition selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">
              Device condition
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'flawless', label: 'Flawless', desc: 'No scratches or dents' },
                { id: 'good', label: 'Good', desc: 'Minor normal wear' },
                { id: 'damaged', label: 'Cracked', desc: 'Screen or body crack' }
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCondition(c.id as any)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    condition === c.id
                      ? 'border-[#0071e3] ring-2 ring-[#0071e3]/20 bg-white dark:bg-[#2c2c2e]'
                      : 'border-black/10 dark:border-white/10 bg-white/50 dark:bg-[#242426]'
                  }`}
                >
                  <div className="font-semibold text-xs">{c.label}</div>
                  <div className="text-[10px] text-[#86868b] mt-0.5">{c.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Value Card */}
          <div className="p-6 bg-white dark:bg-[#242426] rounded-2xl border border-black/5 dark:border-white/5 text-center space-y-1">
            <span className="text-xs text-[#86868b] uppercase tracking-wider font-medium">Estimated Trade-In Value</span>
            <div className="text-4xl font-extrabold text-[#34c759]">${finalEstimate}</div>
            <p className="text-xs text-[#86868b] pt-1">
              Applied instantly as a discount upon checkout.
            </p>
          </div>

          <div className="space-y-2 text-xs text-[#86868b]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#34c759]" />
              <span>Free prepaid trade-in return kit included.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#34c759]" />
              <span>Zero-hassle secure factory reset guidance.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white dark:bg-[#2c2c2e] border-t border-black/5 dark:border-white/10 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full border border-black/15 dark:border-white/20 text-xs font-semibold hover:bg-black/5"
          >
            Done
          </button>
          <button
            onClick={() => {
              if (onApplyTradeIn) onApplyTradeIn(finalEstimate, selectedDevice);
              onClose();
            }}
            className="px-6 py-2.5 rounded-full bg-[#0071e3] text-white text-xs font-semibold hover:bg-[#0077ed] flex items-center gap-1 shadow-md shadow-blue-500/20"
          >
            <span>Apply to New iPhone</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
