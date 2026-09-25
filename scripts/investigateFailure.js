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

// Decodes PNG buffer from bwip-js into raw RGBA ImageData and packed 32-bit ARGB
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
      const srcIdx = rowStart + x * 4;
      const r = decompressed[srcIdx];
      const g = decompressed[srcIdx + 1];
      const b = decompressed[srcIdx + 2];
      const a = decompressed[srcIdx + 3];
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

// Composite transparent pixels onto a solid white background (as a browser canvas should do)
function compositeOnWhite(img) {
  const argb = new Int32Array(img.width * img.height);
  const rgba = new Uint8ClampedArray(img.width * img.height * 4);
  for (let i = 0; i < img.rgba.length; i += 4) {
    const r = img.rgba[i];
    const g = img.rgba[i + 1];
    const b = img.rgba[i + 2];
    const a = img.rgba[i + 3] / 255; // 0 to 1

    // Alpha blending with white background (255, 255, 255)
    const outR = Math.round(r * a + 255 * (1 - a));
    const outG = Math.round(g * a + 255 * (1 - a));
    const outB = Math.round(b * a + 255 * (1 - a));
    const outA = 255;

    rgba[i] = outR;
    rgba[i + 1] = outG;
    rgba[i + 2] = outB;
    rgba[i + 3] = outA;

    const pixelIdx = i / 4;
    argb[pixelIdx] = (outA << 24) | (outR << 16) | (outG << 8) | outB;
  }
  return { width: img.width, height: img.height, argb, rgba };
}

function cropImage(img, cropLeftPercent, cropRightPercent) {
  const startX = Math.round(img.width * (cropLeftPercent / 100));
  const endX = Math.round(img.width * (1 - cropRightPercent / 100));
  const newWidth = endX - startX;
  const newHeight = img.height;
  const rgba = new Uint8ClampedArray(newWidth * newHeight * 4);
  const argb = new Int32Array(newWidth * newHeight);

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const srcIdx = (y * img.width + (startX + x)) * 4;
      const dstIdx = (y * newWidth + x) * 4;
      const r = img.rgba[srcIdx];
      const g = img.rgba[srcIdx + 1];
      const b = img.rgba[srcIdx + 2];
      const a = img.rgba[srcIdx + 3];
      rgba[dstIdx] = r;
      rgba[dstIdx + 1] = g;
      rgba[dstIdx + 2] = b;
      rgba[dstIdx + 3] = a;
      argb[y * newWidth + x] = (a << 24) | (r << 16) | (g << 8) | b;
    }
  }
  return { width: newWidth, height: newHeight, rgba, argb };
}

function rotate90(img) {
  const newWidth = img.height;
  const newHeight = img.width;
  const rgba = new Uint8ClampedArray(newWidth * newHeight * 4);
  const argb = new Int32Array(newWidth * newHeight);

  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const srcIdx = (y * img.width + x) * 4;
      const newX = img.height - 1 - y;
      const newY = x;
      const dstIdx = (newY * newWidth + newX) * 4;
      const r = img.rgba[srcIdx];
      const g = img.rgba[srcIdx + 1];
      const b = img.rgba[srcIdx + 2];
      const a = img.rgba[srcIdx + 3];
      rgba[dstIdx] = r;
      rgba[dstIdx + 1] = g;
      rgba[dstIdx + 2] = b;
      rgba[dstIdx + 3] = a;
      argb[newY * newWidth + newX] = (a << 24) | (r << 16) | (g << 8) | b;
    }
  }
  return { width: newWidth, height: newHeight, rgba, argb };
}

function applyInversion(img) {
  const rgba = new Uint8ClampedArray(img.rgba);
  const argb = new Int32Array(img.width * img.height);
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = 255 - rgba[i];
    rgba[i + 1] = 255 - rgba[i + 1];
    rgba[i + 2] = 255 - rgba[i + 2];
    const pixelIdx = i / 4;
    argb[pixelIdx] = (rgba[i + 3] << 24) | (rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2];
  }
  return { width: img.width, height: img.height, rgba, argb };
}

