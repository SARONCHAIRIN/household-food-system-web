export type Language = 'en' | 'km';

export interface TranslationDictionary {
  // Flat ARB-style keys
  dashboard_addExpense: string;
  bills_settleDeduct: string;
  profile_markActive: string;
  profile_markInactive: string;

  // Common
  appName: string;
  appSubname: string;
  activeTag: string;
  active: string;
  inactive: string;
  away: string;
  admin: string;
  member: string;
  you: string;
  date: string;
  today: string;
  close: string;
  cancel: string;
  confirm: string;
  save: string;
  loading: string;
  export: string;
  actions: string;
  status: string;
  total: string;
  filter: string;
  search: string;
  balance: string;
  amount: string;
  paidInFull: string;
  partialBalance: string;
  covered: string;
  needsTopup: string;
  alreadySettled: string;
  alreadySettledBadge: string;
  eating: string;
  skipping: string;
  records: string;
  currencyUSD: string;

  // Nav
  navDashboard: string;
  navMeals: string;
  navDeposits: string;
  navBills: string;
  navProfile: string;

  // Auth
  signIn: string;
  register: string;
  usernameLabel: string;
  usernamePlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  signInButton: string;
  createAccountButton: string;
  newResident: string;
  alreadyRegistered: string;
  apiError: string;
  enterUsernamePassword: string;
  fillAllFields: string;
  invalidCredentials: string;
  registrationFailed: string;
  liveApiAuth: string;
  logout: string;

  // Dashboard
  greeting: string;
  activeHouseholdMembers: string;
  registered: string;
  liveFoodPoolTotal: string;
  liveFoodPoolTotalKh: string;
  currentCycle: string;
  foodPrep: string;
  foodPrepTotal: string;
  pantryGroceries: string;
  ingredientPantry: string;
  addExpense: string;
  tonightsDinner: string;
  tonightsDinnerKh: string;
  eatTonight: string;
  eatTonightKh: string;
  skipMeal: string;
  skipMealKh: string;
  confirmedDining: string;
  householdMembers: string;
  manage: string;
  activate: string;
  deactivate: string;
  recentDailyCosts: string;
  addCost: string;
  noDailyCosts: string;
  exportData: string;
  cyclesCount: string;
  usdDue: string;
  aggregatedFromApi: string;
  percentOfPool: string;
  costLogged: string;
  noCostLoggedToday: string;
  duplicateCostWarning: string;
  confirmDuplicateCost: string;

  // Meals
  mealAttendance: string;
  mealAttendanceKh: string;
  mealsSubtitle: string;
  selectMealDate: string;
  todaysDinnerPool: string;
  dinersConfirmed: string;
  costPerDiner: string;
  perDiner: string;
  noCost: string;
  attendanceRecords: string;
  attendanceLedger: string;
  liveEntriesFromApi: string;
  noAttendanceRecords: string;
  logAttendanceHint: string;
  all: string;
  eaten: string;
  skipped: string;
  daysPoolCost: string;

  // Deposits
  prepaidVault: string;
  prepaidVaultKh: string;
  prepaidDeposits: string;
  prepaidDepositsKh: string;
  depositsSubtitle: string;
  singleMember: string;
  allMembers: string;
  availableBalance: string;
  walletBalance: string;
  activePrepaidBalanceDesc: string;
  creditMemberDeposit: string;
  selectResidentMember: string;
  depositAmountUsd: string;
  auditNoteOptional: string;
  creditDepositToMember: string;
  executingCreditDeposit: string;
  transactionHistory: string;
  allHouseholdDeposits: string;
  totalMembers: string;
  totalBalance: string;
  zeroBalanceMembers: string;
  searchMembersPlaceholder: string;
  balanceHeader: string;
  transactionsHeader: string;
  statusHeader: string;
  memberHeader: string;
  actionHeader: string;
  inspect: string;
  surplus: string;
  deficit: string;
  myDepositActivity: string;
  noTransactionsReturned: string;
  depositCredit: string;
  cycleSettlement: string;

  // Bills
  billingSettlement: string;
  billingSettlementKh: string;
  billsSubtitle: string;
  settlementCycleRange: string;
  thisMonth: string;
  lastMonth: string;
  last14Days: string;
  last7Days: string;
  customRange: string;
  startDate: string;
  endDate: string;
  activeResidents: string;
  periodCostRecalculated: string;
  periodCostSubtitle: string;
  previewSettlementReport: string;
  generateSettlementReport: string;
  saveSettlementReport: string;
  settleDeductDeposits: string;
  settleDeductBalances: string;
  previousSettlementOverlapDetected: string;
  overlapWarningExplanation: string;
  understandDoubleCharge: string;
  perMemberCostBreakdown: string;
  sumOfMemberCosts: string;
  lastSettlementRecord: string;
  settledBy: string;
  settlementPeriod: string;
  totalDueAll: string;
  foodIngredients: string;
  deductionResults: string;
  settlementReceipt: string;
  settlementReceiptReady: string;
  receiptIdRef: string;
  authoritative: string;
  officialRecord: string;
  amountDue: string;
  depositBefore: string;
  amountDeducted: string;
  depositAfter: string;
  remainingOwed: string;
  paidInFullStatus: string;
  partialStatus: string;
  compilingStatements: string;
  executingSettlement: string;

