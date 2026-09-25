import {
  MultiFormatReader,
  DecodeHintType,
  BarcodeFormat as ZXingBarcodeFormat,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
} from '@zxing/library';
import { BarcodeFormat } from '../types/scanner';

export interface DecodedResult {
  rawValue: string;
  format: BarcodeFormat | string;
  points?: Array<{ x: number; y: number }>;
}

// Map from internal format to ZXing BarcodeFormat enum
const FORMAT_MAP: Record<BarcodeFormat, ZXingBarcodeFormat> = {
  QR_CODE: ZXingBarcodeFormat.QR_CODE,
  DATA_MATRIX: ZXingBarcodeFormat.DATA_MATRIX,
  AZTEC: ZXingBarcodeFormat.AZTEC,
  PDF_417: ZXingBarcodeFormat.PDF_417,
  EAN_13: ZXingBarcodeFormat.EAN_13,
  EAN_8: ZXingBarcodeFormat.EAN_8,
  UPC_A: ZXingBarcodeFormat.UPC_A,
  UPC_E: ZXingBarcodeFormat.UPC_E,
  CODE_128: ZXingBarcodeFormat.CODE_128,
  CODE_39: ZXingBarcodeFormat.CODE_39,
  CODE_93: ZXingBarcodeFormat.CODE_93,
  CODABAR: ZXingBarcodeFormat.CODABAR,
  ITF: ZXingBarcodeFormat.ITF,
};

// Map from ZXing BarcodeFormat to internal string
const REVERSE_FORMAT_MAP: Map<ZXingBarcodeFormat, BarcodeFormat> = new Map([
  [ZXingBarcodeFormat.QR_CODE, 'QR_CODE'],
  [ZXingBarcodeFormat.DATA_MATRIX, 'DATA_MATRIX'],
  [ZXingBarcodeFormat.AZTEC, 'AZTEC'],
  [ZXingBarcodeFormat.PDF_417, 'PDF_417'],
  [ZXingBarcodeFormat.EAN_13, 'EAN_13'],
  [ZXingBarcodeFormat.EAN_8, 'EAN_8'],
  [ZXingBarcodeFormat.UPC_A, 'UPC_A'],
  [ZXingBarcodeFormat.UPC_E, 'UPC_E'],
  [ZXingBarcodeFormat.CODE_128, 'CODE_128'],
  [ZXingBarcodeFormat.CODE_39, 'CODE_39'],
  [ZXingBarcodeFormat.CODE_93, 'CODE_93'],
  [ZXingBarcodeFormat.CODABAR, 'CODABAR'],
  [ZXingBarcodeFormat.ITF, 'ITF'],
]);

// Map native BarcodeDetector format strings
const NATIVE_FORMAT_MAP: Record<string, BarcodeFormat> = {
  qr_code: 'QR_CODE',
  data_matrix: 'DATA_MATRIX',
  aztec: 'AZTEC',
  pdf417: 'PDF_417',
  ean_13: 'EAN_13',
  ean_8: 'EAN_8',
  upc_a: 'UPC_A',
  upc_e: 'UPC_E',
  code_128: 'CODE_128',
  code_39: 'CODE_39',
  code_93: 'CODE_93',
  codabar: 'CODABAR',
  itf: 'ITF',
};

export class ScannerEngine {
  private zxingReader: MultiFormatReader | null = null;
  private nativeDetector: unknown = null;
  private isNativeSupported = false;
  private activeFormats: BarcodeFormat[] = Object.keys(FORMAT_MAP) as BarcodeFormat[];
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D | null;

  constructor() {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    this.initNativeDetector();
    this.initZXingReader();
  }

