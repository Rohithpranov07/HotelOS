// Client-side helper that sends a captured ID image to ai-service for OCR.
// Falls back to a deterministic mock when the endpoint is unavailable so the
// pre-checkin flow remains demoable without ai-service running.

import { aiApi } from './api';

export type IdDocumentType = 'passport' | 'aadhaar' | 'dl';

export interface OcrResult {
  full_name: string;
  date_of_birth: string;       // ISO date (YYYY-MM-DD)
  document_number_hash: string; // SHA-256 hex of the document number
}

async function sha256Hex(input: string): Promise<string> {
  try {
    // expo-crypto is an optional dep — load by string so TS doesn't require its types.
    const moduleName = 'expo-crypto';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Crypto = (await (Function('m', 'return import(m)')(moduleName) as Promise<any>)) as {
      digestStringAsync: (algo: string, value: string) => Promise<string>;
      CryptoDigestAlgorithm: { SHA256: string };
    };
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
  } catch {
    let h = 0;
    for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
    return `mock_${Math.abs(h).toString(16).padStart(8, '0')}`;
  }
}

export async function hashDocumentNumber(raw: string): Promise<string> {
  return sha256Hex(raw.replace(/\s+/g, '').toUpperCase());
}

export async function extractIdDocument(
  imageBase64: string,
  docType: IdDocumentType,
): Promise<OcrResult> {
  try {
    const { data } = await aiApi.post<OcrResult>('/ai/ocr', {
      image_base64: imageBase64,
      document_type: docType,
    });
    return data;
  } catch {
    // Mock fallback — deterministic-ish per capture so the UI feels alive.
    const stamp = Date.now().toString().slice(-4);
    return {
      full_name: docType === 'aadhaar' ? 'Arjun Mehta' : 'Arjun M.',
      date_of_birth: '1991-04-12',
      document_number_hash: await hashDocumentNumber(`MOCK-${docType}-${stamp}`),
    };
  }
}
