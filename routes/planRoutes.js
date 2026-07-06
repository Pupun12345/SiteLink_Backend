const express = require('express');
const {
  getPlans,
  createPlan,
  editPlanAmount,
  deletePlan
} = require('../controllers/planController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/plans', getPlans);
router.post('/plans', createPlan);
router.put('/plans/:id', editPlanAmount);
router.delete('/plans/:id', deletePlan);

module.exports = router;