  private initNativeDetector() {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const BarcodeDetectorClass = (window as unknown as { BarcodeDetector: new (opts?: { formats: string[] }) => unknown }).BarcodeDetector;
        const nativeFormats = [
          'qr_code', 'data_matrix', 'aztec', 'pdf417',
          'ean_13', 'ean_8', 'upc_a', 'upc_e',
          'code_128', 'code_39', 'code_93', 'codabar', 'itf'
        ];
        this.nativeDetector = new BarcodeDetectorClass({ formats: nativeFormats });
        this.isNativeSupported = true;
      } catch {
        this.isNativeSupported = false;
        this.nativeDetector = null;
      }
    }
  }

  public setEnabledFormats(enabledMap: Record<BarcodeFormat, boolean>) {
    this.activeFormats = (Object.keys(enabledMap) as BarcodeFormat[]).filter(f => enabledMap[f]);
    this.initZXingReader();
  }

  private initZXingReader() {
    const hints = new Map();
    const formatsToUse = this.activeFormats
      .map(f => FORMAT_MAP[f])
      .filter((f): f is ZXingBarcodeFormat => f !== undefined);

    hints.set(DecodeHintType.POSSIBLE_FORMATS, formatsToUse.length > 0 ? formatsToUse : Object.values(FORMAT_MAP));
    hints.set(DecodeHintType.TRY_HARDER, true);

    this.zxingReader = new MultiFormatReader();
    this.zxingReader.setHints(hints);
  }

  public async scanVideo(video: HTMLVideoElement): Promise<DecodedResult | null> {
    if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    // 1. Try native BarcodeDetector if available
    if (this.isNativeSupported && this.nativeDetector) {
      try {
        const detector = this.nativeDetector as { detect: (src: ImageBitmapSource) => Promise<Array<{ rawValue: string; format: string }>> };
        const results = await detector.detect(video);
        if (results && results.length > 0) {
          const first = results[0];
          const fmt = NATIVE_FORMAT_MAP[first.format] || first.format.toUpperCase();
          return {
            rawValue: first.rawValue,
            format: fmt,
          };
        }
      } catch {
        // Fallback to ZXing
      }
    }

    // 2. Fallback to ZXing decoding
    const width = video.videoWidth;
    const height = video.videoHeight;
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;

    if (!this.offscreenCtx) return null;
    this.offscreenCtx.drawImage(video, 0, 0, width, height);

    const imageData = this.offscreenCtx.getImageData(0, 0, width, height);
    return this.decodeImageData(imageData);
  }

  public async scanImageElement(img: HTMLImageElement | HTMLCanvasElement): Promise<DecodedResult | null> {
    const width = ('naturalWidth' in img ? img.naturalWidth : img.width) || img.width;
    const height = ('naturalHeight' in img ? img.naturalHeight : img.height) || img.height;

    if (!width || !height) return null;

    // 1. Native BarcodeDetector
    if (this.isNativeSupported && this.nativeDetector) {
      try {
        const detector = this.nativeDetector as { detect: (src: ImageBitmapSource) => Promise<Array<{ rawValue: string; format: string }>> };
        const results = await detector.detect(img);
        if (results && results.length > 0) {
          const first = results[0];
          const fmt = NATIVE_FORMAT_MAP[first.format] || first.format.toUpperCase();
          return {
            rawValue: first.rawValue,
            format: fmt,
          };
        }
      } catch {
        // Fallback
      }
    }

    // 2. Offscreen Canvas extraction with Multi-strategy Fallback
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
    if (!this.offscreenCtx) return null;

    this.offscreenCtx.drawImage(img, 0, 0, width, height);
    const originalData = this.offscreenCtx.getImageData(0, 0, width, height);

    // Strategy A: Standard scan
    let decoded = this.decodeImageData(originalData);
    if (decoded) return decoded;

    // Strategy B: Inverted scan (for dark-mode QR codes: white dots on black)
    const invertedData = this.invertImageData(originalData);
    decoded = this.decodeImageData(invertedData);
    if (decoded) return decoded;

    // Strategy C: Rotated 90° for vertical barcodes
    const rotatedCanvas = document.createElement('canvas');
    rotatedCanvas.width = height;
    rotatedCanvas.height = width;
    const rotCtx = rotatedCanvas.getContext('2d', { willReadFrequently: true });
    if (rotCtx) {
      rotCtx.translate(height / 2, width / 2);
      rotCtx.rotate((90 * Math.PI) / 180);
      rotCtx.drawImage(img, -width / 2, -height / 2);
      const rotatedData = rotCtx.getImageData(0, 0, height, width);
      decoded = this.decodeImageData(rotatedData);
      if (decoded) return decoded;
    }

    return null;
  }

  private decodeImageData(imageData: ImageData): DecodedResult | null {
    if (!this.zxingReader) return null;

    const width = imageData.width;
    const height = imageData.height;
    const d = imageData.data;
    const argb = new Int32Array(width * height);
    for (let i = 0; i < d.length; i += 4) {
      argb[i / 4] = (d[i + 3] << 24) | (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
    }
    try {
      const luminanceSource = new RGBLuminanceSource(
        argb,
        width,
        height
      );
      const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
      const result = this.zxingReader.decode(binaryBitmap);

      if (result) {
        const fmtEnum = result.getBarcodeFormat();
        const fmtName = REVERSE_FORMAT_MAP.get(fmtEnum) || 'UNKNOWN';
        const points = result.getResultPoints()?.map(p => ({ x: p.getX(), y: p.getY() }));

        return {
          rawValue: result.getText(),
          format: fmtName,
          points,
        };
      }
    } catch {
      // Decode not found in this frame/data
    }

    return null;
  }

  private invertImageData(imageData: ImageData): ImageData {
    const copy = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );
    const d = copy.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = 255 - d[i];         // R
      d[i + 1] = 255 - d[i + 1]; // G
      d[i + 2] = 255 - d[i + 2]; // B
    }
    return copy;
  }

  public dispose() {
    this.zxingReader?.reset();
    this.zxingReader = null;
    this.nativeDetector = null;
  }
}
