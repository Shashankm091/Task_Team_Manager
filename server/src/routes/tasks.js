const express = require('express');
const { check } = require('express-validator');
const { protect, authorizeRoles } = require('../middleware/auth');
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
} = require('../controllers/taskController');

const router = express.Router();

// All task routes are protected
router.use(protect);

router.get('/', getTasks);

router.post(
  '/',
  authorizeRoles('Admin'),
  [
    check('title', 'Task title is required').not().isEmpty(),
    check('due_date', 'Valid due date is required').isISO8601().toDate(),
    check('project', 'Project ID is required').isMongoId(),
    check('assigned_to', 'Assigned User ID is required').isMongoId(),
  ],
  createTask
);

router.put(
  '/:id',
  authorizeRoles('Admin'),
  [
    check('title', 'Task title is required').optional().not().isEmpty(),
    check('due_date', 'Valid due date is required').optional().isISO8601().toDate(),
    check('project', 'Project ID is required').optional().isMongoId(),
    check('assigned_to', 'Assigned User ID is required').optional().isMongoId(),
  ],
  updateTask
);

router.delete('/:id', authorizeRoles('Admin'), deleteTask);

router.patch('/:id/status', updateTaskStatus);

module.exports = router;
