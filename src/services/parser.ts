import { ParsedPayload, ResultType, WifiData, VCardData, EmailData, SmsData, GeoData } from '../types/scanner';

export function parseBarcodePayload(raw: string, format?: string): ParsedPayload {
  const trimmed = raw.trim();

  // 1. Wi-Fi Configuration (WIFI:T:WPA;S:MyNetwork;P:MyPassword;H:false;;)
  if (/^WIFI:/i.test(trimmed)) {
    const wifi = parseWifiPayload(trimmed);
    return {
      type: 'wifi',
      title: wifi.ssid ? `Wi-Fi: ${wifi.ssid}` : 'Wi-Fi Network',
      description: `Security: ${wifi.authType || 'None'}${wifi.password ? ' (Password protected)' : ' (Open)'}`,
      displayValue: wifi.ssid,
      wifi,
    };
  }

  // 2. vCard Contact (BEGIN:VCARD ... END:VCARD) or MeCard (MECARD:...)
  if (/^BEGIN:VCARD/i.test(trimmed) || /^MECARD:/i.test(trimmed)) {
    const vcard = parseContactPayload(trimmed);
    return {
      type: 'vcard',
      title: vcard.name || vcard.formattedName || 'Contact Information',
      description: [vcard.phone, vcard.email, vcard.organization].filter(Boolean).join(' • ') || 'vCard Contact',
      displayValue: vcard.name || vcard.phone || trimmed,
      vcard,
    };
  }

  // 3. Email (mailto: or MATMSG:)
  if (/^mailto:/i.test(trimmed) || /^MATMSG:/i.test(trimmed)) {
    const email = parseEmailPayload(trimmed);
    return {
      type: 'email',
      title: email.email,
      description: email.subject ? `Subject: ${email.subject}` : 'Email Address',
      displayValue: email.email,
      email,
    };
  }

  // 4. SMS (smsto: or sms:)
  if (/^smsto:/i.test(trimmed) || /^sms:/i.test(trimmed)) {
    const sms = parseSmsPayload(trimmed);
    return {
      type: 'sms',
      title: `SMS to ${sms.phoneNumber}`,
      description: sms.message ? `Message: "${sms.message}"` : 'Direct SMS',
      displayValue: sms.phoneNumber,
      sms,
    };
  }

  // 5. Telephone (tel:)
  if (/^tel:/i.test(trimmed)) {
    const phone = trimmed.replace(/^tel:/i, '').trim();
    return {
      type: 'phone',
      title: phone,
      description: 'Direct Phone Number',
      displayValue: phone,
    };
  }

  // 6. Geo Location (geo:lat,lng or Google Maps URL)
  if (/^geo:/i.test(trimmed) || /^https?:\/\/(maps\.google\.com|goo\.gl\/maps|maps\.apple\.com)/i.test(trimmed)) {
    const geo = parseGeoPayload(trimmed);
    return {
      type: 'geo',
      title: geo ? `Location: ${geo.latitude.toFixed(5)}, ${geo.longitude.toFixed(5)}` : 'Geographic Location',
      description: 'Coordinates / Map location',
      displayValue: geo ? `${geo.latitude}, ${geo.longitude}` : trimmed,
      geo: geo || undefined,
    };
  }

  // 7. Web URL (http://, https://)
  if (/^https?:\/\//i.test(trimmed) || /^(www\.)[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(trimmed)) {
    let url = trimmed;
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    let host = '';
    try {
      const parsedUrl = new URL(url);
      host = parsedUrl.hostname;
    } catch {
      host = trimmed;
    }

    return {
      type: 'url',
      title: host || trimmed,
      description: url,
      displayValue: url,
    };
  }

  // 8. Product Barcodes (EAN-13, EAN-8, UPC-A, UPC-E)
  const isProductFormat = format && ['EAN_13', 'EAN_8', 'UPC_A', 'UPC_E', 'ean_13', 'ean_8', 'upc_a', 'upc_e'].includes(format);
  if (isProductFormat || (/^\d{8}$|^\d{12,14}$/.test(trimmed) && (format?.includes('EAN') || format?.includes('UPC')))) {
    return {
      type: 'product',
      title: `Product Code: ${trimmed}`,
      description: `Format: ${format || 'Retail Barcode'}`,
      displayValue: trimmed,
      productCode: trimmed,
    };
  }

  // 9. JSON Data
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        type: 'json',
        title: 'Structured JSON Data',
        description: Array.isArray(parsed) ? `Array (${parsed.length} items)` : `Object (${Object.keys(parsed).length} keys)`,
        displayValue: trimmed,
        parsedJson: parsed,
      };
    } catch {
      // not valid JSON, fall through
    }
  }

  // 10. Default Plain Text
  return {
    type: 'text',
    title: trimmed.length > 50 ? trimmed.substring(0, 47) + '...' : trimmed,
    description: `Plain text (${trimmed.length} characters)`,
    displayValue: trimmed,
  };
}

function parseWifiPayload(raw: string): WifiData {
  const wifi: WifiData = {
    ssid: '',
    authType: 'WPA',
    hidden: false,
  };

  // Format: WIFI:S:SSID;T:WPA;P:Password;H:false;;
  const strip = raw.replace(/^WIFI:/i, '');
  const tokens = strip.split(';');

  for (const token of tokens) {
    if (!token) continue;
    const colonIdx = token.indexOf(':');
    if (colonIdx === -1) continue;

    const key = token.substring(0, colonIdx).toUpperCase();
    const val = token.substring(colonIdx + 1);

    if (key === 'S') wifi.ssid = val;
    else if (key === 'T') wifi.authType = val || 'nopass';
    else if (key === 'P') wifi.password = val;
    else if (key === 'H') wifi.hidden = val.toLowerCase() === 'true';
  }

  return wifi;
}

