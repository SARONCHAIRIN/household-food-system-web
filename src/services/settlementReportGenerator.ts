import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  MemberDueSummary,
  DepositBalanceResponse,
  ApiUser,
  TransactionRecord,
} from '../types/api';
import { parseCurrency } from './apiClient';

export interface MemberMealItem {
  date: string;
  status: string;
  foodCost: number;
  ingredientCost: number;
}

export interface MemberReportData {
  member: MemberDueSummary;
  user?: ApiUser;
  depositBalance: DepositBalanceResponse;
  meals: MemberMealItem[];
  poolSummary: {
    totalFoodPrice: number;
    totalIngredientPrice: number;
    totalPool: number;
    activeMembersCount: number;
    totalMembers: number;
  };
  period: {
    startDate: string;
    endDate: string;
  };
  generatedAt: string;
}

const DEFAULT_EXCHANGE_RATE = 4000;

export const formatDualCurrency = (
  amountVal: number | string,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE
): string => {
  const numericVal = typeof amountVal === 'number' ? amountVal : parseFloat(String(amountVal)) || 0;
  const khr = Math.round(numericVal);
  const usd = (khr / exchangeRate).toFixed(2);
  return `${khr.toLocaleString()} KHR ($${usd})`;
};

export interface CombinedReportData {
  period: {
    startDate: string;
    endDate: string;
  };
  poolSummary: {
    totalFoodPrice: number;
    totalIngredientPrice: number;
    totalPool: number;
    activeMembersCount: number;
    totalMembers: number;
  };
  memberSummaries: MemberDueSummary[];
  memberBalances: Record<string, number>;
  generatedAt: string;
}

const BRAND_PRIMARY: [number, number, number] = [0, 79, 53]; // #004f35
const BRAND_SECONDARY: [number, number, number] = [179, 44, 0]; // #b32c00
const TEXT_DARK: [number, number, number] = [17, 28, 45]; // #111c2d
const TEXT_MUTED: [number, number, number] = [100, 116, 139]; // #64748b
const BG_LIGHT: [number, number, number] = [248, 250, 252]; // #f8fafc

export function getPdfLabels(lang: 'en' | 'km' = 'en') {
  const isKm = lang === 'km';
  return {
    systemTitle: 'Household Food',
    systemSubtitle: isKm ? 'Shared Meal & Settlement System (Proponh Ahara & Tuotat)' : 'Shared Meal & Settlement System',
    reportPreviewBadge: isKm ? 'SETTLEMENT REPORT PREVIEW (ROBAYKARN)' : 'SETTLEMENT REPORT PREVIEW',
    preSettleEstimate: isKm ? 'PRE-SETTLE ESTIMATE (UNPAID)' : 'PRE-SETTLE ESTIMATE (UNPAID)',
    period: isKm ? 'Period' : 'Period',
    generated: isKm ? 'Generated' : 'Generated',
    memberDetails: isKm ? 'MEMBER DETAILS' : 'MEMBER DETAILS',
    poolContext: isKm ? 'HOUSEHOLD POOL CONTEXT' : 'HOUSEHOLD POOL CONTEXT',
    settlementReceipt: isKm ? 'SETTLEMENT RECEIPT (BONGKAN-DAI TUOTAT)' : 'SETTLEMENT RECEIPT',
    settlementReceiptMaster: isKm ? 'SETTLEMENT RECEIPT / MASTER' : 'SETTLEMENT RECEIPT (MASTER)',
    completedRecord: isKm ? 'Official Completed Transaction Record' : 'Official Completed Transaction Record',
    memberInfo: isKm ? 'MEMBER INFORMATION' : 'MEMBER INFORMATION',
    transactionAuth: isKm ? 'TRANSACTION AUTHENTICATION' : 'TRANSACTION AUTHENTICATION',
    settledBy: isKm ? 'Settled By' : 'Settled By',
    settledAt: isKm ? 'Settled At' : 'Settled At',
    referenceId: isKm ? 'Reference ID' : 'Reference ID',
    statusPaidInFull: isKm ? 'STATUS: PAID IN FULL (Settled)' : 'STATUS: PAID IN FULL',
    statusPartial: (owed: string) => isKm ? `STATUS: Partial / Insufficient Balance — Remaining: ${owed}` : `STATUS: Partial / Insufficient Balance — Remaining Owed: ${owed}`,
    breakdownTitle: isKm ? 'SETTLEMENT TRANSACTION BREAKDOWN' : 'SETTLEMENT TRANSACTION BREAKDOWN',
    officialRecordNotice: isKm ? 'OFFICIAL RECORD OF SETTLEMENT' : 'OFFICIAL RECORD OF SETTLEMENT',
    amountDue: isKm ? 'Amount Due' : 'Amount Due',
    depositBefore: isKm ? 'Deposit Before' : 'Deposit Before',
    amountDeducted: isKm ? 'Amount Deducted' : 'Amount Deducted',
    depositAfter: isKm ? 'Deposit After' : 'Deposit After',
    remainingOwed: isKm ? 'Remaining Owed' : 'Remaining Owed',
  };
}

