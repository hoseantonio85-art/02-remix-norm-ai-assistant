import i18n from '@/i18n/config';
import type {
  KnowledgeFormat,
  KnowledgeNode,
} from '@/types/universalKnowledge';

interface DateParts {
  year: string;
  month: string;
  day: string;
  hour?: string;
  minute?: string;
  second?: string;
}

function localizedMonth(month: string): string {
  const monthIndex = Number(month) - 1;
  if (monthIndex < 0 || monthIndex > 11) {
    return month;
  }
  const parts = new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).formatToParts(new Date(Date.UTC(2000, monthIndex, 2)));
  return parts.find((part) => part.type === 'month')?.value || month;
}

function parseDateParts(value: string): DateParts | null {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(
      value,
    );
  if (!match) {
    return null;
  }
  return {
    year: match[1],
    month: match[2],
    day: match[3],
    hour: match[4],
    minute: match[5],
    second: match[6],
  };
}

function applyDatePattern(parts: DateParts, pattern: string): string {
  const replacements: Record<string, string> = {
    YYYY: parts.year,
    MMMM: localizedMonth(parts.month),
    MM: parts.month,
    DD: parts.day,
    HH: parts.hour || '00',
    mm: parts.minute || '00',
    ss: parts.second || '00',
  };
  return Object.entries(replacements).reduce(
    (result, [token, replacement]) => result.replaceAll(token, replacement),
    pattern,
  );
}

function formatDate(value: string, format?: KnowledgeFormat): string {
  const parts = parseDateParts(value);
  if (!parts) {
    return value;
  }
  if (format?.datePattern) {
    return applyDatePattern(parts, format.datePattern);
  }
  return `${Number(parts.day)} ${localizedMonth(parts.month)} ${parts.year}`;
}

export function formatDateTime(
  value: string,
  format?: KnowledgeFormat,
): string {
  const parts = parseDateParts(value);
  if (!parts) {
    return value;
  }
  if (format?.datePattern) {
    return applyDatePattern(parts, format.datePattern);
  }
  const date = formatDate(value);
  const time =
    parts.hour && parts.minute
      ? `${parts.hour}:${parts.minute}${parts.second ? `:${parts.second}` : ''}`
      : '';
  const timezone = format?.timezone ? ` (${format.timezone})` : '';
  return time ? `${date}, ${time}${timezone}` : date;
}

export function formatNodeValue(node: KnowledgeNode): string {
  if (node.displayValue) {
    return node.displayValue;
  }
  const value = node.value;
  if (value === null || value === undefined || value === '') {
    return '';
  }
  const format = node.format || undefined;
  if (node.valueType === 'enum') {
    return node.enumLabels?.[String(value)] || String(value);
  }
  if (typeof value === 'boolean') {
    return value
      ? format?.trueLabel || i18n.t('universalValue.yes')
      : format?.falseLabel || i18n.t('universalValue.no');
  }
  if (node.valueType === 'datetime' || format?.kind === 'datetime') {
    return formatDateTime(String(value), format);
  }
  if (node.valueType === 'date' || format?.kind === 'date') {
    return formatDate(String(value), format);
  }
  if (format?.kind === 'money' && typeof value === 'number') {
    try {
      return new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency: format.currency || 'RUB',
        maximumFractionDigits: format.decimals ?? 0,
        minimumFractionDigits: format.decimals ?? 0,
      }).format(value);
    } catch {
      return String(value);
    }
  }
  if (format?.kind === 'percentage') {
    return `${value}${format.suffix ?? '%'}`;
  }
  if (format?.kind === 'number' && typeof value === 'number') {
    const formatted = new Intl.NumberFormat(i18n.language, {
      maximumFractionDigits: format.decimals ?? 0,
      minimumFractionDigits: format.decimals ?? 0,
    }).format(value);
    return format.unit ? `${formatted} ${format.unit}` : formatted;
  }
  let result = String(value);
  if (format?.prefix) {
    result = format.prefix + result;
  }
  if (format?.suffix) {
    result += format.suffix;
  }
  return result;
}
