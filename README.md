# Ledger - AI Financial Coach

> Smart financial insights for everyone. Stop budgeting. Start understanding.

## Try the Demo

**Live Demo:** [https://hackathon-ledger.vercel.app](https://hackathon-ledger.vercel.app)

**Pre-recorded Demo:** [https://youtu.be/rsXoMzi96Rk](https://youtu.be/rsXoMzi96Rk)

### Test Accounts (Plaid Sandbox)

Use these credentials to explore Ledger with realistic fake data:

| Username | Password | Profile |
|----------|----------|---------|
| `user_good` | `pass_good` | Healthy finances, stable income |
| `user_yuppie` | `pass_good` | High earner, lots of subscriptions |
| `user_credit_profile_poor` | `pass_good` | Struggling finances, overdrafts |

**Larger List of credentials** [https://plaid.com/docs/sandbox/test-credentials/](https://plaid.com/docs/sandbox/test-credentials/)

**How to use:**
1. Click "Connect Bank Account"
2. Select any bank from the list
3. Enter one of the test usernames and password above
4. Explore your personalized dashboard!

---

##  Key Features

###  AI Financial Coach
- **GPT-4o-powered insights** streaming in real-time
- Personalized advice based on YOUR actual spending patterns
- No generic tips - specific recommendations with dollar amounts

###  Smart Analytics
- **Income pattern detection** - Automatically identifies biweekly, monthly, or irregular paychecks
- **Cash flow health score** (0-100) - Instant financial health assessment
- **Subscription tracking** - Finds recurring charges you forgot about
- **Interactive charts** - Period filters (3M/6M/12M) for trend analysis

###  Built also for Students & Freelancers
- Handles **variable income** (unlike traditional budgeting apps)
- **Transaction-based balance** calculation for accuracy
- Clean, **Robinhood-inspired UI** with dark mode
- **No manual input** required - everything auto-calculated

---

##  Tech Stack

**Frontend:**
- Next.js 15 (App Router) with TypeScript
- Tailwind CSS with custom dark theme
- Recharts for data visualization

**Backend:**
- Next.js API Routes (serverless)
- Plaid API for banking data
- OpenAI GPT-4o for AI insights
- iron-session for encrypted sessions

**Deployment:**
- Vercel (serverless, auto-scaling)
- Zero external databases required

---

##  Design Philosophy

**Transaction-Based Balance**
> Calculate balance from transaction history (Income - Spending) instead of trusting Plaid's reported balance. This ensures all numbers align perfectly.

**Multi-Layer Subscription Detection**
> Combines category analysis, pattern detection, and price consistency to avoid false positives. Won't flag your weekly grocery runs as subscriptions.

**Server-Side Period Calculations**
> Pre-calculate 3M/6M/12M spending breakdowns on load for instant tab switching. No 4-second delays filtering hundreds of transactions.

See [DESIGN_DOCS.md](./DESIGN_DOCS.md) for full technical deep-dive.

---

##  Security

- **Bank-grade security** via Plaid (same infrastructure as Venmo, Robinhood)
- **Read-only access** to bank accounts - cannot move money
- **Encrypted sessions** with iron-session
- **No database** - all data stored in secure HTTP-only cookies
- **PII sanitization** before sending data to OpenAI

---

##  Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your PLAID_CLIENT_ID, PLAID_SECRET, and OPENAI_API_KEY

# Run development server
npm run dev

# Open http://localhost:3000
```


