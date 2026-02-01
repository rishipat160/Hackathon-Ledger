/**
 * LEDGER - CATEGORY MAPPING UTILITIES
 * 
 * Maps Plaid Personal Finance Categories (PFC) to friendly display names
 * Supports both modern PFC and legacy category array for backward compatibility
 */

interface PersonalFinanceCategory {
  primary: string;
  detailed: string;
  confidence_level?: string;
}

/**
 * Map Plaid PFC primary category to user-friendly name
 */
export function mapPFCToFriendly(
  pfc?: PersonalFinanceCategory | null
): string {
  if (!pfc?.primary) {
    return 'Other';
  }

  const mapping: Record<string, string> = {
    'FOOD_RETAIL': 'Groceries',
    'FOOD_AND_DRINK': 'Food & Drink',
    'DINING': 'Dining',
    'ENTERTAINMENT': 'Entertainment',
    'TRANSPORTATION': 'Transportation',
    'GENERAL_MERCHANDISE': 'Shopping',
    'GENERAL_SERVICES': 'Services',
    'RENT_AND_UTILITIES': 'Bills & Utilities',
    'MEDICAL': 'Healthcare',
    'PERSONAL_CARE': 'Personal Care',
    'BANK_FEES': 'Fees',
    'TRANSFER_IN': 'Income',
    'TRANSFER_OUT': 'Transfers',
    'LOAN_PAYMENTS': 'Loan Payments',
    'HOME_IMPROVEMENT': 'Home & Garden',
    'GOVERNMENT_AND_NON_PROFIT': 'Government & Non-Profit',
    'TRAVEL': 'Travel',
    'INCOME': 'Income',
  };
  
  return mapping[pfc.primary] || pfc.primary.replace(/_/g, ' ');
}

/**
 * Check if a transaction is likely a subscription based on PFC category
 */
export function isSubscriptionCategory(pfc?: PersonalFinanceCategory | null): boolean {
  if (!pfc?.primary) return false;
  
  const subscriptionCategories = [
    'ENTERTAINMENT', // Netflix, Spotify, etc.
    'RENT_AND_UTILITIES', // Internet, phone bills
    'GENERAL_SERVICES', // SaaS, memberships
  ];
  
  return subscriptionCategories.includes(pfc.primary);
}

/**
 * Check if category should be excluded from subscription detection
 * (groceries, gas, restaurants are NOT subscriptions)
 */
export function isNonSubscriptionCategory(pfc?: PersonalFinanceCategory | null): boolean {
  if (!pfc?.primary) return false;
  
  const excludedCategories = [
    'FOOD_RETAIL', // Groceries
    'FOOD_AND_DRINK', // Food and drink
    'DINING', // Restaurants
    'TRANSPORTATION', // Gas, parking
    'GENERAL_MERCHANDISE', // Retail shopping
    'TRAVEL', // One-time travel
    'MEDICAL', // Healthcare
    'PERSONAL_CARE', // Salons, gyms (variable)
  ];
  
  return excludedCategories.includes(pfc.primary);
}
