import { z } from 'zod';

const calloutSchema = z.object({
  variant: z
    .enum(['info', 'warning', 'success', 'quote'])
    .describe(
      'Box style: "info" (neutral note), "warning" (caution), "success" (positive), "quote" (citation)'
    ),
  title: z.string().optional().describe('Optional bold heading for the box'),
  content: z
    .array(z.string())
    .describe('One or more paragraphs of text inside the box'),
  citation: z
    .string()
    .optional()
    .describe(
      'Optional source reference shown in italics under the box, e.g. "Annual Report 2025, p. 12"'
    )
});

const tableSchema = z.object({
  title: z
    .string()
    .optional()
    .describe('Optional caption shown above the table'),
  headers: z.array(z.string()).describe('Table header row'),
  rows: z.array(z.array(z.string())).describe('Table data rows'),
  columnWidths: z
    .array(z.number())
    .optional()
    .describe(
      'Optional relative column widths (flex weights), one per column, e.g. [2,1,1] makes the first column twice as wide'
    )
});

const sectionSchema = z.object({
  heading: z.string().optional().describe('Section heading text'),
  headingLevel: z
    .enum(['1', '2', '3'])
    .optional()
    .describe('Heading level: 1 (largest) to 3'),
  content: z
    .array(z.string())
    .optional()
    .describe(
      'Paragraphs for this section. Supports inline **bold**, *italic*, `code`, and [link](https://url).'
    ),
  bulletPoints: z
    .array(z.string())
    .optional()
    .describe('Optional bullet points'),
  numberedList: z
    .array(z.string())
    .optional()
    .describe('Optional numbered list items'),
  callouts: z
    .array(calloutSchema)
    .optional()
    .describe(
      'Optional highlighted boxes (notes, warnings, quotes) for this section'
    ),
  table: tableSchema
    .optional()
    .describe('Optional table belonging to this section'),
  imageUrl: z
    .string()
    .optional()
    .describe(
      'Optional absolute https URL of a PNG/JPEG image to embed in this section'
    ),
  imageCaption: z
    .string()
    .optional()
    .describe('Optional caption shown under the image'),
  divider: z
    .boolean()
    .optional()
    .describe('Draw a horizontal divider line after this section')
});

export const createPdfInputSchema = z.object({
  title: z.string().describe('Document title'),
  subtitle: z.string().optional().describe('Optional document subtitle'),
  author: z.string().optional().describe('Document author name'),
  date: z
    .string()
    .optional()
    .describe('Document date (free text, e.g. "July 21, 2026")'),
  template: z
    .enum(['report', 'memo', 'letter', 'contract'])
    .optional()
    .describe(
      'Document style preset: "report" (default, blue), "memo" (slate), "letter" (formal dark), "contract" (teal)'
    ),
  sections: z
    .array(sectionSchema)
    .describe('Ordered document sections with headings and content'),
  tables: z
    .array(tableSchema)
    .optional()
    .describe(
      'Optional document-level tables rendered after all sections (prefer section.table for tables that belong to a section)'
    ),
  includeCoverPage: z
    .boolean()
    .optional()
    .describe('Render a dedicated cover page before the content'),
  includeTableOfContents: z
    .boolean()
    .optional()
    .describe(
      'Render a "Contents" table of contents from level 1 & 2 headings (use for longer documents)'
    ),
  headerText: z
    .string()
    .optional()
    .describe('Optional running header text shown on every page'),
  includePageNumbers: z
    .boolean()
    .optional()
    .describe('Show "Page X of Y" in the footer (default true)')
});

export type PdfSection = z.infer<typeof sectionSchema>;
export type PdfTable = z.infer<typeof tableSchema>;
export type PdfCallout = z.infer<typeof calloutSchema>;

/** A section augmented with a pre-fetched image buffer (resolved in the tool). */
export type ResolvedSection = PdfSection & {
  imageData?: { data: Buffer; format: 'png' | 'jpg' };
};
