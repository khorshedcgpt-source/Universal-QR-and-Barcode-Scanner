/**
 * Comprehensive Empirical Scanner Engine Benchmark Script
 * 
 * Accurately benchmarks identical test cases across:
 *  - Candidate 1: @zxing/library (Pure JS)
 *  - Candidate 2: zxing-wasm (ZXing-C++ compiled to WebAssembly)
 * 
 * Accurately accounts for:
 *  - Format normalization (e.g. UPC-E / UPC-A 13-digit EAN normalization in zxing-cpp)
 *  - Required checksum options (e.g. Code 93 includecheck)
 *  - Pure JS vs WASM multi-symbol decoding
 */

import bwipjs from 'bwip-js';
import { inflateSync } from 'zlib';
import {
  MultiFormatReader,
  DecodeHintType,
  BarcodeFormat as ZXingBarcodeFormat,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
} from '@zxing/library';
import { readBarcodes } from 'zxing-wasm/reader';
import fs from 'fs';

const TEST_CASES = [
  // 1. Required Formats (1D & 2D)
  { id: 'TC-EAN8', format: 'EAN-8', bcid: 'ean8', text: '96385074', category: '1D', condition: 'Normal' },
  { id: 'TC-EAN13', format: 'EAN-13', bcid: 'ean13', text: '5901234123457', category: '1D', condition: 'Normal' },
  { id: 'TC-UPCA', format: 'UPC-A', bcid: 'upca', text: '012345678905', category: '1D', condition: 'Normal', normalizedText: '0012345678905' },
  { id: 'TC-UPCE', format: 'UPC-E', bcid: 'upce', text: '01234565', category: '1D', condition: 'Normal', normalizedText: '0012345000065' },
  { id: 'TC-CODE39', format: 'Code 39', bcid: 'code39', text: 'TEST39', category: '1D', condition: 'Normal' },
  { id: 'TC-CODE93', format: 'Code 93', bcid: 'code93', text: 'CODE93', includecheck: true, category: '1D', condition: 'Normal (with check characters)' },
  { id: 'TC-CODE128', format: 'Code 128', bcid: 'code128', text: 'TEST-CODE128-BATCH-99', category: '1D', condition: 'Normal' },
  { id: 'TC-ITF', format: 'ITF', bcid: 'interleaved2of5', text: '123456789012', category: '1D', condition: 'Normal' },
  { id: 'TC-CODABAR', format: 'Codabar', bcid: 'rationalizedCodabar', text: 'A123456789B', category: '1D', condition: 'Normal' },
  { id: 'TC-QR', format: 'QR Code', bcid: 'qrcode', text: 'https://example.com/scanner-poc-test-01', category: '2D', condition: 'Normal' },
  { id: 'TC-DATAMATRIX', format: 'Data Matrix', bcid: 'datamatrix', text: 'SYNTHETIC-DATAMATRIX-ABC-9921', category: '2D', condition: 'Normal' },
  { id: 'TC-AZTEC', format: 'Aztec', bcid: 'azteccode', text: 'AZTEC-SYNTHETIC-TOKEN-4491', category: '2D', condition: 'Normal' },
  { id: 'TC-PDF417', format: 'PDF417', bcid: 'pdf417', text: 'SYNTH-PDF417-ID:ALICE-M-SMITH:DOB:19900101:EXP:20301231:DOC#8839104', category: '2D', condition: 'Normal (Synthetic ID)' },
  { id: 'TC-MICROQR', format: 'Micro QR', bcid: 'microqrcode', text: 'MQR-TEST-771', category: '2D', condition: 'Normal (Micro QR conditional)' },

  // 2. Difficult Conditions
  { id: 'TC-DIFF-ROT90', format: 'Code 128', bcid: 'code128', text: 'ROTATED-90-CODE128', rotate: 'R', category: 'DIFFICULT', condition: 'Simulated 90° Vertical Rotation' },
  { id: 'TC-DIFF-PDF417-ROT', format: 'PDF417', bcid: 'pdf417', text: 'PDF417-ROTATED-ORIENTATION-TEST', rotate: 'R', category: 'DIFFICULT', condition: 'Simulated 90° Rotated PDF417' },
  { id: 'TC-DIFF-INVERT', format: 'QR Code', bcid: 'qrcode', text: 'INVERTED-DARK-MODE-QR', invert: true, category: 'DIFFICULT', condition: 'Simulated Inverted / Dark Mode' },
  { id: 'TC-DIFF-LOWRES', format: 'QR Code', bcid: 'qrcode', text: 'LOW-RES-QR-TEST', scale: 1, category: 'DIFFICULT', condition: 'Simulated Low Resolution (Scale 1)' },

  // 3. Negative Controls / False Positive Testing
  { id: 'TC-FP-BLANK', format: 'NONE', category: 'FALSE_POSITIVE', condition: 'Negative Control - White Blank Canvas' },
  { id: 'TC-FP-NOISE', format: 'NONE', category: 'FALSE_POSITIVE', condition: 'Negative Control - High-frequency Random Noise' },

  // 4. Multiple Barcodes in Single Frame
  { id: 'TC-MULTI-2', format: 'MULTIPLE (QR + C128)', text: 'MULTI-A-QR', secondText: 'MULTI-B-C128', category: 'MULTIPLE', condition: 'Multiple Barcodes - QR + Code 128 side-by-side' }
];

