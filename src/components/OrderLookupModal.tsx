import React, { useState } from 'react';
import { Search, Package, MapPin, Truck, CheckCircle2, Clock, ShieldCheck, ExternalLink } from 'lucide-react';
import { AppleLogo } from './AppleLogo';

interface OrderLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultOrderNumber?: string;
}

export function OrderLookupModal({ isOpen, onClose, defaultOrderNumber = '' }: OrderLookupModalProps) {
  const [searchTerm, setSearchTerm] = useState(defaultOrderNumber);
  const [foundOrder, setFoundOrder] = useState<any | null>(() => {
    return defaultOrderNumber
      ? {
          orderNumber: defaultOrderNumber,
          recipientEmail: 'recipient@gmail.com',
          product: 'iPhone 18 Pro Max 1TB (Deep Crimson)',
          status: 'In Transit with Express Courier',
          carrier: 'FedEx Express Worldwide Priority',
          trackingNumber: '7829-4910-3849',
          estimatedDelivery: 'Tomorrow by 10:30 AM',
          ribbon: 'Signature Red',
          giftMessage: 'By Void Hub https://discord.gg/brhBspMGAj'
        }
      : null;
  });

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (!query) return;

    // Simulate finding the order
    setFoundOrder({
      orderNumber: query.startsWith('W') ? query : 'W' + Math.floor(100000000 + Math.random() * 900000000),
      recipientEmail: query.includes('@') ? query : 'recipient@gmail.com',
      product: 'iPhone 18 Pro Max 512GB (Deep Crimson)',
      status: 'Dispatched with Apple Express Courier',
      carrier: 'FedEx Priority Overnight',
      trackingNumber: '7829-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000),
      estimatedDelivery: 'Tomorrow by 10:30 AM',
      ribbon: 'Signature Red',
      giftMessage: 'By Void Hub https://discord.gg/brhBspMGAj'
    });
  };

  return (
    <div className="fixed inset-0 z-500 apple-backdrop flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl apple-sheet overflow-hidden my-auto text-[#1d1d1f] p-6 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#d2d2d7]">
          <div className="flex items-center gap-2.5">
            <AppleLogo size={24} fill="#1d1d1f" />
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f]">
                Track Your Apple Gift Order
              </h2>
              <p className="text-xs text-[#6e6e73]">
                Enter your Apple Order Number or Recipient Gmail
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="apple-close-btn cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g. W918237461 or recipient@gmail.com"
              className="apple-input-field pl-10"
            />
          </div>
          <button
            type="submit"
            className="apple-cta-primary px-6 cursor-pointer"
          >
            Track
          </button>
        </form>

        {/* Found Order Results & Live Courier Map Tracker */}
        {foundOrder && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Live Status Card */}
            <div className="p-5 rounded-2xl bg-[#f5f5f7] border border-[#d2d2d7] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#0071e3]">
                    {foundOrder.status}
                  </span>
                  <h3 className="text-lg font-bold text-[#1d1d1f]">{foundOrder.product}</h3>
                  <div className="text-xs text-[#6e6e73]">
                    Order: <strong className="font-mono text-[#1d1d1f]">{foundOrder.orderNumber}</strong> • Carrier: {foundOrder.carrier}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xs text-[#6e6e73]">Estimated Delivery</div>
                  <div className="text-sm font-bold text-[#34c759] flex items-center sm:justify-end gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {foundOrder.estimatedDelivery}
                  </div>
                </div>
              </div>

              {/* Progress Milestones */}
              <div className="grid grid-cols-4 gap-2 text-center text-[11px] pt-3 border-t border-[#d2d2d7]">
                <div className="space-y-1">
                  <div className="w-6 h-6 mx-auto rounded-full bg-[#34c759] text-white flex items-center justify-center font-bold text-xs">✓</div>
                  <div className="font-semibold text-[#1d1d1f]">Ordered</div>
                </div>
                <div className="space-y-1">
                  <div className="w-6 h-6 mx-auto rounded-full bg-[#34c759] text-white flex items-center justify-center font-bold text-xs">✓</div>
                  <div className="font-semibold text-[#1d1d1f]">Gift Boxed</div>
                </div>
                <div className="space-y-1">
                  <div className="w-6 h-6 mx-auto rounded-full bg-[#0071e3] text-white flex items-center justify-center font-bold text-xs animate-pulse">🚚</div>
                  <div className="font-semibold text-[#0071e3]">In Transit</div>
                </div>
                <div className="space-y-1 opacity-40">
                  <div className="w-6 h-6 mx-auto rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-bold text-xs">📦</div>
                  <div className="font-semibold text-gray-700">Delivered</div>
                </div>
              </div>
            </div>

            {/* Simulated Live Apple Maps Courier Route */}
            <div className="rounded-2xl border border-[#d2d2d7] overflow-hidden bg-[#e8ece9] relative h-48 sm:h-56 shadow-inner">
              {/* Map grid lines */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#86868b_1px,transparent_1px)] [background-size:16px_16px]" />

              {/* Highway lines */}
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M 40 160 Q 180 60 480 90"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <path
                  d="M 40 160 Q 180 60 480 90"
                  fill="none"
                  stroke="#0071e3"
                  strokeWidth="4"
                  strokeDasharray="8 6"
                  className="animate-pulse"
                />
              </svg>

              {/* Origin Marker */}
              <div className="absolute bottom-8 left-8 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md border border-black/10 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-[#34c759]" />
                <span className="font-semibold text-[#1d1d1f]">Apple Cupertino Hub</span>
              </div>

              {/* Moving Courier Truck */}
              <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-[#0071e3] text-white px-3 py-1 rounded-full shadow-xl flex items-center gap-1.5 text-xs font-bold animate-bounce">
                <Truck className="w-3.5 h-3.5" />
                <span>Express Courier in Transit</span>
              </div>

              {/* Destination Marker */}
              <div className="absolute top-6 right-8 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md border border-black/10 text-xs">
                <MapPin className="w-3.5 h-3.5 text-[#e30000]" />
                <span className="font-semibold text-[#1d1d1f]">Recipient ({foundOrder.recipientEmail})</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#86868b] pt-2">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-[#34c759]" /> Apple Signature Verification Required
              </span>
              <span>Live GPS Courier Data Updated 1m ago</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
