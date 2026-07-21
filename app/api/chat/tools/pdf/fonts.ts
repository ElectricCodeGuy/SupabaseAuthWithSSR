// Registers the bundled Inter font family for @react-pdf/renderer. The TTFs
// live in /assets and are read from disk, so there is no runtime CDN
// dependency. Latin subset covers Western European characters (æøå, §, €).
import { join } from 'node:path';
import { Font } from '@react-pdf/renderer';

let registered = false;

export function registerPdfFonts(): void {
  if (registered) return;
  registered = true;

  const dir = join(process.cwd(), 'assets');

  Font.register({
    family: 'Inter',
    fonts: [
      { src: join(dir, 'Inter-Regular.ttf'), fontWeight: 400 },
      { src: join(dir, 'Inter-SemiBold.ttf'), fontWeight: 600 },
      { src: join(dir, 'Inter-Bold.ttf'), fontWeight: 700 },
      { src: join(dir, 'Inter-Italic.ttf'), fontWeight: 400, fontStyle: 'italic' },
      {
        src: join(dir, 'Inter-BoldItalic.ttf'),
        fontWeight: 700,
        fontStyle: 'italic'
      }
    ]
  });

  // Avoid @react-pdf hyphenating words at odd points.
  Font.registerHyphenationCallback((word) => [word]);
}
