

const router = require('express').Router();
const ctrl = require('../controllers/admin.auth.controller');
const {
  protectAdmin,
  superAdminOnly,
  adminLoginRateLimit,
  logAdminAction,
} = require('../middleware/admin.auth.middleware');

// ── Public Routes (no token required) ────────────────────────────────────────
router.post('/login', adminLoginRateLimit, ctrl.login);
router.post('/refresh', ctrl.refresh);

// ── Protected Routes (valid admin token required) ─────────────────────────────
router.post('/logout', protectAdmin, ctrl.logout);
router.get('/me', protectAdmin, ctrl.getMe);
router.put('/me', protectAdmin, ctrl.updateMe);
router.put('/change-password', protectAdmin, logAdminAction('CHANGE_PASSWORD'), ctrl.changePassword);

// ── Super Admin Only ──────────────────────────────────────────────────────────
router.post('/create', protectAdmin, superAdminOnly, logAdminAction('CREATE_ADMIN'), ctrl.createAdmin);
router.get('/list', protectAdmin, superAdminOnly, ctrl.listAdmins);
router.get('/activity', protectAdmin, superAdminOnly, ctrl.getActivityLog);
router.put('/toggle/:id', protectAdmin, superAdminOnly, logAdminAction('TOGGLE_ADMIN'), ctrl.toggleAdmin);
router.put('/permissions/:id', protectAdmin, superAdminOnly, logAdminAction('UPDATE_PERMISSIONS'), ctrl.updatePermissions);
router.delete('/:id', protectAdmin, superAdminOnly, logAdminAction('DELETE_ADMIN'), ctrl.deleteAdmin);

module.exports = router;
