import { ScannerEngine, DecodedResult } from './engine';
import { ZxingWasmEngine, ZxingWasmDecodedResult } from './zxingWasmEngine';
import { SYNTHETIC_TEST_CASES, TestCaseDefinition, generateTestCanvas } from './pocCorpus';

export interface TestExecutionRecord {
  testId: string;
  engine: 'ZXing (JS Baseline)' | 'ZXing-C++ (WebAssembly)';
  platform: 'Web (Browser)';
  barcodeFormat: string;
  inputType: 'Image Canvas' | 'Camera Frame' | 'Upload';
  imageCondition: string;
  expectedPayload: string;
  detected: boolean;
  decoded: boolean;
  returnedPayload: string;
  payloadCorrect: boolean;
  falsePositive: boolean;
  latencyMs: number;
  status: 'PASS' | 'FAIL' | 'FALSE_POSITIVE_ALERT';
  notes: string;
}

export interface EngineComparisonStats {
  engineName: string;
  total: number;
  passed: number;
  failed: number;
  falsePositives: number;
  avgLatencyMs: number;
  pdf417Status: 'PASS' | 'FAIL';
  microQrStatus: 'PASS' | 'FAIL' | 'NOT_SUPPORTED';
  multipleBarcodeStatus: 'PASS' | 'FAIL' | 'NOT_SUPPORTED';
}

export interface DualPocSummaryStats {
  totalFixtures: number;
  jsStats: EngineComparisonStats;
  wasmStats: EngineComparisonStats;
}

export class PocRunner {
  private jsEngine: ScannerEngine;
  private wasmEngine: ZxingWasmEngine;

  constructor() {
    this.jsEngine = new ScannerEngine();
    this.wasmEngine = new ZxingWasmEngine();
  }

  /**
   * Run the full suite for a chosen engine or both engines
   */
  public async runEngineSuite(
    targetEngine: 'js' | 'wasm' | 'both',
    onProgress?: (current: number, total: number, latest: TestExecutionRecord) => void
  ): Promise<TestExecutionRecord[]> {
    const records: TestExecutionRecord[] = [];
    const fixtures = SYNTHETIC_TEST_CASES;
    const enginesToRun: Array<'js' | 'wasm'> =
      targetEngine === 'both' ? ['js', 'wasm'] : [targetEngine];

    const totalSteps = fixtures.length * enginesToRun.length;
    let stepCount = 0;

    for (const eng of enginesToRun) {
      for (const tc of fixtures) {
        const record = await this.runSingleTest(tc, eng);
        records.push(record);
        stepCount++;
        if (onProgress) {
          onProgress(stepCount, totalSteps, record);
        }
      }
    }

    return records;
  }

