import { Buffer } from 'buffer';
/**
 * Decode base64 string into a string
 *
 * @param {string} input Base64 encoded input
 * @returns {string} Decoded string
 */
export function atob(input) {
    return Buffer.from(input, 'base64').toString();
}
/**
 * Decode base64 string into a number
 *
 * @param {string} input Base64 encoded input
 * @returns {number} Decoded number
 */
export function atoi(input) {
    const data = Buffer.from(input, 'base64');
    if (data.length === 1) {
        return data.readUInt8(0);
    }
    else if (data.length === 2) {
        return data.readUInt16LE(0);
    }
    else if (data.length === 4) {
        return data.readUInt32LE(0);
    }
    else {
        throw new Error('Unknown integer size');
    }
}
