import React, { useState } from 'react';
import { ProductModel, CartItem } from '../types';
import { TRADE_IN_DEVICES } from '../data/products';
import { X, Check, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

interface BuyModalProps {
  product: ProductModel | null;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export const BuyModal: React.FC<BuyModalProps> = ({ product, onClose, onAddToCart }) => {
  if (!product) return null;

  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
  const [selectedFinish, setSelectedFinish] = useState(product.finishes[0]);
  const [selectedStorage, setSelectedStorage] = useState(product.storages[0]);
  const [hasTradeIn, setHasTradeIn] = useState(false);
  const [selectedTradeInDevice, setSelectedTradeInDevice] = useState(TRADE_IN_DEVICES[0].model);
  const [selectedPaymentType, setSelectedPaymentType] = useState<'monthly' | 'full'>('monthly');
  const [selectedCarrier, setSelectedCarrier] = useState('Connect later / Unlocked');
  const [includeAppleCare, setIncludeAppleCare] = useState(false);

  const size = product.sizes ? product.sizes[selectedSizeIndex] : null;
  const sizeOffset = size ? size.priceOffset : 0;
  const basePrice = selectedStorage.price + sizeOffset;
  const tradeInCredit = hasTradeIn ? (TRADE_IN_DEVICES.find(d => d.model === selectedTradeInDevice)?.credit || 0) : 0;
  const finalPrice = Math.max(0, basePrice - tradeInCredit + (includeAppleCare ? 199 : 0));
  const finalMonthly = Number(((finalPrice) / 24).toFixed(2));

  const handleAdd = () => {
    const item: CartItem = {
      id: `${product.id}-${Date.now()}`,
      modelId: product.id,
      modelName: size ? size.name : product.name,
      sizeName: size?.screen,
      finish: selectedFinish.name,
      finishColorHex: selectedFinish.colorHex,
      storage: selectedStorage.size,
      carrier: selectedCarrier,
      tradeInCredit,
      appleCare: includeAppleCare,
      price: finalPrice,
      monthlyPrice: finalMonthly,
      image: selectedFinish.image,
      quantity: 1
    };
    onAddToCart(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-500 overflow-y-auto bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-[#f5f5f7] dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col relative border border-black/10 dark:border-white/10">
        
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#2c2c2e]/70 backdrop-blur-md sticky top-0 z-10">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-[#86868b]">Apple Store</span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Buy {size ? size.name : product.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/20 transition-all text-[#1d1d1f] dark:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          
          {/* Product Hero preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white dark:bg-[#242426] p-6 rounded-2xl border border-black/5 dark:border-white/5">
            <div className="flex flex-col items-center justify-center min-h-[260px]">
              <img
                src={selectedFinish.image}
                alt={`${product.name} in ${selectedFinish.name}`}
                className="max-h-60 object-contain drop-shadow-xl transition-all duration-300"
              />
              <span className="mt-3 text-sm font-medium text-[#86868b]">
                Finish: <strong className="text-[#1d1d1f] dark:text-white">{selectedFinish.name}</strong>
              </span>
            </div>

            <div className="space-y-4">
              {product.badge && (
                <span className="inline-block px-3 py-1 bg-[#ff2d55]/10 text-[#ff2d55] text-xs font-semibold rounded-full uppercase tracking-wider">
                  {product.badge}
                </span>
              )}
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {size ? size.name : product.name}
              </h3>
              <p className="text-sm text-[#86868b] leading-relaxed">
                {product.description}
              </p>

              {/* Price Display */}
              <div className="p-4 bg-[#f5f5f7] dark:bg-[#1c1c1e] rounded-xl border border-black/5 dark:border-white/5">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">${finalPrice}</span>
                  <span className="text-xs text-[#86868b]">or ${finalMonthly}/mo. for 24 mo.*</span>
                </div>
                {tradeInCredit > 0 && (
                  <p className="text-xs text-[#34c759] font-medium mt-1">
                    Includes ${tradeInCredit} Apple Trade In credit applied.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 1. Model / Size Selection if multiple */}
          {product.sizes && product.sizes.length > 1 && (
            <div className="space-y-3">
              <label className="text-sm font-semibold uppercase tracking-wider text-[#86868b]">
                1. Select your size
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.sizes.map((s, idx) => (
                  <button
                    key={s.name}
                    onClick={() => setSelectedSizeIndex(idx)}
                    className={`p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${
                      selectedSizeIndex === idx
                        ? 'border-[#0071e3] ring-2 ring-[#0071e3]/20 bg-white dark:bg-[#2c2c2e]'
                        : 'border-black/10 dark:border-white/10 bg-white/50 dark:bg-[#242426] hover:border-black/20'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-base">{s.name}</div>
                      <div className="text-xs text-[#86868b]">{s.screen}</div>
                    </div>
                    <div className="text-sm font-semibold">
                      {s.priceOffset > 0 ? `+$${s.priceOffset}` : 'Standard'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Finish Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold uppercase tracking-wider text-[#86868b]">
              2. Select your finish
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {product.finishes.map((finish) => {
                const isSelected = selectedFinish.name === finish.name;
                return (
                  <button
                    key={finish.name}
                    onClick={() => setSelectedFinish(finish)}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                      isSelected
                        ? 'border-[#0071e3] ring-2 ring-[#0071e3]/20 bg-white dark:bg-[#2c2c2e]'
                        : 'border-black/10 dark:border-white/10 bg-white/50 dark:bg-[#242426] hover:border-black/20'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full shadow-inner border border-black/10"
                      style={{ backgroundColor: finish.colorHex }}
                    />
                    <span className="text-xs font-medium text-center">{finish.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Storage Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold uppercase tracking-wider text-[#86868b]">
              3. Select your storage
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {product.storages.map((storage) => {
                const isSelected = selectedStorage.size === storage.size;
                return (
                  <button
                    key={storage.size}
                    onClick={() => setSelectedStorage(storage)}
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? 'border-[#0071e3] ring-2 ring-[#0071e3]/20 bg-white dark:bg-[#2c2c2e]'
                        : 'border-black/10 dark:border-white/10 bg-white/50 dark:bg-[#242426] hover:border-black/20'
                    }`}
                  >
                    <div className="text-lg font-bold">{storage.size}</div>
                    <div className="text-xs text-[#86868b] mt-1">${storage.price + sizeOffset}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Apple Trade In */}
          <div className="space-y-3 bg-white dark:bg-[#242426] p-5 rounded-2xl border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-[#34c759]" />
              <div>
                <h4 className="font-semibold text-sm">Apple Trade In</h4>
                <p className="text-xs text-[#86868b]">Trade in your current smartphone for $120–$650 in credit.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <button
                onClick={() => setHasTradeIn(false)}
                className={`p-3 rounded-xl border text-sm font-medium text-left transition-all ${
                  !hasTradeIn
                    ? 'border-[#0071e3] ring-2 ring-[#0071e3]/20 bg-[#f5f5f7] dark:bg-[#2c2c2e]'
                    : 'border-black/10 dark:border-white/10'
                }`}
              >
                No trade-in
              </button>
              <button
                onClick={() => setHasTradeIn(true)}
                className={`p-3 rounded-xl border text-sm font-medium text-left transition-all ${
                  hasTradeIn
                    ? 'border-[#0071e3] ring-2 ring-[#0071e3]/20 bg-[#f5f5f7] dark:bg-[#2c2c2e]'
                    : 'border-black/10 dark:border-white/10'
                }`}
              >
                Yes, select trade-in device
              </button>
            </div>

            {hasTradeIn && (
              <div className="mt-3 space-y-2 pt-2 border-t border-black/5 dark:border-white/5 animate-fadeIn">
                <label className="text-xs font-semibold text-[#86868b]">Select your current iPhone:</label>
                <select
                  value={selectedTradeInDevice}
                  onChange={(e) => setSelectedTradeInDevice(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#f5f5f7] dark:bg-[#1c1c1e] text-sm font-medium outline-none focus:border-[#0071e3]"
                >
                  {TRADE_IN_DEVICES.map((d) => (
                    <option key={d.model} value={d.model}>
                      {d.model} (up to ${d.credit} credit)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 5. Payment Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold uppercase tracking-wider text-[#86868b]">
              4. Payment option
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedPaymentType('monthly')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  selectedPaymentType === 'monthly'
                    ? 'border-[#0071e3] ring-2 ring-[#0071e3]/20 bg-white dark:bg-[#2c2c2e]'
                    : 'border-black/10 dark:border-white/10 bg-white/50 dark:bg-[#242426]'
                }`}
              >
                <div className="font-semibold text-sm">Apple Card Monthly Installments</div>
                <div className="text-lg font-bold mt-1">${finalMonthly}/mo.</div>
                <div className="text-xs text-[#86868b]">0% APR for 24 months*</div>
              </button>
              <button
                onClick={() => setSelectedPaymentType('full')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  selectedPaymentType === 'full'
                    ? 'border-[#0071e3] ring-2 ring-[#0071e3]/20 bg-white dark:bg-[#2c2c2e]'
                    : 'border-black/10 dark:border-white/10 bg-white/50 dark:bg-[#242426]'
                }`}
              >
                <div className="font-semibold text-sm">Pay in full</div>
                <div className="text-lg font-bold mt-1">${finalPrice}</div>
                <div className="text-xs text-[#86868b]">One-time payment</div>
              </button>
            </div>
          </div>

          {/* 6. AppleCare+ Option */}
          <div className="p-4 bg-white dark:bg-[#242426] rounded-2xl border border-black/5 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[#0071e3]" />
              <div>
                <div className="font-semibold text-sm">AppleCare+ for iPhone</div>
                <div className="text-xs text-[#86868b]">2 years of unlimited repairs for accidental damage protection.</div>
              </div>
            </div>
            <button
              onClick={() => setIncludeAppleCare(!includeAppleCare)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                includeAppleCare
                  ? 'bg-[#0071e3] text-white'
                  : 'bg-black/5 dark:bg-white/10 text-[#1d1d1f] dark:text-white hover:bg-black/10'
              }`}
            >
              {includeAppleCare ? 'Added ($199)' : 'Add ($199)'}
            </button>
          </div>

          {/* Delivery & Perks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#86868b] pt-2">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#0071e3]" />
              <span>Free shipping & free store pickup</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#34c759]" />
              <span>Free returns within 14 days</span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-white dark:bg-[#2c2c2e] border-t border-black/5 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs text-[#86868b]">Total Price</div>
            <div className="text-2xl font-bold">
              ${finalPrice}
              <span className="text-sm font-normal text-[#86868b] ml-2">
                (or ${finalMonthly}/mo.)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-1/2 sm:w-auto px-6 py-3 rounded-full border border-black/15 dark:border-white/20 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="w-1/2 sm:w-auto px-8 py-3 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all transform active:scale-95"
            >
              Add to Bag
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