function parseContactPayload(raw: string): VCardData {
  const vcard: VCardData = {
    name: '',
    rawVCard: raw,
  };

  if (raw.startsWith('MECARD:')) {
    const tokens = raw.replace(/^MECARD:/i, '').split(';');
    for (const token of tokens) {
      if (!token) continue;
      const colonIdx = token.indexOf(':');
      if (colonIdx === -1) continue;
      const key = token.substring(0, colonIdx).toUpperCase();
      const val = token.substring(colonIdx + 1);

      if (key === 'N') vcard.name = val.replace(/,/g, ' ');
      else if (key === 'TEL') vcard.phone = val;
      else if (key === 'EMAIL') vcard.email = val;
      else if (key === 'ORG') vcard.organization = val;
      else if (key === 'NOTE') vcard.note = val;
      else if (key === 'URL') vcard.url = val;
      else if (key === 'ADR') vcard.address = val.replace(/,/g, ', ');
    }
  } else {
    // Standard vCard (RFC 6350)
    const lines = raw.split(/\r\n|\r|\n/);
    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;

      const fullKey = line.substring(0, colonIdx).toUpperCase();
      const val = line.substring(colonIdx + 1).trim();

      const mainKey = fullKey.split(';')[0];
      if (mainKey === 'FN') {
        vcard.formattedName = val;
        if (!vcard.name) vcard.name = val;
      } else if (mainKey === 'N' && !vcard.name) {
        vcard.name = val.split(';').filter(Boolean).reverse().join(' ');
      } else if (mainKey === 'TEL') {
        vcard.phone = val;
      } else if (mainKey === 'EMAIL') {
        vcard.email = val;
      } else if (mainKey === 'ORG') {
        vcard.organization = val.replace(/;/g, ' - ');
      } else if (mainKey === 'TITLE') {
        vcard.title = val;
      } else if (mainKey === 'URL') {
        vcard.url = val;
      } else if (mainKey === 'ADR') {
        vcard.address = val.split(';').filter(Boolean).join(', ');
      } else if (mainKey === 'NOTE') {
        vcard.note = val;
      }
    }
  }

  if (!vcard.name && vcard.formattedName) {
    vcard.name = vcard.formattedName;
  }

  return vcard;
}

function parseEmailPayload(raw: string): EmailData {
  if (raw.startsWith('MATMSG:')) {
    const email: EmailData = { email: '' };
    const tokens = raw.replace(/^MATMSG:/i, '').split(';');
    for (const token of tokens) {
      const colonIdx = token.indexOf(':');
      if (colonIdx === -1) continue;
      const key = token.substring(0, colonIdx).toUpperCase();
      const val = token.substring(colonIdx + 1);
      if (key === 'TO') email.email = val;
      else if (key === 'SUB') email.subject = val;
      else if (key === 'BODY') email.body = val;
    }
    return email;
  }

  // mailto:someone@example.com?subject=Hello&body=World
  const cleaned = raw.replace(/^mailto:/i, '');
  const qIdx = cleaned.indexOf('?');
  if (qIdx === -1) {
    return { email: cleaned };
  }

  const email = cleaned.substring(0, qIdx);
  const searchParams = new URLSearchParams(cleaned.substring(qIdx + 1));
  return {
    email,
    subject: searchParams.get('subject') || undefined,
    body: searchParams.get('body') || undefined,
  };
}

function parseSmsPayload(raw: string): SmsData {
  if (/^smsto:/i.test(raw)) {
    const stripped = raw.replace(/^smsto:/i, '');
    const colonIdx = stripped.indexOf(':');
    if (colonIdx === -1) {
      return { phoneNumber: stripped };
    }
    return {
      phoneNumber: stripped.substring(0, colonIdx),
      message: stripped.substring(colonIdx + 1),
    };
  }

  // sms:+1234567890?body=Hello
  const cleaned = raw.replace(/^sms:/i, '');
  const qIdx = cleaned.indexOf('?');
  if (qIdx === -1) {
    return { phoneNumber: cleaned };
  }
  const phoneNumber = cleaned.substring(0, qIdx);
  const searchParams = new URLSearchParams(cleaned.substring(qIdx + 1));
  return {
    phoneNumber,
    message: searchParams.get('body') || undefined,
  };
}

function parseGeoPayload(raw: string): GeoData | null {
  if (raw.startsWith('geo:')) {
    const coords = raw.replace(/^geo:/i, '').split('?')[0];
    const parts = coords.split(',');
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return {
          latitude: lat,
          longitude: lng,
          altitude: parts[2] ? parseFloat(parts[2]) : undefined,
        };
      }
    }
  }

  // Google Maps link: https://maps.google.com/?q=lat,lng
  const match = raw.match(/[?&]q=([-+]?\d*\.?\d+),([-+]?\d*\.?\d+)/);
  if (match) {
    return {
      latitude: parseFloat(match[1]),
      longitude: parseFloat(match[2]),
    };
  }

  return null;
}