  public async runSingleTest(
    tc: TestCaseDefinition,
    engineType: 'js' | 'wasm'
  ): Promise<TestExecutionRecord> {
    const engineLabel: TestExecutionRecord['engine'] =
      engineType === 'js' ? 'ZXing (JS Baseline)' : 'ZXing-C++ (WebAssembly)';

    let detected = false;
    let decoded = false;
    let returnedPayload = '';
    let payloadCorrect = false;
    let falsePositive = false;
    let status: TestExecutionRecord['status'] = 'FAIL';
    let notes = '';

    try {
      const canvas = await generateTestCanvas(tc);
      const ctx = canvas.getContext('2d')!;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const decodeStart = performance.now();
      let latency = 0;

      if (engineType === 'js') {
        const result: DecodedResult | null = await this.jsEngine.scanImageElement(canvas);
        latency = Math.round(performance.now() - decodeStart);

        if (tc.category === 'FALSE_POSITIVE') {
          if (result && result.rawValue) {
            falsePositive = true;
            returnedPayload = result.rawValue;
            status = 'FALSE_POSITIVE_ALERT';
            notes = `JS Engine erroneously detected "${result.format}" on negative control.`;
          } else {
            status = 'PASS';
            notes = 'JS Baseline correctly rejected non-barcode control.';
          }
        } else if (tc.category === 'MULTIPLE') {
          // JS single format reader only captures one
          if (result) {
            detected = true;
            decoded = true;
            returnedPayload = result.rawValue;
            payloadCorrect = (result.rawValue === tc.expectedPayload);
            status = payloadCorrect ? 'PASS' : 'FAIL';
            notes = `JS detected first symbol (${result.rawValue}). Multi-barcode simultaneous detection not supported natively in this baseline.`;
          } else {
            status = 'FAIL';
            notes = 'JS engine failed to decode multi-symbol canvas.';
          }
        } else {
          if (result) {
            detected = true;
            decoded = true;
            returnedPayload = result.rawValue;
            payloadCorrect = (result.rawValue === tc.expectedPayload);
            if (payloadCorrect) {
              status = 'PASS';
              notes = `Decoded in ${latency}ms.`;
            } else {
              status = 'FAIL';
              notes = `Mismatch: expected "${tc.expectedPayload}", got "${result.rawValue}".`;
            }
          } else {
            status = 'FAIL';
            notes = 'JS engine returned null.';
          }
        }
      } else {
        // ZXing-C++ (WASM)
        if (tc.category === 'MULTIPLE') {
          const multi = await this.wasmEngine.decodeMultiple(imageData, 5);
          latency = Math.round(performance.now() - decodeStart);

          if (multi.length > 0) {
            detected = true;
            decoded = true;
            returnedPayload = multi.map((m) => m.rawValue).join(' | ');
            const foundFirst = multi.some((m) => m.rawValue === tc.expectedPayload);
            const foundSecond = multi.some((m) => m.rawValue === (tc.expectedSecondPayload || 'MULTI-SERIAL-99'));
            payloadCorrect = foundFirst && (tc.expectedSecondPayload ? foundSecond : true);
            status = payloadCorrect ? 'PASS' : 'FAIL';
            notes = `ZXing-C++ detected ${multi.length} symbols simultaneously (${returnedPayload}) in ${latency}ms.`;
          } else {
            status = 'FAIL';
            notes = 'ZXing-C++ failed to locate symbols on multi canvas.';
          }
        } else {
          const wasmResult: ZxingWasmDecodedResult | null = await this.wasmEngine.decodeImageData(
            imageData,
            tc.format === 'MICRO_QR' ? { formats: ['MicroQRCode', 'QRCode'] } : undefined
          );
          latency = Math.round(performance.now() - decodeStart);

          if (tc.category === 'FALSE_POSITIVE') {
            if (wasmResult && wasmResult.rawValue) {
              falsePositive = true;
              returnedPayload = wasmResult.rawValue;
              status = 'FALSE_POSITIVE_ALERT';
              notes = `ZXing-C++ erroneously detected "${wasmResult.format}" on negative control.`;
            } else {
              status = 'PASS';
              notes = 'ZXing-C++ correctly rejected non-barcode control.';
            }
          } else {
            if (wasmResult) {
              detected = true;
              decoded = true;
              returnedPayload = wasmResult.rawValue;
              payloadCorrect = (wasmResult.rawValue === tc.expectedPayload);
              if (payloadCorrect) {
                status = 'PASS';
                notes = `ZXing-C++ decoded ${wasmResult.format} (rotation: ${wasmResult.rotation ?? 0}°) in ${latency}ms.`;
              } else {
                status = 'FAIL';
                notes = `Mismatch: expected "${tc.expectedPayload}", got "${wasmResult.rawValue}".`;
              }
            } else {
              status = 'FAIL';
              notes = 'ZXing-C++ returned null for symbology.';
            }
          }
        }
      }

      return {
        testId: tc.id,
        engine: engineLabel,
        platform: 'Web (Browser)',
        barcodeFormat: tc.format,
        inputType: 'Image Canvas',
        imageCondition: tc.condition,
        expectedPayload: tc.expectedPayload,
        detected,
        decoded,
        returnedPayload,
        payloadCorrect,
        falsePositive,
        latencyMs: latency,
        status,
        notes,
      };
    } catch (err: unknown) {
      return {
        testId: tc.id,
        engine: engineLabel,
        platform: 'Web (Browser)',
        barcodeFormat: tc.format,
        inputType: 'Image Canvas',
        imageCondition: tc.condition,
        expectedPayload: tc.expectedPayload,
        detected: false,
        decoded: false,
        returnedPayload: '',
        payloadCorrect: false,
        falsePositive: false,
        latencyMs: 0,
        status: 'FAIL',
        notes: `Execution exception: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  public calculateStats(records: TestExecutionRecord[]): DualPocSummaryStats {
    const jsRecords = records.filter((r) => r.engine === 'ZXing (JS Baseline)');
    const wasmRecords = records.filter((r) => r.engine === 'ZXing-C++ (WebAssembly)');

    const calcFor = (subset: TestExecutionRecord[], name: string): EngineComparisonStats => {
      const total = subset.length;
      const passed = subset.filter((r) => r.status === 'PASS').length;
      const failed = subset.filter((r) => r.status === 'FAIL').length;
      const falsePositives = subset.filter((r) => r.falsePositive).length;
      const latencies = subset.map((r) => r.latencyMs).filter((l) => l > 0);
      const avgLatencyMs =
        latencies.length > 0
          ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
          : 0;

      const pdf417 = subset.find((r) => r.testId === 'POC-PDF417-001');
      const microQr = subset.find((r) => r.testId === 'POC-MQR-001');
      const multi = subset.find((r) => r.testId === 'POC-MULTI-001');

      return {
        engineName: name,
        total,
        passed,
        failed,
        falsePositives,
        avgLatencyMs,
        pdf417Status: pdf417 ? (pdf417.status === 'PASS' ? 'PASS' : 'FAIL') : 'FAIL',
        microQrStatus: microQr
          ? microQr.status === 'PASS'
            ? 'PASS'
            : 'FAIL'
          : 'NOT_SUPPORTED',
        multipleBarcodeStatus: multi
          ? multi.status === 'PASS'
            ? 'PASS'
            : 'FAIL'
          : 'NOT_SUPPORTED',
      };
    };

    return {
      totalFixtures: SYNTHETIC_TEST_CASES.length,
      jsStats: calcFor(jsRecords, 'ZXing (JS Baseline)'),
      wasmStats: calcFor(wasmRecords, 'ZXing-C++ (WebAssembly)'),
    };
  }
}