function decodePng(buf) {
  let pos = 8;
  let width = 0, height = 0;
  const idatChunks = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') {
      width = buf.readUInt32BE(pos + 8);
      height = buf.readUInt32BE(pos + 12);
    } else if (type === 'IDAT') {
      idatChunks.push(buf.subarray(pos + 8, pos + 8 + len));
    }
    pos += 12 + len;
  }
  const decompressed = inflateSync(Buffer.concat(idatChunks));
  const argb = new Int32Array(width * height);
  const rgba = new Uint8ClampedArray(width * height * 4);
  const stride = 1 + width * 4;

  for (let y = 0; y < height; y++) {
    const rowStart = y * stride + 1;
    for (let x = 0; x < width; x++) {
      const px = rowStart + x * 4;
      const r = decompressed[px];
      const g = decompressed[px + 1];
      const b = decompressed[px + 2];
      const a = decompressed[px + 3];
      const idx = y * width + x;
      argb[idx] = (a << 24) | (r << 16) | (g << 8) | b;

      const rgbaIdx = idx * 4;
      rgba[rgbaIdx] = r;
      rgba[rgbaIdx + 1] = g;
      rgba[rgbaIdx + 2] = b;
      rgba[rgbaIdx + 3] = a;
    }
  }
  return { width, height, argb, rgba };
}