function scanWithJsBaseline(img) {
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    ZXingBarcodeFormat.PDF_417,
    ZXingBarcodeFormat.QR_CODE,
    ZXingBarcodeFormat.DATA_MATRIX,
    ZXingBarcodeFormat.CODE_128,
  ]);
  hints.set(DecodeHintType.TRY_HARDER, true);

  const reader = new MultiFormatReader();
  reader.setHints(hints);

  const t0 = performance.now();
  try {
    const luminanceSource = new RGBLuminanceSource(img.argb, img.width, img.height);
    const bitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
    const res = reader.decode(bitmap);
    const latency = Math.round(performance.now() - t0);
    return {
      pass: true,
      format: ZXingBarcodeFormat[res.getBarcodeFormat()] || String(res.getBarcodeFormat()),
      rawValue: res.getText(),
      latency,
      error: null,
    };
  } catch (err) {
    const latency = Math.round(performance.now() - t0);
    return {
      pass: false,
      format: null,
      rawValue: null,
      latency,
      error: err.message || 'No symbology detected',
    };
  }
}

async function scanWithWasm(img) {
  const t0 = performance.now();
  try {
    const results = await readBarcodes(
      {
        data: img.rgba,
        width: img.width,
        height: img.height,
      },
      {
        tryHarder: true,
        tryRotate: true,
        tryInvert: true,
        maxNumberOfSymbols: 1,
        formats: ['PDF417', 'QRCode', 'DataMatrix', 'Code128'],
      }
    );
    const latency = Math.round(performance.now() - t0);
    if (results && results.length > 0 && results[0].isValid && results[0].text) {
      return {
        pass: true,
        format: results[0].format,
        rawValue: results[0].text,
        latency,
        error: null,
      };
    }
    return {
      pass: false,
      format: null,
      rawValue: null,
      latency,
      error: 'No symbology detected',
    };
  } catch (err) {
    const latency = Math.round(performance.now() - t0);
    return {
      pass: false,
      format: null,
      rawValue: null,
      latency,
      error: err.message || 'Detection failure',
    };
  }
}

