/**
 * Demo / persona accounts for The 2am Shoppers.
 *
 * Two personas from the brief (Emily, John) plus one ready-to-go admin
 * account per case (student, working adult, business). Each account ships
 * with a fully pre-filled profile so the demo skips onboarding entirely —
 * you log in and land straight in the right dashboard.
 *
 * Shape notes (must match the stores):
 *   - account:  { id, username, password, email, name, role, demo:true }
 *   - shopper profile fields (from CustomerOnboarding.finish):
 *       name, userType:'student'|'working', interests[], budget,
 *       quietStart, quietEnd, paydayDate, notifFreq,
 *       student:  allowance, essentialReserveStudent, savingsAllocation, gamificationEnabled
 *       working:  income, essentialReserve, savingsAllocation, buffer
 *   - merchant profile fields: name, businessName, goal, etc.
 *   - goals[]:  { name, icon, targetAmount, currentAmount, contributionAmount, contributionFrequency }
 */

export const DEMO_ACCOUNTS = [
  /* ───────────────── Persona 1 — Emily ───────────────── */
  {
    account: {
      id:       'demo-emily',
      username: 'emily',
      password: 'emilypassword',
      email:    'emily@2amshoppers.com',
      name:     'Emily',
      role:     'student',
      demo:     true,
    },
    // Shown on the quick-login picker
    card: {
      emoji: '💄',
      label: 'Emily',
      tagline: 'Student · 18 · KOL',
      blurb: 'Beauty, fashion & travel vlogging. Trendy, always saving for the next trip.',
      accent: 'student',
    },
    profile: {
      kind: 'shopper',
      data: {
        name: 'Emily',
        userType: 'student',
        interests: ['Beauty', 'Fashion', 'Travel', 'Content Creation'],
        budget: 60,
        quietStart: '23:00',
        quietEnd: '09:00',
        paydayDate: '1',           // allowance day-of-month
        notifFreq: 'frequent',
        allowance: 120,
        essentialReserveStudent: 40,
        savingsAllocation: 30,
        gamificationEnabled: true,
      },
    },
    goals: [
      { name: 'Korea trip ✈️', icon: '✈️', targetAmount: 800, currentAmount: 260, contributionAmount: 30, contributionFrequency: 'weekly' },
      { name: 'Ring light + tripod', icon: '🎥', targetAmount: 150, currentAmount: 90, contributionAmount: 20, contributionFrequency: 'weekly' },
    ],
  },

  /* ───────────────── Persona 2 — John ───────────────── */
  {
    account: {
      id:       'demo-john',
      username: 'john',
      password: 'johnpassword',
      email:    'john@2amshoppers.com',
      name:     'John',
      role:     'working',
      demo:     true,
    },
    card: {
      emoji: '💪',
      label: 'John',
      tagline: 'Working youth · 25',
      blurb: 'Gym life & protein shakes. Collects Shinchan merch. Fitness for life.',
      accent: 'working',
    },
    profile: {
      kind: 'shopper',
      data: {
        name: 'John',
        userType: 'working',
        interests: ['Fitness', 'Supplements', 'Collectibles', 'Activewear'],
        budget: 300,
        quietStart: '22:30',
        quietEnd: '07:00',
        paydayDate: '25',
        notifFreq: 'occasional',
        income: 3200,
        essentialReserve: 1800,
        savingsAllocation: 500,
        buffer: 300,
      },
    },
    goals: [
      { name: 'Shinchan figure set', icon: '🧸', targetAmount: 120, currentAmount: 80, contributionAmount: 40, contributionFrequency: 'monthly' },
      { name: 'New lifting shoes', icon: '👟', targetAmount: 180, currentAmount: 60, contributionAmount: 60, contributionFrequency: 'monthly' },
    ],
  },

  /* ───────────────── Admin — Student case ───────────────── */
  {
    account: {
      id:       'demo-admin-student',
      username: 'student',
      password: 'student',
      email:    'student@2amshoppers.com',
      name:     'Demo Student',
      role:     'student',
      demo:     true,
    },
    card: {
      emoji: '🎓',
      label: 'Student (demo)',
      tagline: 'Ready-to-go student account',
      blurb: 'A clean student profile with a weekly budget and a sample goal.',
      accent: 'student',
    },
    profile: {
      kind: 'shopper',
      data: {
        name: 'Demo Student',
        userType: 'student',
        interests: ['Fashion', 'Coffee', 'Food & Snacks'],
        budget: 40,
        quietStart: '22:00',
        quietEnd: '08:00',
        paydayDate: '1',
        notifFreq: 'occasional',
        allowance: 80,
        essentialReserveStudent: 45,
        savingsAllocation: 15,
        gamificationEnabled: true,
      },
    },
    goals: [
      { name: 'New sneakers', icon: '👟', targetAmount: 60, currentAmount: 20, contributionAmount: 15, contributionFrequency: 'weekly' },
    ],
  },

  /* ───────────────── Admin — Working adult case ───────────────── */
  {
    account: {
      id:       'demo-admin-working',
      username: 'working',
      password: 'working',
      email:    'working@2amshoppers.com',
      name:     'Demo Working Adult',
      role:     'working',
      demo:     true,
    },
    card: {
      emoji: '💼',
      label: 'Working Adult (demo)',
      tagline: 'Ready-to-go working account',
      blurb: 'A monthly plan with reserves, savings and a sample reorder goal.',
      accent: 'working',
    },
    profile: {
      kind: 'shopper',
      data: {
        name: 'Demo Working Adult',
        userType: 'working',
        interests: ['Coffee', 'Workday Essentials', 'Home & Living'],
        budget: 300,
        quietStart: '22:00',
        quietEnd: '08:00',
        paydayDate: '25',
        notifFreq: 'occasional',
        income: 2400,
        essentialReserve: 1500,
        savingsAllocation: 400,
        buffer: 200,
      },
    },
    goals: [
      { name: 'Holiday fund', icon: '🏖️', targetAmount: 1000, currentAmount: 350, contributionAmount: 200, contributionFrequency: 'monthly' },
    ],
  },

  /* ───────────────── Admin — Business case ───────────────── */
  {
    account: {
      id:       'demo-admin-business',
      username: 'business',
      password: 'business',
      email:    'business@2amshoppers.com',
      name:     'Brew & Bites',
      role:     'business',
      demo:     true,
    },
    card: {
      emoji: '🏪',
      label: 'Business (demo)',
      tagline: 'Ready-to-go merchant account',
      blurb: 'A café merchant with a goal to win back repeat coffee customers.',
      accent: 'business',
    },
    profile: {
      kind: 'merchant',
      data: {
        name: 'Brew & Bites',
        businessName: 'Brew & Bites',
        category: 'Café',
        goal: 'repeat_purchase',
        contactCapPerWeek: 2,
      },
    },
    goals: [],
  },

  /* ───────────────── Super admin (full access) ───────────────── */
  {
    account: {
      id:       'admin-001',
      username: 'user',
      password: 'password',
      email:    'admin@2amshoppers.com',
      name:     'Admin',
      role:     'admin',
      demo:     true,
    },
    card: {
      emoji: '⚡',
      label: 'Admin',
      tagline: 'Full access · all modes',
      blurb: 'Pick any mode at the selector. Skips onboarding everywhere.',
      accent: 'admin',
    },
    profile: null,   // admin chooses mode at the selector
    goals: [],
  },
];

/** Just the account objects (for seeding the auth store). */
export const DEMO_ACCOUNT_LIST = DEMO_ACCOUNTS.map(d => d.account);

/** Find a demo bundle by account id. */
export function getDemoBundle(accountId) {
  return DEMO_ACCOUNTS.find(d => d.account.id === accountId) ?? null;
}
