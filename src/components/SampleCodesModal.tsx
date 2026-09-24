import React, { useEffect, useRef } from 'react';
import { X, Sparkles, Scan, Download } from 'lucide-react';
import bwipjs from 'bwip-js';

interface SampleItem {
  id: string;
  title: string;
  category: string;
  format: string;
  bcid: string;
  text: string;
  description: string;
}

const SAMPLE_CODES: SampleItem[] = [
  {
    id: 'qr-url',
    title: 'Website URL',
    category: 'URL',
    format: 'QR_CODE',
    bcid: 'qrcode',
    text: 'https://github.com/khorshedcgpt-source/Universal-QR-and-Barcode-Scanner',
    description: 'Secure HTTPS web link to open',
  },
  {
    id: 'qr-wifi',
    title: 'Wi-Fi Network',
    category: 'Wi-Fi',
    format: 'QR_CODE',
    bcid: 'qrcode',
    text: 'WIFI:S:HomeGuest_5G;T:WPA;P:SuperSecretPass2026;H:false;;',
    description: 'Automatic Wi-Fi credentials with SSID and password',
  },
  {
    id: 'qr-vcard',
    title: 'Business Contact Card',
    category: 'Contact',
    format: 'QR_CODE',
    bcid: 'qrcode',
    text: 'BEGIN:VCARD\nVERSION:3.0\nN:Smith;Jane;;Dr.;\nFN:Dr. Jane Smith\nORG:Universal Scanning Labs\nTITLE:Lead Systems Architect\nTEL:+1-555-0199\nEMAIL:jane.smith@example.org\nURL:https://example.org\nEND:VCARD',
    description: 'Full vCard 3.0 contact with phone, email, and org',
  },
  {
    id: 'ean-13',
    title: 'Retail Grocery Item',
    category: 'Product',
    format: 'EAN_13',
    bcid: 'ean13',
    text: '5901234123457',
    description: 'Standard EAN-13 international retail barcode',
  },
  {
    id: 'code-128',
    title: 'Logistics Package ID',
    category: 'Logistics',
    format: 'CODE_128',
    bcid: 'code128',
    text: 'PKG-98234-EXP-2026',
    description: 'High-density alphanumeric Code 128 barcode',
  },
  {
    id: 'data-matrix',
    title: 'Industrial Component',
    category: '2D Matrix',
    format: 'DATA_MATRIX',
    bcid: 'datamatrix',
    text: 'PART-A901-SER-549102-REV4',
    description: 'Data Matrix 2D code used in automotive & aerospace',
  },
  {
    id: 'pdf-417',
    title: 'Boarding / ID Card',
    category: '2D Stacked',
    format: 'PDF_417',
    bcid: 'pdf417',
    text: 'PASSENGER:ALEXANDER/NOAH:FLIGHT:US849:SEAT:14B:GATE:C12',
    description: 'PDF417 stacked 2D barcode for ticketing and identification',
  },
  {
    id: 'aztec',
    title: 'Transit Rail Ticket',
    category: '2D Aztec',
    format: 'AZTEC',
    bcid: 'azteccode',
    text: 'TRANSIT:METRO-EXPRESS:TICKET#8910481-SINGLE-ZONE1-3',
    description: 'Aztec compact 2D code used in airline & railway tickets',
  },
];

interface SampleCodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSampleImage: (canvas: HTMLCanvasElement) => void;
}

export const SampleCodesModal: React.FC<SampleCodesModalProps> = ({
  isOpen,
  onClose,
  onSelectSampleImage,
}) => {
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

  useEffect(() => {
    if (!isOpen) return;

    SAMPLE_CODES.forEach((sample) => {
      const canvas = canvasRefs.current[sample.id];
      if (!canvas) return;

      try {
        bwipjs.toCanvas(canvas, {
          bcid: sample.bcid,
          text: sample.text,
          scale: 3,
          height: sample.bcid === 'qrcode' || sample.bcid === 'datamatrix' || sample.bcid === 'azteccode' ? 25 : 12,
          includetext: sample.bcid !== 'qrcode' && sample.bcid !== 'datamatrix' && sample.bcid !== 'azteccode' && sample.bcid !== 'pdf417',
          textxalign: 'center',
          backgroundcolor: 'FFFFFF',
          paddingwidth: 10,
          paddingheight: 10,
        });
      } catch (err) {
        console.warn('Failed rendering sample barcode:', sample.id, err);
      }
    });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Sample Barcodes & QR Codes</h2>
              <p className="text-xs text-slate-400">
                Instantly test 1D, 2D, and QR formats directly in the scanner engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {SAMPLE_CODES.map((sample) => (
            <div
              key={sample.id}
              className="bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-4 flex flex-col justify-between transition group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white text-sm">{sample.title}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 font-mono border border-slate-700">
                    {sample.format}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">{sample.description}</p>

                {/* Barcode Render Canvas */}
                <div className="bg-white rounded-lg p-3 flex items-center justify-center min-h-[140px] shadow-inner">
                  <canvas
                    ref={(el) => {
                      canvasRefs.current[sample.id] = el;
                    }}
                    className="max-h-[130px] max-w-full object-contain"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    const canvas = canvasRefs.current[sample.id];
                    if (canvas) {
                      onSelectSampleImage(canvas);
                      onClose();
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow transition"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span>Scan This Code</span>
                </button>
                <button
                  onClick={() => {
                    const canvas = canvasRefs.current[sample.id];
                    if (!canvas) return;
                    const a = document.createElement('a');
                    a.href = canvas.toDataURL('image/png');
                    a.download = `sample_${sample.id}.png`;
                    a.click();
                  }}
                  title="Download Image"
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>All samples decode locally on device without network transmission.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
