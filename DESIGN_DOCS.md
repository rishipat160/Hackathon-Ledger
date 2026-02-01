# Ledger - Design Documentation

## Executive Summary

Ledger is a smart financial coach for students and freelancers, providing real-time insights into spending patterns, subscription management, and personalized financial guidance. Built with a security-first approach, Ledger combines Plaid's banking infrastructure with OpenAI's conversational AI to deliver actionable financial advice in a clean, Robinhood-inspired interface.

---

## Technical Stack

### Core Technologies

**Frontend:**
- Next.js 15 (App Router) - Full-stack React framework
- TypeScript - Type safety throughout
- Tailwind CSS - Custom dark theme with neon accent colors
- Recharts - Interactive data visualizations

**Backend:**
- Next.js API Routes - Serverless functions
- iron-session - Encrypted session management
- Plaid SDK - Banking data integration

**External APIs:**
- Plaid Transactions API - Bank account and transaction data
- Plaid Personal Finance Categories (PFC v2) - Transaction categorization
- OpenAI GPT-4o - AI-powered financial insights

**Key Libraries:**
- react-plaid-link - Secure bank connection UI
- recharts - Charts (Bar, Pie, Line)
- iron-session - Secure server-side sessions

---

## Design Choices

### 1. Transaction-Based Balance Calculation

**Decision:** Calculate current balance from transaction history instead of using Plaid's reported balance.

**Reasoning:**
- Plaid's `account.balances.current` can be inconsistent with transaction history
- Transaction-based calculation ensures all numbers align perfectly
- Simpler mental model: Balance = Total Income - Total Spending
- Eliminates confusion when displayed balance doesn't match the math

**Implementation:**
```typescript
const currentBalance = income.totalIncome - spendingTotal;
```

### 2. Plaid Personal Finance Categories (PFC v2)

**Decision:** Use modern PFC taxonomy exclusively, remove legacy category fallbacks.

**Reasoning:**
- PFC provides higher accuracy (16 primary categories, 104 detailed subcategories)
- Consistent categorization across all transactions
- Better subscription detection (can filter by ENTERTAINMENT, GENERAL_SERVICES)
- Forward-compatible with Plaid's direction

**Implementation:**
- Request PFC data: `include_personal_finance_category: true`
- Centralized mapping in `lib/categories.ts`

### 3. Subscription Detection Algorithm

**Decision:** Multi-layered filtering approach combining category analysis, pattern detection, and price consistency.