  // Profile
  accountProfile: string;
  accountProfileKh: string;
  profileSubtitle: string;
  authenticatedJwt: string;
  jwtAuthenticated: string;
  memberId: string;
  statusLabel: string;
  residentDiningStatus: string;
  diningStatusDesc: string;
  activeResident: string;
  inactiveResident: string;
  statusManagedByAdmin: string;
  statusManagedByAdminDesc: string;
  markAsActive: string;
  markAsAway: string;
  pauseDining: string;
  resumeDining: string;
  statusUpdatedActive: string;
  statusUpdatedAway: string;
  userId: string;
  joinedDate: string;
  appPreferences: string;
  languageSetting: string;
  appearanceSetting: string;
  lightMode: string;
  darkMode: string;
  householdRosterManagement: string;
  registeredMembersCount: string;
  adminControls: string;
  readOnlyRoster: string;
  setStatus: string;

  // Dialogs
  confirmSettleTitle: string;
  confirmDuplicateSettleTitle: string;
  confirmSettleDesc: string;
  confirmSignOutTitle: string;
  confirmSignOutDesc: string;
  executeSettle: string;

  // Report & Receipt Modals
  downloadPdf: string;
  print: string;
  share: string;
  downloadAllReports: string;
  masterSummary: string;
  viewing: string;
  proceedToSettle: string;
  completedTransactionRecord: string;
  permanentRef: string;
  summaryOverview: string;
  totalPeriodCost: string;
  totalAmountDeducted: string;
  outstandingBalance: string;
  fullyPaidMembers: string;
  partialBalanceMembers: string;
  preSettleEstimateUnpaid: string;
  settlementReportPreview: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    // Flat ARB keys
    dashboard_addExpense: 'Add Expense',
    bills_settleDeduct: 'Settle & Deduct Deposits',
    profile_markActive: 'Mark Active',
    profile_markInactive: 'Mark Inactive',

    // Common
    appName: 'Household Food',
    appSubname: 'Apartment Shared Pantry & Meal Ledger',
    activeTag: 'Active',
    active: 'Active',
    inactive: 'Inactive',
    away: 'Away',
    admin: 'ADMIN',
    member: 'MEMBER',
    you: '(YOU)',
    date: 'Date',
    today: 'Today',
    close: 'Close',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    loading: 'Loading...',
    export: 'Export Data',
    actions: 'Actions',
    status: 'Status',
    total: 'Total',
    filter: 'Filter',
    search: 'Search',
    balance: 'Balance',
    amount: 'Amount',
    paidInFull: 'Paid in Full',
    partialBalance: 'Partial / Insufficient Balance',
    covered: 'Covered',
    needsTopup: 'Needs Top-up',
    alreadySettled: 'Already settled',
    alreadySettledBadge: 'Already settled',
    eating: 'Eating',
    skipping: 'Skipping',
    records: 'records',
    currencyUSD: 'USD DUE',

    // Nav
    navDashboard: 'Dashboard',
    navMeals: 'Meals',
    navDeposits: 'Deposits',
    navBills: 'Bills',
    navProfile: 'Profile',

    // Auth
    signIn: 'Sign In',
    register: 'Register',
    usernameLabel: 'Resident Username',
    usernamePlaceholder: 'Username',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Password',
    fullNameLabel: 'Full Name',
    fullNamePlaceholder: 'Full Name',
    emailLabel: 'Resident Email',
    emailPlaceholder: 'email@domain.com',
    signInButton: 'Sign In',
    createAccountButton: 'Create Account',
    newResident: 'New resident? Register an account',
    alreadyRegistered: 'Already registered? Sign in here',
    apiError: 'API Error',
    enterUsernamePassword: 'Please enter username and password',
    fillAllFields: 'Please fill in all required registration fields',
    invalidCredentials: 'Invalid credentials',
    registrationFailed: 'Registration failed',
    liveApiAuth: 'Live Backend API Authentication',
    logout: 'Sign Out',

    // Dashboard
    greeting: 'Hello',
    activeHouseholdMembers: 'active household members',
    registered: 'registered',
    liveFoodPoolTotal: 'LIVE FOOD POOL TOTAL',
    liveFoodPoolTotalKh: 'មូលនិធិអាហារសរុប',
    currentCycle: 'Current Cycle',
    foodPrep: 'Food Prep',
    foodPrepTotal: 'Food Prep Total',
    pantryGroceries: 'Pantry / Groceries',
    ingredientPantry: 'Ingredient / Pantry',
    addExpense: 'Add Expense',
    tonightsDinner: "TONIGHT'S DINNER",
    tonightsDinnerKh: 'អាហារពេលល្ងាច',
    eatTonight: 'EAT TONIGHT',
    eatTonightKh: 'ញ៉ាំល្ងាចនេះ',
    skipMeal: 'SKIP MEAL',
    skipMealKh: 'មិនញ៉ាំ',
    confirmedDining: 'confirmed dining',
    householdMembers: 'Household Members',
    manage: 'Manage',
    activate: 'Activate',
    deactivate: 'Deactivate',
    recentDailyCosts: 'Recent Daily Costs',
    addCost: 'Add Cost',
    noDailyCosts: 'No daily costs recorded yet.',
    exportData: 'Export Data',
    cyclesCount: 'Cycles',
    usdDue: 'USD DUE',
    aggregatedFromApi: 'Aggregated strictly from GET /daily-costs',
    percentOfPool: '% of pool',
    costLogged: 'Cost Logged',
    noCostLoggedToday: 'No cost logged for today yet',
    duplicateCostWarning: 'A cost entry already exists for this date. Saving will update the existing record.',
    confirmDuplicateCost: 'Confirm Expense Update',

