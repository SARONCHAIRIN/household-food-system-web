/**
 * Utility functions for billing settlement date calculations,
 * single source of truth date range formatting, and presets.
 */

export type DatePreset = 'this_month' | 'last_month' | 'last_14_days' | 'last_7_days' | 'custom';

export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Returns YYYY-MM-DD formatted string in local time
 * (avoids UTC offset shifts from toISOString)
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Computes exact startDate and endDate for standard billing cycle presets
 * using the device's current local date.
 */
export function computeDatePreset(
  preset: 'this_month' | 'last_month' | 'last_14_days' | 'last_7_days',
  now: Date = new Date()
): DateRange {
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (preset) {
    case 'this_month': {
      // 1st day of current month to last day of current month
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return {
        startDate: getLocalDateString(start),
        endDate: getLocalDateString(end),
      };
    }
    case 'last_month': {
      // 1st day of previous month to last day of previous month
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      return {
        startDate: getLocalDateString(start),
        endDate: getLocalDateString(end),
      };
    }
    case 'last_14_days': {
      // Last 14 days ending today (inclusive of today: 13 days ago to today)
      const start = new Date(now);
      start.setDate(now.getDate() - 13);
      return {
        startDate: getLocalDateString(start),
        endDate: getLocalDateString(now),
      };
    }
    case 'last_7_days': {
      // Last 7 days ending today (inclusive of today: 6 days ago to today)
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      return {
        startDate: getLocalDateString(start),
        endDate: getLocalDateString(now),
      };
    }
  }
}

/**
 * Detects if a date range matches any of the standard presets.
 */
export function detectPresetFromRange(
  range: DateRange,
  now: Date = new Date()
): DatePreset {
  const presets: Array<'this_month' | 'last_month' | 'last_14_days' | 'last_7_days'> = [
    'this_month',
    'last_month',
    'last_14_days',
    'last_7_days',
  ];

  for (const p of presets) {
    const computed = computeDatePreset(p, now);
    if (computed.startDate === range.startDate && computed.endDate === range.endDate) {
      return p;
    }
  }
  return 'custom';
}

/**
 * Formats a date range into human-readable text.
 * Example: "2026-09-01" to "2026-09-12" -> "Sep 1 – Sep 12, 2026"
 * Example: "2026-08-30" to "2026-09-12" -> "Aug 30 – Sep 12, 2026"
 */
export function formatHumanRange(startStr: string, endStr: string): string {
  if (!startStr || !endStr) return '';
  const [sY, sM, sD] = startStr.split('-').map(Number);
  const [eY, eM, eD] = endStr.split('-').map(Number);

  if (!sY || !sM || !sD || !eY || !eM || !eD) {
    return `${startStr} – ${endStr}`;
  }

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const sMonth = monthNames[sM - 1] || '';
  const eMonth = monthNames[eM - 1] || '';

  if (sY === eY) {
    return `${sMonth} ${sD} – ${eMonth} ${eD}, ${sY}`;
  }
  return `${sMonth} ${sD}, ${sY} – ${eMonth} ${eD}, ${eY}`;
}

/**
 * Formats date range as short month + day (e.g., "Sep 14 – Sep 14" or "Sep 1 – Sep 14").
 */
export function formatShortPeriod(startStr: string, endStr: string): string {
  if (!startStr || !endStr) return '';
  const [sY, sM, sD] = startStr.split('-').map(Number);
  const [eY, eM, eD] = endStr.split('-').map(Number);
  if (!sY || !sM || !sD || !eY || !eM || !eD) return `${startStr} – ${endStr}`;
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const sMonth = monthNames[sM - 1] || '';
  const eMonth = monthNames[eM - 1] || '';
  return `${sMonth} ${sD} – ${eMonth} ${eD}`;
}

/**
 * Formats settled created_at timestamp into human date (e.g., "Sep 12, 2026").
 */