/**
 * Builds a single PDF Settlement Statement for an individual household member.
 * Strictly uses real API data provided in MemberReportData.
 */
export function buildMemberSettlementPdf(data: MemberReportData, lang: 'en' | 'km' = 'en'): jsPDF {
  const labels = getPdfLabels(lang);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 16;

  // --- 1. HEADER & BRAND ---
  doc.setFillColor(...BRAND_PRIMARY);
  doc.rect(14, currentY, 12, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('HF', 20, currentY + 7.5, { align: 'center' });

  doc.setTextColor(...BRAND_PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(labels.systemTitle, 30, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(labels.systemSubtitle, 30, currentY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text(labels.reportPreviewBadge, pageWidth - 14, currentY + 4.5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...BRAND_SECONDARY);
  doc.text(labels.preSettleEstimate, pageWidth - 14, currentY + 8.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`${labels.period}: ${data.period.startDate} to ${data.period.endDate}`, pageWidth - 14, currentY + 12.5, { align: 'right' });
  doc.text(`${labels.generated}: ${data.generatedAt}`, pageWidth - 14, currentY + 16.5, { align: 'right' });

  currentY += 21;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 6;

  // --- 2. MEMBER INFO & HOUSEHOLD POOL SUMMARY ---
  const memberBoxX = 14;
  const memberBoxWidth = (pageWidth - 34) / 2;
  const poolBoxX = memberBoxX + memberBoxWidth + 6;

  doc.setFillColor(...BG_LIGHT);
  doc.roundedRect(memberBoxX, currentY, memberBoxWidth, 28, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text('MEMBER DETAILS', memberBoxX + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text(`Name: ${data.member.name}`, memberBoxX + 4, currentY + 12);
  doc.text(`Username: @${data.member.username} (ID #${data.member.memberId})`, memberBoxX + 4, currentY + 17);
  doc.text(`Role: ${data.user?.role || 'MEMBER'}  |  Status: ${data.member.status || 'ACTIVE'}`, memberBoxX + 4, currentY + 22);

  doc.setFillColor(...BG_LIGHT);
  doc.roundedRect(poolBoxX, currentY, memberBoxWidth, 28, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text('HOUSEHOLD POOL CONTEXT', poolBoxX + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text(`Total Food Cost: ${formatDualCurrency(data.poolSummary.totalFoodPrice)}`, poolBoxX + 4, currentY + 12);
  doc.text(`Total Pantry Ingredients: ${formatDualCurrency(data.poolSummary.totalIngredientPrice)}`, poolBoxX + 4, currentY + 17);
  doc.text(`Total Shared Pool: ${formatDualCurrency(data.poolSummary.totalPool)} (${data.poolSummary.activeMembersCount} Active)`, poolBoxX + 4, currentY + 22);

  currentY += 34;

  // --- 3. TOTAL DUE BOX ---
  const totalDueVal = parseCurrency(data.member.totalDue);
  const foodCostVal = parseCurrency(data.member.foodCost);
  const ingredientCostVal = parseCurrency(data.member.ingredientCost);
  const currentDepositBal = parseCurrency(data.depositBalance.balance);

  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(14, currentY, pageWidth - 28, 22, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text('PAYMENT SUMMARY (FROM GET /bills/summary)', 20, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_DARK);
  doc.text(
    `Food Cost: ${formatDualCurrency(foodCostVal)}  +  Ingredient: ${formatDualCurrency(ingredientCostVal)}`,
    20,
    currentY + 14
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text(formatDualCurrency(totalDueVal), pageWidth - 20, currentY + 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`Current Deposit Wallet: ${formatDualCurrency(currentDepositBal)}`, pageWidth - 20, currentY + 17, { align: 'right' });

  currentY += 28;

  // --- 4. ITEMISED MEAL ATTENDANCE TABLE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text('ITEMIZED MEAL ATTENDANCE & SHARES', 14, currentY);
  currentY += 3;

  const mealRows = data.meals.map((m) => [
    m.date,
    m.status,
    m.foodCost > 0 ? formatDualCurrency(m.foodCost) : '0 ៛ ($0.00)',
    m.ingredientCost > 0 ? formatDualCurrency(m.ingredientCost) : '0 ៛ ($0.00)',
  ]);

  const totalDaysEaten = data.meals.filter((m) => m.status === 'EAT').length;
  const sumFood = data.meals.reduce((acc, m) => acc + m.foodCost, 0);
  const sumIngr = data.meals.reduce((acc, m) => acc + m.ingredientCost, 0);

  autoTable(doc, {
    startY: currentY,
    head: [['Date', 'Attendance Status', 'Food Share', 'Ingredient Share']],
    body: mealRows.length > 0 ? mealRows : [['No meal records in this period', '-', '-', '-']],
    foot: [
      [
        `Total Days Eaten: ${totalDaysEaten}`,
        '',
        formatDualCurrency(sumFood > 0 ? sumFood : foodCostVal),
        formatDualCurrency(sumIngr > 0 ? sumIngr : ingredientCostVal),
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    footStyles: {
      fillColor: BG_LIGHT,
      textColor: BRAND_PRIMARY,
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: TEXT_DARK,
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (hookData) => {
      currentY = hookData.cursor?.y ? hookData.cursor.y + 8 : currentY + 30;
    },
  });

  const lastTableY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
  if (lastTableY) {
    currentY = lastTableY + 8;
  }

  // --- 5. DEPOSIT WALLET TRANSACTION HISTORY ---
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text('DEPOSIT WALLET & RECENT ACTIVITY', 14, currentY);
  currentY += 3;

  const historyItems: TransactionRecord[] =
    data.depositBalance.history || data.depositBalance.transactions || [];

  const relevantTxns = historyItems.filter((tx) => {
    const dStr = tx.created_at || tx.createdAt;
    if (!dStr) return true;
    const date = dStr.split('T')[0];
    return date >= data.period.startDate && date <= data.period.endDate;
  });

  const txnsToDisplay = relevantTxns.length > 0 ? relevantTxns : historyItems.slice(0, 5);

  const txnRows = txnsToDisplay.map((tx) => {
    const amt = parseCurrency(tx.amount);
    const date = tx.created_at || tx.createdAt ? (tx.created_at || tx.createdAt)!.split('T')[0] : 'N/A';
    return [
      date,
      tx.type,
      formatDualCurrency(Math.abs(amt)),
      tx.note || (tx.type === 'DEPOSIT' ? 'Prepaid Deposit' : 'Deduction'),
      tx.balance_after !== undefined ? formatDualCurrency(parseCurrency(tx.balance_after)) : '-',
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Date', 'Type', 'Amount', 'Note', 'Balance After']],
    body:
      txnRows.length > 0
        ? txnRows
        : [['No transaction records in period', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: TEXT_DARK,
    },
    margin: { left: 14, right: 14 },
  });

  const lastTxTableY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
  if (lastTxTableY) {
    currentY = lastTxTableY + 8;
  }

  // --- 6. PAYMENT INSTRUCTIONS FOOTER ---
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }

  const deadlineDate = new Date(data.period.endDate);
  deadlineDate.setDate(deadlineDate.getDate() + 5);
  const deadlineStr = deadlineDate.toISOString().split('T')[0];

  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(14, currentY, pageWidth - 28, 26, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...BRAND_SECONDARY);
  doc.text('PAYMENT INSTRUCTIONS & NOTICES', 20, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_DARK);
  doc.text(
    `• Please ensure an active balance of at least ${formatDualCurrency(totalDueVal)} by ${deadlineStr}.`,
    20,
    currentY + 12
  );
  doc.text(
    '• Payment method: ABA Bank / Bakong transfer or Cash to Household Food Administrator.',
    20,
    currentY + 17
  );
  doc.text(
    '• Upon settlement, the required amount will be deducted directly from your deposit balance.',
    20,
    currentY + 22
  );

  const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(
      `Household Food Settlement Statement • Page ${i} of ${pageCount} • Real API Data`,
      pageWidth / 2,
      290,
      { align: 'center' }
    );
  }

  return doc;
}

/**
 * Builds a combined Household Summary PDF covering all active residents.
 */
export function buildCombinedHouseholdPdf(data: CombinedReportData, lang: 'en' | 'km' = 'en'): jsPDF {
  const labels = getPdfLabels(lang);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 16;

  doc.setFillColor(...BRAND_PRIMARY);
  doc.rect(14, currentY, 12, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('HF', 20, currentY + 7.5, { align: 'center' });

  doc.setTextColor(...BRAND_PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(labels.systemTitle, 30, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(labels.systemSubtitle, 30, currentY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text(labels.reportPreviewBadge, pageWidth - 14, currentY + 4.5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...BRAND_SECONDARY);
  doc.text('PRE-SETTLE ESTIMATE (UNPAID)', pageWidth - 14, currentY + 8.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`Period: ${data.period.startDate} to ${data.period.endDate}`, pageWidth - 14, currentY + 12.5, { align: 'right' });
  doc.text(`Generated: ${data.generatedAt}`, pageWidth - 14, currentY + 16.5, { align: 'right' });

  currentY += 21;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 6;

  const colWidth = (pageWidth - 28 - 8) / 3;

  doc.setFillColor(...BG_LIGHT);
  doc.roundedRect(14, currentY, colWidth, 22, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text('FOOD EXPENSES', 18, currentY + 6);
  doc.setFontSize(10);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text(formatDualCurrency(data.poolSummary.totalFoodPrice), 18, currentY + 15);

  doc.setFillColor(...BG_LIGHT);
  doc.roundedRect(14 + colWidth + 4, currentY, colWidth, 22, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text('PANTRY INGREDIENTS', 18 + colWidth + 4, currentY + 6);
  doc.setFontSize(10);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text(formatDualCurrency(data.poolSummary.totalIngredientPrice), 18 + colWidth + 4, currentY + 15);

  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14 + (colWidth + 4) * 2, currentY, colWidth, 22, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text('TOTAL POOL DUE', 18 + (colWidth + 4) * 2, currentY + 6);
  doc.setFontSize(10);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text(formatDualCurrency(data.poolSummary.totalPool), 18 + (colWidth + 4) * 2, currentY + 15);

  currentY += 28;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text('PER-MEMBER SETTLEMENT SUMMARY (FROM GET /bills/summary)', 14, currentY);
  currentY += 3;

  const rows = data.memberSummaries.map((m) => {
    const bal = data.memberBalances[String(m.memberId)] ?? 0;
    const due = parseCurrency(m.totalDue);
    const food = parseCurrency(m.foodCost);
    const ingr = parseCurrency(m.ingredientCost);

    return [
      `#${m.memberId}`,
      m.name,
      `@${m.username}`,
      String(m.daysEaten),
      formatDualCurrency(food),
      formatDualCurrency(ingr),
      formatDualCurrency(due),
      formatDualCurrency(bal),
      bal >= due ? 'Covered' : 'Needs Top-up',
    ];
  });

  const totalDueSum = data.memberSummaries.reduce(
    (acc, m) => acc + parseCurrency(m.totalDue),
    0
  );

  autoTable(doc, {
    startY: currentY,
    head: [
      ['ID', 'Name', 'Username', 'Days', 'Food', 'Ingr', 'Total Due', 'Current Bal', 'Status'],
    ],
    body: rows,
    foot: [
      [
        'Totals',
        `${data.memberSummaries.length} members`,
        '',
        '',
        formatDualCurrency(data.poolSummary.totalFoodPrice),
        formatDualCurrency(data.poolSummary.totalIngredientPrice),
        formatDualCurrency(totalDueSum),
        '',
        '',
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    footStyles: {
      fillColor: BG_LIGHT,
      textColor: BRAND_PRIMARY,
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: TEXT_DARK,
    },
    margin: { left: 14, right: 14 },
  });

  const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(
      `Household Master Settlement Summary • Page ${i} of ${pageCount} • Real API Data`,
      pageWidth / 2,
      290,
      { align: 'center' }
    );
  }

  return doc;
}

export function downloadPdf(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

export function printPdf(doc: jsPDF): void {
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = blobUrl;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    setTimeout(() => {
      iframe.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(blobUrl);
      }, 2000);
    }, 100);
  };
}

export async function sharePdf(doc: jsPDF, filename: string, title: string): Promise<boolean> {
  const blob = doc.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title,
        text: `Settlement Statement for ${title}`,
        files: [file],
      });
      return true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        downloadPdf(doc, filename);
      }
      return false;
    }
  } else {
    downloadPdf(doc, filename);
    return false;
  }
}

export interface PostSettlementMemberResult {
  userId: string | number;
  name: string;
  username?: string;
  totalDue: number;
  previousDepositBalance: number;
  deductedAmount: number;
  depositAfter: number;
  remainingOwed: number;
  settlementStatus: string;
  statusLabel: string;
  isPaidInFull: boolean;
}

export interface PostSettlementReceiptData {
  receiptId: string | number;
  period: {
    startDate: string;
    endDate: string;
  };
  settledByName: string;
  settledAt: string;
  members: PostSettlementMemberResult[];
  summary: {
    totalDueAll: number;
    totalDeductedAll: number;
    totalRemainingOwedAll: number;
    fullyPaidCount: number;
    partialCount: number;
    totalMembers: number;
  };
}

export function createMemberReceiptItem(raw: {
  userId: string | number;
  name: string;
  username?: string;
  totalDue: number | string;
  previousDepositBalance: number | string;
  deductedAmount: number | string;
  settlementStatus?: string;
}): PostSettlementMemberResult {
  const totalDue = parseCurrency(raw.totalDue);
  const previousDepositBalance = parseCurrency(raw.previousDepositBalance);
  const deductedAmount = parseCurrency(raw.deductedAmount);

  const depositAfter = Math.round((previousDepositBalance - deductedAmount) * 100) / 100;
  const remainingOwed = Math.max(0, Math.round((totalDue - deductedAmount) * 100) / 100);

  const rawStatus = String(raw.settlementStatus || '').toUpperCase();
  const isPaidInFull =
    rawStatus === 'SUCCESSFULLY_DEDUCTED' ||
    rawStatus === 'PAID_IN_FULL' ||
    remainingOwed <= 0.001;

  const statusLabel = isPaidInFull
    ? 'Paid in Full'
    : `Partial / Insufficient Balance — Remaining Owed: ${formatDualCurrency(remainingOwed)}`;

  return {
    userId: raw.userId,
    name: raw.name,
    username: raw.username,
    totalDue,
    previousDepositBalance,
    deductedAmount,
    depositAfter,
    remainingOwed,
    settlementStatus: raw.settlementStatus || (isPaidInFull ? 'SUCCESSFULLY_DEDUCTED' : 'INSUFFICIENT_DEPOSIT_PARTIAL_OR_DEBT'),
    statusLabel,
    isPaidInFull,
  };
}

/**
 * Builds a single-member official Settlement Receipt PDF.
 */
export function buildMemberSettlementReceiptPdf(
  receiptData: PostSettlementReceiptData,
  member: PostSettlementMemberResult,
  lang: 'en' | 'km' = 'en'
): jsPDF {
  const labels = getPdfLabels(lang);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 16;

  doc.setFillColor(...BRAND_PRIMARY);
  doc.rect(14, currentY, 12, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('HF', 20, currentY + 7.5, { align: 'center' });

  doc.setTextColor(...BRAND_PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(labels.systemTitle, 30, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(labels.completedRecord, 30, currentY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text(labels.settlementReceipt, pageWidth - 14, currentY + 5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND_SECONDARY);
  doc.text(`Permanent Record Ref: #${receiptData.receiptId}`, pageWidth - 14, currentY + 10, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`Period: ${receiptData.period.startDate} to ${receiptData.period.endDate}`, pageWidth - 14, currentY + 14.5, { align: 'right' });

  currentY += 21;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 6;

  const boxWidth = (pageWidth - 34) / 2;
  const leftX = 14;
  const rightX = leftX + boxWidth + 6;

  doc.setFillColor(...BG_LIGHT);
  doc.roundedRect(leftX, currentY, boxWidth, 26, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text('MEMBER INFORMATION', leftX + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text(`Member Name: ${member.name}`, leftX + 4, currentY + 12);
  doc.text(`User ID: #${member.userId}${member.username ? ` (@${member.username})` : ''}`, leftX + 4, currentY + 17);
  doc.text('Account Type: Resident Member Wallet', leftX + 4, currentY + 22);

  doc.setFillColor(...BG_LIGHT);
  doc.roundedRect(rightX, currentY, boxWidth, 26, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text('TRANSACTION AUTHENTICATION', rightX + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text(`Settled By: ${receiptData.settledByName}`, rightX + 4, currentY + 12);
  doc.text(`Settled At: ${receiptData.settledAt}`, rightX + 4, currentY + 17);
  doc.text(`Reference ID: Settlement #${receiptData.receiptId}`, rightX + 4, currentY + 22);

  currentY += 32;

  if (member.isPaidInFull) {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(14, currentY, pageWidth - 28, 16, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(22, 101, 52);
    doc.text('STATUS: PAID IN FULL', 20, currentY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(21, 128, 61);
    doc.text(
      'All meal and pantry shares have been successfully deducted from your prepaid deposit wallet.',
      20,
      currentY + 12
    );
  } else {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(14, currentY, pageWidth - 28, 18, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(185, 28, 28);
    doc.text(
      `STATUS: Partial / Insufficient Balance — Remaining Owed: ${formatDualCurrency(member.remainingOwed)}`,
      20,
      currentY + 7
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(153, 27, 27);
    doc.text(
      `Only ${formatDualCurrency(member.deductedAmount)} could be deducted. Please top up ${formatDualCurrency(member.remainingOwed)} to clear your outstanding balance.`,
      20,
      currentY + 13
    );
  }

  currentY += 23;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text('SETTLEMENT TRANSACTION BREAKDOWN', 14, currentY);
  currentY += 4;

  const ledgerRows = [
    [
      'Amount Due',
      formatDualCurrency(member.totalDue),
      'Authoritative calculated charge at settlement time',
    ],
    [
      'Deposit Before',
      formatDualCurrency(member.previousDepositBalance),
      'Member prepaid deposit wallet balance prior to settlement',
    ],
    [
      'Amount Deducted',
      `-${formatDualCurrency(member.deductedAmount)}`,
      'Amount debited from wallet during this settlement run',
    ],
    [
      'Deposit After',
      formatDualCurrency(member.depositAfter),
      'Directly computed remaining wallet balance (Before - Deducted)',
    ],
    [
      'Remaining Owed',
      member.remainingOwed > 0 ? formatDualCurrency(member.remainingOwed) : '0 ៛ ($0.00)',
      member.remainingOwed > 0
        ? 'Outstanding balance due immediately to household administrator'
        : 'Zero balance owed — fully settled',
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Item / Ledger Field', 'Amount (KHR & USD)', 'Description & Verification']],
    body: ledgerRows,
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: TEXT_DARK,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45 },
      1: { fontStyle: 'bold', halign: 'right', cellWidth: 45 },
      2: { textColor: TEXT_MUTED },
    },
    margin: { left: 14, right: 14 },
    didParseCell: (hookData) => {
      if (hookData.section === 'body') {
        if (hookData.row.index === 0 && hookData.column.index === 1) {
          hookData.cell.styles.textColor = BRAND_PRIMARY;
        }
        if (hookData.row.index === 2 && hookData.column.index === 1) {
          hookData.cell.styles.textColor = [185, 28, 28];
        }
        if (hookData.row.index === 3 && hookData.column.index === 1) {
          hookData.cell.styles.textColor = member.depositAfter < 0 ? [185, 28, 28] : [22, 101, 52];
        }
        if (hookData.row.index === 4 && hookData.column.index === 1) {
          hookData.cell.styles.textColor = member.remainingOwed > 0 ? [185, 28, 28] : [22, 101, 52];
        }
      }
    },
  });

  const lastTableY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
  if (lastTableY) {
    currentY = lastTableY + 10;
  }

  doc.setFillColor(...BG_LIGHT);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, currentY, pageWidth - 28, 26, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text('OFFICIAL RECORD OF SETTLEMENT', 20, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_DARK);
  doc.text(
    `• This document is an official Settlement Receipt generated from the actual response of POST /bills/settle.`,
    20,
    currentY + 12
  );
  doc.text(
    `• It reflects the frozen transaction data recorded at settlement time (Reference #${receiptData.receiptId}), distinguishing it from an unpaid estimate.`,
    20,
    currentY + 17
  );
  doc.text(
    `• Questions or deposit top-ups should be directed to the administrator: ${receiptData.settledByName}.`,
    20,
    currentY + 22
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(
    `Settlement Receipt • Record #${receiptData.receiptId} • Member: ${member.name} • Completed Transaction`,
    pageWidth / 2,
    290,
    { align: 'center' }
  );

  return doc;
}

/**
 * Builds a master Household Settlement Receipt PDF covering all members from POST /bills/settle response.
 */
export function buildMasterSettlementReceiptPdf(receiptData: PostSettlementReceiptData, lang: 'en' | 'km' = 'en'): jsPDF {
  const labels = getPdfLabels(lang);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 16;

  doc.setFillColor(...BRAND_PRIMARY);
  doc.rect(14, currentY, 12, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('HF', 20, currentY + 7.5, { align: 'center' });

  doc.setTextColor(...BRAND_PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(labels.systemTitle, 30, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(labels.completedRecord, 30, currentY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text(labels.settlementReceiptMaster, pageWidth - 14, currentY + 5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND_SECONDARY);
  doc.text(`Record Ref: #${receiptData.receiptId}`, pageWidth - 14, currentY + 10, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`Period: ${receiptData.period.startDate} to ${receiptData.period.endDate}`, pageWidth - 14, currentY + 14.5, { align: 'right' });

  currentY += 21;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 6;

  doc.setFillColor(...BG_LIGHT);
  doc.roundedRect(14, currentY, pageWidth - 28, 14, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text(
    `Settled By: ${receiptData.settledByName}  |  Settled At: ${receiptData.settledAt}  |  Settlement Reference: #${receiptData.receiptId}`,
    20,
    currentY + 9
  );
  currentY += 18;

  const colWidth = (pageWidth - 28 - 8) / 3;

  doc.setFillColor(...BG_LIGHT);
  doc.roundedRect(14, currentY, colWidth, 22, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text('TOTAL AMOUNT DUE', 18, currentY + 6);
  doc.setFontSize(10);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text(formatDualCurrency(receiptData.summary.totalDueAll), 18, currentY + 15);

  doc.setFillColor(...BG_LIGHT);
  doc.roundedRect(14 + colWidth + 4, currentY, colWidth, 22, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text('TOTAL AMOUNT DEDUCTED', 18 + colWidth + 4, currentY + 6);
  doc.setFontSize(10);
  doc.setTextColor(22, 101, 52);
  doc.text(formatDualCurrency(receiptData.summary.totalDeductedAll), 18 + colWidth + 4, currentY + 15);

  if (receiptData.summary.totalRemainingOwedAll > 0) {
    doc.setFillColor(254, 242, 242);
  } else {
    doc.setFillColor(240, 253, 244);
  }
  doc.roundedRect(14 + (colWidth + 4) * 2, currentY, colWidth, 22, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text('TOTAL REMAINING OWED', 18 + (colWidth + 4) * 2, currentY + 6);
  doc.setFontSize(10);
  if (receiptData.summary.totalRemainingOwedAll > 0) {
    doc.setTextColor(185, 28, 28);
  } else {
    doc.setTextColor(22, 101, 52);
  }
  doc.text(formatDualCurrency(receiptData.summary.totalRemainingOwedAll), 18 + (colWidth + 4) * 2, currentY + 15);

  currentY += 28;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text('PER-MEMBER SETTLEMENT EXECUTION LEDGER', 14, currentY);
  currentY += 3;

  const rows = receiptData.members.map((m) => [
    `#${m.userId}`,
    m.name,
    formatDualCurrency(m.totalDue),
    formatDualCurrency(m.previousDepositBalance),
    formatDualCurrency(m.deductedAmount),
    formatDualCurrency(m.depositAfter),
    m.isPaidInFull ? 'Paid in Full' : `Partial (Owed: ${formatDualCurrency(m.remainingOwed)})`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [
      ['UID', 'Name', 'Amount Due', 'Deposit Before', 'Deducted', 'Deposit After', 'Settlement Status'],
    ],
    body: rows,
    foot: [
      [
        'Totals',
        `${receiptData.members.length} members`,
        formatDualCurrency(receiptData.summary.totalDueAll),
        '-',
        formatDualCurrency(receiptData.summary.totalDeductedAll),
        '-',
        receiptData.summary.totalRemainingOwedAll > 0
          ? `Owed: ${formatDualCurrency(receiptData.summary.totalRemainingOwedAll)}`
          : 'All Settled',
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    footStyles: {
      fillColor: BG_LIGHT,
      textColor: BRAND_PRIMARY,
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: TEXT_DARK,
    },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 6) {
        const row = receiptData.members[hookData.row.index];
        if (row && !row.isPaidInFull) {
          hookData.cell.styles.textColor = [185, 28, 28];
          hookData.cell.styles.fontStyle = 'bold';
        } else {
          hookData.cell.styles.textColor = [22, 101, 52];
        }
      }
    },
  });

  const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(
      `Master Settlement Receipt • Ref #${receiptData.receiptId} • Page ${i} of ${pageCount} • Completed Transaction`,
      pageWidth / 2,
      290,
      { align: 'center' }
    );
  }

  return doc;
}