    // Meals
    mealAttendance: 'Meal Attendance',
    mealAttendanceKh: 'កត់ត្រាវត្តមានអាហារ',
    mealsSubtitle: 'Live daily records & diner headcounts',
    selectMealDate: 'Select Meal Date',
    todaysDinnerPool: "Today's Dinner Pool",
    dinersConfirmed: 'Diners Confirmed',
    costPerDiner: 'Cost per Diner',
    perDiner: '/ DINER',
    noCost: 'No Cost',
    attendanceRecords: 'Attendance Records',
    attendanceLedger: 'Attendance Ledger',
    liveEntriesFromApi: 'Live entries from GET /meal-statuses',
    noAttendanceRecords: 'No attendance records submitted for this date yet.',
    logAttendanceHint: 'Use the buttons above to log meal attendance.',
    all: 'All',
    eaten: 'Eaten',
    skipped: 'Skipped',
    daysPoolCost: "Day's Pool Cost",

    // Deposits
    prepaidVault: 'Prepaid Deposits',
    prepaidVaultKh: 'ប្រាក់កក់ទុកមុន',
    prepaidDeposits: 'Prepaid Deposits',
    prepaidDepositsKh: 'ប្រាក់កក់ទុកមុន',
    depositsSubtitle: 'Live wallet ledger & member balances',
    singleMember: 'Single Member',
    allMembers: 'All Members',
    availableBalance: 'Available Balance',
    walletBalance: 'Active prepaid balance for food pool settlements',
    activePrepaidBalanceDesc: 'Active prepaid balance for food pool settlements',
    creditMemberDeposit: 'Credit Member Deposit',
    selectResidentMember: 'Select Resident Member',
    depositAmountUsd: 'Deposit Amount ($ USD)',
    auditNoteOptional: 'Audit Note (Optional)',
    creditDepositToMember: 'Credit Deposit to Member',
    executingCreditDeposit: 'Executing POST /admin/deposits...',
    transactionHistory: 'Transaction History',
    allHouseholdDeposits: 'All Household Deposits',
    totalMembers: 'Total Members',
    totalBalance: 'Total Balance',
    zeroBalanceMembers: 'Members with $0 Balance',
    searchMembersPlaceholder: 'Search members by name or @username...',
    balanceHeader: 'Balance',
    transactionsHeader: 'Transactions',
    statusHeader: 'Status',
    memberHeader: 'Member',
    actionHeader: 'Action',
    inspect: 'Inspect',
    surplus: 'Surplus',
    deficit: 'Deficit',
    myDepositActivity: 'My Deposit Activity',
    noTransactionsReturned: 'No transaction records returned for this account.',
    depositCredit: 'Deposit Credit',
    cycleSettlement: 'Cycle Settlement',

    // Bills
    billingSettlement: 'Billing & Settlement',
    billingSettlementKh: 'វិក្កយបត្រ & ការទូទាត់',
    billsSubtitle: 'Fair food pool cost sharing & deposit balance settlement',
    settlementCycleRange: 'Settlement Cycle Range',
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
    last14Days: 'Last 14 Days',
    last7Days: 'Last 7 Days',
    customRange: 'Custom Range',
    startDate: 'Start Date',
    endDate: 'End Date',
    activeResidents: 'Active Residents',
    periodCostRecalculated: 'Period Cost (recalculated)',
    periodCostSubtitle: 'Live estimate based on current cycle attendance and expenses',
    previewSettlementReport: 'Preview Settlement Statements (PDF)',
    generateSettlementReport: 'Generate Settlement Report (PDF)',
    saveSettlementReport: 'Save Settlement Report (PDF)',
    settleDeductDeposits: 'Settle & Deduct Deposits',
    settleDeductBalances: 'Settle & Deduct Balances',
    previousSettlementOverlapDetected: 'Previous Settlement Overlap Detected',
    overlapWarningExplanation: 'Part or all of this period ({startDate} – {endDate}) was already settled on {date} by {settledByName} (Settlement #{settlementId}). Settling again will deduct these amounts a second time.',
    understandDoubleCharge: 'I understand this may double-charge members',
    perMemberCostBreakdown: 'Per-Member Cost Breakdown',
    sumOfMemberCosts: 'Sum of {count} member period costs',
    lastSettlementRecord: 'Last Settlement Record',
    settledBy: 'Settled by {name}',
    settlementPeriod: 'Settlement Period',
    totalDueAll: 'Total Due All',
    foodIngredients: 'Food / Ingredients',
    deductionResults: 'Deduction Results',
    settlementReceipt: 'Settlement Receipt',
    settlementReceiptReady: 'Settlement Receipt Ready',
    receiptIdRef: 'Transaction Record • Permanent Ref #{id}',
    authoritative: 'Authoritative',
    officialRecord: 'OFFICIAL RECORD OF SETTLEMENT',
    amountDue: 'Amount Due',
    depositBefore: 'Deposit Before',
    amountDeducted: 'Amount Deducted',
    depositAfter: 'Deposit After',
    remainingOwed: 'Remaining Owed',
    paidInFullStatus: 'Paid in Full',
    partialStatus: 'Partial / Insufficient Balance',
    compilingStatements: 'Compiling Live Statements...',
    executingSettlement: 'Executing POST /bills/settle...',

