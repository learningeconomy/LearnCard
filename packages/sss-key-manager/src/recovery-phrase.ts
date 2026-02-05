/**
 * BIP39 Recovery Phrase utilities for SSS recovery
 * The recovery phrase directly encodes a share (not encryption)
 */

import { bytesToHex, hexToBytes, bufferToBase64, base64ToBuffer } from './crypto';

export interface RecoveryPhraseData {
    phrase: string;
    shareHex: string;
}

const WORDLIST_MODULE = '@scure/bip39/wordlists/english';

let wordlistPromise: Promise<string[]> | null = null;

async function getWordlist(): Promise<string[]> {
    if (!wordlistPromise) {
        wordlistPromise = import('@scure/bip39/wordlists/english').then(m => m.wordlist);
    }
    return wordlistPromise;
}

function bytesToBits(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map(b => b.toString(2).padStart(8, '0'))
        .join('');
}

function bitsToBytes(bits: string): Uint8Array {
    const bytes = new Uint8Array(Math.ceil(bits.length / 8));
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(bits.slice(i * 8, (i + 1) * 8).padEnd(8, '0'), 2);
    }
    return bytes;
}

async function computeChecksum(data: Uint8Array): Promise<string> {
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashBits = bytesToBits(new Uint8Array(hash));
    const checksumLength = Math.floor(data.length / 4);
    return hashBits.slice(0, checksumLength);
}

export async function shareToRecoveryPhrase(shareHex: string): Promise<string> {
    const wordlist = await getWordlist();
    const shareBytes = hexToBytes(shareHex);

    const checksum = await computeChecksum(shareBytes);
    const allBits = bytesToBits(shareBytes) + checksum;

    const words: string[] = [];
    for (let i = 0; i < allBits.length; i += 11) {
        const index = parseInt(allBits.slice(i, i + 11).padEnd(11, '0'), 2);
        words.push(wordlist[index]);
    }

    return words.join(' ');
}

export async function recoveryPhraseToShare(phrase: string): Promise<string> {
    const wordlist = await getWordlist();
    const words = phrase.trim().toLowerCase().split(/\s+/);

    // SSS shares include an index byte, so they produce 25 words instead of standard BIP39 24
    if (words.length < 12 || words.length > 27) {
        throw new Error('Recovery phrase must be 12-27 words');
    }

    let bits = '';
    for (const word of words) {
        const index = wordlist.indexOf(word);
        if (index === -1) {
            throw new Error(`Invalid word in recovery phrase: ${word}`);
        }
        bits += index.toString(2).padStart(11, '0');
    }

    // Calculate the correct data byte count
    // The encoding formula: totalBits = dataBytes * 8 + floor(dataBytes / 4)
    // We need to find the LARGEST dataBytes such that ceil(totalBits / 11) == words.length
    // Multiple byte counts can produce the same word count, so we want the largest (most likely)
    let dataByteCount = 0;
    for (let bytes = 1; bytes <= 64; bytes++) {
        const checksumBits = Math.floor(bytes / 4);
        const totalBits = bytes * 8 + checksumBits;
        const wordsNeeded = Math.ceil(totalBits / 11);
        if (wordsNeeded === words.length) {
            dataByteCount = bytes; // Keep updating to get the largest match
        } else if (wordsNeeded > words.length) {
            break; // Gone past, stop
        }
    }

    if (dataByteCount === 0) {
        throw new Error('Could not determine data size from word count');
    }

    const checksumLength = Math.floor(dataByteCount / 4);
    const dataBitCount = dataByteCount * 8;
    
    const dataBits = bits.slice(0, dataBitCount);
    const checksumBits = bits.slice(dataBitCount, dataBitCount + checksumLength);

    const dataBytes = bitsToBytes(dataBits);

    const expectedChecksum = await computeChecksum(dataBytes);
    if (checksumBits !== expectedChecksum.slice(0, checksumLength)) {
        throw new Error('Invalid recovery phrase checksum');
    }

    return bytesToHex(dataBytes);
}

export async function generateRecoveryPhrase(shareHex: string): Promise<RecoveryPhraseData> {
    const phrase = await shareToRecoveryPhrase(shareHex);
    return { phrase, shareHex };
}

export async function validateRecoveryPhrase(phrase: string): Promise<boolean> {
    try {
        await recoveryPhraseToShare(phrase);
        return true;
    } catch {
        return false;
    }
}

export function countWords(phrase: string): number {
    return phrase.trim().split(/\s+/).filter(w => w.length > 0).length;
}
