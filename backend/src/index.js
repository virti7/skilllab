import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import authRoutes from './routes/auth.routes.js';
import batchRoutes from './routes/batch.routes.js';
import testRoutes from './routes/test.routes.js';
import resultRoutes from './routes/result.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true, // allow all origins during development
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/test', testRoutes);
app.use('/api/result', resultRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Error handler (Express 5: async errors are forwarded here automatically)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message || err);
  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 SkillLab backend running on http://localhost:${PORT}`);
});
