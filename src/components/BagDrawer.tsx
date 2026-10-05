import React, { useState } from 'react';
import { CartItem } from '../types';
import { X, Trash2, Plus, Minus, CheckCircle, Apple, Lock } from 'lucide-react';

interface BagDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export const BagDrawer: React.FC<BagDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}) => {
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const monthlyTotal = items.reduce((sum, item) => sum + item.monthlyPrice * item.quantity, 0);

  const handleCheckout = () => {
    const num = `W${Math.floor(100000000 + Math.random() * 900000000)}`;
    setOrderNumber(num);
    setIsCheckedOut(true);
    onClearCart();
  };

  return (
    <div className="fixed inset-0 z-500 overflow-hidden bg-black/50 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="bg-[#f5f5f7] dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] w-full max-w-md h-full shadow-2xl flex flex-col relative border-l border-black/10 dark:border-white/10 animate-slideLeft">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#2c2c2e]/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">Your Bag</h2>
            <span className="text-xs bg-[#0071e3] text-white px-2 py-0.5 rounded-full font-medium">
              {items.reduce((acc, i) => acc + i.quantity, 0)}
            </span>
          </div>
          <button
            onClick={() => {
              setIsCheckedOut(false);
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/20 transition-all text-[#1d1d1f] dark:text-white"
            aria-label="Close Bag"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {isCheckedOut ? (
            <div className="py-12 text-center space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-[#34c759]/10 text-[#34c759] flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight">Thank You For Your Order!</h3>
              <p className="text-sm text-[#86868b]">
                Order number: <strong className="text-[#1d1d1f] dark:text-white">{orderNumber}</strong>
              </p>
              <p className="text-xs text-[#86868b] max-w-xs mx-auto">
                We've received your Apple Store order. Free express delivery will arrive in 2 business days.
              </p>
              <button
                onClick={() => {
                  setIsCheckedOut(false);
                  onClose();
                }}
                className="mt-6 px-6 py-2.5 rounded-full bg-[#0071e3] text-white text-sm font-semibold hover:bg-[#0077ed]"
              >
                Continue Shopping
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="text-4xl">🛍️</div>
              <h3 className="text-xl font-bold">Your Bag is empty.</h3>
              <p className="text-xs text-[#86868b] max-w-xs mx-auto">
                Items added to your bag will appear here. Choose your favorite iPhone model to start your order.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#242426] p-4 rounded-2xl border border-black/5 dark:border-white/5 space-y-3 shadow-sm"
                >
                  <div className="flex gap-4 items-center">
                    <img
                      src={item.image}
                      alt={item.modelName}
                      className="w-16 h-16 object-contain drop-shadow"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{item.modelName}</h4>
                      <p className="text-xs text-[#86868b]">
                        {item.storage} • {item.finish}
                      </p>
                      {item.appleCare && (
                        <p className="text-[11px] text-[#0071e3] font-medium">+ AppleCare+ Protection</p>
                      )}
                      <div className="font-bold text-sm mt-1">
                        ${item.price}
                        <span className="text-xs font-normal text-[#86868b] ml-1.5">
                          (${item.monthlyPrice}/mo.)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5 text-xs">
                    <div className="flex items-center border border-black/10 dark:border-white/10 rounded-full bg-[#f5f5f7] dark:bg-[#1c1c1e] px-2 py-0.5">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="p-1 hover:text-[#0071e3]"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="p-1 hover:text-[#0071e3]"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-[#ff3b30] flex items-center gap-1 hover:underline"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with totals & Apple Pay Checkout */}
        {items.length > 0 && !isCheckedOut && (
          <div className="p-6 bg-white dark:bg-[#2c2c2e] border-t border-black/5 dark:border-white/10 space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#86868b]">
                <span>Shipping</span>
                <span className="text-[#34c759] font-medium">FREE</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#1d1d1f] dark:text-white pt-1 border-t border-black/5 dark:border-white/10">
                <span>Total</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-[#86868b]">
                <span>Monthly Installments</span>
                <span>${monthlyTotal.toFixed(2)}/mo.</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCheckout}
                className="w-full py-3.5 px-4 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all transform active:scale-98"
              >
                <Lock className="w-4 h-4" />
                <span>Check Out</span>
              </button>

              <button
                onClick={handleCheckout}
                className="w-full py-3.5 px-4 rounded-full bg-black text-white text-sm font-semibold flex items-center justify-center gap-1 hover:bg-neutral-900 transition-all border border-white/20"
              >
                <span>Buy with</span>
                <Apple className="w-4 h-4 fill-current ml-0.5" />
                <span className="font-bold">Pay</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
