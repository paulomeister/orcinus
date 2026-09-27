import express from 'express';
import agentRoutes from './routes/agent.routes';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api', agentRoutes);

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export app for testing
export { app, server };
