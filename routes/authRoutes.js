const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
// User registration
router.post('/register', authController.register);

// User login
router.post('/login', authController.login);
router.get('/', (req, res) => {
    res.send('Hello World!');
})
// router.get('/create-biology-question-paper', authController.createBiologyQuestionPaper);
// router.get('/create-chemistry-question-paper', authController.createChemistryQuestionPaper);
// router.get('/create-physics-question-paper', authController.createPhysicsQuestionPaper);
// Create final paper (non-authenticated route)
router.get('/create-final-paper', authController.createFinalPaper);

router.get('/fetch-final-paper', authMiddleware.authenticate, authController.fetchFinalPaper);
// router.get('/fetch-final-paper',authController.fetchFinalPaper);

router.get('/download-final-paper', (req, res) => {
    const filePath = '/Users/achintya/Desktop/prepneet/backend/data/finalpaper.json'; // Replace with the actual file path
    res.download(filePath, 'finalpaper.json', (error) => {
      if (error) {
        console.error('Error downloading final paper:', error); 
        res.status(500).send('Error downloading final paper');
      }
    });
  });

router.post('/check-answers', authController.checkAnswers);



module.exports = router;
