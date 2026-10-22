import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Shopper routes
import wishlistRouter      from './routes/wishlist.js';
import conversationRouter  from './routes/conversations.js';
import remindersRouter     from './routes/reminders.js';
import savingsRouter       from './routes/savings.js';
import expensesRouter      from './routes/expenses.js';
import connectionsRouter   from './routes/connections.js';
import assistantRouter     from './routes/assistant.js';

// Business routes
import catalogueRouter     from './routes/catalogue.js';
import customersRouter     from './routes/customers.js';
import journeysRouter      from './routes/journeys.js';
import dashboardRouter     from './routes/dashboard.js';
import supportRouter       from './routes/support.js';

import { errorHandler }    from './middleware/errorHandler.js';
import { initDb }          from './db/init.js';

const app  = express();
const PORT = process.env.PORT ?? 3001;

// ── Middleware ───────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:3003', credentials: true }));
app.use(express.json());

// ── Shopper ──────────────────────────────────────────────────
app.use('/api/wishlist',      wishlistRouter);
app.use('/api/conversations', conversationRouter);
app.use('/api/reminders',     remindersRouter);
app.use('/api/savings',       savingsRouter);     // goals + ledger
app.use('/api/expenses',      expensesRouter);    // spending records + budget summary
app.use('/api/connections',   connectionsRouter); // hub + saved links + import
app.use('/api/assistant',     assistantRouter);   // Hoot chat (Claude)

// ── Business ─────────────────────────────────────────────────
app.use('/api/catalogue',     catalogueRouter);
app.use('/api/customers',     customersRouter);
app.use('/api/journeys',      journeysRouter);
app.use('/api/dashboard',     dashboardRouter);
app.use('/api/support',       supportRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Error handler ─────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
initDb();
app.listen(PORT, () => {
  console.log(`[2am-shoppers] Backend running on http://localhost:${PORT}`);
});
