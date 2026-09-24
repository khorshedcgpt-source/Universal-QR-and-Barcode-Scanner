export type BarcodeFormat =
  | 'QR_CODE'
  | 'DATA_MATRIX'
  | 'AZTEC'
  | 'PDF_417'
  | 'EAN_13'
  | 'EAN_8'
  | 'UPC_A'
  | 'UPC_E'
  | 'CODE_128'
  | 'CODE_39'
  | 'CODE_93'
  | 'CODABAR'
  | 'ITF';

export type ResultType =
  | 'url'
  | 'wifi'
  | 'vcard'
  | 'email'
  | 'sms'
  | 'phone'
  | 'geo'
  | 'product'
  | 'json'
  | 'text';

export interface WifiData {
  ssid: string;
  password?: string;
  authType: 'WPA' | 'WEP' | 'nopass' | string;
  hidden?: boolean;
}

export interface VCardData {
  name: string;
  formattedName?: string;
  phone?: string;
  email?: string;
  organization?: string;
  title?: string;
  url?: string;
  address?: string;
  note?: string;
  rawVCard: string;
}

export interface EmailData {
  email: string;
  subject?: string;
  body?: string;
}

export interface SmsData {
  phoneNumber: string;
  message?: string;
}

export interface GeoData {
  latitude: number;
  longitude: number;
  altitude?: number;
  query?: string;
}

export interface ParsedPayload {
  type: ResultType;
  title: string;
  description: string;
  displayValue: string;
  wifi?: WifiData;
  vcard?: VCardData;
  email?: EmailData;
  sms?: SmsData;
  geo?: GeoData;
  productCode?: string;
  parsedJson?: unknown;
}

export interface ScanResult {
  id: string;
  rawValue: string;
  format: BarcodeFormat | string;
  timestamp: number;
  payload: ParsedPayload;
  favorite?: boolean;
  thumbnail?: string;
}

export interface AppSettings {
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  autoCopy: boolean;
  autoOpenUrl: boolean;
  continuousScan: boolean;
  enabledFormats: Record<BarcodeFormat, boolean>;
  preferredCameraId?: string;
  highAccuracy: boolean;
}
