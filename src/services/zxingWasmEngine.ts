/**
 * Isolated Proof-of-Concept Engine Implementation for ZXing-C++ (WebAssembly).
 * 
 * Based on zxing-wasm (Sec-ant/zxing-wasm), which wraps the official zxing-cpp
 * library compiled with Emscripten/WASM.
 * 
 * Verified against:
 * - 12_SCANNER_ENGINE_VERIFICATION.md
 * - 13_SCANNER_ENGINE_POC.md
 * - Privacy spec: 100% in-memory, 0 network telemetry, local WASM binary.
 */

import {
  readBarcodes,
  prepareZXingModule,
  type ReadResult,
  type ReaderOptions,
  type ReadInputBarcodeFormat,
} from 'zxing-wasm/reader';
import { BarcodeFormat } from '../types/scanner';

export interface ZxingWasmDecodedResult {
  rawValue: string;
  format: string;
  symbology: string;
  points?: Array<{ x: number; y: number }>;
  error?: string;
  rotation?: number;
  isInverted?: boolean;
}

// Map project format strings to zxing-wasm formats
const ZXING_WASM_FORMAT_MAP: Record<BarcodeFormat, ReadInputBarcodeFormat> = {
  QR_CODE: 'QRCode',
  DATA_MATRIX: 'DataMatrix',
  AZTEC: 'Aztec',
  PDF_417: 'PDF417',
  EAN_13: 'EAN13',
  EAN_8: 'EAN8',
  UPC_A: 'UPCA',
  UPC_E: 'UPCE',
  CODE_128: 'Code128',
  CODE_39: 'Code39',
  CODE_93: 'Code93',
  CODABAR: 'Codabar',
  ITF: 'ITF',
};

export class ZxingWasmEngine {
  private isInitialized = false;
  private activeFormats: ReadInputBarcodeFormat[] = Object.values(ZXING_WASM_FORMAT_MAP);

  constructor() {
    this.initModule();
  }

  private initModule() {
    try {
      // Configure local locateFile so WASM runs 100% offline without CDN fallback
      prepareZXingModule({
        overrides: {
          locateFile: (path: string, prefix: string) => {
            if (path.endsWith('.wasm')) {
              // Local static path served by Vite
              return `/zxing_reader.wasm`;
            }
            return prefix + path;
          },
        },
        fireImmediately: true,
      });
      this.isInitialized = true;
    } catch (err) {
      console.warn('ZXing-C++ WASM module init error:', err);
    }
  }

  public setEnabledFormats(enabledMap: Record<BarcodeFormat, boolean>) {
    this.activeFormats = (Object.keys(enabledMap) as BarcodeFormat[])
      .filter((f) => enabledMap[f])
      .map((f) => ZXING_WASM_FORMAT_MAP[f])
      .filter(Boolean);
  }

  public async decodeImageData(
    imageData: ImageData,
    options?: {
      tryHarder?: boolean;
      tryRotate?: boolean;
      tryInvert?: boolean;
      maxNumberOfSymbols?: number;
      formats?: ReadInputBarcodeFormat[];
    }
  ): Promise<ZxingWasmDecodedResult | null> {
    try {
      const readerOptions: ReaderOptions = {
        tryHarder: options?.tryHarder ?? true,
        tryRotate: options?.tryRotate ?? true,
        tryInvert: options?.tryInvert ?? true,
        maxNumberOfSymbols: options?.maxNumberOfSymbols ?? 1,
        formats: options?.formats ?? (this.activeFormats.length > 0 ? this.activeFormats : undefined),
      };

      const results: ReadResult[] = await readBarcodes(imageData, readerOptions);

      if (results && results.length > 0) {
        const first = results[0];
        if (first.isValid && first.text) {
          const points = first.position
            ? [
                first.position.topLeft,
                first.position.topRight,
                first.position.bottomRight,
                first.position.bottomLeft,
              ]
            : undefined;

          return {
            rawValue: first.text,
            format: first.format,
            symbology: first.symbology,
            points,
            rotation: first.rotation,
            isInverted: first.isInverted,
          };
        }
      }
    } catch (err) {
      // Decode failed or format not present in frame
    }
    return null;
  }

  public async decodeMultiple(
    imageData: ImageData,
    maxSymbols = 10
  ): Promise<ZxingWasmDecodedResult[]> {
    try {
      const results: ReadResult[] = await readBarcodes(imageData, {
        tryHarder: true,
        tryRotate: true,
        tryInvert: true,
        maxNumberOfSymbols: maxSymbols,
        formats: this.activeFormats.length > 0 ? this.activeFormats : undefined,
      });

      return (results || [])
        .filter((r) => r.isValid && r.text)
        .map((r) => ({
          rawValue: r.text,
          format: r.format,
          symbology: r.symbology,
          rotation: r.rotation,
          isInverted: r.isInverted,
        }));
    } catch {
      return [];
    }
  }

  public dispose() {
    // No-op for now; wasm memory is managed per call
  }
}
