import express from 'express';
import taskRoutes from './routes/task.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/tasks', taskRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Task CRUD API Server',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      tasks: {
        create: 'POST /api/tasks',
        list: 'GET /api/tasks',
        get: 'GET /api/tasks/:id',
        update: 'PUT /api/tasks/:id',
        delete: 'DELETE /api/tasks/:id',
      },
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  🚀 Server running on http://localhost:${PORT}`);
  console.log(`${'='.repeat(60)}\n`);
  console.log(`  📋 Available endpoints:`);
  console.log(`     GET    /              - API information`);
  console.log(`     GET    /health        - Health check`);
  console.log(`     POST   /api/tasks     - Create task`);
  console.log(`     GET    /api/tasks     - List tasks`);
  console.log(`     GET    /api/tasks/:id - Get task`);
  console.log(`     PUT    /api/tasks/:id - Update task`);
  console.log(`     DELETE /api/tasks/:id - Delete task`);
  console.log(`\n${'='.repeat(60)}\n`);
});
