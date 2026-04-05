const PBKDF2_ITERATIONS = 100_000;
const IV_LENGTH = 12;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function ensureBrowserCrypto(): Crypto {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    throw new Error("Web Crypto API is not available in this environment");
  }

  return window.crypto;
}

export function generateSaltHex(byteLength = 16): string {
  const cryptoApi = ensureBrowserCrypto();
  const bytes = cryptoApi.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

export async function deriveKey(password: string, saltHex: string): Promise<CryptoKey> {
  const cryptoApi = ensureBrowserCrypto();
  const passwordKey = await cryptoApi.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return cryptoApi.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: hexToBytes(saltHex),
      iterations: PBKDF2_ITERATIONS,
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptArrayBuffer(
  data: ArrayBuffer,
  key: CryptoKey,
): Promise<{ encryptedData: ArrayBuffer; iv: Uint8Array }> {
  const cryptoApi = ensureBrowserCrypto();
  const iv = cryptoApi.getRandomValues(new Uint8Array(IV_LENGTH));
  const encryptedData = await cryptoApi.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  );

  return { encryptedData, iv };
}

export async function decryptArrayBuffer(
  encryptedData: ArrayBuffer,
  iv: Uint8Array,
  key: CryptoKey,
): Promise<ArrayBuffer> {
  const cryptoApi = ensureBrowserCrypto();
  return cryptoApi.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encryptedData,
  );
}

export async function encryptBlob(
  blob: Blob,
  key: CryptoKey,
): Promise<{ encryptedData: ArrayBuffer; iv: Uint8Array; mimeType: string; size: number }> {
  const data = await blob.arrayBuffer();
  const { encryptedData, iv } = await encryptArrayBuffer(data, key);
  return {
    encryptedData,
    iv,
    mimeType: blob.type || "application/octet-stream",
    size: blob.size,
  };
}

export async function decryptBlob(
  encryptedData: ArrayBuffer,
  iv: Uint8Array,
  key: CryptoKey,
  mimeType: string,
): Promise<Blob> {
  const data = await decryptArrayBuffer(encryptedData, iv, key);
  return new Blob([data], { type: mimeType || "application/octet-stream" });
}

export async function encryptText(
  value: string,
  key: CryptoKey,
): Promise<{ encryptedData: ArrayBuffer; iv: Uint8Array }> {
  return encryptArrayBuffer(encoder.encode(value).buffer, key);
}

export async function decryptText(
  encryptedData: ArrayBuffer,
  iv: Uint8Array,
  key: CryptoKey,
): Promise<string> {
  const data = await decryptArrayBuffer(encryptedData, iv, key);
  return decoder.decode(data);
}
