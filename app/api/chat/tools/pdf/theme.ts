// Visual theme for generated PDFs: per-template accent colors and a StyleSheet
// factory. Keeping this separate keeps the document component readable.
import { StyleSheet } from '@react-pdf/renderer';

export type PdfTemplate = 'report' | 'memo' | 'letter' | 'contract';

export const TEMPLATES: Record<
  PdfTemplate,
  { accent: string; label: string }
> = {
  report: { accent: '#1e4fa3', label: 'Report' },
  memo: { accent: '#334155', label: 'Memo' },
  letter: { accent: '#111827', label: 'Letter' },
  contract: { accent: '#0f766e', label: 'Contract' }
};

const INK = '#1a2330';
const MUTED = '#6b7280';
const HAIRLINE = '#e3e6ea';

export const CALLOUT_VARIANTS = {
  info: { bg: '#eff6ff', border: '#bfdbfe', bar: '#3b82f6', label: 'Info' },
  warning: { bg: '#fff7ed', border: '#fed7aa', bar: '#f59e0b', label: 'Note' },
  success: { bg: '#f0fdf4', border: '#bbf7d0', bar: '#22c55e', label: 'OK' },
  quote: { bg: '#f8fafc', border: '#e2e8f0', bar: '#94a3b8', label: '' }
} as const;

export function getStyles(accent: string) {
  return StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#ffffff',
      paddingTop: 64,
      paddingBottom: 56,
      paddingHorizontal: 54,
      fontFamily: 'Inter',
      fontSize: 10.5,
      color: INK,
      lineHeight: 1.5
    },
    // Running header / footer (fixed on every page)
    runningHeader: {
      position: 'absolute',
      top: 28,
      left: 54,
      right: 54,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: HAIRLINE
    },
    brandMark: {
      fontSize: 9,
      fontWeight: 700,
      color: accent,
      letterSpacing: 0.4
    },
    headerMeta: { fontSize: 8, color: MUTED },
    footer: {
      position: 'absolute',
      bottom: 28,
      left: 54,
      right: 54,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: HAIRLINE,
      fontSize: 8,
      color: MUTED
    },
    // Title block (top of first content page)
    titleBlock: { marginBottom: 18 },
    accentRule: {
      width: 46,
      height: 3,
      backgroundColor: accent,
      borderRadius: 2,
      marginBottom: 10
    },
    title: {
      fontSize: 23,
      fontWeight: 700,
      color: INK,
      marginBottom: 4,
      lineHeight: 1.2
    },
    subtitle: { fontSize: 13, color: MUTED, marginBottom: 6, lineHeight: 1.3 },
    metaInfo: { fontSize: 9, color: MUTED },
    // Cover page
    coverPage: {
      backgroundColor: '#ffffff',
      paddingHorizontal: 64,
      justifyContent: 'center',
      fontFamily: 'Inter'
    },
    coverBrand: {
      fontSize: 11,
      fontWeight: 700,
      color: accent,
      letterSpacing: 1,
      marginBottom: 16
    },
    coverRule: {
      width: 64,
      height: 4,
      backgroundColor: accent,
      borderRadius: 2,
      marginBottom: 20
    },
    coverTitle: {
      fontSize: 34,
      fontWeight: 700,
      color: INK,
      lineHeight: 1.15,
      marginBottom: 12
    },
    coverSubtitle: {
      fontSize: 15,
      color: MUTED,
      lineHeight: 1.35,
      marginBottom: 28
    },
    coverMeta: { fontSize: 11, color: INK },
    coverMetaMuted: { fontSize: 10, color: MUTED, marginTop: 2 },
    // Table of contents
    tocTitle: {
      fontSize: 15,
      fontWeight: 700,
      color: INK,
      marginBottom: 12
    },
    tocRow: { flexDirection: 'row', marginBottom: 6 },
    tocRowSub: { flexDirection: 'row', marginBottom: 5, paddingLeft: 16 },
    tocText: { fontSize: 11, color: INK },
    tocTextSub: { fontSize: 10, color: MUTED },
    // Headings
    heading1: {
      fontSize: 16,
      fontWeight: 700,
      color: INK,
      marginTop: 18,
      marginBottom: 7
    },
    heading2: {
      fontSize: 13,
      fontWeight: 700,
      color: INK,
      marginTop: 14,
      marginBottom: 5
    },
    heading3: {
      fontSize: 11,
      fontWeight: 600,
      color: accent,
      marginTop: 11,
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5
    },
    paragraph: { marginBottom: 8 },
    // Lists
    listContainer: { marginBottom: 8, marginTop: 2 },
    listItem: { flexDirection: 'row', marginBottom: 4, paddingLeft: 6 },
    bulletDot: { width: 14, color: accent, fontWeight: 700 },
    listNumber: { width: 18, color: accent, fontWeight: 700 },
    listText: { flex: 1 },
    // Tables
    tableTitle: {
      fontSize: 10,
      fontWeight: 700,
      color: INK,
      marginBottom: 4,
      marginTop: 4
    },
    table: {
      marginTop: 6,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: HAIRLINE,
      borderRadius: 4,
      overflow: 'hidden'
    },
    tableHeaderRow: { flexDirection: 'row', backgroundColor: accent },
    tableRow: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: HAIRLINE
    },
    tableRowAlt: { backgroundColor: '#f8fafc' },
    tableHeaderCell: {
      paddingVertical: 6,
      paddingHorizontal: 8,
      fontSize: 9,
      fontWeight: 700,
      color: '#ffffff'
    },
    tableCell: {
      paddingVertical: 6,
      paddingHorizontal: 8,
      fontSize: 9.5,
      color: INK
    },
    // Callout / quote boxes
    callout: {
      flexDirection: 'row',
      marginVertical: 9,
      borderRadius: 5,
      borderWidth: 1,
      overflow: 'hidden'
    },
    calloutBar: { width: 4 },
    calloutBody: { flex: 1, paddingVertical: 9, paddingHorizontal: 11 },
    calloutLabel: {
      fontSize: 8,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 4
    },
    calloutTitle: {
      fontSize: 10.5,
      fontWeight: 700,
      marginBottom: 3,
      color: INK
    },
    calloutText: { fontSize: 10, color: '#374151', marginBottom: 3 },
    calloutCitation: {
      fontSize: 8.5,
      fontStyle: 'italic',
      color: MUTED,
      marginTop: 3
    },
    // Divider + image
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: HAIRLINE,
      marginVertical: 12
    },
    image: { marginVertical: 8, borderRadius: 4, objectFit: 'contain' },
    imageCaption: {
      fontSize: 8.5,
      color: MUTED,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 3
    },
    // Inline
    bold: { fontWeight: 700 },
    italic: { fontStyle: 'italic' },
    code: {
      fontFamily: 'Courier',
      fontSize: 9.5,
      backgroundColor: '#f1f5f9',
      color: '#9333ea'
    },
    link: { color: accent, textDecoration: 'underline' }
  });
}

export type PdfStyles = ReturnType<typeof getStyles>;
