const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Function to read questions from a JSON file
const readQuestionsFromFile = (fileName) => {
  const filePath = path.join(__dirname, '..', 'data', fileName);
  const rawData = fs.readFileSync(filePath);
  return JSON.parse(rawData);
};

// Function to select random questions
const selectRandomQuestions = (questions, count) => {
  const shuffledQuestions = questions.sort(() => 0.5 - Math.random());
  return shuffledQuestions.slice(0, count);
};

// Function to add serial number to questions
const addSerialNumbers = (questions) => {
  let id = 1;
  return questions.map((question) => ({
    ...question,
    id: id++
  }));
};

// Create final paper with questions from all subjects
// Create final paper with questions from all subjects
exports.createFinalPaper = (req, res) => {
  try {
    // Read questions from all subjects
    const biologyQuestions = readQuestionsFromFile('biology.json');
    const physicsQuestions = readQuestionsFromFile('physics.json');
    const chemistryQuestions = readQuestionsFromFile('chemistry.json');

    // Filter MCQ questions from each subject
    const biologyMCQQuestions = biologyQuestions.filter((question) => question.quiz_type === 'mcq');
    const physicsMCQQuestions = physicsQuestions.filter((question) => question.quiz_type === 'mcq');
    const chemistryMCQQuestions = chemistryQuestions.filter((question) => question.quiz_type === 'mcq');

    // Select random MCQ questions from each subject
    const randomBiologyQuestions = selectRandomQuestions(biologyMCQQuestions, 90);
    const randomPhysicsQuestions = selectRandomQuestions(physicsMCQQuestions, 45);
    const randomChemistryQuestions = selectRandomQuestions(chemistryMCQQuestions, 45);

    // Combine questions from all subjects
    const combinedQuestions = [
      ...randomBiologyQuestions,
      ...randomPhysicsQuestions,
      ...randomChemistryQuestions
    ];

    // Add serial numbers to questions
    const finalPaper = addSerialNumbers(combinedQuestions);

    // Write final paper to finalpaper.json file
    const finalPaperFilePath = path.join(__dirname, '..', 'data', 'finalpaper.json');
    fs.writeFileSync(finalPaperFilePath, JSON.stringify(finalPaper, null, 2));

    res.json({ message: 'Final paper created successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};


// Fetch final paper
exports.fetchFinalPaper = (req, res) => {
  try {
    // Read final paper from file
    const finalPaperFilePath = path.join(__dirname, '..', 'data', 'finalpaper.json');
    const rawData = fs.readFileSync(finalPaperFilePath);
    const finalPaper = JSON.parse(rawData);
    res.json(finalPaper);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, email, phoneNumber, batch, password, repeater } = req.body;

    // Check if the user already exists
    let user = await User.findOne({ where: { email } });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    user = await User.create({
      username,
      email,
      phoneNumber,
      batch,
      password: hashedPassword,
      repeater,
    }); 

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Login user and generate JWT token
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create and return JWT token
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(payload, 'jwtSecret', { expiresIn: '1h' }, (error, token) => {
      if (error) throw error;
      res.json({ token });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};


// Function to read final paper from JSON file
const readFinalPaperFromFile = () => {
  const filePath = path.join(__dirname, '..', 'data', 'finalpaper.json');
  const rawData = fs.readFileSync(filePath);
  return JSON.parse(rawData);
};

// Function to calculate marks awarded
const calculateMarks = (userAnswers, finalPaper) => {
  let totalMarks = 0;
  const result = finalPaper.map((question) => {
    const questionId = question.id.toString();
    const userAnswer = userAnswers[questionId];
    const correctAnswer = question.answer;

    let marks = 0;
    if (userAnswer === correctAnswer) {
      marks = 4; // Correct answer: +4 marks
      totalMarks += 4;
    } else if (userAnswer === null) {
      // If no answer is selected
      marks = 0; // No answer: 0 marks
    } else {
      marks = -1; // Wrong answer: -1 mark
      totalMarks -= 1;
    }

    return {
      question: question.question,
      questionId: question.id, 
      userAnswer,
      correctAnswer,
      marks
    };
  });

  return { result, totalMarks };
};

// API endpoint to check user's answers
exports.checkAnswers = (req, res) => {
  try {
    // Get user's answers from request body
    const userAnswers = req.body;

    // Read final paper from file
    const finalPaper = readFinalPaperFromFile();

    // Calculate marks awarded
    const { result, totalMarks } = calculateMarks(userAnswers, finalPaper);

    // Prepare response
    const response = {
      result,
      totalMarks
    };

    res.json(response);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};