async function createFixture(tc) {
  if (tc.category === 'FALSE_POSITIVE') {
    const width = 300;
    const height = 150;
    const argb = new Int32Array(width * height);
    const rgba = new Uint8ClampedArray(width * height * 4);

    if (tc.id === 'TC-FP-BLANK') {
      argb.fill(-1);
      rgba.fill(255);
    } else {
      for (let i = 0; i < argb.length; i++) {
        const isWhite = Math.random() > 0.5;
        argb[i] = isWhite ? -1 : (0xFF000000 | 0);
        const v = isWhite ? 255 : 0;
        rgba[i * 4] = v;
        rgba[i * 4 + 1] = v;
        rgba[i * 4 + 2] = v;
        rgba[i * 4 + 3] = 255;
      }
    }
    return { width, height, argb, rgba };
  }

  if (tc.category === 'MULTIPLE') {
    const b1 = await bwipjs.toBuffer({
      bcid: 'qrcode',
      text: tc.text,
      scale: 3,
      paddingwidth: 10,
      paddingheight: 10,
      backgroundcolor: 'FFFFFF'
    });
    const b2 = await bwipjs.toBuffer({
      bcid: 'code128',
      text: tc.secondText,
      scale: 3,
      paddingwidth: 10,
      paddingheight: 10,
      backgroundcolor: 'FFFFFF'
    });

    const p1 = decodePng(b1);
    const p2 = decodePng(b2);

    const pad = 20;
    const totalW = p1.width + p2.width + pad * 3;
    const totalH = Math.max(p1.height, p2.height) + pad * 2;

    const argb = new Int32Array(totalW * totalH);
    const rgba = new Uint8ClampedArray(totalW * totalH * 4);
    argb.fill(-1);
    rgba.fill(255);

    blitInto(argb, rgba, totalW, totalH, p1, pad, pad);
    blitInto(argb, rgba, totalW, totalH, p2, p1.width + pad * 2, pad);

    return { width: totalW, height: totalH, argb, rgba };
  }

  const opts = {
    bcid: tc.bcid,
    text: tc.text,
    scale: tc.scale || 3,
    rotate: tc.rotate || 'N',
    includecheck: tc.includecheck ?? false,
    paddingwidth: 20,
    paddingheight: 20,
    backgroundcolor: 'FFFFFF',
    includetext: tc.bcid !== 'qrcode' && tc.bcid !== 'datamatrix' && tc.bcid !== 'azteccode' && tc.bcid !== 'pdf417' && tc.bcid !== 'microqrcode'
  };

  const pngBuf = await bwipjs.toBuffer(opts);
  let decoded = decodePng(pngBuf);

  if (tc.invert) {
    for (let i = 0; i < decoded.argb.length; i++) {
      decoded.argb[i] = (decoded.argb[i] === -1) ? (0xFF000000 | 0) : -1;
      const idx = i * 4;
      decoded.rgba[idx] = 255 - decoded.rgba[idx];
      decoded.rgba[idx + 1] = 255 - decoded.rgba[idx + 1];
      decoded.rgba[idx + 2] = 255 - decoded.rgba[idx + 2];
    }
  }

  return { ...decoded, pngBuf };
}

function blitInto(destArgb, destRgba, destW, destH, src, offX, offY) {
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const srcIdx = y * src.width + x;
      const dx = offX + x;
      const dy = offY + y;
      if (dx >= 0 && dx < destW && dy >= 0 && dy < destH) {
        const destIdx = dy * destW + dx;
        destArgb[destIdx] = src.argb[srcIdx];
        const s4 = srcIdx * 4;
        const d4 = destIdx * 4;
        destRgba[d4] = src.rgba[s4];
        destRgba[d4 + 1] = src.rgba[s4 + 1];
        destRgba[d4 + 2] = src.rgba[s4 + 2];
        destRgba[d4 + 3] = src.rgba[s4 + 3];
      }
    }
  }
}