export function formatSettledDate(dateStr?: string): string {
  if (!dateStr) return 'a previous date';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.split('T')[0];
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr.split('T')[0];
  }
}

export interface OverlappingSettlementRecord {
  id: string | number;
  startDate: string;
  endDate: string;
  settledByName: string;
  settledDate: string;
  rawCreatedAt: string;
  overlapStart: string;
  overlapEnd: string;
  overlapPeriodFormatted: string;
  totalDueAll?: number | string;
}

export interface SettlementOverlapResult {
  hasOverlap: boolean;
  overlappingSettlements: OverlappingSettlementRecord[];
  primaryOverlap: OverlappingSettlementRecord | null;
  warningMessage: string;
}

/**
 * Checks whether a selected startDate–endDate range overlaps with any period
 * already recorded in settlements history or last-settlement.
 */
export function checkSettlementOverlap(
  selectedStart: string,
  selectedEnd: string,
  settlementsList: Array<{
    id: string | number;
    start_date?: string;
    startDate?: string;
    end_date?: string;
    endDate?: string;
    settled_by_name?: string;
    settledByName?: string;
    created_at?: string;
    createdAt?: string;
    total_due_all?: number | string;
    totalDueAll?: number | string;
  }>
): SettlementOverlapResult {
  if (!selectedStart || !selectedEnd || selectedStart > selectedEnd) {
    return {
      hasOverlap: false,
      overlappingSettlements: [],
      primaryOverlap: null,
      warningMessage: '',
    };
  }

  const selStart = selectedStart.split('T')[0].trim();
  const selEnd = selectedEnd.split('T')[0].trim();

  // Deduplicate settlements by ID
  const seenIds = new Set<string>();
  const uniqueSettlements = settlementsList.filter((item) => {
    if (!item || item.id === undefined || item.id === null) return false;
    const strId = String(item.id);
    if (seenIds.has(strId)) return false;
    seenIds.add(strId);
    return true;
  });

  const overlapping: OverlappingSettlementRecord[] = [];

  for (const s of uniqueSettlements) {
    const rawStart = s.start_date || s.startDate;
    const rawEnd = s.end_date || s.endDate;
    if (!rawStart || !rawEnd) continue;

    const sStart = rawStart.split('T')[0].trim();
    const sEnd = rawEnd.split('T')[0].trim();

    // Overlap condition: selStart <= sEnd && sStart <= selEnd
    if (selStart <= sEnd && sStart <= selEnd) {
      const overlapStart = selStart > sStart ? selStart : sStart;
      const overlapEnd = selEnd < sEnd ? selEnd : sEnd;
      const overlapPeriodFormatted = formatShortPeriod(overlapStart, overlapEnd);
      const settledDate = formatSettledDate(s.created_at || s.createdAt);

      overlapping.push({
        id: s.id,
        startDate: sStart,
        endDate: sEnd,
        settledByName: s.settled_by_name || s.settledByName || 'Admin',
        settledDate,
        rawCreatedAt: s.created_at || s.createdAt || '',
        overlapStart,
        overlapEnd,
        overlapPeriodFormatted,
        totalDueAll: s.total_due_all || s.totalDueAll,
      });
    }
  }

  const primary = overlapping[0] || null;
  const warningMessage = primary
    ? `Part or all of this period (${primary.overlapPeriodFormatted}) was already settled on ${primary.settledDate} by ${primary.settledByName} (Settlement #${primary.id}). Settling again will deduct these amounts a second time.`
    : '';

  return {
    hasOverlap: overlapping.length > 0,
    overlappingSettlements: overlapping,
    primaryOverlap: primary,
    warningMessage,
  };
}

/**
 * Checks if a string is a valid YYYY-MM-DD date.
 */
export function isValidDateString(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dateObj = new Date(y, m - 1, d);
  return (
    dateObj.getFullYear() === y &&
    dateObj.getMonth() === m - 1 &&
    dateObj.getDate() === d
  );
}
