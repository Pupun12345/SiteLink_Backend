const express = require('express');
const { getAllSkills, getSkillById} = require ('../controllers/skillsController');

const router = express.Router();

router.get('/', getAllSkills);
router.get('/:id', getSkillById);

module.exports = router;
