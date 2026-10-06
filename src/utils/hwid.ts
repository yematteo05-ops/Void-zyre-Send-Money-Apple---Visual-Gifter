// Device HWID generator and manager
export function getOrCreateDeviceHwid(): string {
  try {
    let hwid = localStorage.getItem('void_device_hwid');
    if (!hwid || !hwid.startsWith('HWID-')) {
      const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const part3 = Math.random().toString(36).substring(2, 6).toUpperCase();
      hwid = `HWID-${part1}-${part2}-${part3}`;
      localStorage.setItem('void_device_hwid', hwid);
    }
    return hwid;
  } catch {
    return 'HWID-62E0-CA8D-7B0Y';
  }
}
