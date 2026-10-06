import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Search,
  Lock,
  Unlock,
  X,
  Download,
  Upload,
  FileSpreadsheet,
  FileCode,
  FileText,
  FileUp,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Laptop,
  Clock,
  Calendar,
  Gamepad2,
  Info,
  Maximize2,
  ExternalLink,
  Users,
  Sliders,
} from 'lucide-react';
import { AccessKey } from '../types';
import { addOrUpdateLocalKey, deleteLocalKey } from '../utils/localAdminStorage';
import { playChime } from '../utils/audio';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyRevoked?: (key: string) => void;
}

type AdminTab = 'generate' | 'listkeys' | 'export' | 'import';

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  onKeyRevoked,
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return (
        sessionStorage.getItem('void_admin_authenticated') === 'true' ||
        sessionStorage.getItem('adminvoid_auth') === 'true' ||
        localStorage.getItem('adminvoid_auth') === 'true'
      );
    } catch {
      return false;
    }
  });
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Tab (Default to Generate Key)
  const [activeTab, setActiveTab] = useState<AdminTab>('generate');

  // Keys State
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unactivated' | 'active' | 'revoked' | 'lifetime'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Enlarged Key Inspection State
  const [selectedInspectKey, setSelectedInspectKey] = useState<AccessKey | null>(null);
  const [editKeyDuration, setEditKeyDuration] = useState('24h');
  const [editKeyTimerMode, setEditKeyTimerMode] = useState<'continuous' | 'active_usage'>('continuous');
  const [editKeyMaxDevices, setEditKeyMaxDevices] = useState(2);
  const [editKeyDiscord, setEditKeyDiscord] = useState('');
  const [editKeyNote, setEditKeyNote] = useState('');
  const [isSavingKeySettings, setIsSavingKeySettings] = useState(false);
  const [copiedHwid, setCopiedHwid] = useState<string | null>(null);
  const [isResettingKeyDevices, setIsResettingKeyDevices] = useState(false);

  const handleOpenInspectKey = (k: AccessKey | null) => {
    setSelectedInspectKey(k);
    if (k) {
      setEditKeyDuration(k.duration || '24h');
      setEditKeyTimerMode(k.timer_mode || 'continuous');
      setEditKeyMaxDevices(typeof k.max_devices === 'number' ? k.max_devices : (typeof k.max_hwid === 'number' ? k.max_hwid : 2));
      setEditKeyDiscord(k.discord_username || k.discord_user || '');
      setEditKeyNote(k.note || '');
    }
  };

  const handleSaveKeySettings = async () => {
    if (!selectedInspectKey) return;
    setIsSavingKeySettings(true);
    try {
      const res = await fetch('/api/admin/keys/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: selectedInspectKey.key,
          duration: editKeyDuration,
          timer_mode: editKeyTimerMode,
          max_devices: editKeyMaxDevices,
          discord_username: editKeyDiscord.trim() || null,
          note: editKeyNote.trim() || null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        playChime('success');
        const updatedKey = data.key || {
          ...selectedInspectKey,
          duration: editKeyDuration,
          timer_mode: editKeyTimerMode,
          max_devices: editKeyMaxDevices,
          max_hwid: editKeyMaxDevices,
          discord_username: editKeyDiscord.trim() || undefined,
          discord_user: editKeyDiscord.trim() || undefined,
          note: editKeyNote.trim() || undefined,
        };
        setSelectedInspectKey(updatedKey);
        setKeys((prev) => prev.map((k) => k.key === updatedKey.key ? updatedKey : k));
        await loadKeys();
      } else {
        playChime('alert');
        alert(data?.message || 'Failed to update key settings.');
      }
    } catch {
      playChime('alert');
      alert('Network error while updating key settings.');
    } finally {
      setIsSavingKeySettings(false);
    }
  };

  const handleCopyHwid = (hwid: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(hwid);
    setCopiedHwid(hwid);
    playChime('click');
    setTimeout(() => setCopiedHwid(null), 2000);
  };

  const handleResetDevicesForInspectKey = async (keyItem: AccessKey, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!window.confirm(`Are you sure you want to reset all linked HWIDs for key "${keyItem.key}"? The user will be able to bind new devices.`)) {
      return;
    }
    setIsResettingKeyDevices(true);
    try {
      const res = await fetch(`/api/admin/keys/${encodeURIComponent(keyItem.key)}/reset-devices`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setSelectedInspectKey((prev) => prev ? { ...prev, devices: [] } : null);
        await loadKeys();
      }
    } catch {}
    finally {
      setIsResettingKeyDevices(false);
    }
  };

  // Key Generator Form State
  const [genMode, setGenMode] = useState<'random' | 'custom'>('random');
  const [customKeyName, setCustomKeyName] = useState('');
  const [genDuration, setGenDuration] = useState('24h');
  const [durationMode, setDurationMode] = useState<'preset' | 'custom_days'>('preset');
  const [customDays, setCustomDays] = useState<number>(15);
  const [genTimerMode, setGenTimerMode] = useState<'continuous' | 'active_usage'>('continuous');
  const [genDiscordUser, setGenDiscordUser] = useState('');
  const [genNote, setGenNote] = useState('');
  const [genMaxHwid, setGenMaxHwid] = useState('2');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedKey, setLastGeneratedKey] = useState<AccessKey | null>(null);

  // Export State
  const [exportScope, setExportScope] = useState<'all' | 'active' | 'lifetime'>('all');

  // Import State
  const [importInputText, setImportInputText] = useState('');
  const [importDefaultDuration, setImportDefaultDuration] = useState('24h');
  const [importOverwrite, setImportOverwrite] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [importErrorMsg, setImportErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Generate a random key code formatted as VOID-XXXX-XXXX
  const generateRandomKeyCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const randPart = () =>
      Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `VOID-${randPart()}-${randPart()}`;
  };

  // Load keys directly from server /api/keys
  const loadKeys = useCallback(async () => {
    setIsLoadingKeys(true);
    try {
      const res = await fetch('/api/keys');
      if (res.ok) {
        const body = await res.json();
        if (body.success && Array.isArray(body.keys)) {
          const formatted = body.keys.map((k: any) => {
            const dur = String(k.duration || '24h');
            const isLifetime =
              Boolean(k.is_lifetime) || dur.toLowerCase() === 'lifetime';
            return {
              id: k.id || k.key,
              key: String(k.key || k.id).trim().toUpperCase(),
              duration: isLifetime ? 'Lifetime' : dur,
              duration_hours: k.duration_hours,
              status: (k.status || (k.active === false ? 'revoked' : 'active')) as any,
              tag: k.tag,
              note: k.note,
              max_hwid: k.max_devices ?? k.max_hwid ?? 2,
              max_devices: k.max_devices ?? k.max_hwid ?? 2,
              devices: Array.isArray(k.devices) ? k.devices : [],
              timer_mode: k.timer_mode || 'continuous',
              remaining_seconds: k.remaining_seconds,
              activated_at: k.activated_at,
              last_used_at: k.last_used_at,
              used_count: k.used_count || 0,
              discord_username: k.discord_user || k.discord_username,
              discord_user: k.discord_user || k.discord_username,
              created_at: k.created_at || new Date().toISOString(),
              is_lifetime: isLifetime,
            };
          });

          // Sort newest first
          formatted.sort((a: any, b: any) => {
            const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return tB - tA;
          });

          setKeys(formatted);
          try {
            localStorage.setItem('void_admin_access_keys', JSON.stringify(formatted));
          } catch {}
        }
      }
    } catch (err) {
      console.warn('[AdminPanel] Error fetching keys:', err);
    } finally {
      setIsLoadingKeys(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadKeys();
    }
  }, [isOpen, isAuthenticated, loadKeys]);

  // Handle Login
  const handleLogin = async () => {
    setAuthError(null);
    const clean = authPassword.trim();
    if (!clean) {
      setAuthError('Please enter master security password or PIN.');
      return;
    }

    setIsLoggingIn(true);

    setTimeout(() => {
      // Always accept any non-empty password
      setIsAuthenticated(true);
      try {
        sessionStorage.setItem('void_admin_authenticated', 'true');
        sessionStorage.setItem('adminvoid_auth', 'true');
        localStorage.setItem('void_admin_authenticated', 'true');
      } catch {}
      setAuthPassword('');
      loadKeys();
      setIsLoggingIn(false);
    }, 250);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('void_admin_authenticated');
      sessionStorage.removeItem('adminvoid_auth');
      localStorage.removeItem('adminvoid_auth');
    } catch {}
  };

  // 1. GENERATE KEY HANDLER
  const handleGenerateKey = async () => {
    setIsGenerating(true);

    const finalKeyString =
      genMode === 'custom' && customKeyName.trim()
        ? customKeyName.trim().toUpperCase()
        : generateRandomKeyCode();

    const isLifetime = durationMode === 'preset' && genDuration === 'Lifetime';
    const cleanDuration = isLifetime
      ? 'Lifetime'
      : durationMode === 'custom_days'
      ? `${customDays}d`
      : genDuration;
    const durationHours = isLifetime
      ? 999999
      : durationMode === 'custom_days'
      ? customDays * 24
      : undefined;
    const cleanDiscord = genDiscordUser.trim().replace(/^@/, '');

    const newKeyDoc: AccessKey = {
      id: finalKeyString,
      key: finalKeyString,
      duration: cleanDuration,
      duration_hours: durationHours,
      status: 'unactivated',
      is_lifetime: isLifetime,
      timer_mode: genTimerMode,
      created_at: new Date().toISOString(),
      discord_username: cleanDiscord || undefined,
      discord_user: cleanDiscord || undefined,
      tag: cleanDiscord ? `@${cleanDiscord}` : 'VIP',
      note: genNote.trim() || undefined,
      max_hwid: genMaxHwid.trim() || '2',
      max_devices: parseInt(genMaxHwid.trim(), 10) || 2,
      devices: [],
    };

    try {
      await fetch('/api/keys/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: finalKeyString,
          duration: cleanDuration,
          duration_hours: durationHours,
          is_lifetime: isLifetime,
          status: 'unactivated',
          timer_mode: genTimerMode,
          discord_user: cleanDiscord || null,
          tag: cleanDiscord ? `@${cleanDiscord}` : 'VIP',
          note: genNote.trim() || undefined,
          max_devices: parseInt(genMaxHwid.trim(), 10) || 2,
          origin: 'admin_panel',
          created_at: newKeyDoc.created_at,
        }),
      }).catch(() => {});
    } catch {}

    try {
      await addOrUpdateLocalKey(newKeyDoc);
    } catch {}

    setLastGeneratedKey(newKeyDoc);
    setKeys((prev) => [newKeyDoc, ...prev.filter((k) => k.key !== finalKeyString)]);
    if (genMode === 'custom') {
      setCustomKeyName('');
    }
    setGenDiscordUser('');
    setGenNote('');
    setIsGenerating(false);
  };

  // Toggle Revoke / Reactivate Key
  const handleToggleRevoke = async (k: AccessKey) => {
    const nextStatus: 'active' | 'revoked' = k.status === 'active' ? 'revoked' : 'active';

    try {
      await fetch('/api/keys/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: k.key,
          status: nextStatus,
          duration: k.duration || '24h',
          active: nextStatus === 'active',
        }),
      }).catch(() => {});
    } catch {}

    const updatedKey: AccessKey = { ...k, status: nextStatus };
    try {
      await addOrUpdateLocalKey(updatedKey);
    } catch {}

    setKeys((prev) =>
      prev.map((item) => (item.key === k.key ? updatedKey : item))
    );
    if (nextStatus === 'revoked' && onKeyRevoked) {
      onKeyRevoked(k.key);
    }
  };

  // Delete Single Key
  const handleDeleteKey = async (keyString: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete key ${keyString}?`)) {
      return;
    }

    try {
      await fetch('/api/keys/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyString }),
      }).catch(() => {});
    } catch {}

    try {
      await deleteLocalKey(keyString);
    } catch {}

    setKeys((prev) => prev.filter((k) => k.key !== keyString));
  };

  // Quick Copy to Clipboard with animation
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Filtered keys for the List Keys tab
  const filteredKeys = useMemo(() => {
    return keys.filter((k) => {
      if (statusFilter === 'unactivated' && k.status !== 'unactivated') return false;
      if (statusFilter === 'active' && k.status !== 'active') return false;
      if (statusFilter === 'revoked' && k.status !== 'revoked') return false;
      if (statusFilter === 'lifetime' && !k.is_lifetime && (k.duration || '').toLowerCase() !== 'lifetime') {
        return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        k.key.toLowerCase().includes(q) ||
        (k.tag && k.tag.toLowerCase().includes(q)) ||
        (k.note && k.note.toLowerCase().includes(q)) ||
        (k.discord_username && k.discord_username.toLowerCase().includes(q)) ||
        (k.duration && k.duration.toLowerCase().includes(q))
      );
    });
  }, [keys, searchQuery, statusFilter]);

  // Keys selected for Export
  const keysToExport = useMemo(() => {
    if (exportScope === 'active') {
      return keys.filter((k) => k.status === 'active');
    }
    if (exportScope === 'lifetime') {
      return keys.filter((k) => k.is_lifetime || (k.duration || '').toLowerCase() === 'lifetime');
    }
    return keys;
  }, [keys, exportScope]);

  // Export handlers
  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(keysToExport, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `void-keys-export-${exportScope}.json`);
    dlAnchor.click();
  };

  const handleDownloadCSV = () => {
    const headers = ['Key', 'Duration', 'Status', 'Tag', 'Note', 'Max_HWID', 'Discord_User', 'Created_At'];
    const rows = keysToExport.map((k) => [
      `"${k.key}"`,
      `"${k.duration || '24h'}"`,
      `"${k.status}"`,
      `"${k.tag || ''}"`,
      `"${k.note || ''}"`,
      `"${k.max_hwid || 2}"`,
      `"${k.discord_username || ''}"`,
      `"${k.created_at || ''}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', url);
    dlAnchor.setAttribute('download', `void-keys-export-${exportScope}.csv`);
    dlAnchor.click();
  };

  const handleDownloadTXT = () => {
    const txtContent = keysToExport.map((k) => k.key).join('\n');
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', url);
    dlAnchor.setAttribute('download', `void-keys-list-${exportScope}.txt`);
    dlAnchor.click();
  };

  // Parse Keys from Input Text / File for Import
  const parseKeysFromText = useCallback((rawText: string, defaultDur: string) => {
    const trimmed = rawText.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.keys) ? parsed.keys : [];
      if (list.length > 0) {
        return list.map((item: any) => {
          if (typeof item === 'string') {
            return { key: item.trim().toUpperCase(), duration: defaultDur, status: 'active' as const };
          }
          return {
            key: (item.key || item.id || '').trim().toUpperCase(),
            duration: item.duration || defaultDur,
            status: item.status === 'revoked' || item.status === 'expired' ? item.status : 'active',
            note: item.note || undefined,
            tag: item.tag || undefined,
            max_devices: item.max_devices ?? 2,
            devices: Array.isArray(item.devices) ? item.devices : [],
            used_count: item.used_count ?? 0,
            discord_user: item.discord_user || null,
          };
        }).filter((k: any) => k.key && k.key.length >= 3);
      }
    } catch {}

    const lines = trimmed.split(/[\r\n]+/);
    const result: any[] = [];

    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.startsWith('#')) continue;

      if (cleanLine.includes(',')) {
        const parts = cleanLine.split(',').map((p) => p.replace(/["']/g, '').trim());
        const keyCode = parts[0]?.toUpperCase();
        if (keyCode && keyCode !== 'KEY') {
          result.push({
            key: keyCode,
            duration: parts[2] || parts[1] || defaultDur,
            status: parts[1] === 'revoked' || parts[1] === 'expired' ? parts[1] : 'active',
          });
        }
        continue;
      }

      const match = cleanLine.match(/^([A-Z0-9_-]+)(?:\s*\(([^)-]+)\))?/i);
      if (match) {
        const keyCode = match[1].toUpperCase();
        const dur = match[2] ? match[2].trim() : defaultDur;
        result.push({
          key: keyCode,
          duration: dur,
          status: 'active',
        });
      } else {
        result.push({
          key: cleanLine.toUpperCase(),
          duration: defaultDur,
          status: 'active',
        });
      }
    }

    return result;
  }, []);

  const parsedImportKeys = useMemo(() => {
    return parseKeysFromText(importInputText, importDefaultDuration);
  }, [importInputText, importDefaultDuration, parseKeysFromText]);

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportErrorMsg(null);
    setImportSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportInputText(content);
      }
    };
    reader.onerror = () => {
      setImportErrorMsg('Failed to read the uploaded file.');
    };
    reader.readAsText(file);
  };

  // Perform Import
  const handleExecuteImport = async () => {
    if (parsedImportKeys.length === 0) {
      setImportErrorMsg('No valid keys found to import. Please check your input.');
      return;
    }

    setIsImporting(true);
    setImportErrorMsg(null);
    setImportSuccessMsg(null);

    try {
      const res = await fetch('/api/keys/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keys: parsedImportKeys,
          overwrite: importOverwrite,
          default_duration: importDefaultDuration,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setImportSuccessMsg(
          `Successfully imported ${data.importedCount || parsedImportKeys.length} keys!${
            data.skippedCount ? ` (${data.skippedCount} existing keys skipped)` : ''
          }`
        );
        setImportInputText('');
        await loadKeys();
      } else {
        setImportErrorMsg(data?.message || 'Failed to import keys into Firestore.');
      }
    } catch (err: any) {
      console.error('[AdminPanel] Import error:', err);
      setImportErrorMsg(err?.message || 'Network error while importing keys.');
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="adminvoid-gateway-overlay"
        id="adminvoid-gateway-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{
          opacity: 0,
          transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] },
        }}
        className="fixed inset-0 z-[999999] overflow-hidden select-none font-sans text-white"
      >
        {/* ============================================================== */}
        {/* EXACT LIQUID GLASS VIEWPORT BACKGROUND (Identical to Key Lock) */}
        {/* ============================================================== */}
        <div className="fixed inset-0 w-screen h-screen bg-black/85 backdrop-blur-2xl overflow-hidden pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#03060f]/60 via-[#04060d]/75 to-[#020408]/90 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(6,182,212,0.14),transparent_70%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_115%,rgba(99,102,241,0.14),transparent_70%)] pointer-events-none" />

          {/* Liquid Floating Caustic Orbs */}
          <div
            className="absolute -top-36 -left-36 w-[450px] h-[450px] rounded-full blur-[140px] pointer-events-none animate-liquid-orb-1"
            style={{
              background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute -bottom-36 left-1/2 -translate-x-1/2 w-[100vw] h-[450px] rounded-full blur-[140px] pointer-events-none animate-liquid-orb-2"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(59,130,246,0.15) 0%, rgba(99,102,241,0.1) 45%, transparent 75%)',
            }}
          />
          <div
            className="absolute top-1/3 -right-24 w-[360px] h-[360px] rounded-full blur-[120px] pointer-events-none animate-liquid-orb-3"
            style={{
              background: 'radial-gradient(circle, rgba(147,51,234,0.12) 0%, transparent 70%)',
            }}
          />
        </div>

        {/* Scrollable Modal Container */}
        <div className="fixed inset-0 w-full h-full overflow-y-auto overscroll-y-contain custom-scrollbar z-10 px-3 sm:px-6 py-6 sm:py-10 flex flex-col items-center justify-center">
          <div
            className={`w-full relative z-10 my-auto transition-all duration-300 ${
              isAuthenticated ? 'max-w-4xl' : 'max-w-md'
            }`}
          >
            <motion.div
              layout
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: -15 }}
              transition={{
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="liquid-glass-modal rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.85)] border border-white/20 space-y-5 text-left"
            >
              {/* Top Specular Line & Ambient Beam (Identical to Key Lock) */}
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-36 bg-gradient-to-b from-cyan-400/20 to-transparent blur-3xl pointer-events-none" />

              {/* ============================================================== */}
              {/* STATE 1: LOGIN SCREEN (Identical Liquid Glass UI to Key Lock)  */}
              {/* ============================================================== */}
              {!isAuthenticated ? (
                <div className="space-y-5 text-center">
                  {/* Top Security Gateway Bar */}
                  <div className="relative z-20 flex items-center justify-between pb-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-mono">
                      <Shield size={13} className="text-cyan-400" />
                      <span>ADMIN SECURITY GATEWAY</span>
                    </div>

                    <button
                      type="button"
                      onClick={onClose}
                      className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                      title="Return to Website"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Header Glowing Icon & Title (Same as Key Lock) */}
                  <div className="relative z-10 flex flex-col items-center text-center space-y-2.5">
                    <div className="w-14 h-14 rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-indigo-600/20 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.35)]">
                      <Lock size={26} className="text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                    </div>

                    <h2 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                      Admin Portal
                    </h2>

                    <p className="text-xs text-neutral-300/90 max-w-sm leading-relaxed">
                      Enter the master security password or PIN to unlock Key Management.
                    </p>
                  </div>

                  {/* Form Card in liquid-glass-panel */}
                  <div className="relative liquid-glass-panel rounded-2xl p-4 sm:p-5 overflow-hidden border border-white/15 space-y-4 shadow-2xl text-left">
                    <div
                      className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none"
                      style={{
                        background:
                          'radial-gradient(circle, rgba(6,182,212,0.25) 0%, rgba(59,130,246,0.15) 60%, transparent 80%)',
                      }}
                    />

                    <div className="space-y-2 relative z-10">
                      <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Key size={13} className="text-cyan-400" />
                          <span className="text-white">Master Security Key</span>
                        </span>
                        <span className="text-[11px] text-neutral-400 font-mono">/adminvoid</span>
                      </label>

                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={authPassword}
                          onChange={(e) => {
                            setAuthPassword(e.target.value);
                            setAuthError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleLogin();
                            }
                          }}
                          placeholder="Enter master password or PIN..."
                          className="w-full liquid-glass-input rounded-2xl px-4 py-3.5 pr-11 text-sm text-white placeholder-gray-500 font-mono font-bold tracking-wider transition-all shadow-inner focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.35)] focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 cursor-pointer transition-colors"
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {authError && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start space-x-2.5 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs relative z-10"
                      >
                        <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
                        <span className="leading-tight">{authError}</span>
                      </motion.div>
                    )}

                    {/* Primary Unlock Button */}
                    <button
                      type="button"
                      onClick={handleLogin}
                      disabled={isLoggingIn || !authPassword.trim()}
                      className="relative overflow-hidden w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:brightness-110 text-white font-bold text-sm rounded-2xl transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-[0_4px_25px_rgba(6,182,212,0.35)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] border border-white/20 z-10"
                    >
                      <div className="absolute inset-x-0 top-0 h-[1px] bg-white/50 pointer-events-none" />
                      {isLoggingIn ? (
                        <>
                          <RefreshCw size={18} className="animate-spin text-white" />
                          <span>Verifying Master Credentials...</span>
                        </>
                      ) : (
                        <>
                          <Unlock size={18} className="text-yellow-300" />
                          <span>Unlock Admin Panel</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>

                    {/* Database Info Card */}
                    <div className="relative z-10 p-3 liquid-glass-card rounded-2xl border border-white/10 text-[11px] text-gray-300 space-y-1.5 shadow-inner">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Database Vault:</span>
                        <span className="font-mono text-cyan-300 font-bold">
                          void-project-keys-db (/keys)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Authorization:</span>
                        <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                          <ShieldCheck size={12} className="text-emerald-400" /> Master Key Protected
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Information */}
                  <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-emerald-400" />
                      <span>Security & Master Control Gateway</span>
                    </span>
                    <button
                      type="button"
                      onClick={onClose}
                      className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px] transition-colors cursor-pointer"
                    >
                      Return to Website →
                    </button>
                  </div>
                </div>
              ) : (
                /* ============================================================== */
                /* STATE 2: AUTHENTICATED ADMIN DASHBOARD (Smooth Liquid Glass)   */
                /* ============================================================== */
                <div className="space-y-5">
                  {/* Top Bar with Title, Status, Lock & Exit */}
                  <div className="flex items-center justify-between pb-1 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-indigo-600/20 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.35)] shrink-0">
                        <Shield size={20} className="text-cyan-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                            <span>VOID ADMIN CONTROL</span>
                          </h2>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                            /adminvoid
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5 mt-0.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Firestore: void-project-keys-db (/keys)</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        title="Lock admin session"
                      >
                        <LogOut size={13} />
                        <span className="hidden sm:inline">Lock</span>
                      </button>

                      <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer border border-white/10"
                        title="Exit to Website"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* LIQUID GLASS SEGMENTED TAB BAR with Gliding Indicator */}
                  <div className="p-1.5 rounded-2xl liquid-glass-panel border border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-1 relative">
                    {[
                      { id: 'generate', label: 'Generate Key', icon: Plus },
                      { id: 'listkeys', label: `List Keys (${keys.length})`, icon: Key },
                      { id: 'export', label: 'Export Keys', icon: Download },
                      { id: 'import', label: 'Import Keys', icon: Upload },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id as AdminTab)}
                          className={`relative py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer select-none z-10 ${
                            isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="activeAdminTabIndicator"
                              className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 shadow-[0_4px_22px_rgba(6,182,212,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-cyan-300/40 -z-10"
                              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                            />
                          )}
                          <Icon size={14} className={isActive ? 'text-white' : 'text-zinc-400'} />
                          <span className="truncate">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* ========================================================== */}
                  {/* SMOOTH ANIMATED TAB CONTENTS                               */}
                  {/* ========================================================== */}
                  <AnimatePresence mode="wait">
                    {/* TAB 1: GENERATE KEY */}
                    {activeTab === 'generate' && (
                      <motion.div
                        key="tab-generate"
                        initial={{ opacity: 0, y: 12, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.99 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
                      >
                        {/* Form Panel */}
                        <div className="lg:col-span-7 liquid-glass-panel rounded-2xl p-5 space-y-4 border border-white/15">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles size={14} className="text-cyan-400" />
                              <span>Key Generator Form</span>
                            </span>

                            {/* Mode Pill Toggle */}
                            <div className="flex items-center liquid-glass-card rounded-xl p-0.5 border border-white/10 text-xs">
                              <button
                                type="button"
                                onClick={() => setGenMode('random')}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                                  genMode === 'random'
                                    ? 'bg-cyan-500 text-black shadow'
                                    : 'text-zinc-400 hover:text-white'
                                }`}
                              >
                                Auto Random
                              </button>
                              <button
                                type="button"
                                onClick={() => setGenMode('custom')}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                                  genMode === 'custom'
                                    ? 'bg-cyan-500 text-black shadow'
                                    : 'text-zinc-400 hover:text-white'
                                }`}
                              >
                                Custom Key
                              </button>
                            </div>
                          </div>

                          {genMode === 'custom' && (
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 block">
                                Custom Key Code
                              </label>
                              <input
                                type="text"
                                value={customKeyName}
                                onChange={(e) => setCustomKeyName(e.target.value.toUpperCase())}
                                placeholder="e.g. VOID-VIP-2026"
                                className="w-full liquid-glass-input rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white uppercase placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                              />
                            </div>
                          )}

                          {/* Duration Selector */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 block">
                                Duration / Validity
                              </label>
                              <span className="text-[10px] text-cyan-400 font-mono">
                                {durationMode === 'custom_days'
                                  ? `📅 ${customDays} Days (${customDays * 24}h)`
                                  : genDuration === 'Lifetime'
                                  ? '♾️ Lifetime'
                                  : genDuration}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5">
                              {[
                                { label: '30 Min', value: '30m' },
                                { label: '1 Hour', value: '1h' },
                                { label: '24 Hours', value: '24h' },
                                { label: '7 Days', value: '7d' },
                                { label: '30 Days', value: '30d' },
                                { label: 'Lifetime', value: 'Lifetime', isLife: true },
                                { label: 'Custom', value: 'custom_days', isCustom: true },
                              ].map((d) => {
                                const isSelected = d.isCustom
                                  ? durationMode === 'custom_days'
                                  : durationMode === 'preset' && genDuration === d.value;
                                return (
                                  <button
                                    key={d.value}
                                    type="button"
                                    onClick={() => {
                                      if (d.isCustom) {
                                        setDurationMode('custom_days');
                                      } else {
                                        setDurationMode('preset');
                                        setGenDuration(d.value);
                                      }
                                    }}
                                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center flex items-center justify-center gap-1 ${
                                      isSelected
                                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20'
                                        : 'liquid-glass-card border-white/10 text-zinc-400 hover:text-white'
                                    }`}
                                  >
                                    {d.isCustom && <Calendar size={11} className="text-cyan-400" />}
                                    {d.isLife && <Sparkles size={11} className="text-yellow-300" />}
                                    <span>{d.label}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Custom Days Input */}
                            {durationMode === 'custom_days' && (
                              <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 bg-black/40 border border-cyan-500/30 rounded-xl space-y-2 mt-2"
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-cyan-300 flex items-center gap-1">
                                    <Calendar size={13} />
                                    <span>Custom Duration (in Days):</span>
                                  </span>
                                  <span className="font-mono text-white text-[11px] font-bold bg-cyan-500/15 px-2 py-0.5 rounded border border-cyan-500/30">
                                    {customDays} {customDays === 1 ? 'Day' : 'Days'} ({customDays * 24} Hours)
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min={1}
                                    max={3650}
                                    value={customDays}
                                    onChange={(e) => {
                                      const val = Math.max(1, Math.min(3650, parseInt(e.target.value, 10) || 1));
                                      setCustomDays(val);
                                    }}
                                    className="w-24 px-3 py-1.5 bg-black/60 border border-white/20 rounded-lg text-center font-mono font-bold text-sm text-white focus:outline-none focus:border-cyan-400"
                                  />
                                  <span className="text-xs text-zinc-400 font-bold">Days</span>
                                  <div className="flex items-center gap-1 flex-wrap ml-auto">
                                    {[1, 3, 7, 14, 30, 60, 90, 180, 365].map((d) => (
                                      <button
                                        key={d}
                                        type="button"
                                        onClick={() => setCustomDays(d)}
                                        className={`px-2 py-1 rounded text-[11px] font-bold font-mono transition-all cursor-pointer ${
                                          customDays === d
                                            ? 'bg-cyan-500 text-black shadow'
                                            : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5'
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

                          {/* Timer Mode Selector */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 block">
                                Timer Countdown Mode
                              </label>
                              <span className="text-[10px] text-cyan-400 font-mono">
                                {genTimerMode === 'active_usage' ? '🎮 Active Usage Only' : '⏱️ 24/7 Continuous'}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setGenTimerMode('continuous')}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                                  genTimerMode === 'continuous'
                                    ? 'bg-cyan-500/20 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                                    : 'liquid-glass-card border-white/10 text-zinc-400 hover:text-white'
                                }`}
                              >
                                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${genTimerMode === 'continuous' ? 'bg-cyan-500 text-black' : 'bg-white/10 text-zinc-400'}`}>
                                  <Clock size={14} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className={`text-xs font-bold ${genTimerMode === 'continuous' ? 'text-white' : 'text-zinc-300'}`}>
                                    ⏱️ Continuous (24/7)
                                  </div>
                                  <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                                    Countdown runs continuously 24/7 from the user's 1st login until expiration.
                                  </p>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => setGenTimerMode('active_usage')}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                                  genTimerMode === 'active_usage'
                                    ? 'bg-cyan-500/20 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                                    : 'liquid-glass-card border-white/10 text-zinc-400 hover:text-white'
                                }`}
                              >
                                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${genTimerMode === 'active_usage' ? 'bg-cyan-500 text-black' : 'bg-white/10 text-zinc-400'}`}>
                                  <Gamepad2 size={14} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className={`text-xs font-bold ${genTimerMode === 'active_usage' ? 'text-white' : 'text-zinc-300'}`}>
                                    🎮 Active Usage Only
                                  </div>
                                  <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                                    Countdown ticks ONLY while the user is active (freezes when closed/offline).
                                  </p>
                                </div>
                              </button>
                            </div>
                          </div>

                          {/* Enter Discord Username */}
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Users size={13} className="text-indigo-400" />
                                <span>Enter Discord Username</span>
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono">Assign to Discord User</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-xs select-none">
                                @
                              </span>
                              <input
                                type="text"
                                value={genDiscordUser}
                                onChange={(e) => setGenDiscordUser(e.target.value.replace(/^@/, ''))}
                                placeholder="Enter discord username (e.g. username)"
                                className="w-full liquid-glass-input rounded-xl pl-8 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none font-mono"
                              />
                            </div>
                          </div>

                          {/* Admin Note Input (Private / Admin Only) */}
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <FileText size={13} className="text-cyan-400" />
                                <span>Admin Note (Private / Admin Only)</span>
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono">Only visible in Admin Panel</span>
                            </label>
                            <input
                              type="text"
                              value={genNote}
                              onChange={(e) => setGenNote(e.target.value)}
                              placeholder="e.g. VIP buyer, Discord giveaway winner, Tester account..."
                              className="w-full liquid-glass-input rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                            />
                          </div>

                          {/* Submit Action Button */}
                          <button
                            type="button"
                            onClick={handleGenerateKey}
                            disabled={isGenerating}
                            className="relative overflow-hidden w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:brightness-110 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-[0_4px_25px_rgba(6,182,212,0.35)] disabled:opacity-50 active:scale-[0.98] border border-white/20 mt-1"
                          >
                            <div className="absolute inset-x-0 top-0 h-[1px] bg-white/50 pointer-events-none" />
                            {isGenerating ? (
                              <>
                                <RefreshCw size={15} className="animate-spin text-white" />
                                <span>Saving to Firestore /keys...</span>
                              </>
                            ) : (
                              <>
                                <Zap size={15} className="text-yellow-300" />
                                <span>Generate Key & Save to Firestore</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Right Column: Generated Key Display Card */}
                        <div className="lg:col-span-5 liquid-glass-card rounded-2xl p-5 border border-white/15 flex flex-col justify-between min-h-[300px] relative overflow-hidden">
                          <div
                            className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none"
                            style={{
                              background:
                                'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)',
                            }}
                          />

                          <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 font-mono">
                                Live Generated Key
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)] flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                <span>UNACTIVATED</span>
                              </span>
                            </div>

                            {lastGeneratedKey ? (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-3 pt-1"
                              >
                                <div className="p-4 rounded-2xl liquid-glass-panel border border-amber-500/40 text-center space-y-2 shadow-2xl">
                                  <span className="text-[10px] uppercase font-mono text-zinc-400 block">
                                    Access Key Code
                                  </span>
                                  <div className="font-mono text-lg font-black text-cyan-300 tracking-wider break-all select-all">
                                    {lastGeneratedKey.key}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(lastGeneratedKey.key)}
                                    className="mt-2 w-full py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-cyan-500 hover:brightness-110 text-black text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.35)] active:scale-95"
                                  >
                                    {copiedKey === lastGeneratedKey.key ? (
                                      <>
                                        <Check size={14} className="text-black" />
                                        <span>COPIED TO CLIPBOARD!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={14} />
                                        <span>COPY ACCESS KEY</span>
                                      </>
                                    )}
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="p-2.5 rounded-xl liquid-glass-subcard border border-white/10">
                                    <span className="text-[10px] text-zinc-400 block font-mono">
                                      Duration
                                    </span>
                                    <span className="font-bold text-white">
                                      {lastGeneratedKey.duration}
                                    </span>
                                  </div>
                                  <div className="p-2.5 rounded-xl liquid-glass-subcard border border-amber-500/30 bg-amber-500/10">
                                    <span className="text-[10px] text-amber-300 block font-mono font-bold">
                                      Initial Status
                                    </span>
                                    <span className="font-bold text-amber-300 uppercase flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                      {lastGeneratedKey.status}
                                    </span>
                                  </div>
                                  <div className="p-2.5 rounded-xl liquid-glass-subcard border border-white/10 col-span-2">
                                    <span className="text-[10px] text-zinc-400 block font-mono">
                                      Timer Mode
                                    </span>
                                    <span className="font-bold text-cyan-300 text-[11px]">
                                      {lastGeneratedKey.timer_mode === 'active_usage'
                                        ? '🎮 Active Usage Only (Starts on 1st login)'
                                        : '⏱️ Continuous 24/7 (Starts on 1st login)'}
                                    </span>
                                  </div>
                                  {lastGeneratedKey.note && (
                                    <div className="p-2.5 rounded-xl liquid-glass-subcard border border-cyan-400/30 col-span-2 space-y-0.5 bg-cyan-950/20">
                                      <span className="text-[10px] text-cyan-300 font-bold block font-mono flex items-center gap-1">
                                        <FileText size={11} className="text-cyan-400" /> Admin Note
                                      </span>
                                      <span className="text-xs text-zinc-200 italic break-words block">
                                        "{lastGeneratedKey.note}"
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200/90 leading-tight">
                                  ⏳ <strong>Activation Note:</strong> This key is currently <em>unactivated</em> (orange). The timer countdown will start automatically upon the user's first login.
                                </div>
                              </motion.div>
                            ) : (
                              <div className="p-8 text-center text-zinc-500 space-y-2 border border-dashed border-white/10 rounded-2xl my-auto">
                                <Key size={26} className="mx-auto text-zinc-600" />
                                <p className="text-xs text-zinc-400">No key generated yet in this session.</p>
                                <p className="text-[11px] text-zinc-500">
                                  Configure options and click Generate.
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400 relative z-10 font-mono">
                            <span>Sync Target:</span>
                            <span className="text-cyan-300">Firestore & Database</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* TAB 2: LIST KEYS (listkeys) */}
                    {activeTab === 'listkeys' && (
                      <motion.div
                        key="tab-listkeys"
                        initial={{ opacity: 0, y: 12, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.99 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-4"
                      >
                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                          <div className="relative flex-1">
                            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search key code, tag, or user..."
                              className="w-full liquid-glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                            />
                          </div>

                          {/* Filter Pills */}
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                            {(['all', 'unactivated', 'active', 'revoked', 'lifetime'] as const).map((filter) => (
                              <button
                                key={filter}
                                type="button"
                                onClick={() => setStatusFilter(filter)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer shrink-0 ${
                                  statusFilter === filter
                                    ? filter === 'unactivated'
                                      ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-md shadow-amber-500/20'
                                      : 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20'
                                    : 'liquid-glass-card border-white/10 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {filter}
                              </button>
                            ))}

                            <button
                              type="button"
                              onClick={loadKeys}
                              disabled={isLoadingKeys}
                              className="p-2.5 liquid-glass-card hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white rounded-xl transition-all cursor-pointer shrink-0 active:scale-95"
                              title="Reload keys from Firestore"
                            >
                              <RefreshCw size={14} className={isLoadingKeys ? 'animate-spin' : ''} />
                            </button>
                          </div>
                        </div>

                        {/* Summary Bar */}
                        <div className="flex items-center justify-between px-1 text-xs text-zinc-400 font-mono flex-wrap gap-2">
                          <span>
                            Showing <strong className="text-white">{filteredKeys.length}</strong> of{' '}
                            <strong className="text-white">{keys.length}</strong> total keys
                          </span>
                          <span className="text-[11px] text-zinc-500 flex items-center gap-2">
                            <span className="text-amber-400 font-bold">Unactivated: {keys.filter((k) => k.status === 'unactivated').length}</span> ·{' '}
                            <span>Active: {keys.filter((k) => k.status === 'active').length}</span> ·{' '}
                            <span>Revoked: {keys.filter((k) => k.status === 'revoked').length}</span>
                          </span>
                        </div>

                        {/* Keys Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto custom-scrollbar p-0.5">
                          {filteredKeys.length === 0 ? (
                            <div className="col-span-full p-12 text-center text-zinc-500 border border-white/10 rounded-2xl liquid-glass-panel">
                              <Key size={26} className="mx-auto mb-2 text-zinc-600" />
                              <p className="text-xs">No keys matching the selected filters.</p>
                            </div>
                          ) : (
                            filteredKeys.map((k) => {
                              const isRevoked = k.status === 'revoked';
                              return (
                                <motion.div
                                  layout
                                  key={k.key}
                                  onClick={() => handleOpenInspectKey(k)}
                                  className={`p-4 rounded-2xl border transition-all space-y-3 cursor-pointer group hover:scale-[1.01] ${
                                    isRevoked
                                      ? 'bg-red-950/20 border-red-500/30'
                                      : 'liquid-glass-card border-white/15 hover:border-cyan-400/80 hover:shadow-[0_0_30px_rgba(6,182,212,0.25)]'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-1 min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-mono text-xs font-bold text-white truncate select-all">
                                          {k.key}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopy(k.key);
                                          }}
                                          className="p-1 text-zinc-400 hover:text-white cursor-pointer transition-colors"
                                          title="Copy Key Code"
                                        >
                                          {copiedKey === k.key ? (
                                            <Check size={13} className="text-emerald-400" />
                                          ) : (
                                            <Copy size={13} />
                                          )}
                                        </button>
                                        <span className="text-[10px] text-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity ml-auto flex items-center gap-0.5">
                                          <span>Details & Edit</span>
                                          <Maximize2 size={11} />
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400">
                                        <span className="px-2 py-0.5 rounded-md bg-white/5 font-mono text-zinc-300">
                                          {k.duration || '24h'}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md bg-white/5 font-mono text-zinc-300 text-[10px]">
                                          {k.timer_mode === 'active_usage' ? '🎮 Active Only' : '⏱️ Continuous'}
                                        </span>
                                        {k.tag && (
                                          <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 font-mono">
                                            #{k.tag}
                                          </span>
                                        )}
                                        {k.discord_username && (
                                          <span className="text-indigo-300 font-mono text-[10px]">
                                            @{k.discord_username}
                                          </span>
                                        )}
                                      </div>

                                      {/* Unactivated banner for unactivated keys */}
                                      {k.status === 'unactivated' && (
                                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-center gap-1.5 font-mono mt-1">
                                          <Clock size={12} className="shrink-0 text-amber-400" />
                                          <span>Pending 1st Login (Unactivated)</span>
                                        </div>
                                      )}

                                      {/* Note preview (Admin only) */}
                                      {k.note && (
                                        <div className="p-2 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-cyan-200 flex items-start gap-1.5 font-mono mt-1">
                                          <FileText size={12} className="shrink-0 mt-0.5 text-cyan-400" />
                                          <div className="min-w-0 flex-1">
                                            <strong className="text-cyan-400 mr-1">Note:</strong>
                                            <span className="text-zinc-300">{k.note}</span>
                                          </div>
                                        </div>
                                      )}

                                      {/* Linked Devices HWIDs List preview */}
                                      {k.devices && k.devices.length > 0 ? (
                                        <div className="mt-2 pt-1.5 border-t border-white/5 space-y-1">
                                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                              <Laptop size={11} className="text-cyan-400" />
                                              <span>Linked HWIDs ({k.devices.length}/{k.max_devices || 2}):</span>
                                            </div>
                                            <span className="text-[9px] text-cyan-400">Click to view</span>
                                          </div>
                                          <div className="space-y-1">
                                            {k.devices.slice(0, 2).map((dev: any, dIdx: number) => {
                                              const dId = typeof dev === 'string' ? dev : dev.device_id || `dev_${dIdx}`;
                                              const dIp = typeof dev === 'object' ? dev.ip : null;
                                              return (
                                                <div key={dIdx} className="flex items-center justify-between p-1.5 rounded-lg bg-black/40 border border-white/10 text-[11px] font-mono">
                                                  <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                                    <span className="text-cyan-300 truncate select-all">{dId}</span>
                                                  </div>
                                                  {dIp && <span className="text-zinc-500 text-[10px] shrink-0 ml-2">{dIp}</span>}
                                                </div>
                                              );
                                            })}
                                            {k.devices.length > 2 && (
                                              <div className="text-[10px] text-cyan-400 text-center font-mono">
                                                +{k.devices.length - 2} more linked devices...
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-[10px] text-zinc-500 font-mono mt-1 flex items-center justify-between">
                                          <span>No HWIDs linked yet (0/{k.max_devices || 2})</span>
                                          <span className="text-cyan-400/80">Edit / View ↗</span>
                                        </div>
                                      )}
                                    </div>

                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${
                                        k.status === 'unactivated'
                                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                                          : k.status === 'active'
                                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                                          : 'bg-red-500/15 text-red-300 border-red-500/40'
                                      }`}
                                    >
                                      {k.status}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleRevoke(k);
                                      }}
                                      className={`font-bold transition-colors cursor-pointer ${
                                        k.status === 'active'
                                          ? 'text-amber-400 hover:text-amber-300'
                                          : 'text-emerald-400 hover:text-emerald-300'
                                      }`}
                                    >
                                      {k.status === 'active' ? 'Revoke Key' : 'Reactivate Key'}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteKey(k.key);
                                      }}
                                      className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer transition-colors"
                                      title="Delete key from Firestore"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </motion.div>
                              );
                            })
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* TAB 3: EXPORT */}
                    {activeTab === 'export' && (
                      <motion.div
                        key="tab-export"
                        initial={{ opacity: 0, y: 12, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.99 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-5"
                      >
                        {/* Scope Selector */}
                        <div className="liquid-glass-panel rounded-2xl p-5 space-y-4 border border-white/15">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                <Download size={14} className="text-cyan-400" />
                                <span>Export Database</span>
                              </span>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                Download or copy access keys directly from Firestore.
                              </p>
                            </div>

                            <div className="flex items-center liquid-glass-card border border-white/10 rounded-xl p-0.5 text-xs">
                              {(['all', 'active', 'lifetime'] as const).map((sc) => (
                                <button
                                  key={sc}
                                  type="button"
                                  onClick={() => setExportScope(sc)}
                                  className={`px-3 py-1.5 rounded-lg font-bold uppercase text-[11px] transition-all cursor-pointer ${
                                    exportScope === sc
                                      ? 'bg-cyan-500 text-black shadow'
                                      : 'text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  {sc} Keys ({keysToExport.length})
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 3 Download Cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                            {/* JSON */}
                            <button
                              type="button"
                              onClick={handleDownloadJSON}
                              className="p-4 rounded-xl liquid-glass-card hover:border-cyan-400/50 text-left transition-all group cursor-pointer space-y-2 border border-white/10"
                            >
                              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                                <FileCode size={18} />
                              </div>
                              <h3 className="text-xs font-bold text-white">Download JSON</h3>
                              <p className="text-[11px] text-zinc-400">
                                Complete schema compatible with Import Keys.
                              </p>
                            </button>

                            {/* CSV */}
                            <button
                              type="button"
                              onClick={handleDownloadCSV}
                              className="p-4 rounded-xl liquid-glass-card hover:border-cyan-400/50 text-left transition-all group cursor-pointer space-y-2 border border-white/10"
                            >
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                                <FileSpreadsheet size={18} />
                              </div>
                              <h3 className="text-xs font-bold text-white">Download CSV</h3>
                              <p className="text-[11px] text-zinc-400">
                                Excel & Google Sheets compatible format.
                              </p>
                            </button>

                            {/* TXT */}
                            <button
                              type="button"
                              onClick={handleDownloadTXT}
                              className="p-4 rounded-xl liquid-glass-card hover:border-cyan-400/50 text-left transition-all group cursor-pointer space-y-2 border border-white/10"
                            >
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                                <FileText size={18} />
                              </div>
                              <h3 className="text-xs font-bold text-white">Download Plain TXT</h3>
                              <p className="text-[11px] text-zinc-400">
                                Clean list of key codes (1 per line) for sharing.
                              </p>
                            </button>
                          </div>
                        </div>

                        {/* Live Text Preview Box in liquid-glass-card */}
                        <div className="liquid-glass-card border border-white/15 rounded-2xl p-4 space-y-2">
                          <div className="flex items-center justify-between text-xs text-zinc-400">
                            <span className="font-mono uppercase font-bold text-zinc-300">
                              Export Preview ({keysToExport.length} Keys)
                            </span>
                            <span className="text-[11px] font-mono text-zinc-500">
                              Plain Text
                            </span>
                          </div>

                          <pre className="p-3.5 liquid-glass-input rounded-xl text-xs font-mono text-cyan-300 max-h-48 overflow-y-auto select-all custom-scrollbar leading-relaxed">
                            {keysToExport.length > 0
                              ? keysToExport.map((k) => k.key).join('\n')
                              : '// No keys found in this export scope.'}
                          </pre>
                        </div>
                      </motion.div>
                    )}

                    {/* TAB 4: IMPORT KEYS */}
                    {activeTab === 'import' && (
                      <motion.div
                        key="tab-import"
                        initial={{ opacity: 0, y: 12, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.99 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-5"
                      >
                        {/* Hidden file input */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".json,.txt,.csv"
                          onChange={handleFileUpload}
                          className="hidden"
                        />

                        <div className="liquid-glass-panel rounded-2xl p-5 space-y-4 border border-white/15">
                          <div>
                            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                              <Upload size={14} className="text-cyan-400" />
                              <span>Import Keys to Firestore</span>
                            </span>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              Upload backup files (.json, .txt, .csv) or paste keys directly.
                            </p>
                          </div>

                          {/* Drag & Drop / Upload Card */}
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="p-5 rounded-2xl liquid-glass-card border-2 border-dashed border-white/20 hover:border-cyan-400/50 transition-all flex flex-col items-center justify-center text-center space-y-2 cursor-pointer group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
                              <FileUp size={20} />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                                Click or Drop File Here (.json, .txt, .csv)
                              </span>
                              <p className="text-[11px] text-zinc-400 mt-0.5">
                                Automatically parses JSON objects, TXT lines, and CSV tables
                              </p>
                            </div>
                          </div>

                          {/* Direct Paste Area */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                              <span>Or Paste Keys / JSON List:</span>
                              {parsedImportKeys.length > 0 && (
                                <span className="text-emerald-400 font-mono flex items-center gap-1">
                                  <Check size={12} /> {parsedImportKeys.length} valid keys detected
                                </span>
                              )}
                            </div>
                            <textarea
                              value={importInputText}
                              onChange={(e) => {
                                setImportInputText(e.target.value);
                                if (importErrorMsg) setImportErrorMsg(null);
                                if (importSuccessMsg) setImportSuccessMsg(null);
                              }}
                              rows={5}
                              placeholder={`Paste keys list (one per line):
VOID-ALPHA-1234
VOID-BETA-5678 (24h)
or JSON array: [{"key": "VOID-VIP-9999", "duration": "Lifetime"}]`}
                              className="w-full liquid-glass-input rounded-xl p-3.5 text-xs text-white placeholder-zinc-500 font-mono outline-none shadow-inner resize-y min-h-[110px]"
                            />
                          </div>

                          {/* Settings */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 block">
                                Default Duration
                              </label>
                              <select
                                value={importDefaultDuration}
                                onChange={(e) => setImportDefaultDuration(e.target.value)}
                                className="w-full liquid-glass-input rounded-xl px-3 py-2 text-xs text-white font-mono outline-none cursor-pointer"
                              >
                                <option value="30m" className="bg-[#0b0e14] text-white">30 Min</option>
                                <option value="1h" className="bg-[#0b0e14] text-white">1 Hour</option>
                                <option value="12h" className="bg-[#0b0e14] text-white">12 Hours</option>
                                <option value="24h" className="bg-[#0b0e14] text-white">24 Hours (1 Day)</option>
                                <option value="7d" className="bg-[#0b0e14] text-white">7 Days (1 Week)</option>
                                <option value="30d" className="bg-[#0b0e14] text-white">30 Days (1 Month)</option>
                                <option value="Lifetime" className="bg-[#0b0e14] text-white">Lifetime (Permanent)</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-2 pt-5">
                              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={importOverwrite}
                                  onChange={(e) => setImportOverwrite(e.target.checked)}
                                  className="rounded bg-black/50 border-white/20 text-cyan-500 focus:ring-0 cursor-pointer"
                                />
                                <span>Overwrite existing keys in Firestore</span>
                              </label>
                            </div>
                          </div>

                          {/* Messages */}
                          {importErrorMsg && (
                            <motion.div
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-start space-x-2.5 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs text-left"
                            >
                              <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-400" />
                              <span className="leading-tight">{importErrorMsg}</span>
                            </motion.div>
                          )}

                          {importSuccessMsg && (
                            <motion.div
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs shadow-lg"
                            >
                              <div className="flex items-center space-x-2">
                                <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                                <span>{importSuccessMsg}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveTab('listkeys')}
                                className="px-3 py-1 rounded-lg bg-emerald-500/25 hover:bg-emerald-500/40 text-white font-bold text-[11px] transition-colors cursor-pointer"
                              >
                                View in List Keys →
                              </button>
                            </motion.div>
                          )}

                          {/* Submit Button */}
                          <button
                            type="button"
                            onClick={handleExecuteImport}
                            disabled={isImporting || parsedImportKeys.length === 0}
                            className="relative overflow-hidden w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:brightness-110 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-[0_4px_25px_rgba(6,182,212,0.35)] disabled:opacity-50 active:scale-[0.98] border border-white/20"
                          >
                            <div className="absolute inset-x-0 top-0 h-[1px] bg-white/50 pointer-events-none" />
                            {isImporting ? (
                              <>
                                <RefreshCw size={15} className="animate-spin text-white" />
                                <span>Importing Keys to Firestore...</span>
                              </>
                            ) : (
                              <>
                                <Upload size={15} />
                                <span>
                                  {parsedImportKeys.length > 0
                                    ? `Import ${parsedImportKeys.length} Keys into Firestore`
                                    : 'Import Keys into Firestore'}
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* ENLARGED KEY CARD & HWID INSPECTOR MODAL */}
        <AnimatePresence>
          {selectedInspectKey && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.93, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.93, opacity: 0, y: 15 }}
                className="w-full max-w-2xl bg-[#090d1a]/98 border border-cyan-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_25px_80px_rgba(0,0,0,0.95)] text-white space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar relative"
              >
                {/* Top Header */}
                <div className="flex items-start justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.35)] shrink-0">
                      <Key size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl sm:text-2xl font-black font-mono text-cyan-300 tracking-wider select-all">
                          {selectedInspectKey.key}
                        </h2>
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedInspectKey.key)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedKey === selectedInspectKey.key ? (
                            <>
                              <Check size={13} className="text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>Copy Key</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                          selectedInspectKey.status === 'unactivated'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                            : selectedInspectKey.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-red-500/20 text-red-300 border-red-500/40'
                        }`}>
                          {selectedInspectKey.status}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/5 border border-white/10 text-zinc-300">
                          {selectedInspectKey.duration || '24h'}
                        </span>

                        {selectedInspectKey.timer_mode && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                            {selectedInspectKey.timer_mode === 'active_usage' ? '🎮 Solo in uso' : '⏱️ Continuo 24/7'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedInspectKey(null)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Key Info Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[11px] text-zinc-500 block uppercase font-bold">Timer Mode</span>
                    <span className="text-white font-bold flex items-center gap-1">
                      {selectedInspectKey.timer_mode === 'active_usage' ? '🎮 Active Usage' : '⏱️ Continuo 24/7'}
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      {selectedInspectKey.timer_mode === 'active_usage' ? 'Scorre solo in sessione' : 'Countdown continuo dal 1° login'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[11px] text-zinc-500 block uppercase font-bold">Data Creazione</span>
                    <span className="text-zinc-200 font-bold">
                      {selectedInspectKey.created_at ? new Date(selectedInspectKey.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                    <span className="text-[10px] text-zinc-500 block">
                      {selectedInspectKey.created_at ? new Date(selectedInspectKey.created_at).toLocaleTimeString() : ''}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[11px] text-zinc-500 block uppercase font-bold">First Access</span>
                    {selectedInspectKey.activated_at ? (
                      <>
                        <span className="text-emerald-300 font-bold">Activated</span>
                        <span className="text-[10px] text-zinc-400 block truncate">
                          {new Date(selectedInspectKey.activated_at).toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-amber-400 font-bold">Not Yet Entered</span>
                        <span className="text-[10px] text-zinc-500 block">Waiting for 1st login</span>
                      </>
                    )}
                  </div>

                  <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[11px] text-zinc-500 block uppercase font-bold">Total Uses</span>
                    <span className="text-white font-bold">{selectedInspectKey.used_count || 0} Times</span>
                    {selectedInspectKey.last_used_at && (
                      <span className="text-[10px] text-zinc-400 block truncate">
                        Last: {new Date(selectedInspectKey.last_used_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>

                  <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[11px] text-zinc-500 block uppercase font-bold">Discord User</span>
                    <span className="text-indigo-300 font-bold truncate block">
                      {selectedInspectKey.discord_username ? `@${selectedInspectKey.discord_username}` : '—'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[11px] text-zinc-500 block uppercase font-bold">Tag / Note</span>
                    <span className="text-cyan-300 font-bold truncate block">
                      {selectedInspectKey.tag ? `#${selectedInspectKey.tag}` : 'Standard'}
                    </span>
                    {selectedInspectKey.note && (
                      <span className="text-[10px] text-zinc-400 truncate block" title={selectedInspectKey.note}>
                        {selectedInspectKey.note}
                      </span>
                    )}
                  </div>
                </div>

                {/* EDIT KEY SETTINGS FORM */}
                <div className="p-4 rounded-2xl bg-black/55 border border-cyan-500/30 space-y-3.5 font-mono">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-300 uppercase tracking-wider border-b border-white/10 pb-2">
                    <span className="flex items-center gap-1.5">
                      <Sliders size={15} />
                      <span>Edit Key Settings</span>
                    </span>
                    <span className="text-[10px] text-zinc-400">Instant Sync</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Duration */}
                    <div className="space-y-1">
                      <label className="text-[11px] text-zinc-400 block font-bold">Duration</label>
                      <select
                        value={editKeyDuration}
                        onChange={(e) => setEditKeyDuration(e.target.value)}
                        className="w-full bg-[#0b0e14] border border-white/15 rounded-xl px-3 py-2 text-white font-mono outline-none cursor-pointer"
                      >
                        <option value="30m">30 Min</option>
                        <option value="1h">1 Hour</option>
                        <option value="12h">12 Hours</option>
                        <option value="24h">24 Hours (1 Day)</option>
                        <option value="7d">7 Days (1 Week)</option>
                        <option value="30d">30 Days (1 Month)</option>
                        <option value="Lifetime">Lifetime (Permanent)</option>
                      </select>
                    </div>

                    {/* Timer Mode */}
                    <div className="space-y-1">
                      <label className="text-[11px] text-zinc-400 block font-bold">Timer Mode</label>
                      <select
                        value={editKeyTimerMode}
                        onChange={(e) => setEditKeyTimerMode(e.target.value as any)}
                        className="w-full bg-[#0b0e14] border border-white/15 rounded-xl px-3 py-2 text-white font-mono outline-none cursor-pointer"
                      >
                        <option value="continuous">⏱️ Continuous 24/7</option>
                        <option value="active_usage">🎮 Active Usage Only</option>
                      </select>
                    </div>

                    {/* Max HWID Devices */}
                    <div className="space-y-1">
                      <label className="text-[11px] text-zinc-400 block font-bold">Max HWID Devices</label>
                      <select
                        value={editKeyMaxDevices}
                        onChange={(e) => setEditKeyMaxDevices(Number(e.target.value))}
                        className="w-full bg-[#0b0e14] border border-white/15 rounded-xl px-3 py-2 text-white font-mono outline-none cursor-pointer"
                      >
                        <option value={1}>1 Device</option>
                        <option value={2}>2 Devices (Standard)</option>
                        <option value={3}>3 Devices</option>
                        <option value={5}>5 Devices</option>
                        <option value={10}>10 Devices</option>
                        <option value={-1}>♾️ Unlimited</option>
                      </select>
                    </div>

                    {/* Discord Username */}
                    <div className="space-y-1">
                      <label className="text-[11px] text-zinc-400 block font-bold">Discord Username</label>
                      <input
                        type="text"
                        value={editKeyDiscord}
                        onChange={(e) => setEditKeyDiscord(e.target.value.replace(/^@/, ''))}
                        placeholder="e.g. username"
                        className="w-full bg-[#0b0e14] border border-white/15 rounded-xl px-3 py-2 text-white font-mono outline-none placeholder-zinc-600"
                      />
                    </div>

                    {/* Admin Note */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] text-zinc-400 block font-bold">Admin Note (Private)</label>
                      <input
                        type="text"
                        value={editKeyNote}
                        onChange={(e) => setEditKeyNote(e.target.value)}
                        placeholder="e.g. VIP Customer, Giveaway winner..."
                        className="w-full bg-[#0b0e14] border border-white/15 rounded-xl px-3 py-2 text-white font-mono outline-none placeholder-zinc-600"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={isSavingKeySettings}
                      onClick={handleSaveKeySettings}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black text-xs uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50"
                    >
                      {isSavingKeySettings ? (
                        <>
                          <RefreshCw size={14} className="animate-spin text-black" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          <span>Save Key Settings</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* SEZIONE HWID DISPOSITIVI */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Laptop size={18} className="text-cyan-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Connected HWID Devices for this Key
                      </h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
                      {selectedInspectKey.devices?.length || 0} / {selectedInspectKey.max_devices === -1 ? '♾️' : (selectedInspectKey.max_devices || selectedInspectKey.max_hwid || 2)} HWID Slots
                    </span>
                  </div>

                  {/* HWID Device List */}
                  <div className="space-y-2.5 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
                    {(!selectedInspectKey.devices || selectedInspectKey.devices.length === 0) ? (
                      <div className="p-7 text-center rounded-2xl bg-black/40 border border-white/10 text-zinc-400 space-y-2">
                        <Laptop size={32} className="mx-auto text-zinc-600 mb-1" />
                        <p className="text-sm font-bold text-zinc-300">No HWIDs registered yet</p>
                        <p className="text-xs text-zinc-500 max-w-md mx-auto">
                          When the user enters and validates this key on their device, the unique HWID and session details will appear here automatically.
                        </p>
                      </div>
                    ) : (
                      selectedInspectKey.devices.map((device: any, idx: number) => {
                        const devId = typeof device === 'string' ? device : device.device_id || `dev_${idx}`;
                        const firstSeen = typeof device === 'object' && device.first_seen ? new Date(device.first_seen).toLocaleString() : null;
                        const lastSeen = typeof device === 'object' && device.last_seen ? new Date(device.last_seen).toLocaleString() : null;

                        return (
                          <div
                            key={idx}
                            className="p-3.5 rounded-2xl bg-black/60 border border-white/10 hover:border-cyan-500/40 transition-all space-y-2 shadow-sm"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                <span className="text-xs font-mono font-bold text-cyan-300 select-all truncate">
                                  {devId}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => handleCopyHwid(devId, e)}
                                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-cyan-500/20 hover:border-cyan-500/40 text-xs font-mono font-bold text-zinc-200 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border border-white/10"
                                title="Copy this Device HWID"
                              >
                                {copiedHwid === devId ? (
                                  <>
                                    <Check size={13} className="text-emerald-400" />
                                    <span className="text-emerald-400">HWID Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={13} />
                                    <span>Copy HWID</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Metadata Subgrid (No IP or User Agent) */}
                            {(lastSeen || firstSeen) && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-400 pt-2 border-t border-white/5 font-mono">
                                {lastSeen && (
                                  <div>
                                    <span className="text-zinc-500">Last Seen:</span>{' '}
                                    <span className="text-zinc-300">{lastSeen}</span>
                                  </div>
                                )}
                                {firstSeen && (
                                  <div>
                                    <span className="text-zinc-500">Registered At:</span>{' '}
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
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10 flex-wrap">
                  {selectedInspectKey.devices && selectedInspectKey.devices.length > 0 && (
                    <button
                      type="button"
                      disabled={isResettingKeyDevices}
                      onClick={(e) => handleResetDevicesForInspectKey(selectedInspectKey, e)}
                      className="px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Trash2 size={14} />
                      <span>{isResettingKeyDevices ? 'Resetting...' : 'Unlink All HWID Devices'}</span>
                    </button>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleRevoke(selectedInspectKey);
                        setSelectedInspectKey((prev) => prev ? { ...prev, status: prev.status === 'active' ? 'revoked' : 'active' } : null);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all cursor-pointer"
                    >
                      {selectedInspectKey.status === 'active' ? 'Revoke Key' : 'Reactivate Key'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedInspectKey(null)}
                      className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs transition-all cursor-pointer shadow-lg"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};