async function executeBenchmark() {
  console.log('========================================================================');
  console.log('   EMPIRICAL SCANNER ENGINE BENCHMARK (MEASURED EVIDENCE EXECUTION)');
  console.log('   Candidate 1: @zxing/library (Pure JS)');
  console.log('   Candidate 2: zxing-wasm (ZXing-C++ compiled to WebAssembly)');
  console.log('========================================================================\n');

  // Candidate 1: JS MultiFormatReader
  const jsReader = new MultiFormatReader();
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    ZXingBarcodeFormat.QR_CODE,
    ZXingBarcodeFormat.DATA_MATRIX,
    ZXingBarcodeFormat.AZTEC,
    ZXingBarcodeFormat.PDF_417,
    ZXingBarcodeFormat.EAN_13,
    ZXingBarcodeFormat.EAN_8,
    ZXingBarcodeFormat.UPC_A,
    ZXingBarcodeFormat.UPC_E,
    ZXingBarcodeFormat.CODE_128,
    ZXingBarcodeFormat.CODE_39,
    ZXingBarcodeFormat.CODE_93,
    ZXingBarcodeFormat.CODABAR,
    ZXingBarcodeFormat.ITF,
  ]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  jsReader.setHints(hints);

  const benchmarkRecords = [];

  for (const tc of TEST_CASES) {
    let fixture;
    try {
      fixture = await createFixture(tc);
    } catch (e) {
      console.error(`[FIXTURE_FAILURE] ${tc.id}: ${e.message}`);
      benchmarkRecords.push({
        tc,
        js: { status: 'BLOCKED', notes: `Fixture creation failed: ${e.message}` },
        wasm: { status: 'BLOCKED', notes: `Fixture creation failed: ${e.message}` }
      });
      continue;
    }

    // Candidate 1: @zxing/library (JS)
    const startJs = performance.now();
    let jsDetected = false;
    let jsDecoded = false;
    let jsPayload = '';
    let jsFormat = '';
    let jsError = null;

    try {
      const lumSource = new RGBLuminanceSource(fixture.argb, fixture.width, fixture.height);
      const bitmap = new BinaryBitmap(new HybridBinarizer(lumSource));
      const res = jsReader.decode(bitmap);
      if (res) {
        jsDetected = true;
        jsDecoded = true;
        jsPayload = res.getText();
        jsFormat = ZXingBarcodeFormat[res.getBarcodeFormat()] || String(res.getBarcodeFormat());
      }
    } catch (err) {
      jsError = err.message;
    }
    const latencyJs = Math.round(performance.now() - startJs);

    let jsStatus = 'FAIL';
    let jsNotes = '';
    let jsFalsePositive = false;

    if (tc.category === 'FALSE_POSITIVE') {
      if (jsDetected) {
        jsStatus = 'FAIL';
        jsFalsePositive = true;
        jsNotes = `FALSE POSITIVE: incorrectly reported "${jsFormat}" on negative control`;
      } else {
        jsStatus = 'PASS';
        jsNotes = 'Correctly rejected negative non-barcode control';
      }
    } else if (tc.category === 'MULTIPLE') {
      if (jsDetected && jsPayload === tc.text) {
        jsStatus = 'PARTIAL';
        jsNotes = `Detected 1 of 2 symbols ("${jsPayload}"). Multi-barcode simultaneous detection not supported natively.`;
      } else {
        jsStatus = 'FAIL';
        jsNotes = 'Failed to decode any symbol from multi frame';
      }
    } else {
      if (jsDetected) {
        if (jsPayload === tc.text) {
          jsStatus = 'PASS';
          jsNotes = `Exact byte match (${jsFormat})`;
        } else {
          jsStatus = 'FAIL';
          jsNotes = `Payload mismatch: expected "${tc.text}", got "${jsPayload}"`;
        }
      } else {
        jsStatus = 'FAIL';
        jsNotes = jsError || 'Failed to locate/decode symbol';
      }
    }

    // Candidate 2: zxing-wasm (ZXing-C++ WASM)
    const startWasm = performance.now();
    let wasmDetected = false;
    let wasmDecoded = false;
    let wasmPayload = '';
    let wasmFormat = '';
    let wasmSymbols = [];
    let wasmRawExtra = null;
    let wasmError = null;

    try {
      const input = fixture.pngBuf && !tc.invert
        ? fixture.pngBuf
        : { data: fixture.rgba, width: fixture.width, height: fixture.height };

      const wasmResults = await readBarcodes(input, {
        tryHarder: true,
        tryRotate: true,
        tryInvert: true,
        maxNumberOfSymbols: tc.category === 'MULTIPLE' ? 5 : 1,
        formats: tc.format === 'Micro QR' ? ['MicroQRCode', 'QRCode'] : []
      });

      if (wasmResults && wasmResults.length > 0) {
        wasmDetected = true;
        wasmDecoded = true;
        wasmSymbols = wasmResults.map(r => ({ rawValue: r.text, format: r.format, isValid: r.isValid }));
        wasmPayload = wasmResults[0].text;
        wasmFormat = wasmResults[0].format;
        if (wasmResults[0].extra) {
          try {
            wasmRawExtra = JSON.parse(wasmResults[0].extra);
          } catch {}
        }
      }
    } catch (err) {
      wasmError = err.message;
    }
    const latencyWasm = Math.round(performance.now() - startWasm);

    let wasmStatus = 'FAIL';
    let wasmNotes = '';
    let wasmFalsePositive = false;

    if (tc.category === 'FALSE_POSITIVE') {
      if (wasmDetected) {
        wasmStatus = 'FAIL';
        wasmFalsePositive = true;
        wasmNotes = `FALSE POSITIVE: incorrectly reported "${wasmFormat}" on negative control`;
      } else {
        wasmStatus = 'PASS';
        wasmNotes = 'Correctly rejected negative non-barcode control';
      }
    } else if (tc.category === 'MULTIPLE') {
      if (wasmDetected && wasmSymbols.length >= 2) {
        const found1 = wasmSymbols.some(s => s.rawValue === tc.text);
        const found2 = wasmSymbols.some(s => s.rawValue === tc.secondText);
        if (found1 && found2) {
          wasmStatus = 'PASS';
          wasmNotes = `Simultaneously decoded both symbols: [${wasmSymbols.map(s => `${s.format}:${s.rawValue}`).join(', ')}]`;
        } else {
          wasmStatus = 'PARTIAL';
          wasmNotes = `Decoded ${wasmSymbols.length} symbols but payload check failed`;
        }
      } else if (wasmDetected) {
        wasmStatus = 'PARTIAL';
        wasmNotes = `Decoded ${wasmSymbols.length} symbol: [${wasmSymbols.map(s => s.rawValue).join(', ')}]`;
      } else {
        wasmStatus = 'FAIL';
        wasmNotes = 'Failed to locate symbols in multi frame';
      }
    } else {
      if (wasmDetected) {
        const rawMatches = wasmPayload === tc.text;
        const normalizedMatches = tc.normalizedText && wasmPayload === tc.normalizedText;
        const extraMatches = wasmRawExtra && (wasmRawExtra.UPCE === tc.text || wasmRawExtra.UPCA === tc.text);

        if (rawMatches) {
          wasmStatus = 'PASS';
          wasmNotes = `Exact byte match (${wasmFormat})`;
        } else if (normalizedMatches || extraMatches) {
          wasmStatus = 'PASS';
          wasmNotes = `Decoded normalized standard ${wasmFormat} ("${wasmPayload}"); original non-expanded payload available in extra: "${wasmRawExtra?.UPCE || tc.text}"`;
        } else {
          wasmStatus = 'FAIL';
          wasmNotes = `Payload mismatch: expected "${tc.text}", got "${wasmPayload}"`;
        }
      } else {
        wasmStatus = 'FAIL';
        wasmNotes = wasmError || 'Failed to locate/decode symbol';
      }
    }

    const record = {
      testId: tc.id,
      format: tc.format,
      condition: tc.condition,
      expectedPayload: tc.text || '',
      js: {
        detected: jsDetected,
        decoded: jsDecoded,
        actualFormat: jsFormat,
        actualPayload: jsPayload,
        payloadCorrect: jsPayload === (tc.text || ''),
        falsePositive: jsFalsePositive,
        latencyMs: latencyJs,
        status: jsStatus,
        notes: jsNotes
      },
      wasm: {
        detected: wasmDetected,
        decoded: wasmDecoded,
        actualFormat: wasmFormat,
        actualPayload: wasmPayload,
        payloadCorrect: wasmStatus === 'PASS',
        falsePositive: wasmFalsePositive,
        latencyMs: latencyWasm,
        status: wasmStatus,
        notes: wasmNotes
      }
    };

    benchmarkRecords.push(record);

    console.log(`[${tc.id.padEnd(18)}] Format: ${tc.format.padEnd(14)} | Condition: ${tc.condition}`);
    console.log(`  JS Baseline:      ${jsStatus.padEnd(8)} (${String(latencyJs).padStart(3)}ms) | ${jsNotes}`);
    console.log(`  ZXing-C++ (WASM): ${wasmStatus.padEnd(8)} (${String(latencyWasm).padStart(3)}ms) | ${wasmNotes}`);
    console.log('------------------------------------------------------------------------');
  }

  fs.writeFileSync('benchmark_results.json', JSON.stringify(benchmarkRecords, null, 2));
  console.log('\nMeasured benchmark completed successfully. Results saved to benchmark_results.json.');
}

executeBenchmark().catch(err => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
