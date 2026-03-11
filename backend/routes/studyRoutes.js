const express = require('express');
const router = express.Router();
const studyController = require('../controllers/studyController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/add-subject', authMiddleware, studyController.addSubject);
router.get('/subjects', authMiddleware, studyController.getSubjects);
router.post('/generate-study-plan', authMiddleware, studyController.generateStudyPlan);
router.get('/study-plan', authMiddleware, studyController.getStudyPlan);
router.put('/complete-task/:taskId', authMiddleware, studyController.completeTask);

module.exports = router;
