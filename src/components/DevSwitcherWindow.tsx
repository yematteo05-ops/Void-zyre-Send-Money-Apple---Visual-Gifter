import React from 'react';
import { motion } from 'motion/react';
import {
  Wallet,
  Key,
  Shield,
  GripVertical,
} from 'lucide-react';
import { playChime } from '../utils/audio';

interface DevSwitcherWindowProps {
  currentRoute: string;
  isUnlocked: boolean;
  onSwitchToLockscreen: () => void;
  onSwitchToAppleStore: () => void;
  onSwitchToAdmin: () => void;
}

export const DevSwitcherWindow: React.FC<DevSwitcherWindowProps> = ({
  currentRoute,
  isUnlocked,
  onSwitchToLockscreen,
  onSwitchToAppleStore,
  onSwitchToAdmin,
}) => {
  // Visible in AI Studio / dev preview environment
  const isDevOrAiStudio = (() => {
    try {
      const host = window.location.hostname;
      return (
        host.includes('run.app') ||
        host.includes('ais-') ||
        host.includes('localhost') ||
        host.includes('127.0.0.1') ||
        window.self !== window.top
      );
    } catch {
      return true;
    }
  })();

  if (!isDevOrAiStudio) {
    return null;
  }

  const activeMode = currentRoute.includes('/adminvoid')
    ? 'admin'
    : !isUnlocked || currentRoute.includes('/access')
    ? 'lockscreen'
    : 'store';

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, y: -20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="fixed z-[99999999] select-none touch-none"
      style={{
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        cursor: 'grab',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
      }}
      whileDrag={{ cursor: 'grabbing', scale: 1.02 }}
    >
      {/* Floating Horizontal Switcher Bar matching the screenshot */}
      <div
        className="flex items-center gap-2 sm:gap-2.5 px-3 py-2 rounded-full backdrop-blur-2xl transition-all border border-[#1b2742]"
        style={{
          backgroundColor: 'rgba(7, 11, 22, 0.96)',
          boxShadow: '0 16px 45px rgba(0, 0, 0, 0.9), 0 0 25px rgba(0, 122, 255, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
        }}
      >
        {/* Drag Handle Grip Dots */}
        <div
          className="flex items-center justify-center pl-1.5 pr-1 text-[#6b7c99] hover:text-zinc-200 transition-colors cursor-grab active:cursor-grabbing shrink-0"
          title="Drag to reposition"
        >
          <GripVertical size={16} />
        </div>

        {/* 1. PayPal / Store Mode Pill */}
        <button
          type="button"
          onClick={() => {
            try { playChime('click'); } catch {}
            onSwitchToAppleStore();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all cursor-pointer active:scale-95 shrink-0 ${
            activeMode === 'store'
              ? 'bg-[#007aff] text-white shadow-[0_2px_14px_rgba(0,122,255,0.55)]'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
          title="Switch to Store / PayPal Checkout"
        >
          <Wallet size={15} strokeWidth={2.4} />
          <span>PayPal</span>
        </button>

        {/* 2. Lockscreen Pill */}
        <button
          type="button"
          onClick={() => {
            try { playChime('click'); } catch {}
            onSwitchToLockscreen();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] transition-all cursor-pointer active:scale-95 shrink-0 ${
            activeMode === 'lockscreen'
              ? 'bg-[#007aff] text-white font-bold shadow-[0_2px_14px_rgba(0,122,255,0.55)]'
              : 'text-zinc-300 hover:text-white hover:bg-white/5 font-medium'
          }`}
          title="Switch to Lockscreen (/access)"
        >
          <Key size={14} strokeWidth={2.2} className="opacity-90" />
          <span>Lockscreen</span>
        </button>

        {/* 3. Admin / Gen Keys Pill */}
        <button
          type="button"
          onClick={() => {
            try { playChime('click'); } catch {}
            onSwitchToAdmin();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] transition-all cursor-pointer active:scale-95 shrink-0 border ${
            activeMode === 'admin'
              ? 'bg-[#007aff] border-[#007aff] text-white font-bold shadow-[0_2px_14px_rgba(0,122,255,0.55)]'
              : 'border-[#1e3c63] bg-[#091b33]/90 text-[#00d8f6] hover:bg-[#0e2749] hover:border-[#00d8f6]/50 font-semibold shadow-[0_0_12px_rgba(0,216,246,0.12)]'
          }`}
          title="Switch to Admin Panel (/adminvoid)"
        >
          <Shield size={14} strokeWidth={2.2} className={activeMode === 'admin' ? 'text-white' : 'text-[#00d8f6]'} />
          <span>Admin / Gen Keys</span>
        </button>
      </div>
    </motion.div>
  );
};
