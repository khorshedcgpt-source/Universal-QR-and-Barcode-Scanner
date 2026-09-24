import { ScanResult, AppSettings, BarcodeFormat } from '../types/scanner';

const HISTORY_KEY = 'uqbs_scan_history_v1';
const SETTINGS_KEY = 'uqbs_app_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  vibrateEnabled: true,
  autoCopy: false,
  autoOpenUrl: false,
  continuousScan: false,
  highAccuracy: true,
  enabledFormats: {
    QR_CODE: true,
    DATA_MATRIX: true,
    AZTEC: true,
    PDF_417: true,
    EAN_13: true,
    EAN_8: true,
    UPC_A: true,
    UPC_E: true,
    CODE_128: true,
    CODE_39: true,
    CODE_93: true,
    CODABAR: true,
    ITF: true,
  },
};

export function getScanHistory(): ScanResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveScanResult(result: ScanResult): ScanResult[] {
  const current = getScanHistory();
  // Filter out any identical recent duplicate (within 3 seconds)
  const isDuplicate = current.length > 0 && 
    current[0].rawValue === result.rawValue && 
    (result.timestamp - current[0].timestamp < 3000);

  if (isDuplicate) {
    return current;
  }

  const updated = [result, ...current].slice(0, 500); // retain last 500 items
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // quota exceeded or private mode
  }
  return updated;
}

export function toggleFavoriteScan(id: string): ScanResult[] {
  const current = getScanHistory();
  const updated = current.map(item => item.id === id ? { ...item, favorite: !item.favorite } : item);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

export function deleteScanResult(id: string): ScanResult[] {
  const current = getScanHistory();
  const updated = current.filter(item => item.id !== id);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

export function clearAllHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}

export function getAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      enabledFormats: {
        ...DEFAULT_SETTINGS.enabledFormats,
        ...(parsed.enabledFormats || {}),
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveAppSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function exportHistoryAsJson(): void {
  const data = getScanHistory();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `scanner_history_${new Date().toISOString().slice(0, 10)}.json`);
}

export function exportHistoryAsCsv(): void {
  const data = getScanHistory();
  const headers = ['Timestamp', 'Date', 'Format', 'Type', 'Title', 'Raw Value'];
  const rows = data.map(item => [
    item.timestamp,
    `"${new Date(item.timestamp).toISOString()}"`,
    `"${item.format}"`,
    `"${item.payload.type}"`,
    `"${(item.payload.title || '').replace(/"/g, '""')}"`,
    `"${(item.rawValue || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `scanner_history_${new Date().toISOString().slice(0, 10)}.csv`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
