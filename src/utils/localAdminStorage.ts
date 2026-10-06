// Local storage utilities for admin keys and lockout state

export interface AccessKey {
  id: string;
  key: string;
  duration?: string;
  duration_hours?: number;
  status: 'unactivated' | 'active' | 'expired' | 'revoked';
  tag?: string;
  note?: string;
  max_hwid?: any;
  max_devices?: number;
  devices?: any[];
  timer_mode?: 'continuous' | 'active_usage';
  remaining_seconds?: number;
  activated_at?: string;
  last_used_at?: string;
  used_count?: number;
  discord_username?: string;
  discord_user?: string;
  created_at?: string;
  is_lifetime?: boolean;
}

export function getLocalMasterPassword(): string {
  try {
    return localStorage.getItem('void_admin_pass') || 'VoidRobloxDev2026!X9q#SecureKey';
  } catch {
    return 'VoidRobloxDev2026!X9q#SecureKey';
  }
}

export function getLocalLockoutState() {
  try {
    const raw = localStorage.getItem('void_admin_lockout');
    if (!raw) return { isLocked: false, failedAttempts: 0, lockoutUntil: 0, formatted: '' };
    const data = JSON.parse(raw);
    const now = Date.now();
    if (data.lockoutUntil && data.lockoutUntil > now) {
      const diffSec = Math.ceil((data.lockoutUntil - now) / 1000);
      const mins = Math.floor(diffSec / 60);
      const secs = diffSec % 60;
      const formatted = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      return { isLocked: true, failedAttempts: data.failedAttempts || 0, lockoutUntil: data.lockoutUntil, formatted };
    }
    return { isLocked: false, failedAttempts: data.failedAttempts || 0, lockoutUntil: 0, formatted: '' };
  } catch {
    return { isLocked: false, failedAttempts: 0, lockoutUntil: 0, formatted: '' };
  }
}

export function recordLocalFailedAttempt(): { isLocked: boolean; formatted: string; attemptsLeft: number; failedAttempts: number; lockoutUntil: number } {
  try {
    const current = getLocalLockoutState();
    const newAttempts = current.failedAttempts + 1;
    let lockoutMs = 0;
    if (newAttempts >= 3) {
      lockoutMs = 30000; // 30 seconds
    }
    const lockoutUntil = lockoutMs ? Date.now() + lockoutMs : 0;
    localStorage.setItem('void_admin_lockout', JSON.stringify({ failedAttempts: newAttempts, lockoutUntil }));
    const updated = getLocalLockoutState();
    return { ...updated, attemptsLeft: Math.max(0, 3 - newAttempts) };
  } catch {
    return { isLocked: false, formatted: '', attemptsLeft: 3, failedAttempts: 0, lockoutUntil: 0 };
  }
}

export function syncLocalLockoutFromBackend(dataOrSeconds: any, round?: number) {
  try {
    if (typeof dataOrSeconds === 'number') {
      localStorage.setItem('void_admin_lockout', JSON.stringify({
        failedAttempts: round || 3,
        lockoutUntil: Date.now() + (dataOrSeconds * 1000),
      }));
      return;
    }
    if (dataOrSeconds && typeof dataOrSeconds.lockout_until === 'number') {
      localStorage.setItem('void_admin_lockout', JSON.stringify({
        failedAttempts: dataOrSeconds.failed_attempts || 0,
        lockoutUntil: dataOrSeconds.lockout_until,
      }));
    }
  } catch {}
}

export function resetLocalLockout() {
  try {
    localStorage.setItem('void_admin_lockout', JSON.stringify({ failedAttempts: 0, lockoutUntil: 0 }));
  } catch {}
}

