import express from 'express';
import agentRoutes from './routes/agent.routes.js';
import interactionRoutes from './routes/interaction.routes.js';
import metricsRoutes from './routes/metrics.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api', agentRoutes);
app.use('/api', interactionRoutes);
app.use('/api', metricsRoutes);

// Error handler middleware (must be last)
app.use(errorHandler as any);

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export app for testing
export { app, server };
