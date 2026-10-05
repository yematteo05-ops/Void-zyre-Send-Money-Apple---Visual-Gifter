import React, { useState } from 'react';
import { Sparkles, Gift, Package, ArrowLeft, ExternalLink, ShieldCheck, Heart } from 'lucide-react';
import { ProductModel, ProductFinish, StorageOption } from '../types';
import { AppleLogo } from './AppleLogo';

interface GmailSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail: string;
  senderName: string;
  giftMessage: string;
  product: ProductModel;
  finish: ProductFinish;
  storage: StorageOption;
  engravingText?: string;
  orderNumber: string;
  ribbonColor: string;
}

export function GmailSimulatorModal({
  isOpen,
  onClose,
  recipientEmail,
  senderName,
  giftMessage,
  product,
  finish,
  storage,
  engravingText,
  orderNumber,
  ribbonColor
}: GmailSimulatorModalProps) {
  const [isUnwrapped, setIsUnwrapped] = useState(false);
  const [isBoxOpening, setIsBoxOpening] = useState(false);

  if (!isOpen) return null;

  const handleUnwrap = () => {
    setIsBoxOpening(true);
    setTimeout(() => {
      setIsUnwrapped(true);
      setIsBoxOpening(false);
    }, 1000);
  };

  const getRibbonHex = (name: string) => {
    switch (name.toLowerCase()) {
      case 'space gray':
        return '#48484a';
      case 'holiday gold':
        return '#d4af37';
      case 'pride edition':
        return 'linear-gradient(90deg, #ff3b30, #ff9500, #ffcc00, #34c759, #007aff, #af52de)';
      default:
        return '#ff3b30'; // Signature Red
    }
  };

  return (
    <div className="fixed inset-0 z-500 apple-backdrop flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col border border-[#d2d2d7]"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
      >
        {/* Gmail Window Chrome */}
        <div className="bg-[#f2f6fc] border-b border-[#e0e3e7] px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Real Gmail Logo Vector */}
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M1.5 5.5v13a2 2 0 0 0 2 2h3v-10l5.5 4 5.5-4v10h3a2 2 0 0 0 2-2v-13l-10.5 7.5L1.5 5.5z"
                />
                <path fill="#EA4335" d="M12 13l-10.5-7.5L12 1.5l10.5 4L12 13z" />
                <path fill="#FBBC05" d="M1.5 5.5l10.5 4 10.5-4V3.5a2 2 0 0 0-2-2h-17a2 2 0 0 0-2 2v2z" />
              </svg>
              <span className="font-semibold text-gray-700 text-sm">Gmail</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
              Live Recipient Inbox Simulator
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:inline">
              Viewing as: <strong className="text-gray-800">{recipientEmail}</strong>
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-200/80 hover:bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-bold transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Email Header */}
        <div className="p-6 bg-white border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shadow-xs">
                  <AppleLogo size={16} fill="#ffffff" />
                </span>
                <div>
                  <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    Apple Store
                    <span className="text-xs font-normal text-blue-600">&lt;gifts@apple.com&gt;</span>
                    <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.2 rounded border border-green-200">
                      Verified Sender
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    to me ({recipientEmail}) • Just now
                  </div>
                </div>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">
                {senderName || 'Zyre'} sent you an Apple Store Gift! 🎁
              </h1>
            </div>
            <span className="text-xs text-gray-400 shrink-0">12:00 PM (0m ago)</span>
          </div>
        </div>

        {/* Email Body - Apple Signature E-Gift Message */}
        <div className="p-6 sm:p-10 bg-[#f5f5f7] max-h-[70vh] overflow-y-auto">
          <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#e5e5ea] text-center space-y-6">
            {/* Apple Logo Header */}
            <div className="flex items-center justify-center gap-2">
              <AppleLogo size={28} fill="#1d1d1f" />
              <span className="text-xs uppercase font-bold tracking-widest text-[#86868b]">
                Apple Store Gift Announcement
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f]">
                You’ve Received a Special Gift.
              </h2>
              <p className="text-sm text-[#6e6e73]">
                Sent with love by <strong className="text-[#1d1d1f]">{senderName || 'Zyre'}</strong>
              </p>
            </div>

            {/* Embossed Note Card */}
            {giftMessage && (
              <div className="p-5 rounded-2xl bg-[#fbfbfd] border border-[#d2d2d7] text-left shadow-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#e30000] flex items-center gap-1.5 mb-2">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  Personal Gift Note
                </div>
                <p className="text-base text-[#1d1d1f] italic leading-relaxed">
                  "{giftMessage}"
                </p>
              </div>
            )}

            {/* Interactive Gift Unboxing Box */}
            {!isUnwrapped ? (
              <div className="py-6 space-y-5">
                <div className="relative mx-auto w-48 h-48 bg-white rounded-3xl border-2 border-[#d2d2d7] shadow-xl flex items-center justify-center overflow-hidden transition-all hover:scale-105">
                  {/* Ribbon */}
                  <div
                    className="absolute inset-y-0 w-8"
                    style={{ background: getRibbonHex(ribbonColor) }}
                  />
                  <div
                    className="absolute inset-x-0 h-8"
                    style={{ background: getRibbonHex(ribbonColor) }}
                  />
                  {/* Bow */}
                  <div className="relative z-10 w-14 h-14 rounded-full bg-white shadow-lg border border-black/10 flex items-center justify-center">
                    <Gift className="w-7 h-7 text-[#0071e3]" />
                  </div>
                </div>

                <div>
                  <button
                    onClick={handleUnwrap}
                    disabled={isBoxOpening}
                    className="apple-cta-primary text-base px-8 py-3.5 shadow-lg transform active:scale-95 transition-all cursor-pointer"
                  >
                    {isBoxOpening ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Unwrapping your Apple Gift...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 font-semibold">
                        <Sparkles className="w-4 h-4" />
                        Click to Unwrap Your Gift 🎁
                      </span>
                    )}
                  </button>
                  <p className="text-xs text-[#86868b] mt-2">
                    Click to reveal what {senderName} selected for you
                  </p>
                </div>
              </div>
            ) : (
              /* Revealed Unwrapped Gift */
              <div className="py-4 space-y-6 animate-in zoom-in-95 duration-500">
                <div className="p-6 rounded-3xl bg-[#f5f5f7] border border-[#d2d2d7] relative">
                  <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#34c759]/10 text-[#34c759] text-xs font-bold">
                    Official Apple Gift
                  </span>

                  <div className="h-56 flex items-center justify-center">
                    <img
                      src={finish.image}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow-xl"
                    />
                  </div>

                  {engravingText && (
                    <div className="mt-3 p-2.5 rounded-xl bg-white/80 border border-black/10 inline-flex items-center gap-1.5">
                      <AppleLogo size={12} fill="#1d1d1f" />
                      <span className="font-mono text-sm font-bold text-[#1d1d1f]">
                        "{engravingText}"
                      </span>
                    </div>
                  )}

                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-[#1d1d1f]">
                      {product.name}
                    </h3>
                    <p className="text-sm text-[#6e6e73]">
                      {storage.size} • Finish: {finish.name}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-[#6e6e73]">
                  <p>Order ID: <strong className="font-mono text-[#1d1d1f]">{orderNumber}</strong></p>
                  <p>Arriving in Apple Signature Gift Packaging tied with an embossed ribbon.</p>
                </div>
              </div>
            )}

            {/* Apple Guarantee */}
            <div className="pt-4 border-t border-[#d2d2d7] flex items-center justify-center gap-2 text-xs text-[#86868b]">
              <ShieldCheck className="w-4 h-4 text-[#34c759]" />
              <span>Full 1-Year Apple Limited Warranty & 14-Day Free Exchange Included</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
