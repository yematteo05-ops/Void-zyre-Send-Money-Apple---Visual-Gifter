import React from 'react';
import { IPHONE_PRODUCTS } from '../data/products';
import { X, Sparkles, Cpu, Camera, Battery, Smartphone } from 'lucide-react';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBuy: (modelId: string) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({ isOpen, onClose, onSelectBuy }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-500 overflow-y-auto bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-[#f5f5f7] dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col relative border border-black/10 dark:border-white/10">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#2c2c2e]/70 backdrop-blur-md sticky top-0 z-10">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-[#86868b]">Apple Store</span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Compare iPhone Models</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/20 transition-all text-[#1d1d1f] dark:text-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="p-6 overflow-x-auto flex-1">
          <div className="grid grid-cols-4 gap-4 min-w-[760px]">
            {IPHONE_PRODUCTS.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-[#242426] p-5 rounded-2xl border border-black/5 dark:border-white/5 flex flex-col justify-between space-y-4"
              >
                {/* Top info */}
                <div className="text-center space-y-3">
                  <img
                    src={p.finishes[0].image}
                    alt={p.name}
                    className="h-44 object-contain mx-auto drop-shadow-md"
                  />
                  <div className="flex justify-center gap-1.5 pt-1">
                    {p.finishes.map((f) => (
                      <span
                        key={f.name}
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-inner"
                        style={{ backgroundColor: f.colorHex }}
                        title={f.name}
                      />
                    ))}
                  </div>

                  <div>
                    <h3 className="font-bold text-lg">{p.name}</h3>
                    <p className="text-xs text-[#86868b] min-h-[32px]">{p.tagline}</p>
                    <div className="text-base font-bold mt-2">From ${p.basePrice}</div>
                    <div className="text-[11px] text-[#86868b]">or ${p.monthlyPrice}/mo. for 24 mo.</div>
                  </div>

                  <button
                    onClick={() => {
                      onSelectBuy(p.id);
                      onClose();
                    }}
                    className="w-full py-2 px-4 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
                  >
                    Buy
                  </button>
                </div>

                {/* Specs list */}
                <div className="space-y-4 text-xs pt-4 border-t border-black/5 dark:border-white/5">
                  <div>
                    <div className="font-semibold flex items-center gap-1 text-[#86868b] mb-1">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Display</span>
                    </div>
                    <p className="font-medium text-[11px]">{p.specs.display}</p>
                  </div>

                  <div>
                    <div className="font-semibold flex items-center gap-1 text-[#86868b] mb-1">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Chip</span>
                    </div>
                    <p className="font-medium text-[11px]">{p.specs.chip}</p>
                  </div>

                  <div>
                    <div className="font-semibold flex items-center gap-1 text-[#86868b] mb-1">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Camera</span>
                    </div>
                    <p className="font-medium text-[11px]">{p.specs.camera}</p>
                  </div>

                  <div>
                    <div className="font-semibold flex items-center gap-1 text-[#86868b] mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#ff2d55]" />
                      <span>Intelligence</span>
                    </div>
                    <p className="font-medium text-[11px]">{p.specs.intelligence}</p>
                  </div>

                  <div>
                    <div className="font-semibold flex items-center gap-1 text-[#86868b] mb-1">
                      <Battery className="w-3.5 h-3.5 text-[#34c759]" />
                      <span>Battery</span>
                    </div>
                    <p className="font-medium text-[11px]">{p.specs.battery}</p>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
