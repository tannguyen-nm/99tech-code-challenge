import { Router } from 'express';
import { TaskController } from '../controllers/task.controller.js';

const router = Router();
const taskController = new TaskController();

/**
 * Task CRUD Routes
 */

// Create a new task
router.post('/', (req, res, next) => taskController.create(req, res, next));

// List all tasks with filters
router.get('/', (req, res, next) => taskController.list(req, res, next));

// Get a single task by ID
router.get('/:id', (req, res, next) => taskController.getById(req, res, next));

// Update a task
router.put('/:id', (req, res, next) => taskController.update(req, res, next));

// Delete a task
router.delete('/:id', (req, res, next) => taskController.delete(req, res, next));

export default router;
