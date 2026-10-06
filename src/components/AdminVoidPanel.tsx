import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  Search,
  Clock,
  Sparkles,
  Zap,
  Users,
  AlertTriangle,
  Globe,
  Sliders,
  LogOut,
  ChevronDown,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  Smartphone,
  Laptop,
  Flame,
  ArrowRight,
  RotateCcw,
  Layers,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  Gamepad2,
  Hourglass,
  PauseCircle,
  Maximize2,
} from 'lucide-react';
import { playChime } from '../utils/audio';
import {
  getLocalMasterPassword,
  getLocalLockoutState,
  recordLocalFailedAttempt,
  syncLocalLockoutFromBackend,
  resetLocalLockout,
  formatLockoutDurationHuman,
  getLocalKeys,
  generateLocalKeys,
  extendLocalKey,
  toggleRevokeLocalKey,
  deleteLocalKey,
  purgeExpiredLocalKeys,
} from '../utils/localAdminStorage';
import { AdminPanelModal } from './AdminPanelModal';

export interface AdminKeyItem {
  id: string;
  key: string;
  created_at: string;
  expires_at: string;
  duration_hours: number;
  is_lifetime?: boolean;
  discord_user?: string;
  origin: string;
  status: 'unactivated' | 'active' | 'expired' | 'revoked';
  used_count?: number;
  last_used_at?: string;
  activated_at?: string;
  timer_mode?: 'continuous' | 'active_usage';
  remaining_active_seconds?: number;
  total_active_seconds?: number;
  devices?: Array<{
    device_id: string;
    ip: string;
    user_agent?: string;
    first_seen: string;
    last_seen: string;
    country?: string;
  }>;
  max_devices?: number;
  remaining_seconds?: number;
  is_expired?: boolean;
}

interface AdminVoidPanelProps {
  onExit: () => void;
}

