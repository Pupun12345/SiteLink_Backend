const express = require('express');
const {
  getPlans,
  createPlan,
  editPlanAmount,
  deletePlan
} = require('../controllers/planController');
const { protect, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/plans', getPlans);
router.post('/plans', requireAdmin, createPlan);
router.put('/plans/:id', requireAdmin, editPlanAmount);
router.delete('/plans/:id', requireAdmin, deletePlan);

module.exports = router;