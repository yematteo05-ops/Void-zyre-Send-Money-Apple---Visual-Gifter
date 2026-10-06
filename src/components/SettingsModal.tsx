import React, { useState, useEffect } from 'react';
import { Settings, User, Wallet, Mail, MessageSquare, ExternalLink, Check, RotateCcw, ShieldCheck, DollarSign } from 'lucide-react';
import { AppleLogo } from './AppleLogo';

export interface UserSettings {
  userName: string;
  paypalBalance: number;
  applePayBalance: number;
  defaultRecipientEmail: string;
  defaultGiftMessage: string;
  discordLink: string;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  userName: 'Zyre',
  paypalBalance: 4850.00,
  applePayBalance: 10000.00,
  defaultRecipientEmail: '',
  defaultGiftMessage: 'By Void Hub https://discord.gg/brhBspMGAj',
  discordLink: 'https://discord.gg/brhBspMGAj'
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (newSettings: UserSettings) => void;
}

export function SettingsModal({ isOpen, onClose, settings, onSaveSettings }: SettingsModalProps) {
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    setFormData(DEFAULT_USER_SETTINGS);
    onSaveSettings(DEFAULT_USER_SETTINGS);
  };

  return (
    <div
      className="fixed inset-0 z-500 apple-backdrop flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
      style={{ fontFamily: '"SF Pro Text", "SF Pro Icons", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
    >
      <div
        className="relative w-full max-w-2xl apple-sheet overflow-hidden my-auto text-[#1d1d1f] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Apple Settings Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#d2d2d7]/60 bg-[#ffffff]">
          <div className="flex items-center gap-2.5">
            <AppleLogo size={18} />
            <div className="h-4 w-px bg-[#d2d2d7]" />
            <div className="text-[15px] font-semibold text-[#1d1d1f] tracking-tight flex items-center gap-1.5">
              <span>Account & Balance Settings</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="apple-close-btn"
            aria-label="Close"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="1" y1="1" x2="11" y2="11" />
              <line x1="11" y1="1" x2="1" y2="11" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto bg-white">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">
              Preferences & Balances
            </h2>
            <p className="text-xs text-[#6e6e73]">
              Configure your sender credentials and simulated wallet balances.
            </p>
          </div>

          {/* User Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1d1d1f] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#0071e3]" />
              <span>Sender / Account Name</span>
            </label>
            <input
              type="text"
              required
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              placeholder="e.g. Zyre"
              className="apple-input-field"
            />
          </div>

          {/* Balances Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* PayPal Balance */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1d1d1f] flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-[#003087]" />
                <span>PayPal Available Balance (USD)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#86868b]">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.paypalBalance}
                  onChange={(e) => setFormData({ ...formData, paypalBalance: parseFloat(e.target.value) || 0 })}
                  placeholder="4850.00"
                  className="apple-input-field pl-8 font-mono"
                />
              </div>
            </div>

            {/* Apple Pay / Apple Card Balance */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1d1d1f] flex items-center gap-1.5">
                <AppleLogo size={13} className="text-black" />
                <span>Apple Card Balance (USD)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#86868b]">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.applePayBalance}
                  onChange={(e) => setFormData({ ...formData, applePayBalance: parseFloat(e.target.value) || 0 })}
                  placeholder="10000.00"
                  className="apple-input-field pl-8 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Discord Hub link */}
          <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-[#d2d2d7] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👾</span>
              <div>
                <div className="text-sm font-bold text-[#1d1d1f]">Void Hub Discord Community</div>
                <div className="text-xs text-[#0071e3] font-mono mt-0.5">discord.gg/brhBspMGAj</div>
              </div>
            </div>
            <a
              href="https://discord.gg/brhBspMGAj"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span>Join</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Admin Link & Security */}
          <div className="pt-2 flex items-center justify-between text-xs border-t border-[#d2d2d7]/50">
            <a
              href="/adminvoid"
              onClick={(e) => {
                e.preventDefault();
                onClose();
                window.history.pushState({}, '', '/adminvoid');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="text-[#0071e3] hover:underline flex items-center gap-1 font-mono font-semibold cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Panel (/adminvoid)</span>
            </a>
            <span className="text-[10px] text-[#86868b]">Void Hub 2026</span>
          </div>

          {/* Save / Reset Actions */}
          <div className="pt-4 border-t border-[#d2d2d7] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-[#6e6e73] hover:text-[#1d1d1f] inline-flex items-center gap-1.5 cursor-pointer py-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="apple-cta-secondary px-4 py-2 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="apple-cta-primary px-6 py-2 text-xs shadow-sm font-semibold cursor-pointer"
              >
                {isSaved ? (
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Saved!
                  </span>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
