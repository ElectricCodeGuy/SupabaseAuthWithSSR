import React from 'react';
import { Document, Page, Text, View, Link, Image } from '@react-pdf/renderer';
import {
  getStyles,
  TEMPLATES,
  CALLOUT_VARIANTS,
  type PdfTemplate,
  type PdfStyles
} from './theme';
import type { PdfCallout, PdfTable, ResolvedSection } from './schema';

export interface PdfDocumentProps {
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
  template?: PdfTemplate;
  sections: ResolvedSection[];
  tables?: PdfTable[];
  includeCoverPage?: boolean;
  includeTableOfContents?: boolean;
  headerText?: string;
  includePageNumbers?: boolean;
}

const BRAND = 'AI ASSISTANT';

// --- Inline markdown: links, **bold**, *italic*, `code` -----------------------
const INLINE_TOKEN =
  /(\[[^\]]+\]\((?:<[^>]+>|[^)]+)\))|(\*\*[\s\S]+?\*\*)|(`[^`]+?`)|(\*[^*\n]+?\*)/g;

function renderInline(
  text: string,
  styles: PdfStyles,
  keyPrefix: string
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  INLINE_TOKEN.lastIndex = 0;

  while ((match = INLINE_TOKEN.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-i${i++}`;

    if (match[1]) {
      // [label](url) — only absolute http(s) URLs become links; anything else
      // renders as plain text (relative URLs are meaningless inside a PDF).
      const m = token.match(/^\[([^\]]+)\]\((<[^>]+>|[^)]+)\)$/);
      if (m) {
        let url = m[2].trim();
        if (url.startsWith('<') && url.endsWith('>')) url = url.slice(1, -1);
        if (/^https?:\/\//.test(url)) {
          nodes.push(
            <Link key={key} src={url} style={styles.link}>
              {m[1]}
            </Link>
          );
        } else {
          nodes.push(m[1]);
        }
      } else {
        nodes.push(token);
      }
    } else if (match[2]) {
      nodes.push(
        <Text key={key} style={styles.bold}>
          {token.slice(2, -2)}
        </Text>
      );
    } else if (match[3]) {
      nodes.push(
        <Text key={key} style={styles.code}>
          {` ${token.slice(1, -1)} `}
        </Text>
      );
    } else if (match[4]) {
      nodes.push(
        <Text key={key} style={styles.italic}>
          {token.slice(1, -1)}
        </Text>
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes.length > 0 ? nodes : [text];
}

// --- Block renderers ---------------------------------------------------------
function Paragraph({
  text,
  styles,
  k
}: {
  text: string;
  styles: PdfStyles;
  k: string;
}) {
  return <Text style={styles.paragraph}>{renderInline(text, styles, k)}</Text>;
}

function Callout({
  callout,
  styles,
  k
}: {
  callout: PdfCallout;
  styles: PdfStyles;
  k: string;
}) {
  const v = CALLOUT_VARIANTS[callout.variant];
  return (
    <View
      style={[styles.callout, { backgroundColor: v.bg, borderColor: v.border }]}
      wrap={false}
    >
      <View style={[styles.calloutBar, { backgroundColor: v.bar }]} />
      <View style={styles.calloutBody}>
        {v.label ? (
          <Text style={[styles.calloutLabel, { color: v.bar }]}>{v.label}</Text>
        ) : null}
        {callout.title ? (
          <Text style={styles.calloutTitle}>{callout.title}</Text>
        ) : null}
        {callout.content.map((p, i) => (
          <Text key={`${k}-c${i}`} style={styles.calloutText}>
            {renderInline(p, styles, `${k}-c${i}`)}
          </Text>
        ))}
        {callout.citation ? (
          <Text style={styles.calloutCitation}>— {callout.citation}</Text>
        ) : null}
      </View>
    </View>
  );
}

function TableBlock({
  table,
  styles,
  k
}: {
  table: PdfTable;
  styles: PdfStyles;
  k: string;
}) {
  const cols = table.headers.length;
  const weights =
    table.columnWidths && table.columnWidths.length === cols
      ? table.columnWidths
      : new Array(cols).fill(1);

  return (
    <View>
      {table.title ? (
        <Text style={styles.tableTitle}>{table.title}</Text>
      ) : null}
      <View style={styles.table}>
        <View style={styles.tableHeaderRow} wrap={false}>
          {table.headers.map((h, ci) => (
            <View key={`${k}-h${ci}`} style={{ flex: weights[ci] }}>
              <Text style={styles.tableHeaderCell}>{h}</Text>
            </View>
          ))}
        </View>
        {table.rows.map((row, ri) => (
          <View
            key={`${k}-r${ri}`}
            style={
              ri % 2 === 1
                ? [styles.tableRow, styles.tableRowAlt]
                : styles.tableRow
            }
            wrap={false}
          >
            {Array.from({ length: cols }).map((_, ci) => (
              <View key={`${k}-r${ri}c${ci}`} style={{ flex: weights[ci] }}>
                <Text style={styles.tableCell}>
                  {renderInline(row[ci] ?? '', styles, `${k}-r${ri}c${ci}`)}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function headingStyle(level: string | undefined, styles: PdfStyles) {
  if (level === '1') return styles.heading1;
  if (level === '3') return styles.heading3;
  return styles.heading2;
}

function SectionBlock({
  section,
  styles,
  k
}: {
  section: ResolvedSection;
  styles: PdfStyles;
  k: string;
}) {
  return (
    <View>
      {section.heading ? (
        <Text
          style={headingStyle(section.headingLevel, styles)}
          minPresenceAhead={54}
          // `bookmark` builds the PDF outline/navigation; it's a real runtime
          // prop on @react-pdf nodes but missing from the installed type defs.
          {...({ bookmark: section.heading } as Record<string, unknown>)}
        >
          {section.heading}
        </Text>
      ) : null}

      {(section.content ?? []).map((p, i) => (
        <Paragraph
          key={`${k}-p${i}`}
          text={p}
          styles={styles}
          k={`${k}-p${i}`}
        />
      ))}

      {section.bulletPoints && section.bulletPoints.length > 0 ? (
        <View style={styles.listContainer}>
          {section.bulletPoints.map((b, i) => (
            <View key={`${k}-b${i}`} style={styles.listItem} wrap={false}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.listText}>
                {renderInline(b, styles, `${k}-b${i}`)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {section.numberedList && section.numberedList.length > 0 ? (
        <View style={styles.listContainer}>
          {section.numberedList.map((it, i) => (
            <View key={`${k}-n${i}`} style={styles.listItem} wrap={false}>
              <Text style={styles.listNumber}>{`${i + 1}.`}</Text>
              <Text style={styles.listText}>
                {renderInline(it, styles, `${k}-n${i}`)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {section.callouts?.map((c, i) => (
        <Callout
          key={`${k}-co${i}`}
          callout={c}
          styles={styles}
          k={`${k}-co${i}`}
        />
      ))}

      {section.table ? (
        <TableBlock table={section.table} styles={styles} k={`${k}-t`} />
      ) : null}

      {section.imageData ? (
        <View>
          <Image style={styles.image} src={section.imageData} />
          {section.imageCaption ? (
            <Text style={styles.imageCaption}>{section.imageCaption}</Text>
          ) : null}
        </View>
      ) : null}

      {section.divider ? <View style={styles.divider} /> : null}
    </View>
  );
}

function TableOfContents({
  sections,
  styles
}: {
  sections: ResolvedSection[];
  styles: PdfStyles;
}) {
  const entries = sections
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.heading && s.headingLevel !== '3');
  if (entries.length === 0) return null;
  return (
    <View>
      <Text style={styles.tocTitle}>Contents</Text>
      {entries.map(({ s, i }) => (
        <View
          key={`toc-${i}`}
          style={s.headingLevel === '2' ? styles.tocRowSub : styles.tocRow}
        >
          <Text
            style={s.headingLevel === '2' ? styles.tocTextSub : styles.tocText}
          >
            {s.heading}
          </Text>
        </View>
      ))}
      <View style={styles.divider} />
    </View>
  );
}

export function PdfDocument(props: PdfDocumentProps) {
  const {
    title,
    subtitle,
    author,
    date,
    template = 'report',
    sections,
    tables,
    includeCoverPage,
    includeTableOfContents,
    headerText,
    includePageNumbers = true
  } = props;

  const accent = (TEMPLATES[template] ?? TEMPLATES.report).accent;
  const styles = getStyles(accent);
  const metaParts = [author, date].filter(Boolean).join('  •  ');

  return (
    <Document title={title} author={author || BRAND} creator={BRAND}>
      {includeCoverPage ? (
        <Page size="A4" style={[styles.page, styles.coverPage]}>
          <Text style={styles.coverBrand}>{BRAND}</Text>
          <View style={styles.coverRule} />
          <Text style={styles.coverTitle}>{title}</Text>
          {subtitle ? (
            <Text style={styles.coverSubtitle}>{subtitle}</Text>
          ) : null}
          {author ? <Text style={styles.coverMeta}>{author}</Text> : null}
          {date ? <Text style={styles.coverMetaMuted}>{date}</Text> : null}
        </Page>
      ) : null}

      <Page size="A4" style={styles.page}>
        {/* Running header */}
        <View style={styles.runningHeader} fixed>
          <Text style={styles.brandMark}>{BRAND}</Text>
          {headerText ? (
            <Text style={styles.headerMeta}>{headerText}</Text>
          ) : (
            <Text style={styles.headerMeta}>{title}</Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{date || metaParts || ''}</Text>
          {includePageNumbers ? (
            <Text
              render={({ pageNumber, totalPages }) =>
                `Page ${pageNumber} of ${totalPages}`
              }
            />
          ) : (
            <Text> </Text>
          )}
        </View>

        {/* Title block (only when no cover page) */}
        {!includeCoverPage ? (
          <View style={styles.titleBlock}>
            <View style={styles.accentRule} />
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            {metaParts ? (
              <Text style={styles.metaInfo}>{metaParts}</Text>
            ) : null}
          </View>
        ) : null}

        {includeTableOfContents ? (
          <TableOfContents sections={sections} styles={styles} />
        ) : null}

        {sections.map((section, i) => (
          <SectionBlock
            key={`s${i}`}
            section={section}
            styles={styles}
            k={`s${i}`}
          />
        ))}

        {tables?.map((t, i) => (
          <TableBlock key={`dt${i}`} table={t} styles={styles} k={`dt${i}`} />
        ))}
      </Page>
    </Document>
  );
}
