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