    // Profile
    accountProfile: 'Account Profile',
    accountProfileKh: 'គណនីផ្ទាល់ខ្លួន',
    profileSubtitle: 'Household resident profile & application preferences',
    authenticatedJwt: 'Authenticated via JWT Bearer token',
    jwtAuthenticated: 'JWT Authenticated',
    memberId: 'Member ID',
    statusLabel: 'Status',
    residentDiningStatus: 'Resident Dining Status',
    diningStatusDesc: 'Controls meal participation in current pool',
    activeResident: 'Active Resident',
    inactiveResident: 'Inactive / Away',
    statusManagedByAdmin: 'Status managed by Admin',
    statusManagedByAdminDesc: 'Dining participation is managed by household administrators. Contact your admin to change your status.',
    markAsActive: 'Mark as Active',
    markAsAway: 'Mark as Away',
    pauseDining: 'Pause Dining',
    resumeDining: 'Resume Dining',
    statusUpdatedActive: 'Status updated to Active',
    statusUpdatedAway: 'Status updated to Away',
    userId: 'User ID',
    joinedDate: 'Joined Date',
    appPreferences: 'App Preferences',
    languageSetting: 'Language / ភាសា',
    appearanceSetting: 'Appearance',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    householdRosterManagement: 'Household Roster Management',
    registeredMembersCount: 'registered members from GET /members',
    adminControls: 'Admin Controls',
    readOnlyRoster: 'Read-only Roster',
    setStatus: 'Set',

    // Dialogs
    confirmSettleTitle: 'Confirm Cycle Settlement',
    confirmDuplicateSettleTitle: 'Confirm Duplicate Settlement',
    confirmSettleDesc: 'This action will deduct calculated balances from resident deposits.',
    confirmSignOutTitle: 'Confirm Sign Out',
    confirmSignOutDesc: 'Are you sure you want to sign out of this household session?',
    executeSettle: 'Confirm & Settle',

