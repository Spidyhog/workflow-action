const express = require('express');
const router = express.Router();
const level = require('../controllers');


router.get('/workflow', level.getWorkflow);     //To get all workflows
router.get('/workflow/:id', level.getWorkflowById); //To get a specific workflow

router.get('/level', level.getLevel);           //to get all levels
router.get('/level/:id', level.getLevelById);   //to get details of a specific level
router.put('/workflow', level.updateWorkflow);  //to update a workflow by a user
router.post('/level', level.postData);          //to create the level by admin
router.post('/workflow', level.postWorkflow);   //to create the workflow by the admin

router.get('/test', level.updateWork);          //api for testing

module.exports = router;