async function runInvestigation() {
  console.log('='.repeat(80));
  console.log('EMPIRICAL INVESTIGATION: UPLOADED BARCODE IMAGE & PDF417 RECOVERY ANALYSIS');
  console.log('='.repeat(80));

  const PDF417_PAYLOAD_STANDARD = 'SYNTH-PDF417-ID:ALICE-M-SMITH:DOB:19900101:EXP:20301231:DOC#8839104';
  const PDF417_PAYLOAD_AAMVA = 'ANSI 636026080102DL00410288ZA03290015DLDAQD1234567\nDCSSMITH\nDACJOHN\nDADEDWARD\nDBB19850615\nDBC1\nDAYNONE';

  const testCases = [
    // 1. Transparent PNG without white background
    {
      id: 'EXP-01-TRANSPARENT-FAIL',
      category: 'PREPROCESSING_ISSUE',
      name: 'Uncomposited Transparent PNG (Simulate uploaded asset without white fill)',
      expectedFormat: 'PDF417',
      expectedPayload: PDF417_PAYLOAD_STANDARD,
      generate: async () => {
        const png = await bwipjs.toBuffer({
          bcid: 'pdf417',
          text: PDF417_PAYLOAD_STANDARD,
          scale: 3,
          paddingwidth: 10,
          paddingheight: 10,
        });
        return decodePng(png);
      },
    },
    // 2. White background composited
    {
      id: 'EXP-02-WHITE-COMPOSITED-FIX',
      category: 'PREPROCESSING_ISSUE',
      name: 'Corrected Preprocessing: Transparent PNG Composited onto Solid White',
      expectedFormat: 'PDF417',
      expectedPayload: PDF417_PAYLOAD_STANDARD,
      generate: async () => {
        const png = await bwipjs.toBuffer({
          bcid: 'pdf417',
          text: PDF417_PAYLOAD_STANDARD,
          scale: 3,
          paddingwidth: 10,
          paddingheight: 10,
        });
        return compositeOnWhite(decodePng(png));
      },
    },
    // 3. Known-Good High Resolution (Scale 3, Full Quiet Zone)
    {
      id: 'EXP-03-PDF417-HIGHRES-S3',
      category: 'KNOWN_GOOD_SYNTHETIC',
      name: 'Known-Good PDF417 High Resolution (Scale 3, Full Quiet Zone)',
      expectedFormat: 'PDF417',
      expectedPayload: PDF417_PAYLOAD_STANDARD,
      generate: async () => {
        const png = await bwipjs.toBuffer({
          bcid: 'pdf417',
          text: PDF417_PAYLOAD_STANDARD,
          scale: 3,
          paddingwidth: 10,
          paddingheight: 10,
          backgroundcolor: 'FFFFFF',
        });
        return decodePng(png);
      },
    },
    // 4. Known-Good Medium Resolution (Scale 2, Full Quiet Zone)
    {
      id: 'EXP-04-PDF417-MEDRES-S2',
      category: 'KNOWN_GOOD_SYNTHETIC',
      name: 'Known-Good PDF417 Medium Resolution (Scale 2, Full Quiet Zone)',
      expectedFormat: 'PDF417',
      expectedPayload: PDF417_PAYLOAD_STANDARD,
      generate: async () => {
        const png = await bwipjs.toBuffer({
          bcid: 'pdf417',
          text: PDF417_PAYLOAD_STANDARD,
          scale: 2,
          paddingwidth: 10,
          paddingheight: 10,
          backgroundcolor: 'FFFFFF',
        });
        return decodePng(png);
      },
    },
    // 5. Known-Good Dense AAMVA Driving License format (Scale 3)
    {
      id: 'EXP-05-PDF417-DENSE-AAMVA',
      category: 'KNOWN_GOOD_SYNTHETIC',
      name: 'Known-Good Dense PDF417 (AAMVA DL / ID Card Standard)',
      expectedFormat: 'PDF417',
      expectedPayload: PDF417_PAYLOAD_AAMVA,
      generate: async () => {
        const png = await bwipjs.toBuffer({
          bcid: 'pdf417',
          text: PDF417_PAYLOAD_AAMVA,
          scale: 3,
          paddingwidth: 10,
          paddingheight: 10,
          backgroundcolor: 'FFFFFF',
        });
        return decodePng(png);
      },
    },
    // 6. Zero Quiet Zone (Padding 0: Barcode edges touch canvas border)
    {
      id: 'EXP-06-PDF417-ZERO-QUIET-ZONE',
      category: 'DETECTION_FAILURE',
      name: 'Zero Quiet Zone PDF417 (Padding 0 - tightly cropped to barcode edge)',
      expectedFormat: 'PDF417',
      expectedPayload: PDF417_PAYLOAD_STANDARD,
      generate: async () => {
        const png = await bwipjs.toBuffer({
          bcid: 'pdf417',
          text: PDF417_PAYLOAD_STANDARD,
          scale: 2,
          paddingwidth: 0,
          paddingheight: 0,
          backgroundcolor: 'FFFFFF',
        });
        return decodePng(png);
      },
    },
    // 7. Physically Clipped Left Edge (Start pattern missing)
    {
      id: 'EXP-07-PDF417-CLIPPED-START-PATTERN',
      category: 'INVALID_UNSUPPORTED_FIXTURE',
      name: 'Physically Clipped PDF417 (Left 6% cropped - Start guard pattern missing)',
      expectedFormat: 'PDF417',
      expectedPayload: PDF417_PAYLOAD_STANDARD,
      generate: async () => {
        const png = await bwipjs.toBuffer({
          bcid: 'pdf417',
          text: PDF417_PAYLOAD_STANDARD,
          scale: 2,
          paddingwidth: 0,
          paddingheight: 0,
          backgroundcolor: 'FFFFFF',
        });
        return cropImage(decodePng(png), 6, 0);
      },
    },
    // 8. Physically Clipped Right Edge (Stop pattern missing)
    {
      id: 'EXP-08-PDF417-CLIPPED-STOP-PATTERN',
      category: 'INVALID_UNSUPPORTED_FIXTURE',
      name: 'Physically Clipped PDF417 (Right 6% cropped - Stop guard pattern missing)',
      expectedFormat: 'PDF417',
      expectedPayload: PDF417_PAYLOAD_STANDARD,
      generate: async () => {
        const png = await bwipjs.toBuffer({
          bcid: 'pdf417',
          text: PDF417_PAYLOAD_STANDARD,
          scale: 2,
          paddingwidth: 0,
          paddingheight: 0,
          backgroundcolor: 'FFFFFF',
        });
        return cropImage(decodePng(png), 0, 6);
      },
    },
    // 9. 90-Degree Rotated PDF417
    {
      id: 'EXP-09-PDF417-ROTATED-90',
      category: 'GENUINE_ENGINE_LIMITATION',
      name: '90° Vertically Rotated PDF417',
      expectedFormat: 'PDF417',
      expectedPayload: PDF417_PAYLOAD_STANDARD,
      generate: async () => {
        const png = await bwipjs.toBuffer({
          bcid: 'pdf417',
          text: PDF417_PAYLOAD_STANDARD,
          scale: 2,
          paddingwidth: 10,
          paddingheight: 10,
          backgroundcolor: 'FFFFFF',
        });
        return rotate90(decodePng(png));
      },
    },
    // 10. Inverted Dark-Mode PDF417
    {
      id: 'EXP-10-PDF417-INVERTED-POLARITY',
      category: 'GENUINE_ENGINE_LIMITATION',
      name: 'Inverted Dark Mode PDF417 (White bars on black)',
      expectedFormat: 'PDF417',
      expectedPayload: PDF417_PAYLOAD_STANDARD,
      generate: async () => {
        const png = await bwipjs.toBuffer({
          bcid: 'pdf417',
          text: PDF417_PAYLOAD_STANDARD,
          scale: 2,
          paddingwidth: 10,
          paddingheight: 10,
          backgroundcolor: 'FFFFFF',
        });
        return applyInversion(decodePng(png));
      },
    },
    // 11. Known-Good QR Code Control
    {
      id: 'EXP-11-QR-CONTROL',
      category: 'KNOWN_GOOD_SYNTHETIC',
      name: 'Known-Good Synthetic QR Code (Sanity Control)',
      expectedFormat: 'QR Code',
      expectedPayload: 'https://example.com/scanner-poc-test-01',
      generate: async () => {
        const png = await bwipjs.toBuffer({
          bcid: 'qrcode',
          text: 'https://example.com/scanner-poc-test-01',
          scale: 3,
          paddingwidth: 10,
          paddingheight: 10,
          backgroundcolor: 'FFFFFF',
        });
        return decodePng(png);
      },
    },
    // 12. Negative Control: Blank White Canvas
    {
      id: 'EXP-12-BLANK-CONTROL',
      category: 'INVALID_UNSUPPORTED_FIXTURE',
      name: 'Negative Control: Blank White Canvas (Simulates non-barcode photo)',
      expectedFormat: 'NONE',
      expectedPayload: 'NONE',
      generate: async () => {
        const width = 400, height = 200;
        const argb = new Int32Array(width * height).fill(-1);
        const rgba = new Uint8ClampedArray(width * height * 4).fill(255);
        return { width, height, argb, rgba };
      },
    },
  ];

  const summary = [];

  for (const tc of testCases) {
    const img = await tc.generate();
    const wasmRes = await scanWithWasm(img);
    const jsRes = scanWithJsBaseline(img);

    const rec = {
      id: tc.id,
      name: tc.name,
      category: tc.category,
      expectedFormat: tc.expectedFormat,
      expectedPayload: tc.expectedPayload,
      imageDimensions: `${img.width}x${img.height}`,
      wasm: {
        engine: 'ZXing-C++ (WebAssembly)',
        pass: wasmRes.pass,
        decodedPayload: wasmRes.rawValue,
        decodedFormat: wasmRes.format,
        latency: wasmRes.latency,
        error: wasmRes.error,
      },
      js: {
        engine: 'ZXing (JS Baseline)',
        pass: jsRes.pass,
        decodedPayload: jsRes.rawValue,
        decodedFormat: jsRes.format,
        latency: jsRes.latency,
        error: jsRes.error,
      },
    };
    summary.push(rec);

    console.log(`\n[${tc.id}] ${tc.name}`);
    console.log(`  Dimensions: ${img.width}x${img.height} | Expected: ${tc.expectedFormat} | Category: ${tc.category}`);
    console.log(`  WASM: ${wasmRes.pass ? 'PASS' : 'FAIL'} (${wasmRes.latency}ms) ${wasmRes.pass ? '-> ' + wasmRes.rawValue.slice(0, 35) + '...' : '[' + wasmRes.error + ']'}`);
    console.log(`  JS  : ${jsRes.pass ? 'PASS' : 'FAIL'} (${jsRes.latency}ms) ${jsRes.pass ? '-> ' + jsRes.rawValue.slice(0, 35) + '...' : '[' + jsRes.error + ']'}`);
  }

  fs.writeFileSync('investigation_results.json', JSON.stringify(summary, null, 2));
  console.log('\nInvestigation completed successfully. Results saved to investigation_results.json');
}

runInvestigation().catch(console.error);
