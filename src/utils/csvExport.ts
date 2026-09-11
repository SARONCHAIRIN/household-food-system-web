import { DailyCostRecord, MealStatusRecord, ApiUser } from '../api/types';

/**
 * RFC 4180 compliant CSV cell value escaping
 */
export function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Downloads string content as a CSV file with UTF-8 BOM
 */
export function downloadCsvBlob(filename: string, csvContent: string): void {
  // UTF-8 BOM (\uFEFF) ensures Excel, Numbers, and Google Sheets display Unicode and Khmer characters correctly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formats ISO date or string to YYYY-MM-DD
 */
function cleanDate(dateStr?: string): string {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
}

/**
 * Export Expense History to CSV
 */
export function exportExpensesToCsv(costs: DailyCostRecord[]): string {
  const headers = [
    'Record ID',
    'Date',
    'Food Price ($)',
    'Ingredient Price ($)',
    'Total Daily Cost ($)',
    'Eaters Count',
    'Total Household Members',
    'Food Cost Per Person ($)',
    'Ingredient Cost Per Person ($)',
    'Calculation Status',
    'Confirmed At',
    'Created At',
  ];

  const rows = costs.map((c) => {
    const food = Number(c.foodPrice ?? c.food_price ?? 0);
    const ingredient = Number(c.ingredientPrice ?? c.ingredient_price ?? 0);
    const total = food + ingredient;
    const eatCount = c.eatCount ?? c.eat_count ?? '';
    const totalMembers = c.totalMemberCount ?? c.total_member_count ?? '';

    return [
      escapeCsv(c.id),
      escapeCsv(cleanDate(c.date)),
      escapeCsv(food.toFixed(2)),
      escapeCsv(ingredient.toFixed(2)),
      escapeCsv(total.toFixed(2)),
      escapeCsv(eatCount),
      escapeCsv(totalMembers),
      escapeCsv(c.cost_food_per_person ?? ''),
      escapeCsv(c.cost_ingredient_per_person ?? ''),
      escapeCsv(c.calculation_status ?? 'CONFIRMED'),
      escapeCsv(c.confirmed_at ?? ''),
      escapeCsv(c.created_at ?? ''),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const today = new Date().toISOString().split('T')[0];
  downloadCsvBlob(`household_expenses_${today}.csv`, csvContent);
  return `household_expenses_${today}.csv`;
}

/**
 * Export Meal Attendance Records to CSV
 */
export function exportAttendanceToCsv(
  attendances: MealStatusRecord[],
  members: ApiUser[]
): string {
  const memberMap = new Map<string, ApiUser>();
  members.forEach((m) => {
    memberMap.set(String(m.id), m);
  });

  const headers = [
    'Record ID',
    'Date',
    'Member ID',
    'Member Name',
    'Username',
    'Email',
    'Member Role',
    'Meal Status',
    'Food Cost Allocated ($)',
    'Ingredient Cost Allocated ($)',
    'Total Cost Allocated ($)',
    'Confirmation Type',
    'Confirmed At',
    'Created At',
  ];

  const rows = attendances.map((a) => {
    const memId = String(a.member_id ?? a.memberId ?? '');
    const member = memberMap.get(memId);
    const memberName = member?.name || member?.username || `Member #${memId}`;
    const username = member?.username || '';
    const email = member?.email || '';
    const role = member?.role || 'MEMBER';

    return [
      escapeCsv(a.id),
      escapeCsv(cleanDate(a.date)),
      escapeCsv(memId),
      escapeCsv(memberName),
      escapeCsv(username),
      escapeCsv(email),
      escapeCsv(role),
      escapeCsv(a.status), // EAT or NOT_EAT
      escapeCsv(a.cost_food ?? '0.00'),
      escapeCsv(a.cost_ingredient ?? '0.00'),
      escapeCsv(a.cost_total ?? '0.00'),
      escapeCsv(a.confirmation_type ?? 'DAILY_CLOSURE'),
      escapeCsv(a.confirmed_at ?? ''),
      escapeCsv(a.created_at ?? ''),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const today = new Date().toISOString().split('T')[0];
  downloadCsvBlob(`household_meal_attendance_${today}.csv`, csvContent);
  return `household_meal_attendance_${today}.csv`;
}

/**
 * Export Combined Household Summary Report to CSV
 */
export function exportCombinedReportToCsv(
  costs: DailyCostRecord[],
  attendances: MealStatusRecord[],
  members: ApiUser[]
): string {
  const memberMap = new Map<string, ApiUser>();
  members.forEach((m) => {
    memberMap.set(String(m.id), m);
  });

  // Group attendances by date
  const attendancesByDate = new Map<string, MealStatusRecord[]>();
  attendances.forEach((a) => {
    const d = cleanDate(a.date);
    if (!attendancesByDate.has(d)) {
      attendancesByDate.set(d, []);
    }
    attendancesByDate.get(d)!.push(a);
  });

  const headers = [
    'Date',
    'Food Price ($)',
    'Ingredient Price ($)',
    'Total Day Cost ($)',
    'Total Diners Count',
    'Household Active Members',
    'Members Who Ate (Names)',
    'Members Who Skipped (Names)',
    'Cost Status',
  ];

  // Unique dates from costs and attendance
  const allDates = Array.from(
    new Set([...costs.map((c) => cleanDate(c.date)), ...Array.from(attendancesByDate.keys())])
  ).filter(Boolean).sort().reverse();

  const rows = allDates.map((dateStr) => {
    const cost = costs.find((c) => cleanDate(c.date) === dateStr);
    const dayAttendances = attendancesByDate.get(dateStr) || [];

    const food = Number(cost?.foodPrice ?? cost?.food_price ?? 0);
    const ingredient = Number(cost?.ingredientPrice ?? cost?.ingredient_price ?? 0);
    const total = food + ingredient;

    const eaters = dayAttendances
      .filter((a) => a.status === 'EAT')
      .map((a) => {
        const mem = memberMap.get(String(a.member_id ?? a.memberId));
        return mem ? mem.name || mem.username : `ID #${a.member_id ?? a.memberId}`;
      });

    const skippers = dayAttendances
      .filter((a) => a.status === 'NOT_EAT')
      .map((a) => {
        const mem = memberMap.get(String(a.member_id ?? a.memberId));
        return mem ? mem.name || mem.username : `ID #${a.member_id ?? a.memberId}`;
      });

    return [
      escapeCsv(dateStr),
      escapeCsv(food.toFixed(2)),
      escapeCsv(ingredient.toFixed(2)),
      escapeCsv(total.toFixed(2)),
      escapeCsv(eaters.length || (cost?.eatCount ?? cost?.eat_count ?? 0)),
      escapeCsv(members.length),
      escapeCsv(eaters.join('; ')),
      escapeCsv(skippers.join('; ')),
      escapeCsv(cost?.calculation_status ?? 'LOGGED'),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const today = new Date().toISOString().split('T')[0];
  downloadCsvBlob(`household_summary_report_${today}.csv`, csvContent);
  return `household_summary_report_${today}.csv`;
}