    // Report & Receipt Modals
    downloadPdf: 'Download PDF',
    print: 'Print',
    share: 'Share',
    downloadAllReports: 'Download All Reports',
    masterSummary: 'Master Summary',
    viewing: 'Viewing',
    proceedToSettle: 'Proceed to Settle & Deduct',
    completedTransactionRecord: 'Completed Transaction Record',
    permanentRef: 'Permanent Ref',
    summaryOverview: 'Summary Overview',
    totalPeriodCost: 'Total Period Cost',
    totalAmountDeducted: 'Total Amount Deducted',
    outstandingBalance: 'Outstanding Balance',
    fullyPaidMembers: 'Fully Paid Members',
    partialBalanceMembers: 'Partial / Insufficient Balance',
    preSettleEstimateUnpaid: 'Pre-Settle Estimate (Unpaid)',
    settlementReportPreview: 'Settlement Report Preview',
  },

  km: {
    // Flat ARB keys
    dashboard_addExpense: 'បន្ថែមចំណាយ',
    bills_settleDeduct: 'ទូទាត់ និងកាត់ប្រាក់កក់',
    profile_markActive: 'កំណត់ថា សកម្ម',
    profile_markInactive: 'កំណត់ថា អសកម្ម',

    // Common
    appName: 'ផ្ទះបាយរួម',
    appSubname: 'កត់ត្រាចំណាយ និងរបបអាហាររួម',
    activeTag: 'សកម្ម',
    active: 'សកម្ម',
    inactive: 'អសកម្ម',
    away: 'នៅក្រៅ',
    admin: 'អ្នកគ្រប់គ្រង',
    member: 'សមាជិក',
    you: '(អ្នក)',
    date: 'កាលបរិច្ឆេទ',
    today: 'ថ្ងៃនេះ',
    close: 'បិទ',
    cancel: 'បោះបង់',
    confirm: 'បញ្ជាក់',
    save: 'រក្សាទុក',
    loading: 'កំពុងដំណើរការ...',
    export: 'ទាញយកទិន្នន័យ',
    actions: 'សកម្មភាព',
    status: 'ស្ថានភាព',
    total: 'សរុប',
    filter: 'តម្រង',
    search: 'ស្វែងរក',
    balance: 'សមតុល្យ',
    amount: 'ចំនួនទឹកប្រាក់',
    paidInFull: 'បានទូទាត់ពេញលេញ',
    partialBalance: 'សមតុល្យមិនគ្រប់គ្រាន់ / ទូទាត់ផ្នែកខ្លះ',
    covered: 'គ្រប់គ្រាន់',
    needsTopup: 'ត្រូវការបញ្ចូលប្រាក់',
    alreadySettled: 'បានទូទាត់រួចហើយ',
    alreadySettledBadge: 'បានទូទាត់រួច',
    eating: 'ញ៉ាំ',
    skipping: 'មិនញ៉ាំ',
    records: 'កំណត់ត្រា',
    currencyUSD: 'ដុល្លារត្រូវបង់',

    // Nav
    navDashboard: 'ទំព័រដើម',
    navMeals: 'អាហារ',
    navDeposits: 'ប្រាក់កក់',
    navBills: 'វិក្កយបត្រ',
    navProfile: 'គណនី',

    // Auth
    signIn: 'ចូលគណនី',
    register: 'ចុះឈ្មោះ',
    usernameLabel: 'ឈ្មោះគណនីអ្នកស្នាក់នៅ',
    usernamePlaceholder: 'ឈ្មោះគណនី',
    passwordLabel: 'ពាក្យសម្ងាត់',
    passwordPlaceholder: 'ពាក្យសម្ងាត់',
    fullNameLabel: 'ឈ្មោះពេញ',
    fullNamePlaceholder: 'ឈ្មោះពេញ',
    emailLabel: 'អ៊ីមែលអ្នកស្នាក់នៅ',
    emailPlaceholder: 'email@domain.com',
    signInButton: 'ចូលគណនី',
    createAccountButton: 'បង្កើតគណនី',
    newResident: 'អ្នកស្នាក់នៅថ្មី? ចុះឈ្មោះគណនី',
    alreadyRegistered: 'មានគណនីរួចហើយ? ចូលគណនីទីនេះ',
    apiError: 'បញ្ហាប្រព័ន្ធ API',
    enterUsernamePassword: 'សូមបញ្ចូលឈ្មោះគណនី និងពាក្យសម្ងាត់',
    fillAllFields: 'សូមបំពេញព័ត៌មានចុះឈ្មោះចាំបាច់ទាំងអស់',
    invalidCredentials: 'ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ',
    registrationFailed: 'ការចុះឈ្មោះមិនជោគជ័យ',
    liveApiAuth: 'ការផ្ទៀងផ្ទាត់គណនី API ផ្ទាល់',
    logout: 'ចាកចេញពីគណនី',

    // Dashboard
    greeting: 'សួស្តី',
    activeHouseholdMembers: 'សមាជិកសកម្មក្នុងផ្ទះ',
    registered: 'បានចុះឈ្មោះ',
    liveFoodPoolTotal: 'មូលនិធិអាហារសរុប',
    liveFoodPoolTotalKh: 'មូលនិធិអាហារសរុប',
    currentCycle: 'វដ្តបច្ចុប្បន្ន',
    foodPrep: 'ថ្លៃធ្វើម្ហូប',
    foodPrepTotal: 'ថ្លៃធ្វើម្ហូបសរុប',
    pantryGroceries: 'គ្រឿងទេស / ទំនិញប្រើប្រាស់',
    ingredientPantry: 'គ្រឿងទេស / ទំនិញប្រើប្រាស់',
    addExpense: 'បន្ថែមចំណាយ',
    tonightsDinner: 'អាហារពេលល្ងាច',
    tonightsDinnerKh: 'អាហារពេលល្ងាច',
    eatTonight: 'ញ៉ាំល្ងាចនេះ',
    eatTonightKh: 'ញ៉ាំល្ងាចនេះ',
    skipMeal: 'មិនញ៉ាំ',
    skipMealKh: 'មិនញ៉ាំ',
    confirmedDining: 'បានបញ្ជាក់ការញ៉ាំ',
    householdMembers: 'សមាជិកក្នុងផ្ទះ',
    manage: 'គ្រប់គ្រង',
    activate: 'បើកដំណើរការ',
    deactivate: 'បិទដំណើរការ',
    recentDailyCosts: 'ចំណាយប្រចាំថ្ងៃថ្មីៗ',
    addCost: 'កត់ត្រាចំណាយ',
    noDailyCosts: 'មិនទាន់មានការកត់ត្រាចំណាយប្រចាំថ្ងៃនៅឡើយទេ។',
    exportData: 'ទាញយកទិន្នន័យ',
    cyclesCount: 'វដ្ត',
    usdDue: 'ដុល្លារត្រូវបង់',
    aggregatedFromApi: 'ទិន្នន័យជាក់ស្តែងពី GET /daily-costs',
    percentOfPool: '% នៃមូលនិធិ',
    costLogged: 'ចំណាយបានកត់ត្រា',
    noCostLoggedToday: 'មិនទាន់មានការកត់ត្រាចំណាយសម្រាប់ថ្ងៃនេះនៅឡើយទេ',
    duplicateCostWarning: 'បានកត់ត្រាចំណាយសម្រាប់កាលបរិច្ឆេទនេះរួចហើយ។ ការរក្សាទុកនឹងកែប្រែទិន្នន័យចាស់។',
    confirmDuplicateCost: 'បញ្ជាក់ការកែប្រែចំណាយ',

    // Meals
    mealAttendance: 'កត់ត្រាវត្តមានអាហារ',
    mealAttendanceKh: 'កត់ត្រាវត្តមានអាហារ',
    mealsSubtitle: 'កំណត់ត្រាប្រចាំថ្ងៃ និងចំនួនអ្នកញ៉ាំ',
    selectMealDate: 'ជ្រើសរើសកាលបរិច្ឆេទអាហារ',
    todaysDinnerPool: 'មូលនិធិអាហារថ្ងៃនេះ',
    dinersConfirmed: 'អ្នកញ៉ាំបានបញ្ជាក់',
    costPerDiner: 'ចំណាយក្នុងម្នាក់',
    perDiner: '/ ម្នាក់',
    noCost: 'គ្មានចំណាយ',
    attendanceRecords: 'កំណត់ត្រាវត្តមាន',
    attendanceLedger: 'បញ្ជីវត្តមានអាហារ',
    liveEntriesFromApi: 'ទិន្នន័យជាក់ស្តែងពី GET /meal-statuses',
    noAttendanceRecords: 'មិនទាន់មានកំណត់ត្រាវត្តមានសម្រាប់កាលបរិច្ឆេទនេះនៅឡើយទេ។',
    logAttendanceHint: 'ប្រើប៊ូតុងខាងលើដើម្បីកត់ត្រាវត្តមានអាហារ។',
    all: 'ទាំងអស់',
    eaten: 'បានញ៉ាំ',
    skipped: 'មិនញ៉ាំ',
    daysPoolCost: 'ចំណាយរួមប្រចាំថ្ងៃ',

    // Deposits
    prepaidVault: 'ប្រាក់កក់ទុកមុន',
    prepaidVaultKh: 'ប្រាក់កក់ទុកមុន',
    prepaidDeposits: 'ប្រាក់កក់ទុកមុន',
    prepaidDepositsKh: 'ប្រាក់កក់ទុកមុន',
    depositsSubtitle: 'សៀវភៅគណនី និងសមតុល្យសមាជិក',
    singleMember: 'សមាជិកទោល',
    allMembers: 'សមាជិកទាំងអស់',
    availableBalance: 'សមតុល្យដែលអាចប្រើបាន',
    walletBalance: 'សមតុល្យប្រាក់កក់សកម្មសម្រាប់ការទូទាត់ចំណាយអាហារ',
    activePrepaidBalanceDesc: 'សមតុល្យប្រាក់កក់សកម្មសម្រាប់ការទូទាត់ចំណាយអាហារ',
    creditMemberDeposit: 'បញ្ចូលប្រាក់កក់សមាជិក',
    selectResidentMember: 'ជ្រើសរើសសមាជិក',
    depositAmountUsd: 'ចំនួនប្រាក់កក់ ($ USD)',
    auditNoteOptional: 'កំណត់សម្គាល់ (ជម្រើស)',
    creditDepositToMember: 'បញ្ចូលប្រាក់កក់ជូនសមាជិក',
    executingCreditDeposit: 'កំពុងដំណើរការ POST /admin/deposits...',
    transactionHistory: 'ប្រវត្តិប្រតិបត្តិការ',
    allHouseholdDeposits: 'ប្រាក់កក់សមាជិកទាំងអស់ក្នុងផ្ទះ',
    totalMembers: 'សមាជិកសរុប',
    totalBalance: 'សមតុល្យសរុប',
    zeroBalanceMembers: 'សមាជិកមានសមតុល្យ $0',
    searchMembersPlaceholder: 'ស្វែងរកសមាជិកតាមឈ្មោះ ឬ @username...',
    balanceHeader: 'សមតុល្យ',
    transactionsHeader: 'ប្រតិបត្តិការ',
    statusHeader: 'ស្ថានភាព',
    memberHeader: 'សមាជិក',
    actionHeader: 'សកម្មភាព',
    inspect: 'ពិនិត្យមើល',
    surplus: 'លើស',
    deficit: 'ខ្វះ',
    myDepositActivity: 'សកម្មភាពប្រាក់កក់ផ្ទាល់ខ្លួន',
    noTransactionsReturned: 'គ្មានកំណត់ត្រាប្រតិបត្តិការសម្រាប់គណនីនេះទេ។',
    depositCredit: 'បញ្ចូលប្រាក់កក់',
    cycleSettlement: 'ការទូទាត់វដ្ត',

    // Bills
    billingSettlement: 'វិក្កយបត្រ & ការទូទាត់',
    billingSettlementKh: 'វិក្កយបត្រ & ការទូទាត់',
    billsSubtitle: 'ការបែងចែកចំណាយអាហាររួម និងទូទាត់កាត់ប្រាក់កក់',
    settlementCycleRange: 'ចន្លោះកាលបរិច្ឆេទការទូទាត់',
    thisMonth: 'ខែនេះ',
    lastMonth: 'ខែមុន',
    last14Days: '១៤ ថ្ងៃចុងក្រោយ',
    last7Days: '៧ ថ្ងៃចុងក្រោយ',
    customRange: 'ចន្លោះថ្ងៃផ្ទាល់ខ្លួន',
    startDate: 'កាលបរិច្ឆេទចាប់ផ្តើម',
    endDate: 'កាលបរិច្ឆេទបញ្ចប់',
    activeResidents: 'សមាជិកសកម្ម',
    periodCostRecalculated: 'ថ្លៃចំណាយប្រចាំវដ្ត (គណនាឡើងវិញ)',
    periodCostSubtitle: 'ការប៉ាន់ប្រមាណផ្ទាល់ផ្អែកលើវត្តមាន និងចំណាយបច្ចុប្បន្ន',
    previewSettlementReport: 'មើលរបាយការណ៍ទូទាត់ជាមុន (PDF)',
    generateSettlementReport: 'បង្កើតរបាយការណ៍ទូទាត់ (PDF)',
    saveSettlementReport: 'រក្សាទុករាយការណ៍ទូទាត់ (PDF)',
    settleDeductDeposits: 'ទូទាត់ និងកាត់ប្រាក់កក់',
    settleDeductBalances: 'ទូទាត់ និងកាត់ប្រាក់កក់',
    previousSettlementOverlapDetected: 'បានរកឃើញការត្រួតគ្នានឹងការទូទាត់មុន',
    overlapWarningExplanation: 'ផ្នែកខ្លះ ឬទាំងអស់នៃចន្លោះពេលនេះ ({startDate} – {endDate}) ត្រូវបានទូទាត់រួចហើយនៅថ្ងៃ {date} ដោយ {settledByName} (ការទូទាត់លេខ #{settlementId})។ ការទូទាត់ម្តងទៀតនឹងកាត់ប្រាក់ទាំងនេះជាលើកទីពីរ។',
    understandDoubleCharge: 'ខ្ញុំយល់ថាការធ្វើបែបនេះអាចកាត់ប្រាក់សមាជិកពីរដង',
    perMemberCostBreakdown: 'ការបំបែកថ្លៃចំណាយតាមសមាជិកម្នាក់ៗ',
    sumOfMemberCosts: 'ផលបូកចំណាយរបស់សមាជិកទាំង {count} នាក់',
    lastSettlementRecord: 'កំណត់ត្រាការទូទាត់ចុងក្រោយ',
    settledBy: 'បានទូទាត់ដោយ {name}',
    settlementPeriod: 'កាលបរិច្ឆេទនៃការទូទាត់',
    totalDueAll: 'សរុបត្រូវបង់ទាំងអស់',
    foodIngredients: 'ម្ហូបអាហារ / គ្រឿងទេស',
    deductionResults: 'លទ្ធផលនៃការកាត់ប្រាក់',
    settlementReceipt: 'បង្កាន់ដៃទូទាត់',
    settlementReceiptReady: 'បង្កាន់ដៃទូទាត់រួចរាល់',
    receiptIdRef: 'កំណត់ត្រាប្រតិបត្តិការ • លេខយោងអចិន្ត្រៃយ៍ #{id}',
    authoritative: 'ផ្លូវការ',
    officialRecord: 'កំណត់ត្រាផ្លូវការនៃការទូទាត់',
    amountDue: 'ចំនួនត្រូវបង់',
    depositBefore: 'ប្រាក់កក់មុនទូទាត់',
    amountDeducted: 'ចំនួនបានកាត់',
    depositAfter: 'ប្រាក់កក់នៅសល់',
    remainingOwed: 'ប្រាក់នៅជំពាក់',
    paidInFullStatus: 'បានទូទាត់ពេញលេញ',
    partialStatus: 'សមតុល្យមិនគ្រប់គ្រាន់ / ទូទាត់ផ្នែកខ្លះ',
    compilingStatements: 'កំពុងចងក្រងរបាយការណ៍ផ្ទាល់...',
    executingSettlement: 'កំពុងដំណើរការ POST /bills/settle...',

    // Profile
    accountProfile: 'គណនីផ្ទាល់ខ្លួន',
    accountProfileKh: 'គណនីផ្ទាល់ខ្លួន',
    profileSubtitle: 'ព័ត៌មានអ្នកស្នាក់នៅ និងការកំណត់កម្មវិធី',
    authenticatedJwt: 'បានផ្ទៀងផ្ទាត់តាមរយៈ JWT Bearer token',
    jwtAuthenticated: 'បានផ្ទៀងផ្ទាត់ JWT',
    memberId: 'លេខសម្គាល់គណនី',
    statusLabel: 'ស្ថានភាព',
    residentDiningStatus: 'ស្ថានភាពនៃការញ៉ាំអាហារ',
    diningStatusDesc: 'គ្រប់គ្រងការចូលរួមញ៉ាំអាហារក្នុងមូលនិធិបច្ចុប្បន្ន',
    activeResident: 'អ្នកស្នាក់នៅសកម្ម',
    inactiveResident: 'អសកម្ម / នៅក្រៅ',
    statusManagedByAdmin: 'ស្ថានភាពត្រូវបានគ្រប់គ្រងដោយអ្នកគ្រប់គ្រង',
    statusManagedByAdminDesc: 'ស្ថានភាពចូលរួមញ៉ាំអាហារត្រូវបានគ្រប់គ្រងដោយអ្នកគ្រប់គ្រងផ្ទះ។ សូមទាក់ទងអ្នកគ្រប់គ្រងដើម្បីផ្លាស់ប្តូរស្ថានភាព។',
    markAsActive: 'កំណត់ជាសកម្ម',
    markAsAway: 'កំណត់ថានៅក្រៅ',
    pauseDining: 'ផ្អាកការញ៉ាំអាហារ',
    resumeDining: 'បន្តការញ៉ាំអាហារ',
    statusUpdatedActive: 'ស្ថានភាពត្រូវបានកែប្រែទៅជាសកម្ម',
    statusUpdatedAway: 'ស្ថានភាពត្រូវបានកែប្រែទៅជានៅក្រៅ',
    userId: 'លេខសម្គាល់គណនី',
    joinedDate: 'កាលបរិច្ឆេទចូលរួម',
    appPreferences: 'ការកំណត់កម្មវិធី',
    languageSetting: 'ភាសា / Language',
    appearanceSetting: 'រូបរាង',
    lightMode: 'ទម្រង់ភ្លឺ',
    darkMode: 'ទម្រង់ងងឹត',
    householdRosterManagement: 'ការគ្រប់គ្រងបញ្ជីសមាជិកក្នុងផ្ទះ',
    registeredMembersCount: 'សមាជិកបានចុះឈ្មោះពី GET /members',
    adminControls: 'ការគ្រប់គ្រងរបស់អ្នកគ្រប់គ្រង',
    readOnlyRoster: 'មើលបញ្ជីសមាជិក',
    setStatus: 'កំណត់',

    // Dialogs
    confirmSettleTitle: 'បញ្ជាក់ការទូទាត់វដ្ត',
    confirmDuplicateSettleTitle: 'បញ្ជាក់ការទូទាត់ត្រួតគ្នា',
    confirmSettleDesc: 'សកម្មភាពនេះនឹងកាត់ប្រាក់កក់របស់សមាជិកតាមការគណនា។',
    confirmSignOutTitle: 'បញ្ជាក់ការចាកចេញ',
    confirmSignOutDesc: 'តើអ្នកពិតជាចង់ចាកចេញពីគណនីនេះមែនទេ?',
    executeSettle: 'បញ្ជាក់ និងទូទាត់',

    // Report & Receipt Modals
    downloadPdf: 'ទាញយក PDF',
    print: 'បោះពុម្ព',
    share: 'ចែករំលែក',
    downloadAllReports: 'ទាញយករបាយការណ៍ទាំងអស់',
    masterSummary: 'សេចក្តីសង្ខេបមេ',
    viewing: 'កំពុងមើល',
    proceedToSettle: 'បន្តទៅការទូទាត់ និងកាត់ប្រាក់កក់',
    completedTransactionRecord: 'កំណត់ត្រាប្រតិបត្តិការបានបញ្ចប់',
    permanentRef: 'លេខយោងអចិន្ត្រៃយ៍',
    summaryOverview: 'ទិដ្ឋភាពទូទៅនៃសេចក្តីសង្ខេប',
    totalPeriodCost: 'ថ្លៃចំណាយប្រចាំវដ្តសរុប',
    totalAmountDeducted: 'ចំនួនទឹកប្រាក់បានកាត់សរុប',
    outstandingBalance: 'សមតុល្យនៅខ្វះ',
    fullyPaidMembers: 'សមាជិកបានទូទាត់រួចរាល់',
    partialBalanceMembers: 'សមតុល្យមិនគ្រប់គ្រាន់ / ទូទាត់ផ្នែកខ្លះ',
    preSettleEstimateUnpaid: 'ការប៉ាន់ប្រមាណមុនទូទាត់ (មិនទាន់បង់)',
    settlementReportPreview: 'មើលរបាយការណ៍ទូទាត់ជាមុន',
  },
};

