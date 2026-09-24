import bwipjs from 'bwip-js';

export interface TestCaseDefinition {
  id: string;
  format: string;
  category: '1D' | '2D' | 'FALSE_POSITIVE' | 'DIFFICULT' | 'MULTIPLE' | 'MICRO_QR';
  bcid?: string;
  expectedPayload: string;
  condition: string;
  description: string;
  expectedSecondPayload?: string;
}

export const SYNTHETIC_TEST_CASES: TestCaseDefinition[] = [
  // 2D Formats
  {
    id: 'POC-QR-001',
    format: 'QR_CODE',
    category: '2D',
    bcid: 'qrcode',
    expectedPayload: 'https://example.com/scanner-poc-test-01',
    condition: 'Normal - High contrast, sharp',
    description: 'Standard QR Code with URL payload',
  },
  {
    id: 'POC-DM-001',
    format: 'DATA_MATRIX',
    category: '2D',
    bcid: 'datamatrix',
    expectedPayload: 'SYNTHETIC-DATAMATRIX-ABC-9921',
    condition: 'Normal - Square matrix',
    description: 'Data Matrix 2D industrial symbology',
  },
  {
    id: 'POC-AZTEC-001',
    format: 'AZTEC',
    category: '2D',
    bcid: 'azteccode',
    expectedPayload: 'AZTEC-SYNTHETIC-TOKEN-4491',
    condition: 'Normal - Bullseye centered',
    description: 'Aztec compact 2D symbology',
  },
  {
    id: 'POC-PDF417-001',
    format: 'PDF_417',
    category: '2D',
    bcid: 'pdf417',
    expectedPayload: 'SYNTH-PDF417-ID:ALICE-M-SMITH:DOB:19900101:EXP:20301231:DOC#8839104',
    condition: 'Normal - Synthetic ID payload (no real PII)',
    description: 'PDF417 stacked 2D barcode testing payload integrity',
  },

  // Micro QR Verification Target (Conditional)
  {
    id: 'POC-MQR-001',
    format: 'MICRO_QR',
    category: 'MICRO_QR',
    bcid: 'microqrcode',
    expectedPayload: 'MQR-TEST-771',
    condition: 'Normal - Single finder pattern Micro QR',
    description: 'Micro QR Code (conditional format specified in Section 6 & Verification Target)',
  },

  // 1D Formats
  {
    id: 'POC-EAN13-001',
    format: 'EAN_13',
    category: '1D',
    bcid: 'ean13',
    expectedPayload: '5901234123457',
    condition: 'Normal - Standard retail',
    description: 'Standard international 13-digit retail barcode',
  },
  {
    id: 'POC-EAN8-001',
    format: 'EAN_8',
    category: '1D',
    bcid: 'ean8',
    expectedPayload: '96385074',
    condition: 'Normal - Small package retail',
    description: '8-digit compact retail barcode',
  },
  {
    id: 'POC-UPCA-001',
    format: 'UPC_A',
    category: '1D',
    bcid: 'upca',
    expectedPayload: '012345678905',
    condition: 'Normal - North American retail',
    description: '12-digit standard UPC-A',
  },
  {
    id: 'POC-UPCE-001',
    format: 'UPC_E',
    category: '1D',
    bcid: 'upce',
    expectedPayload: '01234565',
    condition: 'Normal - Zero-suppressed UPC',
    description: 'UPC-E compact zero-suppressed format',
  },
  {
    id: 'POC-C128-001',
    format: 'CODE_128',
    category: '1D',
    bcid: 'code128',
    expectedPayload: 'TEST-CODE128-BATCH-99',
    condition: 'Normal - Logistics serial',
    description: 'Alphanumeric Code 128 symbology',
  },
  {
    id: 'POC-C39-001',
    format: 'CODE_39',
    category: '1D',
    bcid: 'code39',
    expectedPayload: 'TEST39',
    condition: 'Normal - Industrial alphanumeric',
    description: 'Code 39 discrete symbology',
  },
  {
    id: 'POC-C93-001',
    format: 'CODE_93',
    category: '1D',
    bcid: 'code93',
    expectedPayload: 'TEST93',
    condition: 'Normal - High density 1D',
    description: 'Code 93 compact symbology',
  },
  {
    id: 'POC-CODABAR-001',
    format: 'CODABAR',
    category: '1D',
    bcid: 'rationalizedCodabar',
    expectedPayload: 'A123456789B',
    condition: 'Normal - Library / Blood bank',
    description: 'Codabar with start/stop delimiter symbols',
  },
  {
    id: 'POC-ITF-001',
    format: 'ITF',
    category: '1D',
    bcid: 'interleaved2of5',
    expectedPayload: '123456789012',
    condition: 'Normal - Even number pairs',
    description: 'Interleaved 2 of 5 shipping container symbology',
  },

  // Difficult Conditions
  {
    id: 'POC-DIFF-ROT90',
    format: 'CODE_128',
    category: 'DIFFICULT',
    bcid: 'code128',
    expectedPayload: 'ROTATED-90-CODE128',
    condition: 'Difficult - 90 Degree Vertical Orientation',
    description: 'Tests engine resilience when 1D barcode is vertical',
  },
  {
    id: 'POC-DIFF-INVERT',
    format: 'QR_CODE',
    category: 'DIFFICULT',
    bcid: 'qrcode',
    expectedPayload: 'INVERTED-DARK-MODE-QR',
    condition: 'Difficult - Inverted (White dots on dark background)',
    description: 'Tests inverse polarity detection on screens / dark surfaces',
  },
  {
    id: 'POC-DIFF-BLUR',
    format: 'QR_CODE',
    category: 'DIFFICULT',
    bcid: 'qrcode',
    expectedPayload: 'BLURRED-OPTICAL-TEST',
    condition: 'Difficult - Out of focus / motion blur',
    description: 'Tests engine under simulated camera defocus blur',
  },
  {
    id: 'POC-DIFF-PDF417-ROT',
    format: 'PDF_417',
    category: 'DIFFICULT',
    bcid: 'pdf417',
    expectedPayload: 'PDF417-ROTATED-ORIENTATION-TEST',
    condition: 'Difficult - 90 Degree Rotated PDF417',
    description: 'Tests high-density stacked barcode at vertical rotation',
  },

  // Multiple Barcodes in Frame
  {
    id: 'POC-MULTI-001',
    format: 'MULTIPLE (QR + C128)',
    category: 'MULTIPLE',
    expectedPayload: 'MULTI-ITEM-01',
    expectedSecondPayload: 'MULTI-SERIAL-99',
    condition: 'Multiple Barcodes - 2 symbols in single frame',
    description: 'Tests whether engine can decode multiple distinct symbologies simultaneously',
  },

  // False Positive Negative Controls
  {
    id: 'POC-FP-TEXT',
    format: 'NONE',
    category: 'FALSE_POSITIVE',
    expectedPayload: '',
    condition: 'Negative Control - Standard English Text paragraph',
    description: 'Image containing typography and lines but no barcode',
  },
  {
    id: 'POC-FP-NOISE',
    format: 'NONE',
    category: 'FALSE_POSITIVE',
    expectedPayload: '',
    condition: 'Negative Control - Random geometric noise & speckle',
    description: 'Image with high-frequency noise resembling 2D matrix',
  },
];