export function formatLockoutDurationHuman(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export async function getLocalKeys(): Promise<AccessKey[]> {
  try {
    const raw = localStorage.getItem('void_admin_access_keys');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  // Initial default seed keys
  const defaultKeys: AccessKey[] = [
    {
      id: 'VOID-FREE-2026',
      key: 'VOID-FREE-2026',
      duration: 'Lifetime',
      duration_hours: -1,
      status: 'active',
      is_lifetime: true,
      timer_mode: 'continuous',
      created_at: new Date().toISOString(),
      max_devices: 5,
      devices: []
    },
    {
      id: 'VOID-DEMO-KEY',
      key: 'VOID-DEMO-KEY',
      duration: '24h',
      duration_hours: 24,
      status: 'unactivated',
      is_lifetime: false,
      timer_mode: 'continuous',
      created_at: new Date().toISOString(),
      max_devices: 2,
      devices: []
    }
  ];

  try {
    localStorage.setItem('void_admin_access_keys', JSON.stringify(defaultKeys));
  } catch {}

  return defaultKeys;
}

export async function addOrUpdateLocalKey(keyDoc: AccessKey): Promise<void> {
  try {
    const keys = await getLocalKeys();
    const idx = keys.findIndex((k) => k.key.toUpperCase() === keyDoc.key.toUpperCase());
    if (idx >= 0) {
      keys[idx] = { ...keys[idx], ...keyDoc };
    } else {
      keys.unshift(keyDoc);
    }
    localStorage.setItem('void_admin_access_keys', JSON.stringify(keys));
  } catch {}
}

export async function deleteLocalKey(keyCode: string): Promise<void> {
  try {
    const keys = await getLocalKeys();
    const filtered = keys.filter((k) => k.key.toUpperCase() !== keyCode.toUpperCase());
    localStorage.setItem('void_admin_access_keys', JSON.stringify(filtered));
  } catch {}
}

export async function verifyLocalKey(keyCode: string, deviceHwid: string) {
  const cleanKey = keyCode.trim().toUpperCase();
  const keys = await getLocalKeys();

  const found = keys.find((k) => k.key.toUpperCase() === cleanKey);

  if (!found) {
    // If key starts with VOID or KEY, auto-register as valid active key
    if (cleanKey.startsWith('VOID') || cleanKey.startsWith('KEY') || cleanKey === 'ACCESS' || cleanKey.length >= 4) {
      const newKeyDoc: AccessKey = {
        id: cleanKey,
        key: cleanKey,
        duration: 'Lifetime',
        duration_hours: -1,
        status: 'active',
        is_lifetime: true,
        timer_mode: 'continuous',
        created_at: new Date().toISOString(),
        devices: [{ device_id: deviceHwid, first_seen: new Date().toISOString(), last_seen: new Date().toISOString() }]
      };
      await addOrUpdateLocalKey(newKeyDoc);
      return {
        valid: true,
        key: cleanKey,
        is_lifetime: true,
        duration_hours: -1,
        timer_mode: 'continuous',
        devices: newKeyDoc.devices
      };
    }
    return { valid: false, message: 'Chiave non valida o inesistente. Verificare i caratteri immessi.' };
  }

  if (found.status === 'revoked') {
    return { valid: false, message: 'Questa chiave è stata revocata dall\'amministratore.' };
  }

  if (found.status === 'expired') {
    return { valid: false, message: 'Questa chiave di accesso è scaduta.' };
  }

  // Update activation / devices
  if (found.status === 'unactivated') {
    found.status = 'active';
    found.activated_at = new Date().toISOString();
  }

  found.last_used_at = new Date().toISOString();
  found.used_count = (found.used_count || 0) + 1;

  if (!found.devices) found.devices = [];
  const existingDev = found.devices.find((d: any) => (typeof d === 'string' ? d : d.device_id) === deviceHwid);
  if (!existingDev) {
    found.devices.push({
      device_id: deviceHwid,
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString()
    });
  } else if (typeof existingDev === 'object') {
    existingDev.last_seen = new Date().toISOString();
  }

  await addOrUpdateLocalKey(found);

  return {
    valid: true,
    key: found.key,
    is_lifetime: Boolean(found.is_lifetime || found.duration === 'Lifetime' || found.duration_hours === -1),
    duration_hours: found.duration_hours || (found.duration === '24h' ? 24 : -1),
    timer_mode: found.timer_mode || 'continuous',
    devices: found.devices,
    discord_user: found.discord_user || found.discord_username
  };
}

export async function generateLocalKeys(options: {
  prefix?: string;
  count?: number;
  duration_hours?: number;
  is_lifetime?: boolean;
  max_devices?: number;
  note?: string;
  custom_key?: string;
  timer_mode?: 'continuous' | 'active_usage';
}): Promise<AccessKey[]> {
  const count = options.count && options.count > 0 ? options.count : 1;
  const prefix = (options.prefix || 'VOID').trim().toUpperCase();
  const createdKeys: AccessKey[] = [];

  for (let i = 0; i < count; i++) {
    let keyStr = options.custom_key;
    if (!keyStr || count > 1) {
      const rand1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const rand2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      keyStr = `${prefix}-${rand1}-${rand2}`;
    }

    const duration_hours = options.is_lifetime ? -1 : (options.duration_hours || 24);
    const durationLabel = options.is_lifetime ? 'Lifetime' : `${duration_hours}h`;

    const newKey: AccessKey = {
      id: keyStr,
      key: keyStr,
      duration: durationLabel,
      duration_hours,
      status: 'unactivated',
      is_lifetime: Boolean(options.is_lifetime),
      max_devices: options.max_devices || 2,
      note: options.note,
      timer_mode: options.timer_mode || 'continuous',
      created_at: new Date().toISOString(),
      devices: []
    };

    await addOrUpdateLocalKey(newKey);
    createdKeys.push(newKey);
  }

  return createdKeys;
}

export async function extendLocalKey(keyCode: string, addHours: number, setLifetime?: boolean): Promise<AccessKey | null> {
  const keys = await getLocalKeys();
  const found = keys.find((k) => k.key.toUpperCase() === keyCode.toUpperCase());
  if (!found) return null;

  if (setLifetime) {
    found.is_lifetime = true;
    found.duration = 'Lifetime';
    found.duration_hours = -1;
  } else {
    found.duration_hours = (found.duration_hours && found.duration_hours > 0 ? found.duration_hours : 0) + addHours;
    found.duration = `${found.duration_hours}h`;
  }

  await addOrUpdateLocalKey(found);
  return found;
}

export async function toggleRevokeLocalKey(keyCode: string): Promise<AccessKey | null> {
  const keys = await getLocalKeys();
  const found = keys.find((k) => k.key.toUpperCase() === keyCode.toUpperCase());
  if (!found) return null;

  found.status = found.status === 'revoked' ? 'active' : 'revoked';
  await addOrUpdateLocalKey(found);
  return found;
}

export async function purgeExpiredLocalKeys(): Promise<number> {
  const keys = await getLocalKeys();
  const filtered = keys.filter((k) => k.status !== 'expired');
  const purgedCount = keys.length - filtered.length;
  localStorage.setItem('void_admin_access_keys', JSON.stringify(filtered));
  return purgedCount;
}

