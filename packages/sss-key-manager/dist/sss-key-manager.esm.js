var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/api-client.ts
var SSSApiClient = class {
  static {
    __name(this, "SSSApiClient");
  }
  constructor(config) {
    this.serverUrl = config.serverUrl.replace(/\/$/, "");
    this.authProvider = config.authProvider;
  }
  async getAuthHeaders() {
    const token = await this.authProvider.getIdToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };
  }
  async getContactMethodFromUser() {
    const user = await this.authProvider.getCurrentUser();
    if (!user) return null;
    if (user.email) {
      return { type: "email", value: user.email.toLowerCase() };
    }
    if (user.phone) {
      return { type: "phone", value: user.phone };
    }
    return null;
  }
  async getAuthShare() {
    const headers = await this.getAuthHeaders();
    const providerType = this.authProvider.getProviderType();
    const response = await fetch(`${this.serverUrl}/keys/auth-share`, {
      method: "POST",
      headers,
      body: JSON.stringify({ providerType })
    });
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to get auth share: ${response.statusText}`);
    }
    return response.json();
  }
  async storeAuthShare(input) {
    const headers = await this.getAuthHeaders();
    const providerType = this.authProvider.getProviderType();
    const response = await fetch(`${this.serverUrl}/keys/auth-share`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        ...input,
        providerType
      })
    });
    if (!response.ok) {
      throw new Error(`Failed to store auth share: ${response.statusText}`);
    }
  }
  async addRecoveryMethod(input) {
    const headers = await this.getAuthHeaders();
    const providerType = this.authProvider.getProviderType();
    const response = await fetch(`${this.serverUrl}/keys/recovery`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...input,
        providerType
      })
    });
    if (!response.ok) {
      throw new Error(`Failed to add recovery method: ${response.statusText}`);
    }
  }
  async getRecoveryShare(type, credentialId) {
    const headers = await this.getAuthHeaders();
    const providerType = this.authProvider.getProviderType();
    const params = new URLSearchParams({
      type,
      providerType
    });
    if (credentialId) {
      params.append("credentialId", credentialId);
    }
    const response = await fetch(`${this.serverUrl}/keys/recovery?${params}`, {
      method: "GET",
      headers
    });
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to get recovery share: ${response.statusText}`);
    }
    return response.json();
  }
  async markMigrated() {
    const headers = await this.getAuthHeaders();
    const providerType = this.authProvider.getProviderType();
    const response = await fetch(`${this.serverUrl}/keys/migrate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ providerType })
    });
    if (!response.ok) {
      throw new Error(`Failed to mark as migrated: ${response.statusText}`);
    }
  }
  async deleteUserKey() {
    const headers = await this.getAuthHeaders();
    const providerType = this.authProvider.getProviderType();
    const response = await fetch(`${this.serverUrl}/keys`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ providerType })
    });
    if (!response.ok) {
      throw new Error(`Failed to delete user key: ${response.statusText}`);
    }
  }
};

// src/sss.ts
import { split, combine } from "shamir-secret-sharing";

// src/crypto.ts
import { argon2id } from "hash-wasm";
var ARGON2_TIME_COST = 3;
var ARGON2_MEMORY_COST = 65536;
var ARGON2_PARALLELISM = 4;
var ARGON2_HASH_LENGTH = 32;
var DEFAULT_KDF_PARAMS = {
  algorithm: "argon2id",
  timeCost: ARGON2_TIME_COST,
  memoryCost: ARGON2_MEMORY_COST,
  parallelism: ARGON2_PARALLELISM
};
function bufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
__name(bufferToBase64, "bufferToBase64");
function base64ToBuffer(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
__name(base64ToBuffer, "base64ToBuffer");
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}
__name(hexToBytes, "hexToBytes");
function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(bytesToHex, "bytesToHex");
async function deriveKeyFromPassword(password, salt, params = DEFAULT_KDF_PARAMS) {
  const hash = await argon2id({
    password,
    salt,
    iterations: params.timeCost,
    memorySize: params.memoryCost,
    parallelism: params.parallelism,
    hashLength: ARGON2_HASH_LENGTH,
    outputType: "binary"
  });
  return new Uint8Array(hash);
}
__name(deriveKeyFromPassword, "deriveKeyFromPassword");
async function encryptWithPassword(plaintext, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await deriveKeyFromPassword(password, salt);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyMaterial.buffer,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  const encoder = new TextEncoder();
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    encoder.encode(plaintext)
  );
  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv.buffer),
    salt: bufferToBase64(salt.buffer),
    kdfParams: DEFAULT_KDF_PARAMS
  };
}
__name(encryptWithPassword, "encryptWithPassword");
async function decryptWithPassword(ciphertext, iv, salt, password, params = DEFAULT_KDF_PARAMS) {
  const saltBytes = base64ToBuffer(salt);
  const ivBytes = base64ToBuffer(iv);
  const ciphertextBytes = base64ToBuffer(ciphertext);
  const keyMaterial = await deriveKeyFromPassword(password, saltBytes, params);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyMaterial.buffer,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    cryptoKey,
    ciphertextBytes
  );
  const decoder = new TextDecoder();
  return decoder.decode(plaintextBuffer);
}
__name(decryptWithPassword, "decryptWithPassword");
function generateRandomBytes(length) {
  return crypto.getRandomValues(new Uint8Array(length));
}
__name(generateRandomBytes, "generateRandomBytes");
async function generateEd25519PrivateKey() {
  const privateKeyBytes = generateRandomBytes(32);
  return bytesToHex(privateKeyBytes);
}
__name(generateEd25519PrivateKey, "generateEd25519PrivateKey");

// src/sss.ts
var SSS_TOTAL_SHARES = 3;
var SSS_THRESHOLD = 2;
async function splitPrivateKey(privateKeyHex) {
  const privateKeyBytes = hexToBytes(privateKeyHex);
  const shares = await split(privateKeyBytes, SSS_TOTAL_SHARES, SSS_THRESHOLD);
  return {
    deviceShare: bytesToHex(shares[0]),
    authShare: bytesToHex(shares[1]),
    recoveryShare: bytesToHex(shares[2])
  };
}
__name(splitPrivateKey, "splitPrivateKey");
async function reconstructPrivateKey(share1Hex, share2Hex) {
  const share1 = hexToBytes(share1Hex);
  const share2 = hexToBytes(share2Hex);
  const reconstructed = await combine([share1, share2]);
  return bytesToHex(reconstructed);
}
__name(reconstructPrivateKey, "reconstructPrivateKey");
async function reconstructFromShares(shares) {
  if (shares.length < SSS_THRESHOLD) {
    throw new Error(`Need at least ${SSS_THRESHOLD} shares to reconstruct key`);
  }
  const shareBytes = shares.slice(0, SSS_THRESHOLD).map(hexToBytes);
  const reconstructed = await combine(shareBytes);
  return bytesToHex(reconstructed);
}
__name(reconstructFromShares, "reconstructFromShares");

// src/storage.ts
var DB_NAME = "lcb-sss-keys";
var DB_VERSION = 1;
var KEYS_STORE = "keys";
var SHARES_STORE = "shares";
var DEFAULT_DEVICE_SHARE_ID = "sss-device-share";
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(KEYS_STORE)) {
        db.createObjectStore(KEYS_STORE);
      }
      if (!db.objectStoreNames.contains(SHARES_STORE)) {
        db.createObjectStore(SHARES_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
__name(openDB, "openDB");
function tx(db, store, mode, op) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    const request = op(s);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
__name(tx, "tx");
async function getOrCreateMasterKey() {
  const db = await openDB();
  try {
    const existing = await tx(
      db,
      KEYS_STORE,
      "readonly",
      (s) => s.get("master-key")
    );
    if (existing) {
      return existing;
    }
    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
    await tx(db, KEYS_STORE, "readwrite", (s) => s.put(key, "master-key"));
    return key;
  } finally {
    db.close();
  }
}
__name(getOrCreateMasterKey, "getOrCreateMasterKey");
function bufferToBase642(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
__name(bufferToBase642, "bufferToBase64");
function base64ToBuffer2(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
__name(base64ToBuffer2, "base64ToBuffer");
async function encryptShare(share, id) {
  const key = await getOrCreateMasterKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const ad = encoder.encode(id);
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: ad },
    key,
    encoder.encode(share)
  );
  return {
    version: 1,
    iv: bufferToBase642(iv.buffer),
    cipher: bufferToBase642(cipherBuffer),
    keyVersion: 1
  };
}
__name(encryptShare, "encryptShare");
async function decryptShare(payload, id) {
  const key = await getOrCreateMasterKey();
  const iv = new Uint8Array(base64ToBuffer2(payload.iv));
  const cipher = base64ToBuffer2(payload.cipher);
  const encoder = new TextEncoder();
  const ad = encoder.encode(id);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, additionalData: ad },
    key,
    cipher
  );
  return new TextDecoder().decode(plainBuffer);
}
__name(decryptShare, "decryptShare");
async function storeDeviceShare(share, id = DEFAULT_DEVICE_SHARE_ID) {
  const db = await openDB();
  try {
    const payload = await encryptShare(share, id);
    await tx(db, SHARES_STORE, "readwrite", (s) => s.put(payload, id));
  } finally {
    db.close();
  }
}
__name(storeDeviceShare, "storeDeviceShare");
async function getDeviceShare(id = DEFAULT_DEVICE_SHARE_ID) {
  const db = await openDB();
  try {
    const payload = await tx(
      db,
      SHARES_STORE,
      "readonly",
      (s) => s.get(id)
    );
    if (!payload) {
      return null;
    }
    try {
      return await decryptShare(payload, id);
    } catch (e) {
      console.warn("SSS Storage: decryption failed", e);
      return null;
    }
  } finally {
    db.close();
  }
}
__name(getDeviceShare, "getDeviceShare");
async function hasDeviceShare(id = DEFAULT_DEVICE_SHARE_ID) {
  const share = await getDeviceShare(id);
  return share !== null;
}
__name(hasDeviceShare, "hasDeviceShare");
async function deleteDeviceShare(id = DEFAULT_DEVICE_SHARE_ID) {
  const db = await openDB();
  try {
    await tx(db, SHARES_STORE, "readwrite", (s) => s.delete(id));
  } finally {
    db.close();
  }
}
__name(deleteDeviceShare, "deleteDeviceShare");
async function clearAllShares() {
  await new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}
__name(clearAllShares, "clearAllShares");

// src/key-manager.ts
var SSSKeyManager = class {
  constructor(config) {
    this.name = "sss";
    this.initialized = false;
    this.currentPrivateKey = null;
    this.config = config;
    this.apiClient = new SSSApiClient({
      serverUrl: config.serverUrl,
      authProvider: config.authProvider
    });
  }
  static {
    __name(this, "SSSKeyManager");
  }
  isInitialized() {
    return this.initialized;
  }
  async hasLocalKey() {
    return hasDeviceShare(this.config.deviceStorageKey);
  }
  async connect() {
    const deviceShare = await getDeviceShare(this.config.deviceStorageKey);
    if (!deviceShare) {
      throw new Error("No device share found. User needs to set up SSS or recover.");
    }
    const serverResponse = await this.apiClient.getAuthShare();
    if (!serverResponse || !serverResponse.authShare) {
      throw new Error("No auth share found on server. User may need to recover.");
    }
    if (serverResponse.keyProvider !== "sss") {
      throw new Error("User has not migrated to SSS yet.");
    }
    const privateKey = await reconstructPrivateKey(
      deviceShare,
      serverResponse.authShare.encryptedData
    );
    this.currentPrivateKey = privateKey;
    this.initialized = true;
    return privateKey;
  }
  async disconnect() {
    this.currentPrivateKey = null;
    this.initialized = false;
  }
  async setupNewKey() {
    const privateKey = await generateEd25519PrivateKey();
    await this.setupWithKey(privateKey);
    return privateKey;
  }
  async setupWithKey(privateKey, primaryDid) {
    const shares = await splitPrivateKey(privateKey);
    await storeDeviceShare(shares.deviceShare, this.config.deviceStorageKey);
    const did = primaryDid || `did:key:placeholder-${Date.now()}`;
    await this.apiClient.storeAuthShare({
      authShare: {
        encryptedData: shares.authShare,
        encryptedDek: "",
        iv: ""
      },
      primaryDid: did,
      securityLevel: "basic"
    });
    this.currentPrivateKey = privateKey;
    this.initialized = true;
  }
  async migrate(privateKey) {
    await this.setupWithKey(privateKey);
    await this.apiClient.markMigrated();
  }
  async canMigrate() {
    const serverResponse = await this.apiClient.getAuthShare();
    return serverResponse?.keyProvider === "web3auth";
  }
  async addRecoveryMethod(method) {
    if (!this.currentPrivateKey) {
      throw new Error("No active key. Connect first.");
    }
    const shares = await splitPrivateKey(this.currentPrivateKey);
    const recoveryShare = shares.recoveryShare;
    if (method.type === "password") {
      const encrypted = await encryptWithPassword(recoveryShare, method.password);
      await this.apiClient.addRecoveryMethod({
        type: "password",
        encryptedShare: {
          encryptedData: encrypted.ciphertext,
          iv: encrypted.iv,
          salt: encrypted.salt
        }
      });
    } else if (method.type === "passkey") {
      throw new Error("Passkey recovery not yet implemented");
    } else if (method.type === "backup") {
      throw new Error("Use exportBackup() instead");
    }
  }
  async getRecoveryMethods() {
    const serverResponse = await this.apiClient.getAuthShare();
    return serverResponse?.recoveryMethods || [];
  }
  async recover(method) {
    if (method.type === "password") {
      const encryptedShare = await this.apiClient.getRecoveryShare("password");
      if (!encryptedShare || !encryptedShare.salt) {
        throw new Error("No password recovery share found");
      }
      const recoveryShare = await decryptWithPassword(
        encryptedShare.encryptedData,
        encryptedShare.iv,
        encryptedShare.salt,
        method.password,
        DEFAULT_KDF_PARAMS
      );
      const serverResponse = await this.apiClient.getAuthShare();
      if (!serverResponse || !serverResponse.authShare) {
        throw new Error("No auth share found on server");
      }
      const privateKey = await reconstructPrivateKey(
        recoveryShare,
        serverResponse.authShare.encryptedData
      );
      const newShares = await splitPrivateKey(privateKey);
      await storeDeviceShare(newShares.deviceShare, this.config.deviceStorageKey);
      this.currentPrivateKey = privateKey;
      this.initialized = true;
      return privateKey;
    } else if (method.type === "backup") {
      const backup = JSON.parse(method.fileContents);
      if (backup.version !== 1) {
        throw new Error("Unsupported backup file version");
      }
      const recoveryShare = await decryptWithPassword(
        backup.encryptedShare.ciphertext,
        backup.encryptedShare.iv,
        backup.encryptedShare.salt,
        method.password,
        backup.encryptedShare.kdfParams
      );
      const serverResponse = await this.apiClient.getAuthShare();
      if (!serverResponse || !serverResponse.authShare) {
        throw new Error("No auth share found on server");
      }
      const privateKey = await reconstructPrivateKey(
        recoveryShare,
        serverResponse.authShare.encryptedData
      );
      const newShares = await splitPrivateKey(privateKey);
      await storeDeviceShare(newShares.deviceShare, this.config.deviceStorageKey);
      this.currentPrivateKey = privateKey;
      this.initialized = true;
      return privateKey;
    } else if (method.type === "passkey") {
      throw new Error("Passkey recovery not yet implemented");
    }
    throw new Error("Unknown recovery method");
  }
  async getSecurityLevel() {
    const serverResponse = await this.apiClient.getAuthShare();
    return serverResponse?.securityLevel || "basic";
  }
  async exportBackup(password) {
    if (!this.currentPrivateKey) {
      throw new Error("No active key. Connect first.");
    }
    const shares = await splitPrivateKey(this.currentPrivateKey);
    const encrypted = await encryptWithPassword(shares.recoveryShare, password);
    const serverResponse = await this.apiClient.getAuthShare();
    return {
      version: 1,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      primaryDid: serverResponse?.primaryDid || "unknown",
      encryptedShare: {
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        salt: encrypted.salt,
        kdfParams: encrypted.kdfParams
      }
    };
  }
  async clearLocalData() {
    await deleteDeviceShare(this.config.deviceStorageKey);
    this.currentPrivateKey = null;
    this.initialized = false;
  }
  async deleteAccount() {
    await this.apiClient.deleteUserKey();
    await clearAllShares();
    this.currentPrivateKey = null;
    this.initialized = false;
  }
};
function createSSSKeyManager(config) {
  return new SSSKeyManager(config);
}
__name(createSSSKeyManager, "createSSSKeyManager");
export {
  DEFAULT_KDF_PARAMS,
  SSSApiClient,
  SSSKeyManager,
  SSS_THRESHOLD,
  SSS_TOTAL_SHARES,
  base64ToBuffer,
  bufferToBase64,
  bytesToHex,
  clearAllShares,
  createSSSKeyManager,
  decryptWithPassword,
  deleteDeviceShare,
  deriveKeyFromPassword,
  encryptWithPassword,
  generateEd25519PrivateKey,
  getDeviceShare,
  hasDeviceShare,
  hexToBytes,
  reconstructFromShares,
  reconstructPrivateKey,
  splitPrivateKey,
  storeDeviceShare
};
