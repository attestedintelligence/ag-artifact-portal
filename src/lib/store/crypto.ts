'use client';

/**
 * Crypto Store
 * Per AGA Build Guide Phase 1
 *
 * Manages Ed25519 signing keys in browser with encrypted persistence.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { KeyClass, SigningKey } from '@attested/core';
import {
  generateFullKeyPair,
  encryptPrivateKey,
  decryptPrivateKey,
  getKeyFingerprint,
  validateKeyPair,
  importPrivateKey,
  type GeneratedKeyPair,
  type EncryptedKey,
} from '@attested/core';

// ============================================================================
// TYPES
// ============================================================================

export interface StoredKey {
  keyId: string;
  keyIdHash: string;
  publicKeyB64: string;
  encryptedPrivateKey: EncryptedKey | null;  // null if BYOK with external storage
  fingerprint: string;
  keyClass: KeyClass;
  createdAt: number;
  lastUsedAt?: number;
  label?: string;
}

export interface DecryptedKey extends StoredKey {
  privateKeyB64: string;
}

interface CryptoState {
  // Keys
  keys: StoredKey[];
  activeKeyId: string | null;

  // Derived state
  hasKeys: boolean;
  activeKey: StoredKey | null;

  // Unlock state (password in memory for session)
  isUnlocked: boolean;
  sessionPassword: string | null;

  // Actions
  generateKey: (keyClass: KeyClass, password: string, label?: string) => Promise<StoredKey>;
  importKey: (privateKeyInput: string, keyClass: KeyClass, password: string, label?: string) => Promise<StoredKey>;
  deleteKey: (keyId: string) => void;
  setActiveKey: (keyId: string | null) => void;

  // Unlock/Lock
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;

  // Get decrypted key (requires unlock)
  getDecryptedKey: (keyId: string) => Promise<DecryptedKey | null>;

  // Utility
  updateKeyLabel: (keyId: string, label: string) => void;
  markKeyUsed: (keyId: string) => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useCryptoStore = create<CryptoState>()(
  persist(
    (set, get) => ({
      // Initial state
      keys: [],
      activeKeyId: null,
      hasKeys: false,
      activeKey: null,
      isUnlocked: false,
      sessionPassword: null,

      // Generate a new key
      generateKey: async (keyClass: KeyClass, password: string, label?: string) => {
        const keyPair = await generateFullKeyPair(keyClass);

        // Encrypt private key for storage
        const encryptedPrivateKey = await encryptPrivateKey(keyPair.privateKey, password);

        const storedKey: StoredKey = {
          keyId: keyPair.keyId,
          keyIdHash: keyPair.keyIdHash,
          publicKeyB64: keyPair.publicKeyB64,
          encryptedPrivateKey,
          fingerprint: keyPair.fingerprint,
          keyClass,
          createdAt: keyPair.createdAt,
          label,
        };

        set(state => {
          const newKeys = [...state.keys, storedKey];
          return {
            keys: newKeys,
            hasKeys: newKeys.length > 0,
            activeKeyId: state.activeKeyId ?? storedKey.keyId,
            activeKey: state.activeKeyId ? state.activeKey : storedKey,
          };
        });

        return storedKey;
      },

      // Import an existing key
      importKey: async (privateKeyInput: string, keyClass: KeyClass, password: string, label?: string) => {
        const imported = await importPrivateKey(privateKeyInput);

        // Encrypt private key for storage
        const encryptedPrivateKey = await encryptPrivateKey(imported.privateKey, password);

        const storedKey: StoredKey = {
          keyId: `ai_${keyClass.toLowerCase()}_${imported.importedAt}_ed25519`,
          keyIdHash: imported.keyIdHash,
          publicKeyB64: imported.publicKeyB64,
          encryptedPrivateKey,
          fingerprint: imported.fingerprint,
          keyClass,
          createdAt: imported.importedAt,
          label: label ?? `Imported (${imported.source})`,
        };

        set(state => {
          const newKeys = [...state.keys, storedKey];
          return {
            keys: newKeys,
            hasKeys: newKeys.length > 0,
            activeKeyId: state.activeKeyId ?? storedKey.keyId,
            activeKey: state.activeKeyId ? state.activeKey : storedKey,
          };
        });

        return storedKey;
      },

      // Delete a key
      deleteKey: (keyId: string) => {
        set(state => {
          const newKeys = state.keys.filter(k => k.keyId !== keyId);
          const needNewActive = state.activeKeyId === keyId;
          return {
            keys: newKeys,
            hasKeys: newKeys.length > 0,
            activeKeyId: needNewActive ? (newKeys[0]?.keyId ?? null) : state.activeKeyId,
            activeKey: needNewActive ? (newKeys[0] ?? null) : state.activeKey,
          };
        });
      },

      // Set active key
      setActiveKey: (keyId: string | null) => {
        set(state => ({
          activeKeyId: keyId,
          activeKey: keyId ? state.keys.find(k => k.keyId === keyId) ?? null : null,
        }));
      },

      // Unlock with password (stores password in memory for session)
      unlock: async (password: string) => {
        const { keys } = get();

        // Try to decrypt the first key to verify password
        if (keys.length > 0 && keys[0].encryptedPrivateKey) {
          try {
            await decryptPrivateKey(keys[0].encryptedPrivateKey, password);
            set({ isUnlocked: true, sessionPassword: password });
            return true;
          } catch {
            return false;
          }
        }

        // No keys yet, just store password for future use
        set({ isUnlocked: true, sessionPassword: password });
        return true;
      },

      // Lock (clear session password)
      lock: () => {
        set({ isUnlocked: false, sessionPassword: null });
      },

      // Get decrypted key (requires unlock)
      getDecryptedKey: async (keyId: string) => {
        const { keys, isUnlocked, sessionPassword } = get();

        if (!isUnlocked || !sessionPassword) {
          throw new Error('Crypto store is locked');
        }

        const key = keys.find(k => k.keyId === keyId);
        if (!key) {
          return null;
        }

        if (!key.encryptedPrivateKey) {
          throw new Error('Key has no encrypted private key (external storage)');
        }

        const privateKey = await decryptPrivateKey(key.encryptedPrivateKey, sessionPassword);

        return {
          ...key,
          privateKeyB64: bytesToBase64(privateKey),
        };
      },

      // Update key label
      updateKeyLabel: (keyId: string, label: string) => {
        set(state => ({
          keys: state.keys.map(k =>
            k.keyId === keyId ? { ...k, label } : k
          ),
        }));
      },

      // Mark key as used
      markKeyUsed: (keyId: string) => {
        set(state => ({
          keys: state.keys.map(k =>
            k.keyId === keyId ? { ...k, lastUsedAt: Date.now() } : k
          ),
        }));
      },
    }),
    {
      name: 'aga-crypto-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        keys: state.keys,
        activeKeyId: state.activeKeyId,
      }),
    }
  )
);

// Helper for base64 conversion (imported from core but need to avoid circular dep)
function bytesToBase64(bytes: Uint8Array): string {
  if (typeof btoa !== 'undefined') {
    return btoa(String.fromCharCode.apply(null, Array.from(bytes)));
  } else {
    return Buffer.from(bytes).toString('base64');
  }
}

// ============================================================================
// SELECTORS
// ============================================================================

export const selectHasKeys = (state: CryptoState) => state.hasKeys;
export const selectActiveKey = (state: CryptoState) => state.activeKey;
export const selectIsUnlocked = (state: CryptoState) => state.isUnlocked;
export const selectKeysByClass = (keyClass: KeyClass) => (state: CryptoState) =>
  state.keys.filter(k => k.keyClass === keyClass);

export default useCryptoStore;