**Filters Applied:**
1. Exclude non-subscription categories (Food, Dining, Transportation, Shopping)
2. Blacklist common non-subscription merchants (McDonald's, Walmart, Uber)
3. Require monthly or annual frequency (not weekly)
4. Check price consistency (< 30% variance)
5. Validate against subscription-related categories or Plaid's recurring flag

**Reasoning:**
- Simple `recurring=true` check misses many subscriptions
- Pattern-only detection flags groceries as subscriptions
- Layered approach reduces false positives significantly

### 4. Server-Side Period Calculation

**Decision:** Pre-calculate 3M, 6M, 12M spending breakdowns server-side instead of client-side filtering.

**Reasoning:**
- Instant tab switching (no 4-second delay from filtering 92 transactions × 7 categories)
- Better UX for demos and presentations
- Calculation happens once on page load, not on every tab click
- Reduces client-side processing

**Implementation:**
```typescript
const spendingByPeriod = {
  '3M': calculateSpendingByPeriod(categories, 3),
  '6M': calculateSpendingByPeriod(categories, 6),
  '12M': topCategories,
};
```

### 5. Category Color Consistency

**Decision:** Global category-to-color mapping based on overall spending rank.

**Reasoning:**
- Each category gets a fixed color (Food & Drink = always green)
- Colors match across pie chart, chart tooltips, and category lists
- Prevents confusion when colors change between months
- Professional, consistent visual design

**Implementation:**
- Create mapping on page load: `{'Food & Drink': '#00FF88', 'Dining': '#00E5FF', ...}`
- Pass to all components and tooltips
- Assign by sorted spending order (top spender = first color)

### 6. Time-Series Data for AI

**Decision:** Send GPT spending breakdowns for multiple periods (1M, 3M, 6M, 12M) and monthly income/spending history.

**Reasoning:**
- Prevents AI from guessing timeframes ($547 yearly misreported as monthly)
- Enables accurate trend analysis
- Provides context for recommendations
- Shows seasonal patterns

**Data Sent to GPT:**
```json
{
  "spendingByPeriod": {
    "1M": { "totalSpending": 450, "categories": [...] },
    "3M": { "totalSpending": 1350, "categories": [...] },
    "6M": { "totalSpending": 2700, "categories": [...] },
    "12M": { "totalSpending": 5400, "categories": [...] }
  },
  "monthlyBreakdown": [
    { "month": "Jan 2026", "income": 5200, "spending": 3800, "net": 1400 },
    ...
  ]
}
```

---

## Security & Privacy

### 1. Server-Side Token Exchange

**Implementation:**
- Public tokens from Plaid Link sent to `/api/plaid/exchange`
- Exchanged for access tokens server-side only
- Access tokens stored in encrypted session cookies
- Never exposed to client browser/JavaScript

### 2. PII Masking for AI

**What's Excluded:**
- Account numbers (masked: XXXX1234)
- Account IDs
- Routing numbers
- Full transaction IDs
- Account owner names

**What's Included:**
- Transaction amounts, dates, merchants
- Categories and patterns
- Aggregated statistics

**Implementation:**
```typescript
export function sanitizeForAI(transaction: any): any {
  return {
    date: transaction.date,
    amount: transaction.amount,
    merchant: transaction.name,
    category: pfc?.primary || 'Other',
    // OMIT: account_id, account_owner, payment details
  };
}
```

### 3. Session Security

- iron-session with AES-256 encryption
- HTTP-only cookies (not accessible via JavaScript)
- 7-day expiration
- Secure flag in production
- SameSite: lax (CSRF protection)

### 4. API Endpoint Protection

All sensitive endpoints validate session:
```typescript
if (!session.plaidAccessToken) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## User Experience Design

### Visual Design Philosophy

**Inspiration:** Robinhood-style dark mode with high-contrast neon accents

**Color Palette:**
- Background: Pitch black (#000000)
- Cards: Dark gray (#111111)
- Accents: Neon green (#00FF88), cyan (#00E5FF), purple (#B24BF3)
- Income/Gains: Green
- Spending/Losses: Red (#FF4757)

**Typography:**
- Inter font family (professional, readable)
- Clear hierarchy (3xl headings, regular body text)

**Interactions:**
- Animated number count-ups
- Smooth hover effects on cards
- Loading states with disabled buttons
- Modal overlays for actions

### Layout Strategy

**3-Column Dashboard:**
- Left (1/4): Spending Breakdown + Cash Flow Health
- Middle (2/4): Income vs Spending Chart + Savings Goal + Savings Trend
- Right (1/4): AI Financial Coach
- Bottom: Recent Transactions + Subscriptions (full width, 2 columns)

**Rationale:**
- Most important data (charts) in center
- Quick overview (spending pie) on left
- AI insights accessible but not distracting on right

---

## AI Coach Personality

### Tone & Approach

**Target:** Friendly, knowledgeable advisor (not judgmental auditor)

**Characteristics:**
- Supportive and encouraging
- Data-specific (uses actual numbers)
- Action-oriented (provides 3 concrete steps)
- Context-aware (understands user type: student/freelancer/salaried)

**Format:**
- Plain text with CAPS section headers
- No markdown formatting (clean, readable)
- Sections: KEY INSIGHTS, RECOMMENDATIONS, YOUR PROGRESS

### Personalization

AI receives:
- User profile (student/freelancer/salaried)
- Savings goal (emergency fund, travel, etc.)
- Spending patterns across multiple timeframes
- Monthly income vs spending history

---

## Performance Optimizations

### 1. Server-Side Data Preparation

All expensive calculations done server-side:
- Category aggregation
- Period filtering (3M, 6M, 12M)
- Color mapping
- Chart data preparation

**Result:** Dashboard loads in ~1-2 seconds, tab switching is instant.

### 2. Parallel API Calls

```typescript
const [profileResponse, analysisResponse] = await Promise.all([
  fetch('/api/profile/setup'),
  fetch('/api/analysis/comprehensive')
]);
```

Reduces load time by ~50%.

### 3. Cache Busting

```typescript
fetch(`/api/analysis/comprehensive?t=${Date.now()}`)
```

Ensures fresh data when switching accounts.

### 4. Animation Optimization

- Disabled animation on spending breakdown pie chart (instant tab switching)
- Kept animation on main bar chart (smooth visual effect without impacting UX)

---

## Data Flow Architecture

### Connection Flow

1. User clicks "Connect Bank" → PlaidLink modal opens
2. User selects bank, enters credentials (Plaid Sandbox)
3. Plaid returns `public_token`
4. Client sends `public_token` to `/api/plaid/exchange`
5. Server exchanges for `access_token`, stores in session
6. Redirect to onboarding or dashboard

### Dashboard Data Flow

1. Dashboard loads → Fetches profile + analysis in parallel
2. `/api/analysis/comprehensive` fetches:
   - Transactions (365 days)
   - Account balances
   - Runs `analyzeFinances()` + `detectSubscriptionDrift()`
   - Prepares chart data + period breakdowns
3. Returns JSON with all dashboard data
4. Client renders components with pre-calculated data

### AI Insights Flow

1. User clicks "Get Insights"
2. `/api/analysis/stream` fetches fresh transaction data
3. Runs analysis + subscription detection
4. Sanitizes data (removes PII)
5. Calls OpenAI with streaming
6. Streams response back to client character-by-character
7. Client displays with typing effect

---

## Key Algorithms

### Income Detection

```typescript
const incomeTransactions = transactions.filter(t => t.amount < 0);
const totalIncome = incomeTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
```

**Logic:** In Plaid, negative amounts = money in. Includes paychecks, refunds, transfers.

### Cash Flow Health Score (0-100)

**Components:**
- Income vs Spending Ratio: 40 points
- Balance to Monthly Spending: 30 points
- Income Stability: 20 points
- Base: 50 points

**Calculation:**
```typescript
const monthlySpending = totalSpending / monthRange;
const ratio = monthlyIncome / monthlySpending;
if (ratio >= 1.5) score += 40;
else if (ratio >= 1.2) score += 30;
// ... etc
```

### Subscription Detection

See section "Design Choices > Subscription Detection Algorithm" above.

---

## Future Enhancements

### Near-Term (Next 1-3 Months)

1. **Budget Recommendations**
   - AI-powered category budgets based on income
   - Alerts when approaching budget limits
   - Historical budget vs actual tracking

2. **Bill Payment Reminders**
   - Detect recurring bills (rent, utilities)
   - Notify 3 days before due date
   - Integration with calendar apps

3. **Export Functionality**
   - Download transactions as CSV
   - Generate PDF reports
   - Monthly spending summaries

4. **Mobile Responsive Design**
   - Optimize for phone screens
   - Touch-friendly interactions
   - Progressive Web App (PWA)

### Long-Term (3-6 Months)

1. **Real-Time Webhooks**
   - Plaid webhooks for instant transaction updates
   - Live balance updates
   - Fraud detection alerts

2. **Multi-Account Improvements**
   - Aggregate view across all banks
   - Account-specific breakdowns
   - Transfer detection between own accounts

3. **Goal Tracking**
   - Multiple simultaneous goals
   - Auto-save rules (round-up transactions)
   - Progress notifications

4. **Spending Predictions**
   - ML model to predict next month spending
   - Identify anomalies and unusual purchases
   - Cash flow forecasting

5. **Social Features**
   - Anonymous spending comparisons (peer benchmarking)
   - Savings challenges
   - Financial literacy content

---

## Challenges Overcome

### 1. Category Mapping Consistency

**Problem:** Pie chart and tooltips showed different colors for same category.

**Solution:** Global category-to-color mapping based on overall spending rank, passed to all components.

### 2. Subscription False Positives

**Problem:** Groceries (Aldi, McDonald's) flagged as subscriptions due to weekly patterns.

**Solution:** Multi-layer filtering: category check + merchant blacklist + frequency validation + price consistency.

### 3. GPT Timeframe Confusion

**Problem:** AI reported "$547/month Entertainment" when it was $547/year.

**Solution:** Send period-specific breakdowns (1M, 3M, 6M, 12M) with explicit labels so AI knows exact timeframes.

### 4. Balance Calculation Mismatch

**Problem:** Plaid's reported balance ($500) didn't match transaction math ($8,000).

**Solution:** Use transaction-based calculation exclusively for consistency across all displayed metrics.

### 5. Period Tab Performance

**Problem:** Spending breakdown tabs took 4 seconds to switch (client-side filtering).

**Solution:** Pre-calculate all periods server-side, disable animation, make switching instant.

---

## File Structure

```
hackathon/
├── app/
│   ├── api/
│   │   ├── analysis/
│   │   │   ├── comprehensive/route.ts  # Main dashboard data
│   │   │   └── stream/route.ts         # AI insights streaming
│   │   ├── disconnect/route.ts          # Session cleanup
│   │   ├── plaid/
│   │   │   ├── create-link-token/route.ts
│   │   │   ├── exchange/route.ts
│   │   │   ├── transactions/route.ts
│   │   │   └── accounts/route.ts
│   │   └── profile/setup/route.ts       # User profile management
│   ├── dashboard/page.tsx               # Main dashboard
│   ├── onboarding/page.tsx              # User setup flow
│   └── page.tsx                         # Landing page
├── components/
│   ├── HeroStats.tsx                    # Balance/Income/Spending display
│   ├── IncomeSpendingChart.tsx          # Bar chart with tooltips
│   ├── SpendingBreakdown.tsx            # Pie chart with period tabs
│   ├── SavingsTrend.tsx                 # Line chart with goal line
│   ├── GoalProgress.tsx                 # Circular progress
│   ├── AICoach.tsx                      # Streaming AI insights
│   ├── RecentTransactions.tsx           # Transaction list
│   ├── SubscriptionCards.tsx            # Subscription grid
│   ├── CashFlowHealth.tsx               # Health score card
│   └── PlaidLink.tsx                    # Bank connection modal
├── lib/
│   ├── analyzer.ts                      # Income/spending analysis
│   ├── subscriptions.ts                 # Subscription detection
│   ├── categories.ts                    # PFC mapping utilities
│   ├── plaid.ts                         # Plaid client + PII sanitization
│   ├── session.ts                       # Session management
│   └── hooks/useCountUp.ts              # Number animation
└── [config files]
```

---

## Testing Strategy

### Plaid Sandbox Personas

**Recommended for demos:**
- `user_good` - Standard user with 3 months of data
- `user_transactions_dynamic` - 6 months with recurring patterns
- `user_small_business` - Business expenses with subscriptions

**Login:**
- Username: `user_good` (or other persona)
- Password: `pass_good`

### Key Scenarios Tested

1. First-time user onboarding flow
2. Multiple bank account connections
3. Savings goal updates
4. Period filtering (3M, 6M, 12M tabs)
5. Disconnect and reconnect flow
6. AI insights generation
7. Subscription detection accuracy
8. Category mapping consistency

---

## Production Deployment Considerations

### Environment Variables Required

```
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret
PLAID_ENV=sandbox|development|production
OPENAI_API_KEY=your_openai_key
SESSION_SECRET=32+_character_random_string
```

### Scaling Recommendations

1. **Database Integration**
   - Move from session storage to PostgreSQL/MongoDB
   - Store historical transaction data
   - Enable trend analysis over years

2. **Caching Layer**
   - Redis for AI insights (cache for 1 hour per user)
   - Reduce OpenAI API costs
   - Faster dashboard loads

3. **Background Jobs**
   - Queue transaction syncs
   - Process webhooks asynchronously
   - Generate daily/weekly summaries

4. **Rate Limiting**
   - Limit AI insights to 10/day per user
   - Plaid API rate limiting
   - DDoS protection

---

## Known Limitations

### Plaid Sandbox

- Limited to 3-6 months of synthetic data depending on persona
- Transaction dates cluster in recent months
- Some personas lack subscription patterns

### AI Coach

- Requires OpenAI API credits (costs ~$0.01-0.03 per insight)
- Streaming can be slow on poor connections
- Requires internet connectivity

### Subscription Detection

- May miss one-time annual charges (insufficient pattern data)
- Cannot detect subscriptions with only 1 transaction in dataset
- Relies on consistent merchant naming

---

## Acknowledgments

Built for NetSec SWE hackathon, demonstrating:
- Technical rigor in data processing
- Responsible AI with PII protection
- Production-quality UI/UX
- Security-first architecture

**Target Users:** Students and freelancers seeking financial clarity and actionable insights.

**Design Philosophy:** Professional, non-judgmental, data-driven financial coaching.
