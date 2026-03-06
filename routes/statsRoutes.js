const express=require('express');
const { totalWorkers, totalVendors } = require('../controllers/statsController');
const { adminOnly } = require('../middleware/auth');

const router=express.Router();


router.get('/total-workers', adminOnly, totalWorkers);
router.get('/total-vendors', adminOnly, totalVendors);

module.exports=router;