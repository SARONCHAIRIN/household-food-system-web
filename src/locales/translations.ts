export type Language = 'en' | 'km';

export interface Translations {
  common: {
    appName: string;
    appTagline: string;
    welcome: string;
    hello: string;
    signIn: string;
    signOut: string;
    register: string;
    save: string;
    cancel: string;
    close: string;
    retry: string;
    loading: string;
    active: string;
    inactive: string;
    away: string;
    admin: string;
    member: string;
    you: string;
    today: string;
    api: string;
    cloud: string;
    local: string;
    language: string;
    theme: string;
    darkMode: string;
    lightMode: string;
    refresh: string;
    error: string;
    food: string;
    pantry: string;
  };
  nav: {
    dashboard: string;
    meals: string;
    deposits: string;
    bills: string;
    profile: string;
  };
  dashboard: {
    dinnerAttendance: string;
    liveFoodPoolTotal: string;
    foodPrepTotal: string;
    ingredientPantry: string;
    addExpense: string;
    eatTonight: string;
    skipMeal: string;
    eating: string;
    skipping: string;
    pendingChoice: string;
    viewAllAttendance: string;
    householdMembers: string;
    activeHouseholdMembers: string;
    registered: string;
    manage: string;
    activate: string;
    deactivate: string;
    recentDailyCosts: string;
    addCost: string;
    diners: string;
    perPerson: string;
    recordsLogged: string;
    noDailyCosts: string;
    aggregatedFromCosts: string;
    exportData: string;
  };
  meals: {
    title: string;
    subtitle: string;
    selectDate: string;
    today: string;
    attendanceRecords: string;
    recordsReturned: string;
    all: string;
    eaten: string;
    skipped: string;
    recorded: string;
    noAttendanceLogged: string;
    noRecordsFound: string;
    noRecordsHelp: string;
    daysPoolCost: string;
    eatTonight: string;
    skipMeal: string;
    status: string;
    noAttendanceChoice: string;
    recordsTitle: string;
    noRecords: string;
    useButtonsAbove: string;
  };
  deposits: {
    title: string;
    subtitle: string;
    inspectingBalance: string;
    inspectingMemberBalance: string;
    singleMember: string;
    allMembers: string;
    allMembersOverview: string;
    availableBalance: string;
    currentAvailableDeposit: string;
    creditDeposit: string;
    creditMemberDeposit: string;
    amount: string;
    description: string;
    submitCredit: string;
    transactionHistory: string;
    totalMembers: string;
    totalBalance: string;
    totalBalanceAll: string;
    zeroBalanceCount: string;
    searchMembers: string;
    filterPlaceholder: string;
    balance: string;
    transactions: string;
    status: string;
    member: string;
    action: string;
    inspect: string;
    crediting: string;
  };
  bills: {
    title: string;
    subtitle: string;
    lastSettlement: string;
    summaryPreview: string;
    settleDeduct: string;
    settlementPeriod: string;
    previewDues: string;
    settleBills: string;
    totalFoodCost: string;
    totalIngredientCost: string;
    grandTotalPool: string;
    memberDuesBreakdown: string;
    settlementHistory: string;
    settledBy: string;
    period: string;
    status: string;
    activeDinners: string;
    viewDeposits: string;
    calculate: string;
    thisMonth: string;
    lastMonth: string;
    last14Days: string;
    last7Days: string;
    exportData: string;
  };
  profile: {
    title: string;
    subtitle: string;
    notSignedIn: string;
    notSignedInDesc: string;
    authenticatedVia: string;
    status: string;
    activeHousehold: string;
    markedInactive: string;
    markActive: string;
    markInactive: string;
    statusManagedByAdmin: string;
    userId: string;
    joinedDate: string;
    accountSwitcher: string;
    switchAccountDesc: string;
    switchAccountBtn: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    common: {
      appName: 'Household Food',
      appTagline: 'Apartment Shared Pantry',
      welcome: 'Welcome',
      hello: 'Hello',
      signIn: 'Sign In',
      signOut: 'Sign Out',
      register: 'Register',
      save: 'Save',
      cancel: 'Cancel',
      close: 'Close',
      retry: 'Retry',
      loading: 'Loading...',
      active: 'ACTIVE',
      inactive: 'INACTIVE',
      away: 'AWAY',
      admin: 'ADMIN',
      member: 'MEMBER',
      you: 'YOU',
      today: 'Today',
      api: 'API',
      cloud: 'Cloud',
      local: 'Local',
      language: 'Language',
      theme: 'Theme',
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode',
      refresh: 'Refresh',
      error: 'Error',
      food: 'Food',
      pantry: 'Pantry',
    },
    nav: {
      dashboard: 'Dashboard',
      meals: 'Meals',
      deposits: 'Deposits',
      bills: 'Bills',
      profile: 'Profile',
    },
    dashboard: {
      dinnerAttendance: 'Dinner Attendance',
      liveFoodPoolTotal: 'Live Food Pool Total',
      foodPrepTotal: 'Food Prep Total',
      ingredientPantry: 'Ingredient / Pantry',
      addExpense: 'Add Expense',
      eatTonight: 'EAT TONIGHT',
      skipMeal: 'SKIP MEAL',
      eating: 'EATING',
      skipping: 'SKIPPING',
      pendingChoice: 'Pending choice',
      viewAllAttendance: 'View All Attendance',
      householdMembers: 'Household Members',
      activeHouseholdMembers: 'active household members',
      registered: 'registered',
      manage: 'Manage',
      activate: 'Activate',
      deactivate: 'Deactivate',
      recentDailyCosts: 'Recent Daily Costs',
      addCost: 'Add Cost',
      diners: 'diners',
      perPerson: 'person',
      recordsLogged: 'records logged',
      noDailyCosts: 'No daily costs recorded yet.',
      aggregatedFromCosts: 'Aggregated from Daily Costs',
      exportData: 'Export Data',
    },
    meals: {
      title: 'Meal Attendance',
      subtitle: 'Daily dinner participation & food cost allocation',
      selectDate: 'Select Meal Date',
      today: 'TODAY',
      attendanceRecords: 'Attendance Records',
      recordsReturned: 'records returned by GET /meal-statuses',
      all: 'All',
      eaten: 'Eaten',
      skipped: 'Skipped',
      recorded: 'Recorded',
      noAttendanceLogged: 'No attendance choice logged yet',
      noRecordsFound: 'No meal attendance records found.',
      noRecordsHelp: 'Use the buttons above to log meal attendance.',
      daysPoolCost: "Day's Pool Cost",
      eatTonight: 'EAT TONIGHT',
      skipMeal: 'SKIP MEAL',
      status: 'Status',
      noAttendanceChoice: 'No attendance choice logged yet',
      recordsTitle: 'Attendance Records',
      noRecords: 'No meal attendance records found.',
      useButtonsAbove: 'Use the buttons above to log meal attendance.',
    },
    deposits: {
      title: 'Prepaid Deposits',
      subtitle: 'Member wallet balances & credit deposit management',
      inspectingBalance: 'Inspecting Member Balance',
      inspectingMemberBalance: 'Inspecting Member Balance',
      singleMember: 'Single Member',
      allMembers: 'All Members',
      allMembersOverview: 'All Members Deposit Overview',
      availableBalance: 'Available Balance',
      currentAvailableDeposit: 'Current Available Deposit',
      creditDeposit: 'Credit Member Deposit',
      creditMemberDeposit: 'Credit Member Deposit',
      amount: 'Amount ($)',
      description: 'Description / Memo',
      submitCredit: 'Credit Deposit',
      transactionHistory: 'Transaction History',
      totalMembers: 'Total Members',
      totalBalance: 'Total Balance Across Members',
      totalBalanceAll: 'Total Balance Across Members',
      zeroBalanceCount: 'Members with $0 Balance',
      searchMembers: 'Search members by name or @username...',
      filterPlaceholder: 'Filter members by name or @username...',
      balance: 'Balance',
      transactions: 'Transactions',
      status: 'Status',
      member: 'Member',
      action: 'Action',
      inspect: 'Inspect',
      crediting: 'Crediting...',
    },
    bills: {
      title: 'Billing & Settlement',
      subtitle: 'Fair food pool cost sharing & deposit balance settlement',
      lastSettlement: 'Last Settlement',
      summaryPreview: 'Summary & Preview',
      settleDeduct: 'Settle & Deduct',
      settlementPeriod: 'Settlement Period',
      previewDues: 'Preview Dues',
      settleBills: 'Settle Bills',
      totalFoodCost: 'Total Food Cost',
      totalIngredientCost: 'Total Ingredient Cost',
      grandTotalPool: 'Grand Total Pool',
      memberDuesBreakdown: 'Member Dues Breakdown',
      settlementHistory: 'Settlement History',
      settledBy: 'Settled by',
      period: 'Period',
      status: 'Status',
      activeDinners: 'Active Dinners',
      viewDeposits: 'View Deposits',
      calculate: 'Calculate Preview',
      thisMonth: 'This Month',
      lastMonth: 'Last Month',
      last14Days: 'Last 14 Days',
      last7Days: 'Last 7 Days',
      exportData: 'Export Data',
    },
    profile: {
      title: 'Account Profile',
      subtitle: 'Authenticated via JWT Bearer token',
      notSignedIn: 'Not Signed In',
      notSignedInDesc:
        'Sign in with your username and password to manage your dinner attendance, view meal records, and check billing balances.',
      authenticatedVia: 'Authenticated via JWT Bearer token',
      status: 'Status',
      activeHousehold: 'Active household resident',
      markedInactive: 'Marked as inactive',
      markActive: 'Mark Active',
      markInactive: 'Mark Inactive',
      statusManagedByAdmin: 'Status managed by Admin',
      userId: 'User ID',
      joinedDate: 'Joined Date',
      accountSwitcher: 'Account Switcher',
      switchAccountDesc: 'Easily sign in as another household member or an admin.',
      switchAccountBtn: 'Switch or Register Another Account',
    },
  },
  km: {
    common: {
      appName: 'អាហាររួមក្នុងផ្ទះ',
      appTagline: 'ផ្ទះបាយរួមសម្រាប់បន្ទប់ស្នាក់នៅ',
      welcome: 'សូមស្វាគមន៍',
      hello: 'សួស្តី',
      signIn: 'ចូលគណនី',
      signOut: 'ចាកចេញ',
      register: 'ចុះឈ្មោះ',
      save: 'រក្សាទុក',
      cancel: 'បោះបង់',
      close: 'បិទ',
      retry: 'ព្យាយាមម្តងទៀត',
      loading: 'កំពុងដំណើរការ...',
      active: 'សកម្ម',
      inactive: 'អសកម្ម',
      away: 'មិននៅផ្ទះ',
      admin: 'អ្នកគ្រប់គ្រង',
      member: 'សមាជិក',
      you: 'អ្នក',
      today: 'ថ្ងៃនេះ',
      api: 'API',
      cloud: 'ពពក',
      local: 'មូលដ្ឋាន',
      language: 'ភាសា',
      theme: 'រូបរាង',
      darkMode: 'ទម្រង់ងងឹត',
      lightMode: 'ទម្រង់ភ្លឺ',
      refresh: 'ផ្ទុកឡើងវិញ',
      error: 'កំហុស',
      food: 'ម្ហូបអាហារ',
      pantry: 'គ្រឿងទេស',
    },
    nav: {
      dashboard: 'ផ្ទាំងដើម',
      meals: 'អាហារ',
      deposits: 'ប្រាក់កក់',
      bills: 'វិក្កយបត្រ',
      profile: 'គណនី',
    },
    dashboard: {
      dinnerAttendance: 'វត្តមានអាហារពេលល្ងាច',
      liveFoodPoolTotal: 'សរុបចំណាយអាហាររួម',
      foodPrepTotal: 'ថ្លៃរៀបចំម្ហូប',
      ingredientPantry: 'គ្រឿងទេស / ផ្ទះបាយ',
      addExpense: 'បន្ថែមចំណាយ',
      eatTonight: 'ញ៉ាំល្ងាចនេះ',
      skipMeal: 'អត់ញ៉ាំទេ',
      eating: 'បានចុះឈ្មោះញ៉ាំ',
      skipping: 'មិនញ៉ាំ',
      pendingChoice: 'មិនទាន់ជ្រើសរើស',
      viewAllAttendance: 'មើលវត្តមានទាំងអស់',
      householdMembers: 'សមាជិកក្នុងផ្ទះ',
      activeHouseholdMembers: 'សមាជិកសកម្មក្នុងផ្ទះ',
      registered: 'បានចុះឈ្មោះ',
      manage: 'គ្រប់គ្រង',
      activate: 'ធ្វើឱ្យសកម្ម',
      deactivate: 'ធ្វើឱ្យអសកម្ម',
      recentDailyCosts: 'ចំណាយប្រចាំថ្ងៃថ្មីៗ',
      addCost: 'បន្ថែមថ្លៃម្ហូប',
      diners: 'នាក់ញ៉ាំ',
      perPerson: 'ម្នាក់',
      recordsLogged: 'កំណត់ត្រាបានបញ្ចូល',
      noDailyCosts: 'មិនទាន់មានចំណាយប្រចាំថ្ងៃនៅឡើយទេ។',
      aggregatedFromCosts: 'សរុបចេញពីចំណាយប្រចាំថ្ងៃ',
      exportData: 'ទាញយកទិន្នន័យ (Export)',
    },
    meals: {
      title: 'វត្តមានអាហារ',
      subtitle: 'ការចូលរួមអាហារពេលល្ងាច និងការបែងចែកថ្លៃម្ហូប',
      selectDate: 'ជ្រើសរើសកាលបរិច្ឆេទ',
      today: 'ថ្ងៃនេះ',
      attendanceRecords: 'កំណត់ត្រាវត្តមាន',
      recordsReturned: 'កំណត់ត្រាដែលទទួលបានពី GET /meal-statuses',
      all: 'ទាំងអស់',
      eaten: 'បានញ៉ាំ',
      skipped: 'មិនញ៉ាំ',
      recorded: 'បានកត់ត្រា',
      noAttendanceLogged: 'មិនទាន់បានកត់ត្រាវត្តមាននៅឡើយទេ',
      noRecordsFound: 'មិនមានកំណត់ត្រាវត្តមានអាហារទេ។',
      noRecordsHelp: 'សូមប្រើប៊ូតុងខាងលើដើម្បីកត់ត្រាវត្តមានអាហារ។',
      daysPoolCost: 'ថ្លៃចំណាយរួមប្រចាំថ្ងៃ',
      eatTonight: 'ញ៉ាំល្ងាចនេះ',
      skipMeal: 'អត់ញ៉ាំទេ',
      status: 'ស្ថានភាព',
      noAttendanceChoice: 'មិនទាន់បានកត់ត្រាវត្តមាននៅឡើយទេ',
      recordsTitle: 'កំណត់ត្រាវត្តមាន',
      noRecords: 'មិនមានកំណត់ត្រាវត្តមានអាហារទេ។',
      useButtonsAbove: 'សូមប្រើប៊ូតុងខាងលើដើម្បីកត់ត្រាវត្តមានអាហារ។',
    },
    deposits: {
      title: 'ប្រាក់កក់ទុកជាមុន',
      subtitle: 'សមតុល្យកាបូបសមាជិក និងការគ្រប់គ្រងការបញ្ចូលប្រាក់',
      inspectingBalance: 'ពិនិត្យសមតុល្យសមាជិក',
      inspectingMemberBalance: 'ពិនិត្យសមតុល្យសមាជិក',
      singleMember: 'សមាជិកម្នាក់ៗ',
      allMembers: 'សមាជិកទាំងអស់',
      allMembersOverview: 'ទិដ្ឋភាពទូទៅនៃប្រាក់កក់សមាជិកទាំងអស់',
      availableBalance: 'សមតុល្យដែលអាចប្រើបាន',
      currentAvailableDeposit: 'សមតុល្យប្រាក់កក់បច្ចុប្បន្ន',
      creditDeposit: 'បញ្ចូលទឹកប្រាក់ឱ្យសមាជិក',
      creditMemberDeposit: 'បញ្ចូលទឹកប្រាក់ឱ្យសមាជិក',
      amount: 'ចំនួនទឹកប្រាក់ ($)',
      description: 'ការពិពណ៌នា / ចំណាំ',
      submitCredit: 'បញ្ចូលប្រាក់',
      transactionHistory: 'ប្រវត្តិប្រតិបត្តិការ',
      totalMembers: 'សមាជិកសរុប',
      totalBalance: 'សមតុល្យសរុបទាំងអស់',
      totalBalanceAll: 'សមតុល្យសរុបទាំងអស់របស់សមាជិក',
      zeroBalanceCount: 'សមាជិកដែលមានសមតុល្យ $0',
      searchMembers: 'ស្វែងរកសមាជិកតាមឈ្មោះ ឬ @username...',
      filterPlaceholder: 'ត្រងសមាជិកតាមឈ្មោះ ឬ @username...',
      balance: 'សមតុល្យ',
      transactions: 'ប្រតិបត្តិការ',
      status: 'ស្ថានភាព',
      member: 'សមាជិក',
      action: 'សកម្មភាព',
      inspect: 'ពិនិត្យ',
      crediting: 'កំពុងបញ្ចូលប្រាក់...',
    },
    bills: {
      title: 'ការទូទាត់ និងវិក្កយបត្រ',
      subtitle: 'ការបែងចែកថ្លៃម្ហូបស្មើភាព និងកាត់ចេញពីប្រាក់កក់ទុកជាមុន',
      lastSettlement: 'ការទូទាត់ចុងក្រោយ',
      summaryPreview: 'សង្ខេប & ការមើលជាមុន',
      settleDeduct: 'ទូទាត់ & កាត់ប្រាក់',
      settlementPeriod: 'រយៈពេលទូទាត់',
      previewDues: 'មើលការគណនាបឋម',
      settleBills: 'ទូទាត់វិក្កយបត្រ',
      totalFoodCost: 'ថ្លៃម្ហូបសរុប',
      totalIngredientCost: 'ថ្លៃគ្រឿងទេសសរុប',
      grandTotalPool: 'ចំណាយរួមសរុប',
      memberDuesBreakdown: 'ព័ត៌មានលម្អិតចំណាយរបស់សមាជិក',
      settlementHistory: 'ប្រវត្តិការទូទាត់',
      settledBy: 'ទូទាត់ដោយ',
      period: 'រយៈពេល',
      status: 'ស្ថានភាព',
      activeDinners: 'អាហារសកម្ម',
      viewDeposits: 'មើលប្រាក់កក់',
      calculate: 'គណនាមើលជាមុន',
      thisMonth: 'ខែនេះ',
      lastMonth: 'ខែមុន',
      last14Days: '១៤ ថ្ងៃចុងក្រោយ',
      last7Days: '៧ ថ្ងៃចុងក្រោយ',
      exportData: 'ទាញយកទិន្នន័យ (Export)',
    },
    profile: {
      title: 'ព័ត៌មានគណនី',
      subtitle: 'ផ្ទៀងផ្ទាត់ដោយប្រើ JWT Bearer token',
      notSignedIn: 'មិនទាន់បានចូលគណនី',
      notSignedInDesc:
        'សូមចូលគណនីដោយប្រើឈ្មោះ និងពាក្យសម្ងាត់ ដើម្បីគ្រប់គ្រងវត្តមានអាហារពេលល្ងាច មើលកំណត់ត្រា និងពិនិត្យសមតុល្យវិក្កយបត្រ។',
      authenticatedVia: 'ផ្ទៀងផ្ទាត់ដោយប្រើ JWT Bearer token',
      status: 'ស្ថានភាព',
      activeHousehold: 'សមាជិកសកម្មក្នុងផ្ទះ',
      markedInactive: 'បានកំណត់ជាអសកម្ម',
      markActive: 'កំណត់ជាសកម្ម',
      markInactive: 'កំណត់ជាអសកម្ម',
      statusManagedByAdmin: 'ស្ថានភាពគ្រប់គ្រងដោយអ្នកគ្រប់គ្រង',
      userId: 'លេខសម្គាល់អ្នកប្រើ',
      joinedDate: 'កាលបរិច្ឆេទចូលរួម',
      accountSwitcher: 'ប្តូរគណនី',
      switchAccountDesc: 'ងាយស្រួលចូលគណនីជាសមាជិកផ្សេងទៀត ឬជាអ្នកគ្រប់គ្រង។',
      switchAccountBtn: 'ប្តូរ ឬចុះឈ្មោះគណនីផ្សេង',
    },
  },
};
