const express = require('express');
const { check } = require('express-validator');
const { protect, authorizeRoles } = require('../middleware/auth');
const {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
} = require('../controllers/projectController');

const router = express.Router();

// All project routes are protected
router.use(protect);

router.get('/', getProjects);

router.post(
  '/',
  authorizeRoles('Admin'),
  [
    check('name', 'Project name is required').not().isEmpty(),
    check('deadline', 'Valid deadline date is required').isISO8601().toDate(),
  ],
  createProject
);

router.put(
  '/:id',
  authorizeRoles('Admin'),
  [
    check('name', 'Project name is required').optional().not().isEmpty(),
    check('deadline', 'Valid deadline date is required').optional().isISO8601().toDate(),
  ],
  updateProject
);

router.delete('/:id', authorizeRoles('Admin'), deleteProject);

// Project member management
router.post('/:id/members', authorizeRoles('Admin'), addProjectMember);
router.delete('/:id/members/:userId', authorizeRoles('Admin'), removeProjectMember);

module.exports = router;
