// utilities.ts

/**
 * Copies the provided text to the clipboard.
 *
 * @param str - The text to be copied.
 */
export const copyToClipboard = (str: string): void => {
  void window.navigator.clipboard.writeText(str);
};

/**
 * Generates a random string of the specified length.
 *
 * @param length - The desired length of the random string.
 * @param lowercase - A flag to determine if the output should be in lowercase.
 *
 * @returns A random string.
 */
export const generateRandomString = (
  length: number,
  lowercase = false
): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXY3456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return lowercase ? result.toLowerCase() : result;
};

/**
 * A map to associate programming languages with their typical file extensions.
 */
export const programmingLanguages: Record<string, string | undefined> = {
  javascript: '.js',
  python: '.py',
  java: '.java',
  c: '.c',
  cpp: '.cpp',
  'c++': '.cpp',
  'c#': '.cs',
  ruby: '.rb',
  php: '.php',
  swift: '.swift',
  'objective-c': '.m',
  kotlin: '.kt',
  typescript: '.ts',
  go: '.go',
  perl: '.pl',
  rust: '.rs',
  scala: '.scala',
  haskell: '.hs',
  lua: '.lua',
  shell: '.sh',
  sql: '.sql',
  html: '.html',
  css: '.css'
};