export async function generateTestCanvas(testCase: TestCaseDefinition): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');

  // Negative Controls
  if (testCase.category === 'FALSE_POSITIVE') {
    canvas.width = 300;
    canvas.height = 150;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (testCase.id === 'POC-FP-TEXT') {
      ctx.fillStyle = '#1e293b';
      ctx.font = '14px sans-serif';
      ctx.fillText('Universal QR and Barcode Scanner', 15, 30);
      ctx.fillText('Proof of Concept Verification Harness', 15, 55);
      ctx.fillText('Testing accuracy, false positives & privacy.', 15, 80);
      ctx.fillText('Reference: 13_SCANNER_ENGINE_POC.md', 15, 105);
    } else {
      // Noise
      for (let x = 0; x < canvas.width; x += 10) {
        for (let y = 0; y < canvas.height; y += 10) {
          if (Math.random() > 0.5) {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(x, y, 9, 9);
          }
        }
      }
    }
    return canvas;
  }

  // Multiple Barcodes in Frame
  if (testCase.category === 'MULTIPLE') {
    canvas.width = 500;
    canvas.height = 250;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const c1 = document.createElement('canvas');
    await renderBwip(c1, 'qrcode', testCase.expectedPayload);

    const c2 = document.createElement('canvas');
    await renderBwip(c2, 'code128', testCase.expectedSecondPayload || 'MULTI-SERIAL-99');

    ctx.drawImage(c1, 20, 30);
    ctx.drawImage(c2, 220, 70);
    return canvas;
  }

  // Difficult Rotated
  if (testCase.id === 'POC-DIFF-ROT90' || testCase.id === 'POC-DIFF-PDF417-ROT') {
    const rawCanvas = document.createElement('canvas');
    await renderBwip(rawCanvas, testCase.bcid!, testCase.expectedPayload);

    canvas.width = rawCanvas.height;
    canvas.height = rawCanvas.width;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((90 * Math.PI) / 180);
    ctx.drawImage(rawCanvas, -rawCanvas.width / 2, -rawCanvas.height / 2);
    return canvas;
  }

  // Difficult Inverted
  if (testCase.id === 'POC-DIFF-INVERT') {
    const rawCanvas = document.createElement('canvas');
    await renderBwip(rawCanvas, testCase.bcid!, testCase.expectedPayload);

    canvas.width = rawCanvas.width;
    canvas.height = rawCanvas.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(rawCanvas, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = 255 - d[i];
      d[i + 1] = 255 - d[i + 1];
      d[i + 2] = 255 - d[i + 2];
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }

  // Difficult Blur
  if (testCase.id === 'POC-DIFF-BLUR') {
    const rawCanvas = document.createElement('canvas');
    await renderBwip(rawCanvas, testCase.bcid!, testCase.expectedPayload);

    canvas.width = rawCanvas.width;
    canvas.height = rawCanvas.height;
    const ctx = canvas.getContext('2d')!;
    ctx.filter = 'blur(2px)';
    ctx.drawImage(rawCanvas, 0, 0);
    return canvas;
  }

  // Normal Barcodes
  await renderBwip(canvas, testCase.bcid!, testCase.expectedPayload);
  return canvas;
}

function renderBwip(canvas: HTMLCanvasElement, bcid: string, text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      bwipjs.toCanvas(canvas, {
        bcid,
        text,
        scale: 3,
        height:
          bcid === 'qrcode' || bcid === 'datamatrix' || bcid === 'azteccode' || bcid === 'microqrcode'
            ? 20
            : 10,
        includetext:
          bcid !== 'qrcode' &&
          bcid !== 'datamatrix' &&
          bcid !== 'azteccode' &&
          bcid !== 'pdf417' &&
          bcid !== 'microqrcode',
        textxalign: 'center',
        backgroundcolor: 'FFFFFF',
        paddingwidth: 12,
        paddingheight: 12,
      });
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}
