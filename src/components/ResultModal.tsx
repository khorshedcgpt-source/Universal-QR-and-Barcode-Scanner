import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Wifi,
  User,
  Mail,
  MessageSquare,
  Phone,
  MapPin,
  Barcode,
  Share2,
  Bookmark,
  Sparkles,
  Download,
} from 'lucide-react';
import { ScanResult } from '../types/scanner';

interface ResultModalProps {
  result: ScanResult | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite?: (id: string) => void;
  onScanAnother?: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  result,
  isOpen,
  onClose,
  onToggleFavorite,
  onScanAnother,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  if (!isOpen || !result) return null;

  const { payload, format, rawValue, timestamp } = result;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPassword = (pwd: string) => {
    navigator.clipboard.writeText(pwd);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: payload.title,
          text: rawValue,
        });
      } catch {
        // user canceled share
      }
    } else {
      handleCopy(rawValue);
    }
  };

  const handleDownloadVCard = () => {
    if (!payload.vcard) return;
    const blob = new Blob([payload.vcard.rawVCard], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(payload.vcard.name || 'contact').replace(/\s+/g, '_')}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Type-specific icon
  const getIcon = () => {
    switch (payload.type) {
      case 'url':
        return <ExternalLink className="w-5 h-5 text-cyan-400" />;
      case 'wifi':
        return <Wifi className="w-5 h-5 text-emerald-400" />;
      case 'vcard':
        return <User className="w-5 h-5 text-purple-400" />;
      case 'email':
        return <Mail className="w-5 h-5 text-blue-400" />;
      case 'sms':
        return <MessageSquare className="w-5 h-5 text-green-400" />;
      case 'phone':
        return <Phone className="w-5 h-5 text-amber-400" />;
      case 'geo':
        return <MapPin className="w-5 h-5 text-rose-400" />;
      case 'product':
        return <Barcode className="w-5 h-5 text-amber-300" />;
      default:
        return <Sparkles className="w-5 h-5 text-cyan-300" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 shadow-inner">
              {getIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  {format.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  {payload.type}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Scanned {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(result.id)}
                className={`p-2 rounded-xl border transition ${
                  result.favorite
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'text-slate-400 hover:text-white border-transparent hover:bg-slate-800'
                }`}
                title={result.favorite ? 'Remove Favorite' : 'Save as Favorite'}
              >
                <Bookmark className={`w-4 h-4 ${result.favorite ? 'fill-current' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Main Title / Display */}
          <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800">
            <h3 className="text-lg font-bold text-white break-words">
              {payload.title}
            </h3>
            {payload.description && (
              <p className="text-xs text-slate-400 mt-1 break-words">
                {payload.description}
              </p>
            )}
          </div>

          {/* Contextual Custom Actions */}
          {payload.type === 'url' && (
            <div className="space-y-3">
              <a
                href={payload.displayValue}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-cyan-600/20 transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Link in New Tab</span>
              </a>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs text-slate-400 flex items-start gap-2">
                <span className="text-cyan-400 font-bold">ℹ</span>
                <span>Links open safely with security attributes (noopener noreferrer).</span>
              </div>
            </div>
          )}

          {payload.type === 'wifi' && payload.wifi && (
            <div className="space-y-3 bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">Network Name (SSID)</span>
                  <span className="font-semibold text-white">{payload.wifi.ssid}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Security Type</span>
                  <span className="font-semibold text-white">{payload.wifi.authType}</span>
                </div>
              </div>

              {payload.wifi.password ? (
                <div className="pt-2 border-t border-slate-700">
                  <span className="text-xs text-slate-400 block mb-1">Wi-Fi Password</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={payload.wifi.password}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-cyan-300 font-mono select-all"
                    />
                    <button
                      onClick={() => handleCopyPassword(payload.wifi?.password || '')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition"
                    >
                      {copiedPassword ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPassword ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-emerald-400 font-medium pt-2 border-t border-slate-700">
                  Open network (No password required)
                </p>
              )}
            </div>
          )}

          {payload.type === 'vcard' && payload.vcard && (
            <div className="space-y-3">
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60 space-y-2 text-sm">
                {payload.vcard.name && (
                  <div>
                    <span className="text-xs text-slate-400 block">Full Name</span>
                    <span className="font-semibold text-white">{payload.vcard.name}</span>
                  </div>
                )}
                {payload.vcard.phone && (
                  <div>
                    <span className="text-xs text-slate-400 block">Phone</span>
                    <a href={`tel:${payload.vcard.phone}`} className="text-cyan-400 hover:underline">
                      {payload.vcard.phone}
                    </a>
                  </div>
                )}
                {payload.vcard.email && (
                  <div>
                    <span className="text-xs text-slate-400 block">Email</span>
                    <a href={`mailto:${payload.vcard.email}`} className="text-cyan-400 hover:underline">
                      {payload.vcard.email}
                    </a>
                  </div>
                )}
                {payload.vcard.organization && (
                  <div>
                    <span className="text-xs text-slate-400 block">Organization</span>
                    <span className="text-slate-200">{payload.vcard.organization}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleDownloadVCard}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl shadow transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Contact (.vcf)</span>
              </button>
            </div>
          )}

          {payload.type === 'email' && payload.email && (
            <div className="space-y-3">
              <a
                href={`mailto:${payload.email.email}?subject=${encodeURIComponent(payload.email.subject || '')}&body=${encodeURIComponent(payload.email.body || '')}`}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow transition"
              >
                <Mail className="w-4 h-4" />
                <span>Send Email</span>
              </a>
            </div>
          )}

          {payload.type === 'sms' && payload.sms && (
            <div className="space-y-3">
              <a
                href={`sms:${payload.sms.phoneNumber}?body=${encodeURIComponent(payload.sms.message || '')}`}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-xl shadow transition"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send SMS Message</span>
              </a>
            </div>
          )}

          {payload.type === 'phone' && (
            <div className="space-y-3">
              <a
                href={`tel:${payload.displayValue}`}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-xl shadow transition"
              >
                <Phone className="w-4 h-4" />
                <span>Call {payload.displayValue}</span>
              </a>
            </div>
          )}

          {payload.type === 'geo' && payload.geo && (
            <div className="space-y-3">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${payload.geo.latitude},${payload.geo.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl shadow transition"
              >
                <MapPin className="w-4 h-4" />
                <span>View on Google Maps</span>
              </a>
            </div>
          )}

          {payload.type === 'product' && payload.productCode && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://world.openfoodfacts.org/product/${payload.productCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl shadow transition text-center"
                >
                  <Barcode className="w-4 h-4" />
                  <span>Open Food Facts</span>
                </a>
                <a
                  href={`https://www.barcodelookup.com/${payload.productCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition text-center"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Barcode Lookup</span>
                </a>
              </div>
            </div>
          )}

          {/* Raw Payload Block */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-400">Decoded Raw Content</span>
              <span className="text-[11px] text-slate-400 font-mono">{rawValue.length} characters</span>
            </div>
            <div className="relative">
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 max-h-40 overflow-y-auto whitespace-pre-wrap break-all select-all">
                {rawValue}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer / Primary Action Buttons */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => handleCopy(rawValue)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold rounded-xl border border-slate-700 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 text-xs sm:text-sm transition"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              if (onScanAnother) onScanAnother();
            }}
            className="flex-1 max-w-[200px] py-2 px-4 bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition text-center"
          >
            Scan Another
          </button>
        </div>
      </div>
    </div>
  );
};
