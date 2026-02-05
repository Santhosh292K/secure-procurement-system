/**
 * Base64 Encoding/Decoding Utility
 * Demonstrates Base64 encoding for data obfuscation
 */

export class Base64Util {
    /**
     * Encode data to Base64
     * @param data - String or Buffer to encode
     * @returns Base64 encoded string
     */
    static encode(data: string | Buffer): string {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');
        return buffer.toString('base64');
    }

    /**
     * Decode Base64 string
     * @param encodedData - Base64 encoded string
     * @returns Decoded string
     */
    static decode(encodedData: string): string {
        const buffer = Buffer.from(encodedData, 'base64');
        return buffer.toString('utf-8');
    }

    /**
     * Encode JSON object to Base64
     * @param obj - Object to encode
     * @returns Base64 encoded JSON string
     */
    static encodeJSON(obj: any): string {
        const jsonString = JSON.stringify(obj);
        return this.encode(jsonString);
    }

    /**
     * Decode Base64 to JSON object
     * @param encodedData - Base64 encoded JSON string
     * @returns Decoded object
     */
    static decodeJSON<T = any>(encodedData: string): T {
        const jsonString = this.decode(encodedData);
        return JSON.parse(jsonString) as T;
    }

    /**
     * URL-safe Base64 encoding
     * @param data - Data to encode
     * @returns URL-safe Base64 string
     */
    static encodeURL(data: string | Buffer): string {
        return this.encode(data)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    /**
     * Decode URL-safe Base64
     * @param encodedData - URL-safe Base64 string
     * @returns Decoded string
     */
    static decodeURL(encodedData: string): string {
        // Add back padding
        const padding = '='.repeat((4 - (encodedData.length % 4)) % 4);
        const base64 = encodedData
            .replace(/-/g, '+')
            .replace(/_/g, '/') + padding;
        return this.decode(base64);
    }

    /**
     * Check if string is valid Base64
     * @param str - String to check
     * @returns True if valid Base64
     */
    static isBase64(str: string): boolean {
        const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
        return base64Regex.test(str);
    }
}