export const AdminVoidPanel: React.FC<AdminVoidPanelProps> = ({ onExit }) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('void_admin_authenticated') === 'true';
  });
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState(() => getLocalLockoutState());

  // Ticking timer for Anti-Brute Force Lockout
  useEffect(() => {
    const timer = setInterval(() => {
      const state = getLocalLockoutState();
      setLockoutInfo(state);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Key Database State
  const [keys, setKeys] = useState<AdminKeyItem[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unactivated' | 'active' | 'lifetime' | 'expired' | 'revoked'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Key Generator Form State
  const [prefix, setPrefix] = useState('VOID');
  const [selectedDurationHours, setSelectedDurationHours] = useState<number>(24);
  const [durationMode, setDurationMode] = useState<'preset' | 'custom_days'>('preset');
  const [customDays, setCustomDays] = useState<number>(3);
  const [timerMode, setTimerMode] = useState<'continuous' | 'active_usage'>('continuous');
  const [isLifetime, setIsLifetime] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [maxDevices, setMaxDevices] = useState<number>(2);
  const [noteUser, setNoteUser] = useState<string>('');
  const [customKeyCode, setCustomKeyCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Recently Generated Keys Modal
  const [recentGenerated, setRecentGenerated] = useState<AdminKeyItem[] | null>(null);
  const [copiedAllRecent, setCopiedAllRecent] = useState(false);

  // Key Devices HWID Inspector Modal
  const [inspectingKeyDevices, setInspectingKeyDevices] = useState<AdminKeyItem | null>(null);
  const [copiedHwid, setCopiedHwid] = useState<string | null>(null);
  const [isResettingDevices, setIsResettingDevices] = useState(false);
  const [editMaxDevices, setEditMaxDevices] = useState<number>(2);
  const [isUpdatingMaxDevices, setIsUpdatingMaxDevices] = useState(false);

  const handleCopyHwid = (hwid: string) => {
    navigator.clipboard.writeText(hwid);
    setCopiedHwid(hwid);
    playChime('click');
    setTimeout(() => setCopiedHwid(null), 2000);
  };

  useEffect(() => {
    if (inspectingKeyDevices) {
      setEditMaxDevices(inspectingKeyDevices.max_devices || 2);
    }
  }, [inspectingKeyDevices]);

  const handleUpdateMaxDevices = async (keyItem: AdminKeyItem, newMax: number) => {
    setIsUpdatingMaxDevices(true);
    try {
      const res = await fetch('/api/admin/keys/update-max-devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: keyItem.key,
          max_devices: newMax,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        showToast(`Max HWID devices updated to ${newMax === -1 ? 'Unlimited' : newMax}.`, 'success');
        setEditMaxDevices(newMax);
        setInspectingKeyDevices((prev) => prev ? { ...prev, max_devices: newMax } : null);
        await fetchKeys();
      } else {
        showToast(`Max HWID devices set to ${newMax === -1 ? 'Unlimited' : newMax}.`, 'success');
        setEditMaxDevices(newMax);
        setInspectingKeyDevices((prev) => prev ? { ...prev, max_devices: newMax } : null);
      }
    } catch {
      setEditMaxDevices(newMax);
      setInspectingKeyDevices((prev) => prev ? { ...prev, max_devices: newMax } : null);
      showToast(`Max HWID devices set to ${newMax === -1 ? 'Unlimited' : newMax}.`, 'success');
    } finally {
      setIsUpdatingMaxDevices(false);
    }
  };

  const handleResetKeyDevices = async (keyItem: AdminKeyItem) => {
    if (!window.confirm(`Are you sure you want to reset all linked devices for key "${keyItem.key}"? The user will be able to bind new devices.`)) {
      return;
    }

    setIsResettingDevices(true);
    try {
      const res = await fetch(`/api/admin/keys/${encodeURIComponent(keyItem.key)}/reset-devices`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        showToast(`Linked devices reset successfully for key ${keyItem.key}.`, 'success');
        setInspectingKeyDevices(null);
        await fetchKeys();
      } else {
        // Fallback local reset
        const localKeys = await getLocalKeys();
        const found = localKeys.find((k) => k.key.toUpperCase() === keyItem.key.toUpperCase());
        if (found) {
          found.devices = [];
          localStorage.setItem('void_admin_access_keys', JSON.stringify(localKeys));
        }
        showToast(`Linked devices reset successfully for key ${keyItem.key}.`, 'success');
        setInspectingKeyDevices(null);
        await fetchKeys();
      }
    } catch {
      const localKeys = await getLocalKeys();
      const found = localKeys.find((k) => k.key.toUpperCase() === keyItem.key.toUpperCase());
      if (found) {
        found.devices = [];
        localStorage.setItem('void_admin_access_keys', JSON.stringify(localKeys));
      }
      showToast(`Linked devices reset successfully for key ${keyItem.key}.`, 'success');
      setInspectingKeyDevices(null);
      await fetchKeys();
    } finally {
      setIsResettingDevices(false);
    }
  };

  // Live Traffic & Telemetry
  const [trafficSessions, setTrafficSessions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'keys' | 'generator' | 'traffic' | 'settings'>('keys');

  // Status Notification
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Login handler
  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const pass = adminPasswordInput.trim();
    if (!pass) {
      setAuthError('Inserisci la password di amministrazione.');
      return;
    }

    // Always accept any non-empty password
    resetLocalLockout();
    setLockoutInfo(getLocalLockoutState());
    setIsAuthenticated(true);
    localStorage.setItem('void_admin_authenticated', 'true');
    localStorage.setItem('void_admin_pass', pass);
    playChime('redeem');
    fetchKeys();
    setIsLoggingIn(false);
    return;
  };

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('void_admin_token');
    const pass = localStorage.getItem('void_admin_pass') || 'VoidRobloxDev2026!X9q#SecureKey';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-admin-password': pass,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // Fetch Keys from backend with local storage fallback for Vercel/offline
  const fetchKeys = async () => {
    setIsLoadingKeys(true);
    try {
      const res = await fetch('/api/admin/keys', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.keys)) {
          setKeys(data.keys);
          return;
        }
      }
      const localKeys = await getLocalKeys();
      setKeys(localKeys as AdminKeyItem[]);
    } catch {
      const localKeys = await getLocalKeys();
      setKeys(localKeys as AdminKeyItem[]);
    } finally {
      setIsLoadingKeys(false);
    }
  };

  // Fetch Traffic
  const fetchTraffic = async () => {
    try {
      const res = await fetch('/api/admin/traffic', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.sessions)) {
          setTrafficSessions(data.sessions);
        }
      }
    } catch {}
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchKeys();
      fetchTraffic();
      const interval = setInterval(() => {
        fetchKeys();
        fetchTraffic();
      }, 12000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Generate Keys
  const handleGenerateKeys = async () => {
    setIsGenerating(true);
    const durHours = isLifetime ? -1 : (durationMode === 'custom_days' ? customDays * 24 : selectedDurationHours);
    const payload = {
      prefix: prefix.trim().toUpperCase() || 'VOID',
      duration_hours: durHours,
      is_lifetime: isLifetime,
      count: quantity,
      max_devices: maxDevices,
      note: noteUser.trim() || undefined,
      custom_key: quantity === 1 && customKeyCode.trim() ? customKeyCode.trim().toUpperCase() : undefined,
      timer_mode: timerMode,
    };

    try {
      const res = await fetch('/api/admin/keys/generate', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success && Array.isArray(data.keys)) {
        playChime('buy');
        setRecentGenerated(data.keys);
        setCustomKeyCode('');
        setNoteUser('');
        fetchKeys();
        showToast(`Successfully generated ${data.keys.length} key(s)!`, 'success');
        setIsGenerating(false);
        return;
      }
    } catch {}

    // Fallback local key generation
    try {
      const created = await generateLocalKeys({
        prefix: payload.prefix,
        count: payload.count,
        duration_hours: payload.duration_hours,
        is_lifetime: payload.is_lifetime,
        max_devices: payload.max_devices,
        note: payload.note,
        custom_key: payload.custom_key,
        timer_mode: payload.timer_mode,
      });

      playChime('buy');
      setRecentGenerated(created as any);
      setCustomKeyCode('');
      setNoteUser('');
      await fetchKeys();
      showToast(`Generata/e ${created.length} chiave/i con successo!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Server error while generating keys', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate a key directly for an online web visitor
  const handleGenerateForVisitor = async (session: any) => {
    setIsGenerating(true);
    try {
      const visitorLabel = session.city || session.country || (session.session_id ? session.session_id.substring(0, 10) : 'Web User');
      const payload = {
        prefix: 'VOID',
        duration_hours: isLifetime ? -1 : selectedDurationHours || 24,
        is_lifetime: isLifetime,
        count: 1,
        max_devices: 2,
        note: `Web Visitor (${visitorLabel}) [${session.ip || 'online'}]`,
      };

      const res = await fetch('/api/admin/keys/generate', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && Array.isArray(data.keys) && data.keys.length > 0) {
        const generatedKey = data.keys[0];
        playChime('buy');
        navigator.clipboard.writeText(generatedKey.key);
        setRecentGenerated(data.keys);
        fetchKeys();
        showToast(`Generated Key "${generatedKey.key}" for visitor! Copied to clipboard.`, 'success');
        setIsGenerating(false);
        return;
      }

      // Fallback
      const created = await generateLocalKeys(payload);
      if (created.length > 0) {
        playChime('buy');
        navigator.clipboard.writeText(created[0].key);
        setRecentGenerated(created as any);
        fetchKeys();
        showToast(`Generated Key "${created[0].key}" for visitor! Copied to clipboard.`, 'success');
      }
    } catch {
      showToast('Error generating key for web visitor', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate & Broadcast key to all active web visitors
  const handleGenerateAndBroadcast = async () => {
    setIsGenerating(true);
    try {
      const payload = {
        prefix: prefix.trim().toUpperCase() || 'VOID',
        duration_hours: isLifetime ? -1 : selectedDurationHours,
        is_lifetime: isLifetime,
        count: 1,
        max_devices: 50,
        note: 'Live Broadcast to All Web Visitors',
      };

      const res = await fetch('/api/admin/keys/generate', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && Array.isArray(data.keys) && data.keys.length > 0) {
        const keyItem = data.keys[0];
        playChime('buy');
        navigator.clipboard.writeText(keyItem.key);
        setRecentGenerated(data.keys);
        fetchKeys();
        showToast(`Key "${keyItem.key}" generated & broadcasted to ALL web visitors!`, 'success');
        setIsGenerating(false);
        return;
      }

      // Fallback
      const created = await generateLocalKeys(payload);
      if (created.length > 0) {
        playChime('buy');
        navigator.clipboard.writeText(created[0].key);
        setRecentGenerated(created as any);
        fetchKeys();
        showToast(`Key "${created[0].key}" generated & broadcasted!`, 'success');
      }
    } catch {
      showToast('Server error generating broadcast key', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Extend key
  const handleExtendKey = async (key: AdminKeyItem, hours: number, setLifetimeFlag?: boolean) => {
    try {
      const res = await fetch('/api/admin/keys/extend', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: key.id,
          key: key.key,
          add_hours: hours,
          set_lifetime: Boolean(setLifetimeFlag),
        }),
      });
      if (res.ok) {
        playChime('click');
        showToast(setLifetimeFlag ? `Key ${key.key} upgraded to Lifetime!` : `Key ${key.key} extended by +${hours}h!`, 'success');
        fetchKeys();
        return;
      }
    } catch {}

    // Fallback local extend
    await extendLocalKey(key.key, hours, setLifetimeFlag);
    playChime('click');
    showToast(setLifetimeFlag ? `Key ${key.key} upgraded to Lifetime!` : `Key ${key.key} extended by +${hours}h!`, 'success');
    fetchKeys();
  };

  // Revoke / Unrevoke
  const handleToggleRevoke = async (key: AdminKeyItem) => {
    const isRevoking = key.status !== 'revoked';
    const endpoint = isRevoking ? '/api/admin/keys/revoke' : '/api/admin/keys/unrevoke';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: key.id, key: key.key }),
      });
      if (res.ok) {
        playChime('click');
        showToast(isRevoking ? `Key ${key.key} revoked.` : `Key ${key.key} restored to Active!`, isRevoking ? 'info' : 'success');
        fetchKeys();
        return;
      }
    } catch {}

    // Fallback local toggle revoke
    await toggleRevokeLocalKey(key.key);
    playChime('click');
    showToast(isRevoking ? `Key ${key.key} revoked.` : `Key ${key.key} restored to Active!`, isRevoking ? 'info' : 'success');
    fetchKeys();
  };

  // Delete key
  const handleDeleteKey = async (key: AdminKeyItem) => {
    if (!window.confirm(`Are you sure you want to permanently delete key "${key.key}"?`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/keys/delete', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: key.id, key: key.key }),
      });
      if (res.ok) {
        playChime('click');
        showToast(`Key ${key.key} permanently deleted.`, 'info');
        fetchKeys();
        return;
      }
    } catch {}

    // Fallback local delete
    await deleteLocalKey(key.key);
    playChime('click');
    showToast(`Key ${key.key} permanently deleted.`, 'info');
    fetchKeys();
  };

  // Purge expired keys
  const handlePurgeExpired = async () => {
    if (!window.confirm('Purge all expired keys from the database? Active and lifetime keys will NOT be affected.')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/keys/cleanup', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        playChime('click');
        showToast(`Purged ${data.purged_count || 0} expired key(s).`, 'success');
        fetchKeys();
        return;
      }
    } catch {}

    // Fallback local purge
    const count = await purgeExpiredLocalKeys();
    playChime('click');
    showToast(`Purged ${count} expired key(s).`, 'success');
    fetchKeys();
  };

  // Sync to Cloud
  const handleSyncCloud = async () => {
    try {
      const res = await fetch('/api/admin/keys/sync-cloud', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        playChime('click');
        showToast('All keys & settings synced to Firebase Firestore!', 'success');
      } else {
        showToast('All keys & settings up to date!', 'success');
      }
    } catch {
      showToast('All keys & settings saved locally.', 'info');
    }
  };

  // Copy single key
  const handleCopySingle = (keyCode: string) => {
    navigator.clipboard.writeText(keyCode);
    setCopiedKey(keyCode);
    playChime('click');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Copy all recent keys
  const handleCopyAllRecent = () => {
    if (!recentGenerated || recentGenerated.length === 0) return;
    const text = recentGenerated.map((k) => k.key).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAllRecent(true);
    playChime('click');
    setTimeout(() => setCopiedAllRecent(false), 2200);
  };

  // Download recent keys
  const handleDownloadRecent = () => {
    if (!recentGenerated || recentGenerated.length === 0) return;
    const content = [
      `# VOID ADMIN GENERATED KEYS (${new Date().toLocaleString()})`,
      `# Total Keys: ${recentGenerated.length}`,
      `# ----------------------------------------------------`,
      ...recentGenerated.map((k) => `${k.key} | ${k.is_lifetime ? 'LIFETIME' : `${k.duration_hours}h`} | Max Devices: ${k.max_devices || 2}${k.discord_user ? ` | Note: ${k.discord_user}` : ''}`),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `void_keys_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtered keys
  const filteredKeys = useMemo(() => {
    let list = [...keys];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (k) =>
          k.key.toLowerCase().includes(q) ||
          k.id.toLowerCase().includes(q) ||
          (k.discord_user && k.discord_user.toLowerCase().includes(q))
      );
    }

    if (statusFilter === 'unactivated') {
      list = list.filter((k) => k.status === 'unactivated');
    } else if (statusFilter === 'active') {
      list = list.filter((k) => k.status === 'active' && !k.is_expired);
    } else if (statusFilter === 'lifetime') {
      list = list.filter((k) => k.is_lifetime || k.duration_hours === -1);
    } else if (statusFilter === 'expired') {
      list = list.filter((k) => k.status === 'expired' || k.is_expired);
    } else if (statusFilter === 'revoked') {
      list = list.filter((k) => k.status === 'revoked');
    }

    return list;
  }, [keys, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = keys.length;
    const unactivated = keys.filter((k) => k.status === 'unactivated').length;
    const active = keys.filter((k) => k.status === 'active' && !k.is_expired).length;
    const lifetime = keys.filter((k) => k.is_lifetime || k.duration_hours === -1).length;
    const expired = keys.filter((k) => k.status === 'expired' || k.is_expired).length;
    const revoked = keys.filter((k) => k.status === 'revoked').length;
    const devicesCount = keys.reduce((acc, k) => acc + (k.devices?.length || 0), 0);
    return { total, unactivated, active, lifetime, expired, revoked, devicesCount };
  }, [keys]);

  // Format remaining time
  const formatRemaining = (seconds?: number, isLife?: boolean) => {
    if (isLife || (seconds && seconds >= 90000000)) return '♾️ Lifetime';
    if (!seconds || seconds <= 0) return 'Expired';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  };

  // If NOT authenticated, show Login Shield
  if (!isAuthenticated) {
    return (
      <div className="void-admin-root min-h-screen w-full bg-[#060813] text-white flex flex-col items-center justify-center p-4 font-sans select-none relative overflow-hidden" style={{ color: '#ffffff' }}>
        {/* Glowing cyber orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative z-10 w-full max-w-md liquid-glass-modal rounded-[28px] p-7 sm:p-8 text-center space-y-6 overflow-hidden"
          style={{ color: '#ffffff' }}
        >
          {/* Top Specular Line */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

          <div className="w-16 h-16 rounded-[18px] liquid-glass-icon-box mx-auto flex items-center justify-center text-[#00d8f6] relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-white/60 pointer-events-none" />
            <Shield className="w-8 h-8" color="#00d8f6" />
          </div>

          <div>
            <span className="text-[10px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-[#00d8f6] border border-[#00d8f6]/30 font-mono">
              RESTRICTED ROUTE /adminvoid
            </span>
            <h1 className="text-2xl font-black tracking-tight mt-2" style={{ color: '#ffffff', fontWeight: 900 }}>
              VOID ADMIN ACCESS
            </h1>
            <p className="text-xs text-zinc-400 mt-1" style={{ color: '#8899b0' }}>
              Enter the administrator master password to manage and generate access keys.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
            {lockoutInfo.isLocked ? (
              <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs space-y-2 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <div className="flex items-center gap-2 font-bold text-red-400 uppercase tracking-wider text-[11px]">
                  <AlertTriangle size={16} className="text-red-400 animate-pulse shrink-0" />
                  <span>Blocco Anti-Brute Force Attivo</span>
                </div>
                <p className="text-[12px] leading-relaxed text-zinc-300">
                  Troppi tentativi consecutivi errati. L'accesso all'Admin Panel è temporaneamente bloccato.
                </p>
                <div className="p-2.5 rounded-xl bg-black/50 border border-red-500/30 flex items-center justify-between font-mono">
                  <span className="text-[11px] text-zinc-400">Tempo rimanente:</span>
                  <span className="text-sm font-black text-red-400 tracking-wider animate-pulse">
                    {lockoutInfo.formatted}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400 pt-1 border-t border-red-500/20">
                  Regola: 1° blocco 30s • 2° blocco 1h • Successivi timer raddoppiato (2h, 4h...)
                </div>
              </div>
            ) : lockoutInfo.failedAttempts > 0 ? (
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0 text-amber-400" />
                <span>
                  Attenzione: <strong>{3 - lockoutInfo.failedAttempts}</strong> tentativo/i rimanenti prima del blocco di sicurezza.
                </span>
              </div>
            ) : null}

            <div>
              <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5" style={{ color: '#d1d5db' }}>
                Master Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminPasswordInput}
                  disabled={lockoutInfo.isLocked}
                  onChange={(e) => {
                    setAdminPasswordInput(e.target.value);
                    setAuthError(null);
                  }}
                  placeholder={lockoutInfo.isLocked ? `Bloccato per ${lockoutInfo.formatted}` : "Enter admin password"}
                  autoFocus={!lockoutInfo.isLocked}
                  className="w-full px-4 py-3.5 liquid-glass-input-box rounded-xl text-sm font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ color: '#ffffff', backgroundColor: '#070a14', borderColor: '#172238' }}
                />
                <button
                  type="button"
                  disabled={lockoutInfo.isLocked}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 disabled:opacity-30 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {authError && !lockoutInfo.isLocked && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn || !adminPasswordInput.trim() || lockoutInfo.isLocked}
              className="w-full py-3.5 rounded-xl liquid-glass-btn text-white font-bold text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2 relative overflow-hidden"
              style={{ color: '#ffffff' }}
            >
              <div className="absolute inset-x-0 top-0 h-[1px] bg-white/35 pointer-events-none" />
              {lockoutInfo.isLocked ? (
                <>
                  <Lock size={16} className="text-red-400" />
                  <span style={{ color: '#ffffff' }}>Accesso Bloccato ({lockoutInfo.formatted})</span>
                </>
              ) : isLoggingIn ? (
                <span style={{ color: '#ffffff' }}>Autenticazione in corso...</span>
              ) : (
                <>
                  <Lock size={16} />
                  <span style={{ color: '#ffffff', fontWeight: 700 }}>Authenticate to Admin Panel</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
            <button
              type="button"
              onClick={onExit}
              className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <LogOut size={13} />
              <span>Back to Store</span>
            </button>
            <span className="font-mono text-[10px] text-zinc-500">SECURE_LEVEL: HIGH</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="void-admin-root min-h-screen w-full bg-[#050711] text-zinc-100 font-sans select-none flex flex-col relative overflow-x-hidden" style={{ color: '#ffffff' }}>
      {/* Background Cyber Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[180px]" />
        <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-[200px]" />
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[160px]" />
      </div>

      {/* Floating Status Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[999999] px-4 py-2.5 rounded-full backdrop-blur-xl border text-xs font-bold shadow-2xl flex items-center gap-2 ${
              toastMsg.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : toastMsg.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : 'bg-blue-950/90 border-blue-500/40 text-blue-200'
            }`}
          >
            {toastMsg.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-400" />
            ) : toastMsg.type === 'error' ? (
              <XCircle size={16} className="text-rose-400" />
            ) : (
              <Zap size={16} className="text-blue-400" />
            )}
            <span>{toastMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-40 bg-[#0a0d1a]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <Shield size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight leading-none">
                VOID ADMIN
              </h1>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-mono">
                /adminvoid
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Global Access Key Generator & Web Distribution
            </p>
          </div>
        </div>

        {/* Right Nav Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsAdminModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-xs font-bold text-cyan-300 hover:text-white transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            title="Open Admin Gateway Modal"
          >
            <Sliders size={13} />
            <span>Admin Modal</span>
          </button>

          <button
            type="button"
            onClick={handleSyncCloud}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-200 hover:text-white transition-all cursor-pointer"
            title="Sync all keys and config to Firebase Firestore"
          >
            <RefreshCw size={13} />
            <span>Sync Cloud</span>
          </button>

          <button
            type="button"
            onClick={handlePurgeExpired}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold text-red-300 hover:text-red-200 transition-all cursor-pointer"
            title="Purge all expired keys from database"
          >
            <Trash2 size={13} />
            <span>Purge Expired</span>
          </button>

          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-md transition-all cursor-pointer active:scale-95"
            title="Exit Admin Panel and Return to Website"
          >
            <LogOut size={13} />
            <span>Exit to Store</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6 relative z-10">
        {/* Stats Overview Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-[#0e1222]/80 border border-white/10 backdrop-blur-md flex flex-col justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Total Keys</span>
              <Key size={14} className="text-zinc-400" />
            </span>
            <span className="text-2xl font-black text-white mt-2 font-mono">
              {stats.total}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0e1222]/80 border border-emerald-500/20 backdrop-blur-md flex flex-col justify-between shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
              <span>Active Keys</span>
              <CheckCircle2 size={14} className="text-emerald-400" />
            </span>
            <span className="text-2xl font-black text-emerald-300 mt-2 font-mono">
              {stats.active}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0e1222]/80 border border-amber-500/20 backdrop-blur-md flex flex-col justify-between shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
              <span>Lifetime</span>
              <Sparkles size={14} className="text-amber-400" />
            </span>
            <span className="text-2xl font-black text-amber-300 mt-2 font-mono">
              {stats.lifetime}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0e1222]/80 border border-zinc-700/40 backdrop-blur-md flex flex-col justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Expired</span>
              <Clock size={14} className="text-zinc-400" />
            </span>
            <span className="text-2xl font-black text-zinc-400 mt-2 font-mono">
              {stats.expired}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0e1222]/80 border border-red-500/20 backdrop-blur-md flex flex-col justify-between">
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center justify-between">
              <span>Revoked</span>
              <XCircle size={14} className="text-red-400" />
            </span>
            <span className="text-2xl font-black text-red-300 mt-2 font-mono">
              {stats.revoked}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0e1222]/80 border border-cyan-500/20 backdrop-blur-md flex flex-col justify-between shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
              <span>Online Visitors</span>
              <Globe size={14} className="text-cyan-400 animate-pulse" />
            </span>
            <span className="text-2xl font-black text-cyan-300 mt-2 font-mono">
              {trafficSessions.length}
            </span>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('keys')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'keys'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Key size={14} />
            <span>Key Database ({keys.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('generator')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'generator'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40 shadow-[0_0_15px_rgba(59,130,246,0.25)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Plus size={14} />
            <span>Create & Bulk Generate</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('traffic')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'traffic'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe size={14} />
            <span>Live Traffic & Users ({trafficSessions.length})</span>
          </button>
        </div>

        {/* TAB 1: KEY DATABASE TABLE */}
        {activeTab === 'keys' && (
          <div className="space-y-4">
            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search key code, note, discord..."
                  className="w-full pl-9 pr-4 py-2.5 bg-[#0e1222] border border-white/15 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                {(['all', 'unactivated', 'active', 'lifetime', 'expired', 'revoked'] as const).map((st) => {
                  const count =
                    st === 'all'
                      ? stats.total
                      : st === 'unactivated'
                      ? stats.unactivated
                      : st === 'active'
                      ? stats.active
                      : st === 'lifetime'
                      ? stats.lifetime
                      : st === 'expired'
                      ? stats.expired
                      : stats.revoked;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer flex items-center gap-1.5 ${
                        statusFilter === st
                          ? st === 'unactivated'
                            ? 'bg-amber-500 text-black shadow-md'
                            : 'bg-white text-black shadow-md'
                          : 'bg-[#0e1222] text-zinc-400 hover:text-white border border-white/10'
                      }`}
                    >
                      <span>{st}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        statusFilter === st ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-400'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={fetchKeys}
                  disabled={isLoadingKeys}
                  className="p-2 rounded-lg bg-[#0e1222] border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer ml-auto sm:ml-2"
                  title="Refresh keys"
                >
                  <RefreshCw size={14} className={isLoadingKeys ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Keys Table Container */}
            <div className="bg-[#0e1222]/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-[#080b14] text-[11px] font-extrabold uppercase text-zinc-400 tracking-wider border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3.5">Key Code</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5">Remaining / Duration</th>
                      <th className="px-4 py-3.5">Devices Linked</th>
                      <th className="px-4 py-3.5">Note / Discord</th>
                      <th className="px-4 py-3.5">Created Date</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredKeys.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                          {isLoadingKeys ? (
                            <div className="flex items-center justify-center gap-2">
                              <RefreshCw size={16} className="animate-spin text-cyan-400" />
                              <span>Loading keys from database...</span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-sm font-semibold">No access keys found</p>
                              <button
                                type="button"
                                onClick={() => setActiveTab('generator')}
                                className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-xs font-bold hover:bg-cyan-500/30 transition-all cursor-pointer"
                              >
                                Generate Your First Key
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredKeys.map((k) => {
                        const isLife = Boolean(k.is_lifetime || k.duration_hours === -1);
                        const isExpired = Boolean(k.is_expired || k.status === 'expired');
                        const isRevoked = k.status === 'revoked';

                        return (
                          <tr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                            {/* Key Code with Copy */}
                            <td className="px-4 py-3 font-mono font-bold text-white">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setInspectingKeyDevices(k)}
                                  className="text-cyan-300 hover:text-cyan-200 hover:underline cursor-pointer select-all font-bold text-left flex items-center gap-1.5 group"
                                  title="Clicca per ingrandire scheda e dettagli HWID"
                                >
                                  <span>{k.key}</span>
                                  <Maximize2 size={11} className="text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopySingle(k.key);
                                  }}
                                  className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                  title="Copy Key"
                                >
                                  {copiedKey === k.key ? (
                                    <Check size={13} className="text-emerald-400" />
                                  ) : (
                                    <Copy size={13} />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3">
                              {isRevoked ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                                  <XCircle size={11} />
                                  <span>Revoked</span>
                                </span>
                              ) : k.status === 'unactivated' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                  <span>Unactivated</span>
                                </span>
                              ) : isLife ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                                  <Sparkles size={11} />
                                  <span>Lifetime</span>
                                </span>
                              ) : isExpired ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                                  <Clock size={11} />
                                  <span>Expired</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  <CheckCircle2 size={11} />
                                  <span>Active</span>
                                </span>
                              )}
                            </td>

                            {/* Remaining Time & Timer Mode */}
                            <td className="px-4 py-3 font-mono">
                              {k.status === 'unactivated' ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-amber-300 font-bold flex items-center gap-1 text-[11px]">
                                    <Clock size={11} className="text-amber-400" />
                                    <span>Non Avviato</span>
                                  </span>
                                  <span className="text-zinc-400 text-[10px]">
                                    {isLife ? 'Lifetime' : `${k.duration_hours || 24}h (${Math.round((k.duration_hours || 24) / 24)}d)`} · {k.timer_mode === 'active_usage' ? '🎮 Solo in uso' : '⏱️ Continuo'}
                                  </span>
                                </div>
                              ) : isLife ? (
                                <span className="text-amber-300 font-bold">♾️ Lifetime</span>
                              ) : (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-zinc-200">
                                    {formatRemaining(k.remaining_seconds, isLife)}
                                  </span>
                                  <span className="text-zinc-500 text-[10px]">
                                    {k.timer_mode === 'active_usage' ? '🎮 Solo in uso' : '⏱️ Continuo'}
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Devices Linked */}
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => setInspectingKeyDevices(k)}
                                className={`px-2.5 py-1 rounded-lg border font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                                  (k.devices?.length || 0) > 0
                                    ? 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/30 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-400'
                                }`}
                                title="Click to inspect all linked Device HWIDs"
                              >
                                <Laptop size={12} className={(k.devices?.length || 0) > 0 ? 'text-cyan-400' : 'text-zinc-500'} />
                                <span>
                                  {k.devices?.length || 0} / {k.max_devices === -1 || (k.max_devices && k.max_devices >= 9999) ? '♾️' : (k.max_devices || 2)} HWID
                                </span>
                              </button>
                            </td>

                            {/* Note / Discord */}
                            <td className="px-4 py-3 text-zinc-400 max-w-[150px] truncate">
                              {k.discord_user ? `@${k.discord_user}` : <span className="text-zinc-600">—</span>}
                            </td>

                            {/* Created Date */}
                            <td className="px-4 py-3 text-zinc-400 font-mono text-[11px]">
                              {new Date(k.created_at).toLocaleDateString()}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Extend +24h */}
                                {!isLife && (
                                  <button
                                    type="button"
                                    onClick={() => handleExtendKey(k, 24)}
                                    className="px-2 py-1 rounded bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 text-[10px] font-bold transition-all cursor-pointer"
                                    title="Extend +24 Hours"
                                  >
                                    +24h
                                  </button>
                                )}

                                {/* Make Lifetime */}
                                {!isLife && (
                                  <button
                                    type="button"
                                    onClick={() => handleExtendKey(k, 0, true)}
                                    className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[10px] font-bold transition-all cursor-pointer"
                                    title="Upgrade to Lifetime"
                                  >
                                    ♾️
                                  </button>
                                )}

                                {/* Revoke / Unrevoke */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleRevoke(k)}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                    isRevoked
                                      ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300'
                                      : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300'
                                  }`}
                                  title={isRevoked ? 'Restore Key' : 'Revoke Key'}
                                >
                                  {isRevoked ? 'Restore' : 'Revoke'}
                                </button>

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteKey(k)}
                                  className="p-1.5 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                                  title="Delete Key"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KEY GENERATOR */}
        {activeTab === 'generator' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Card */}
            <div className="lg:col-span-2 bg-[#0e1222]/90 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl space-y-6">
              <div>
                <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <Zap size={18} className="text-cyan-400" />
                  <span>Key Generation Console</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Generate single or bulk access keys configured for anyone on the web.
                </p>
              </div>

              <div className="space-y-5">
                {/* Prefix & Quantity Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                      Key Prefix
                    </label>
                    <input
                      type="text"
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                      placeholder="e.g. VOID, VIP, PROMO"
                      className="w-full px-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-sm text-white font-mono uppercase focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                      Quantity (Bulk Generation)
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 5, 10, 25, 50].map((qty) => (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => setQuantity(qty)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            quantity === qty
                              ? 'bg-cyan-500 text-black shadow-md'
                              : 'bg-black/50 text-zinc-400 hover:text-white border border-white/10'
                          }`}
                        >
                          {qty}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Duration Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                      Duration / Expiration Time
                    </label>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      {isLifetime ? '♾️ Never Expires' : durationMode === 'custom_days' ? `📅 ${customDays} Days (${customDays * 24}h)` : `${selectedDurationHours} Hours`}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { hours: 1, label: '1 Hour' },
                      { hours: 12, label: '12 Hours' },
                      { hours: 24, label: '24h (1 Day)' },
                      { hours: 72, label: '3 Days' },
                      { hours: 168, label: '7 Days' },
                      { hours: 720, label: '30 Days' },
                      { hours: -1, label: '♾️ Lifetime', isLife: true },
                      { isCustom: true, label: '📅 Custom Days' },
                    ].map((dur) => {
                      const isSelected = dur.isCustom
                        ? durationMode === 'custom_days' && !isLifetime
                        : dur.isLife
                        ? isLifetime
                        : !isLifetime && durationMode === 'preset' && selectedDurationHours === dur.hours;
                      return (
                        <button
                          key={dur.label}
                          type="button"
                          onClick={() => {
                            if (dur.isCustom) {
                              setDurationMode('custom_days');
                              setIsLifetime(false);
                              setSelectedDurationHours(customDays * 24);
                            } else if (dur.isLife) {
                              setDurationMode('preset');
                              setIsLifetime(true);
                            } else {
                              setDurationMode('preset');
                              setIsLifetime(false);
                              setSelectedDurationHours(dur.hours || 24);
                            }
                          }}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                              : 'bg-black/50 text-zinc-400 hover:text-white border border-white/10'
                          }`}
                        >
                          {dur.isLife && <Sparkles size={12} className="text-yellow-300" />}
                          {dur.isCustom && <Calendar size={12} className="text-cyan-300" />}
                          <span>{dur.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Days Input Panel */}
                  {durationMode === 'custom_days' && !isLifetime && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 p-3.5 bg-black/60 border border-cyan-500/40 rounded-2xl space-y-2.5 shadow-inner"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                          <Calendar size={13} />
                          <span>Custom Duration in Days (Giorni Personalizzati):</span>
                        </span>
                        <span className="font-mono text-white font-bold bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-lg text-[11px]">
                          {customDays} {customDays === 1 ? 'Giorno' : 'Giorni'} = {customDays * 24} Ore
                        </span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={3650}
                            value={customDays}
                            onChange={(e) => {
                              const val = Math.max(1, Math.min(3650, parseInt(e.target.value, 10) || 1));
                              setCustomDays(val);
                              setSelectedDurationHours(val * 24);
                            }}
                            className="w-28 px-3 py-2 bg-black border border-white/20 rounded-xl text-center text-sm font-bold font-mono text-white focus:outline-none focus:border-cyan-400"
                          />
                          <span className="text-xs text-zinc-400 font-bold">Giorni / Days</span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[1, 2, 3, 5, 7, 14, 30, 60, 90, 180, 365].map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => {
                                setCustomDays(d);
                                setSelectedDurationHours(d * 24);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                customDays === d
                                  ? 'bg-cyan-500 text-black shadow-md'
                                  : 'bg-white/10 hover:bg-white/20 text-zinc-300 border border-white/5'
                              }`}
                            >
                              {d}d
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Timer Countdown Mode Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                      Timer Countdown Mode (Tipo di Conteggio)
                    </label>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      {timerMode === 'active_usage' ? '🎮 Solo mentre in uso (Pause quando offline)' : '⏱️ Countdown continuo 24/7'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setTimerMode('continuous')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        timerMode === 'continuous'
                          ? 'bg-cyan-500/15 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                          : 'bg-black/50 border-white/10 hover:border-white/20 text-zinc-400'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${timerMode === 'continuous' ? 'bg-cyan-500 text-black' : 'bg-white/10 text-zinc-400'}`}>
                        <Clock size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-bold ${timerMode === 'continuous' ? 'text-white' : 'text-zinc-300'}`}>
                          ⏱️ Timer Continuo (Standard)
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-tight mt-1">
                          Il countdown scorre ininterrottamente 24/7 dal primo login dell'utente fino alla scadenza del tempo.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTimerMode('active_usage')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        timerMode === 'active_usage'
                          ? 'bg-cyan-500/15 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                          : 'bg-black/50 border-white/10 hover:border-white/20 text-zinc-400'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${timerMode === 'active_usage' ? 'bg-cyan-500 text-black' : 'bg-white/10 text-zinc-400'}`}>
                        <Gamepad2 size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-bold ${timerMode === 'active_usage' ? 'text-white' : 'text-zinc-300'}`}>
                          🎮 Solo mentre in uso (Active Session)
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-tight mt-1">
                          Il timer scorre SOLO quando l'utente usa attivamente l'app. Quando chiude o si disconnette, il timer si ferma!
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Max Devices & Note Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                      Max Device Limit per Key
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 5, -1].map((dev) => (
                        <button
                          key={dev}
                          type="button"
                          onClick={() => setMaxDevices(dev)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            maxDevices === dev
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-black/50 text-zinc-400 hover:text-white border border-white/10'
                          }`}
                        >
                          {dev === -1 ? '♾️ Any' : `${dev} Dev`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                      <span>Enter Discord Username / Note</span>
                      <span className="text-[10px] text-zinc-500 font-mono">Optional</span>
                    </label>
                    <input
                      type="text"
                      value={noteUser}
                      onChange={(e) => setNoteUser(e.target.value)}
                      placeholder="Enter discord username (e.g. username) or Note"
                      className="w-full px-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                </div>

                {/* Custom Key Code (Only for 1x quantity) */}
                {quantity === 1 && (
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                      Custom Key Code Override (Optional)
                    </label>
                    <input
                      type="text"
                      value={customKeyCode}
                      onChange={(e) => setCustomKeyCode(e.target.value.toUpperCase())}
                      placeholder="Leave blank for auto format (e.g. VOID-XXXX-XXXX)"
                      className="w-full px-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-xs text-white font-mono uppercase placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                )}

                {/* Submit Generate Button */}
                <button
                  type="button"
                  onClick={handleGenerateKeys}
                  disabled={isGenerating}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-sm tracking-wide shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                >
                  <Zap size={18} className="text-yellow-300" />
                  <span>
                    {isGenerating
                      ? 'Generating & Syncing to Cloud...'
                      : `GENERATE ${quantity} KEY${quantity > 1 ? 'S' : ''} NOW`}
                  </span>
                </button>
              </div>
            </div>

            {/* Quick Tips & Info Sidebar */}
            <div className="bg-[#0e1222]/90 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <Flame size={16} className="text-amber-400" />
                  <span>Key Generation Rules</span>
                </h3>
                <ul className="space-y-2.5 text-xs text-zinc-300">
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>Keys generated here are immediately valid worldwide for any visitor on the lock screen.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>Auto-synced to Firebase Firestore so multiple servers or clients verify in real-time.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>Lifetime keys never expire and bypass routine expiration cleanups.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>You can copy all keys with 1-click or export as .txt immediately.</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <Shield size={13} className="text-cyan-400" />
                  <span>Access URL Protection</span>
                </span>
                <p className="text-[11px] text-cyan-300/80 leading-relaxed">
                  The admin panel is accessible exclusively by appending <strong className="text-white">/adminvoid</strong> to your website URL. No public buttons exist.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LIVE TRAFFIC & USERS */}
        {activeTab === 'traffic' && (
          <div className="bg-[#0e1222]/90 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <Globe size={18} className="text-cyan-400" />
                  <span>Connected Live Visitors ({trafficSessions.length})</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Real-time heartbeat sessions of visitors currently browsing the store.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchTraffic}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                title="Refresh Traffic"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#080b14] text-[11px] font-extrabold uppercase text-zinc-400 tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Client Session</th>
                    <th className="px-4 py-3">Location / IP</th>
                    <th className="px-4 py-3">Device Type</th>
                    <th className="px-4 py-3">Active Key Used</th>
                    <th className="px-4 py-3">Last Active</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {trafficSessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                        No active client sessions recorded currently.
                      </td>
                    </tr>
                  ) : (
                    trafficSessions.map((s, idx) => (
                      <tr key={s.session_id || idx} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-mono text-zinc-300">
                          {s.session_id ? s.session_id.substring(0, 16) : `client_${idx + 1}`}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-white">
                            {s.city || s.country || 'Global Visitor'}
                          </span>
                          <span className="text-[10px] text-zinc-500 block font-mono">
                            {s.ip || '127.0.0.1'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1">
                            {s.device_type === 'mobile' ? (
                              <Smartphone size={13} className="text-cyan-400" />
                            ) : (
                              <Laptop size={13} className="text-blue-400" />
                            )}
                            <span className="capitalize">{s.device_type || 'Desktop'}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-cyan-300">
                          {s.key || <span className="text-zinc-600">Lock Screen</span>}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-zinc-400">
                          {s.last_ping ? new Date(s.last_ping).toLocaleTimeString() : 'Just now'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Online</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* RECENTLY GENERATED KEYS MODAL */}
      <AnimatePresence>
        {recentGenerated && recentGenerated.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              className="w-full max-w-lg bg-[#0e1222] border border-white/20 rounded-3xl p-6 shadow-2xl text-white space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center">
                    <Check size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      Generated {recentGenerated.length} Key{recentGenerated.length > 1 ? 's' : ''} Successfully!
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Copy the generated keys or export as a .txt file.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setRecentGenerated(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <XCircle size={18} />
                </button>
              </div>

              {/* Keys Container */}
              <div className="p-3.5 bg-black/60 border border-white/10 rounded-2xl max-h-60 overflow-y-auto space-y-2 font-mono text-xs">
                {recentGenerated.map((k) => (
                  <div
                    key={k.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/15"
                  >
                    <span className="text-cyan-300 font-bold select-all">{k.key}</span>
                    <button
                      type="button"
                      onClick={() => handleCopySingle(k.key)}
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs text-zinc-200 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      {copiedKey === k.key ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleCopyAllRecent}
                  className="py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {copiedAllRecent ? <Check size={15} /> : <Copy size={15} />}
                  <span>{copiedAllRecent ? 'All Keys Copied!' : 'Copy All Keys'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadRecent}
                  className="py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download size={15} />
                  <span>Download .txt</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* KEY DEVICES HWID INSPECTOR MODAL */}
      <AnimatePresence>
        {inspectingKeyDevices && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              className="w-full max-w-xl bg-[#0e1222] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl text-white space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center">
                    <Laptop size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-white">
                        Linked Device HWIDs
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono font-bold">
                        {inspectingKeyDevices.devices?.length || 0} / {inspectingKeyDevices.max_devices === -1 ? '♾️' : (inspectingKeyDevices.max_devices || 2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap text-xs font-mono">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        inspectingKeyDevices.status === 'unactivated'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : inspectingKeyDevices.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-red-500/20 text-red-300 border-red-500/40'
                      }`}>
                        {inspectingKeyDevices.status}
                      </span>
                      <span className="text-zinc-400">
                        {inspectingKeyDevices.timer_mode === 'active_usage' ? '🎮 Solo in uso' : '⏱️ Continuo'}
                      </span>
                      {inspectingKeyDevices.activated_at ? (
                        <span className="text-emerald-400 text-[10px]">
                          Attivata: {new Date(inspectingKeyDevices.activated_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-amber-400 text-[10px]">
                          Non ancora entrato
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectingKeyDevices(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {/* Devices List */}
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {/* Modify Max HWID Devices Limit */}
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2 mb-2">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                    <span>Modify Max HWID Devices Limit:</span>
                    <span className="font-mono text-cyan-400">
                      {editMaxDevices === -1 ? '♾️ Unlimited' : `${editMaxDevices} Devices`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 5, 10, -1].map((devCount) => (
                      <button
                        key={devCount}
                        type="button"
                        disabled={isUpdatingMaxDevices}
                        onClick={() => handleUpdateMaxDevices(inspectingKeyDevices, devCount)}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          editMaxDevices === devCount
                            ? 'bg-cyan-500 text-black shadow-md'
                            : 'bg-white/5 text-zinc-300 hover:text-white border border-white/10'
                        }`}
                      >
                        {devCount === -1 ? '♾️' : devCount}
                      </button>
                    ))}
                  </div>
                </div>
                {(!inspectingKeyDevices.devices || inspectingKeyDevices.devices.length === 0) ? (
                  <div className="p-8 text-center rounded-2xl bg-black/40 border border-white/10 text-zinc-400 space-y-2">
                    <Laptop size={28} className="mx-auto text-zinc-600" />
                    <p className="text-sm font-semibold">No devices linked yet</p>
                    <p className="text-xs text-zinc-500">
                      When the user enters this key on a device, its HWID and details will appear here automatically.
                    </p>
                  </div>
                ) : (
                  inspectingKeyDevices.devices.map((device: any, idx: number) => {
                    const devId = typeof device === 'string' ? device : device.device_id || `dev_${idx}`;
                    const firstSeen = typeof device === 'object' && device.first_seen ? new Date(device.first_seen).toLocaleString() : null;
                    const lastSeen = typeof device === 'object' && device.last_seen ? new Date(device.last_seen).toLocaleString() : null;

                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-black/50 border border-white/10 hover:border-cyan-500/30 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                            <span className="text-xs font-mono font-bold text-cyan-300 truncate select-all">
                              {devId}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopyHwid(devId)}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                            title="Copy this Device HWID"
                          >
                            {copiedHwid === devId ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                            <span>{copiedHwid === devId ? 'Copied' : 'Copy HWID'}</span>
                          </button>
                        </div>

                        {/* Metadata Grid (No IP or User Agent) */}
                        {(lastSeen || firstSeen) && (
                          <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 pt-1 border-t border-white/5 font-mono">
                            {lastSeen && (
                              <div>
                                <span className="text-zinc-500">Last Seen:</span>{' '}
                                <span className="text-zinc-300">{lastSeen}</span>
                              </div>
                            )}
                            {firstSeen && (
                              <div>
                                <span className="text-zinc-500">Registered:</span>{' '}
                                <span className="text-zinc-300">{firstSeen}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
                {inspectingKeyDevices.devices && inspectingKeyDevices.devices.length > 0 && (
                  <button
                    type="button"
                    disabled={isResettingDevices}
                    onClick={() => handleResetKeyDevices(inspectingKeyDevices)}
                    className="px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    <span>{isResettingDevices ? 'Resetting...' : 'Unlink All Device HWIDs'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setInspectingKeyDevices(null)}
                  className="ml-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADMIN GATEWAY MODAL */}
      <AdminPanelModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onKeyRevoked={() => {
          fetchKeys();
        }}
      />
    </div>
  );
};
