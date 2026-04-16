export type CsvCell = string | number | boolean | null | undefined;
export type CsvRow = Record<string, CsvCell>;

function stringifyCell(value: CsvCell): string {
  if (value === null || value === undefined) {
    return '';
  }

  const text = String(value);
  const shouldQuote = text.includes('"') || text.includes(',') || text.includes('\n') || text.includes('\r');

  if (!shouldQuote) {
    return text;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

export function serializeCsv(headers: string[], rows: CsvRow[]): string {
  const headerLine = headers.map((header) => stringifyCell(header)).join(',');
  const rowLines = rows.map((row) => headers.map((header) => stringifyCell(row[header])).join(','));

  return [headerLine, ...rowLines].join('\n');
}