/**
 * Common Known Error Translations Map (English -> Khmer)
 */
export const errorTranslations: Record<string, string> = {
  'Unauthorized: Please log in': 'មិនមានការអនុញ្ញាត៖ សូមចូលគណនី',
  'Access forbidden or session expired': 'ត្រូវបានហាមឃាត់ ឬផុតកំណត់វគ្គប្រើប្រាស់',
  'Please enter username and password': 'សូមបញ្ចូលឈ្មោះគណនី និងពាក្យសម្ងាត់',
  'Invalid credentials': 'ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ',
  'Please fill in all required registration fields': 'សូមបំពេញព័ត៌មានចុះឈ្មោះចាំបាច់ទាំងអស់',
  'Registration failed': 'ការចុះឈ្មោះមិនជោគជ័យ',
  'Failed to fetch members': 'មិនអាចទាញយកបញ្ជីសមាជិកបានទេ',
  'Failed to fetch daily costs': 'មិនអាចទាញយកទិន្នន័យចំណាយប្រចាំថ្ងៃបានទេ',
  'Failed to toggle meal status': 'មិនអាចផ្លាស់ប្តូរវត្តមានអាហារបានទេ',
  'Failed to add daily expense': 'មិនអាចកត់ត្រាចំណាយប្រចាំថ្ងៃបានទេ',
  'Failed to credit deposit': 'មិនអាចបញ្ចូលប្រាក់កក់បានទេ',
  'Failed to settle bills': 'មិនអាចទូទាត់វិក្កយបត្របានទេ',
  'Authentication failed or token expired. Please sign in.': 'ការផ្ទៀងផ្ទាត់មិនជោគជ័យ ឬសញ្ញាសម្ងាត់បានផុតកំណត់។ សូមចូលគណនីម្តងទៀត។',
  'Network error': 'មានបញ្ហាតភ្ជាប់បណ្តាញ',
  'Network connection error': 'មានបញ្ហាតភ្ជាប់បណ្តាញ',
  'Please enter an amount for food or ingredients': 'សូមបញ្ចូលចំនួនទឹកប្រាក់សម្រាប់ម្ហូប ឬគ្រឿងទេស',
  'Please select a valid date': 'សូមជ្រើសរើសកាលបរិច្ឆេទត្រឹមត្រូវ',
  'Please enter a valid deposit amount': 'សូមបញ្ចូលចំនួនទឹកប្រាក់កក់ត្រឹមត្រូវ',
  'Please select a valid member': 'សូមជ្រើសរើសសមាជិកត្រឹមត្រូវ',
};

/**
 * Safe translation lookup helper for error strings
 */
export function translateError(errorMsg: string, lang: Language): string {
  if (lang === 'en') return errorMsg;
  return errorTranslations[errorMsg] || errorMsg;
}
