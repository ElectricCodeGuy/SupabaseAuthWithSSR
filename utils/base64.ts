/**
 *
 * @param str
 * @returns
 *
 * @example encodeBase64("こんにちは.png")
 * // => "44GT44KT44Gr44Gh44GvLnBuZw=="
 */
export function encodeBase64(str: string): string {
  return Buffer.from(str).toString('base64');
}

/**
 *
 * @param str
 * @returns
 *
 * @example decodeBase64("44GT44KT44Gr44Gh44GvLnBuZw==")
 * // => "こんにちは.png"
 */
export function decodeBase64(str: string): string {
  return Buffer.from(str, 'base64').toString();
}

// Storage object names are built from base64-encoded titles. Anything that
// arrives from a URL claiming to be one must match the alphabet exactly
// before it is spliced into a storage path.
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

export function isBase64(str: string): boolean {
  return str.length > 0 && str.length <= 1024 && BASE64_PATTERN.test(str);
}
