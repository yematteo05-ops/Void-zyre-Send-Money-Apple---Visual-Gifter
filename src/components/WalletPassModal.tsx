import React, { useState } from 'react';
import { Check, Download, Share2, Smartphone } from 'lucide-react';
import { AppleLogo } from './AppleLogo';

interface WalletPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  recipientEmail: string;
  senderName: string;
  productName: string;
  finishName: string;
  storageSize: string;
  orderDate: string;
}

export function WalletPassModal({
  isOpen,
  onClose,
  orderNumber,
  recipientEmail,
  senderName,
  productName,
  finishName,
  storageSize,
  orderDate
}: WalletPassModalProps) {
  const [isAdded, setIsAdded] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-500 apple-backdrop flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-sm apple-sheet overflow-hidden my-auto text-[#1d1d1f] p-6 text-center space-y-5"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#d2d2d7]">
          <div className="flex items-center gap-2">
            <AppleLogo size={18} fill="#1d1d1f" />
            <span className="text-sm font-bold tracking-tight text-[#1d1d1f]">Apple Wallet</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] flex items-center justify-center text-xs text-[#6e6e73] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Realistic Apple Wallet Pass Card */}
        <div className="bg-[#1c1c1e] text-white rounded-3xl p-6 shadow-2xl text-left relative overflow-hidden border border-white/10 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AppleLogo size={16} fill="#ffffff" />
              <span className="text-xs font-semibold tracking-wider uppercase text-gray-400">
                Apple Store Order
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#34c759]/20 text-[#34c759]">
              GIFT PASS
            </span>
          </div>

          {/* Product Big Title */}
          <div>
            <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Device</div>
            <div className="text-xl font-bold tracking-tight text-white">{productName}</div>
            <div className="text-xs text-gray-300">{storageSize} • {finishName}</div>
          </div>

          {/* Grid fields */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Recipient</div>
              <div className="font-semibold text-white truncate">{recipientEmail}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">From</div>
              <div className="font-semibold text-white">{senderName || 'Zyre'}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Order ID</div>
              <div className="font-mono font-semibold text-white">{orderNumber}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Status</div>
              <div className="font-semibold text-[#34c759]">Ready for Dispatch</div>
            </div>
          </div>

          {/* Simulated 2D Apple Barcode */}
          <div className="pt-3 border-t border-white/10 text-center">
            <div className="inline-block bg-white p-3 rounded-xl shadow-inner">
              <div className="w-36 h-12 flex items-center justify-center gap-1">
                {[4, 2, 5, 1, 3, 6, 2, 4, 1, 5, 2, 3, 4, 2, 6, 1, 3, 5, 2, 4, 1, 3].map((h, i) => (
                  <div
                    key={i}
                    className="bg-black rounded-sm"
                    style={{ width: `${(i % 3) + 2}px`, height: `${h * 6}px` }}
                  />
                ))}
              </div>
            </div>
            <div className="text-[10px] font-mono text-gray-400 mt-1">{orderNumber}</div>
          </div>
        </div>

        {/* Add to Wallet CTA */}
        {isAdded ? (
          <div className="p-3 rounded-2xl bg-[#34c759]/10 text-[#34c759] font-bold text-sm flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> Added to your Apple Wallet!
          </div>
        ) : (
          <button
            onClick={() => setIsAdded(true)}
            className="w-full h-12 rounded-2xl bg-black text-white hover:bg-gray-900 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <AppleLogo size={16} fill="#ffffff" />
            <span>Add to Apple Wallet</span>
          </button>
        )}

        <button
          onClick={onClose}
          className="text-xs text-[#6e6e73] hover:underline cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
}
