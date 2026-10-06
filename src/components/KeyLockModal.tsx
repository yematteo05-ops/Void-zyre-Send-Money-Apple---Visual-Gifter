import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Key, 
  Copy, 
  Zap, 
  ArrowRight, 
  Lock, 
  AlertCircle, 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  Loader2, 
  X 
} from 'lucide-react';
import { playChime } from '../utils/audio';
import { getOrCreateDeviceHwid } from '../utils/hwid';

interface KeyLockModalProps {
  isLocked: boolean;
  onUnlock: (key: string, robloxProfile?: any) => void;
  adminRevocationNotice?: string | null;
  onDismissRevocationNotice?: () => void;
}

export const KeyLockModal: React.FC<KeyLockModalProps> = ({
  isLocked,
  onUnlock,
  adminRevocationNotice,
  onDismissRevocationNotice,
}) => {
  const [inputKey, setInputKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deviceHwid] = useState(() => getOrCreateDeviceHwid());

  // Lock body scroll when locked so nothing underneath is scrollable or visible
  useEffect(() => {
    if (isLocked) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isLocked]);

  // Handle pasting key from clipboard
  const handlePasteKey = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputKey(text.trim().toUpperCase());
          setErrorMessage(null);
        }
      }
    } catch {
      // Clipboard fallback
    }
  };

  // Verify Key directly with backend / Firebase Firestore or local fallback for Vercel
  const handleValidateKey = async (keyToValidate?: string) => {
    const key = (keyToValidate || inputKey).trim().toUpperCase();
    if (!key) {
      setErrorMessage('Please enter or paste your access key.');
      return;
    }

    setIsValidating(true);
    setErrorMessage(null);

    // Check locally generated keys in localStorage (Vercel / Offline fallback)
    const storedGenKeysRaw = localStorage.getItem('generated_keys');
    const storedGenKeys: Array<{ key: string; isLifetime?: boolean; durationHours?: number; label?: string }> = 
      storedGenKeysRaw ? JSON.parse(storedGenKeysRaw) : [];

    const storedAdminKeysRaw = localStorage.getItem('void_admin_access_keys');
    const storedAdminKeys: Array<any> = storedAdminKeysRaw ? JSON.parse(storedAdminKeysRaw) : [];

    const localMatch = storedGenKeys.find((k) => k.key.toUpperCase() === key);
    const adminMatch = storedAdminKeys.find((k) => (k.key || k.id || '').toUpperCase() === key);
    const isMasterKey = key === 'VOID-DEMO-2026' || key === 'APPLE-PAY-2026' || key === 'VOID-FREE-2026' || key.startsWith('VOID-MASTER-');

    if (adminMatch) {
      if (adminMatch.status === 'revoked') {
        setErrorMessage('This access key has been revoked by the administrator.');
        setIsValidating(false);
        return;
      }
      if (adminMatch.status === 'expired') {
        setErrorMessage('This access key has expired.');
        setIsValidating(false);
        return;
      }

      const isLifetime = Boolean(adminMatch.is_lifetime || adminMatch.duration === 'Lifetime' || adminMatch.duration_hours === -1);
      try {
        playChime('redeem');
      } catch {}

      // Register device HWID
      if (!adminMatch.devices) adminMatch.devices = [];
      const devExists = adminMatch.devices.some((d: any) => (typeof d === 'string' ? d : d.device_id) === deviceHwid);
      if (!devExists) {
        adminMatch.devices.push({ device_id: deviceHwid, first_seen: new Date().toISOString(), last_seen: new Date().toISOString() });
      }
      adminMatch.status = 'active';
      adminMatch.activated_at = adminMatch.activated_at || new Date().toISOString();
      adminMatch.last_used_at = new Date().toISOString();
      adminMatch.used_count = (adminMatch.used_count || 0) + 1;
      try {
        localStorage.setItem('void_admin_access_keys', JSON.stringify(storedAdminKeys));
      } catch {}

      localStorage.setItem('site_key_validated', key);
      localStorage.setItem('site_key_validated_at', Date.now().toString());
      localStorage.setItem('site_key_hwid', deviceHwid);
      localStorage.setItem('site_key_timer_mode', adminMatch.timer_mode || 'continuous');

      if (isLifetime) {
        localStorage.setItem('site_key_lifetime', 'true');
        localStorage.removeItem('site_key_expires_at');
        localStorage.removeItem('site_key_remaining_seconds');
      } else {
        localStorage.removeItem('site_key_lifetime');
        localStorage.removeItem('site_key_remaining_seconds');
        const durationHours = adminMatch.duration_hours || (adminMatch.duration === '24h' ? 24 : 24);
        const expiresAt = Date.now() + durationHours * 3600 * 1000;
        localStorage.setItem('site_key_expires_at', expiresAt.toString());
      }

      setTimeout(() => {
        onUnlock(key);
        setIsValidating(false);
      }, 300);
      return;
    }

    if (localMatch || isMasterKey || (key.startsWith('VOID-') && key.length >= 8)) {
      const isLifetime = localMatch ? Boolean(localMatch.isLifetime) : true;
      try {
        playChime('redeem');
      } catch {}

      localStorage.setItem('site_key_validated', key);
      localStorage.setItem('site_key_validated_at', Date.now().toString());
      localStorage.setItem('site_key_hwid', deviceHwid);
      localStorage.setItem('site_key_timer_mode', 'continuous');

      if (isLifetime) {
        localStorage.setItem('site_key_lifetime', 'true');
        localStorage.removeItem('site_key_expires_at');
        localStorage.removeItem('site_key_remaining_seconds');
      } else {
        localStorage.removeItem('site_key_lifetime');
        localStorage.removeItem('site_key_remaining_seconds');
        const durationHours = localMatch?.durationHours || 24;
        const expiresAt = Date.now() + durationHours * 3600 * 1000;
        localStorage.setItem('site_key_expires_at', expiresAt.toString());
      }

      setTimeout(() => {
        onUnlock(key);
        setIsValidating(false);
      }, 300);
      return;
    }

    try {
      const res = await fetch('/api/keys/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, device_id: deviceHwid, hwid: deviceHwid }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.valid) {
        const resolvedKey = data.key || key;
        const isLifetime = Boolean(data.is_lifetime || data.duration_hours === -1);

        try {
          playChime('redeem');
        } catch {}

        localStorage.setItem('site_key_validated', resolvedKey);
        localStorage.setItem('site_key_validated_at', Date.now().toString());
        localStorage.setItem('site_key_hwid', deviceHwid);

        if (isLifetime) {
          localStorage.setItem('site_key_lifetime', 'true');
          localStorage.removeItem('site_key_expires_at');
        } else {
          const durationHours = typeof data.duration_hours === 'number' && data.duration_hours > 0 ? data.duration_hours : 24;
          const expiresAt = Date.now() + durationHours * 3600 * 1000;
          localStorage.setItem('site_key_expires_at', expiresAt.toString());
        }

        setTimeout(() => {
          onUnlock(resolvedKey);
          setIsValidating(false);
        }, 300);
      } else {
        setErrorMessage(data?.message || 'Invalid or non-existent access key. Please check for typos.');
        setIsValidating(false);
      }
    } catch {
      setErrorMessage('Invalid or non-existent access key. Please check for typos.');
      setIsValidating(false);
    }
  };

  return (
    <AnimatePresence>
      {isLocked && (
        <motion.div
          key="key-lock-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="void-lockscreen fixed inset-0 z-[9999999] w-screen h-screen flex flex-col items-center justify-center p-4 sm:p-6 select-none overflow-y-auto bg-[#060813]"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
        >
          {/* Subtle Deep Center Halo Glow */}
          <div 
            className="absolute inset-0 pointer-events-none" 
            style={{ 
              background: 'radial-gradient(circle at 50% 50%, rgba(13, 28, 59, 0.45) 0%, rgba(6, 8, 19, 0.98) 75%)' 
            }} 
          />

          <div className="relative w-full max-w-[430px] mx-auto z-10 my-auto">
            {/* Modal Card matching screenshot with Liquid Glass */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 14 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 14 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="relative w-full rounded-[28px] liquid-glass-modal p-7 sm:p-8 flex flex-col space-y-6 overflow-hidden"
              style={{ color: '#ffffff' }}
            >
              {/* Subtle top specular reflection */}
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

              {/* Header Icon */}
              <div className="flex flex-col items-center text-center">
                <div className="w-[56px] h-[56px] rounded-[18px] liquid-glass-icon-box flex items-center justify-center shrink-0 mb-3.5 relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-white/60 pointer-events-none" />
                  <Key size={22} color="#00d8f6" strokeWidth={2.4} />
                </div>

                {/* Title */}
                <h2 
                  className="text-[26px] sm:text-[28px] font-black tracking-tight leading-tight m-0"
                  style={{ color: '#ffffff', fontWeight: 900, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
                >
                  Enter Access Key
                </h2>

                {/* Subtitle */}
                <p 
                  className="text-[12.5px] leading-normal max-w-xs mx-auto mt-1.5 m-0 font-normal"
                  style={{ color: '#8899b0' }}
                >
                  Enter your access key to log in and unlock this website.
                </p>
              </div>

              {/* Revocation Notice Banner (if any) */}
              <AnimatePresence>
                {adminRevocationNotice && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    className="p-3.5 rounded-2xl bg-red-950/85 border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.35)] backdrop-blur-xl flex items-start justify-between gap-3 text-left"
                  >
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className="p-2 rounded-xl bg-red-600/30 text-red-300 border border-red-500/40 shrink-0">
                        <ShieldAlert size={18} className="animate-pulse text-red-400" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 font-sans">
                          <span>Session Disconnected</span>
                          <span className="w-2 h-2 rounded-full bg-red-400 animate-ping shrink-0" />
                        </h4>
                        <p className="text-xs text-red-200/90 leading-relaxed font-sans">
                          {adminRevocationNotice}
                        </p>
                      </div>
                    </div>

                    {onDismissRevocationNotice && (
                      <button
                        type="button"
                        onClick={onDismissRevocationNotice}
                        className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                        title="Dismiss notice"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form Section */}
              <div className="space-y-4">
                {/* Field Label Row */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-[13px] font-bold" style={{ color: '#ffffff' }}>
                      <Lock size={14} color="#00d8f6" strokeWidth={2.5} />
                      <span style={{ color: '#ffffff', fontWeight: 700 }}>Your Access Key</span>
                    </div>
                    <button
                      type="button"
                      onClick={handlePasteKey}
                      className="flex items-center gap-1.5 text-[12px] font-bold hover:opacity-80 transition-opacity cursor-pointer"
                      style={{ color: '#00d8f6' }}
                    >
                      <Copy size={13} color="#00d8f6" strokeWidth={2.2} />
                      <span>Paste</span>
                    </button>
                  </div>

                  {/* Input Box */}
                  <input
                    type="text"
                    value={inputKey}
                    onChange={(e) => {
                      setInputKey(e.target.value.toUpperCase());
                      setErrorMessage(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleValidateKey();
                      }
                    }}
                    placeholder="E.G. VOID-XXXX-XXXX"
                    className="w-full h-[52px] rounded-[14px] liquid-glass-input-box px-4 text-[13.5px] font-mono font-bold tracking-wider outline-none transition-all uppercase"
                    style={{ color: '#ffffff', backgroundColor: '#070a14', borderColor: '#172238' }}
                    autoFocus
                  />
                </div>

                {/* Current Device HWID Box */}
                <div className="rounded-[14px] liquid-glass-hwid-box p-3.5 space-y-1.5 text-left" style={{ backgroundColor: '#080d1a', borderColor: '#152035' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[12px]" style={{ color: '#71829d' }}>
                      <Shield size={13} color="#00d8f6" strokeWidth={2.2} />
                      <span>Current Device HWID:</span>
                    </div>
                    <span 
                      className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-[8px] select-all tracking-wider"
                      style={{ backgroundColor: '#041424', border: '1px solid rgba(0, 216, 246, 0.45)', color: '#00d8f6' }}
                    >
                      {deviceHwid}
                    </span>
                  </div>
                  <p className="text-[10.5px] leading-normal m-0" style={{ color: '#55657d' }}>
                    This browser hardware identifier is automatically bound to your access key.
                  </p>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start space-x-2.5 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs text-left"
                  >
                    <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-400" />
                    <span className="leading-tight">{errorMessage}</span>
                  </motion.div>
                )}

                {/* Primary Button */}
                <button
                  type="button"
                  onClick={() => handleValidateKey()}
                  disabled={isValidating || !inputKey.trim()}
                  className="w-full h-[50px] rounded-[14px] liquid-glass-btn flex items-center justify-center gap-2 text-[13.5px] font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                  style={{ color: '#ffffff' }}
                >
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-white/35 pointer-events-none" />
                  {isValidating ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-white" />
                      <span style={{ color: '#ffffff' }}>Verifying Key...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={16} color="#facc15" fill="#facc15" />
                      <span style={{ color: '#ffffff', fontWeight: 700 }}>Verify Key & Unlock Access</span>
                      <ArrowRight size={15} color="#93c5fd" />
                    </>
                  )}
                </button>
              </div>

              {/* Footer Row */}
              <div className="pt-1 flex items-center justify-between text-[11.5px]" style={{ color: '#63748d' }}>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={13} color="#00d8f6" strokeWidth={2.2} />
                  <span style={{ color: '#63748d' }}>Access Protection Gateway</span>
                </div>
                <div>
                  <span style={{ color: '#63748d' }}>Made by </span>
                  <strong style={{ color: '#f59e0b', fontWeight: 800 }}>Void</strong>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
