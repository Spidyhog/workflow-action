const express = require('express');
const router = express.Router();
const level = require('../controllers');


router.get('/workflow', level.getWorkflow);
router.get('/workflow/:id', level.getWorkflowById);

router.get('/level', level.getLevel);
router.get('/level/:id', level.getLevelById);
router.put('/workflow', level.updateWorkflow);
router.post('/level', level.postData);
router.post('/workflow', level.postWorkflow);

router.get('/test', level.updateWork);

module.exports = router;