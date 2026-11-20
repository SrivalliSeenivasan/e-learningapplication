require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const User = require('./models/User');
const Course = require('./models/Course');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Seed 10 sample courses
async function seedCourses() {
  const count = await Course.countDocuments();

  if (count === 0) {
    await Course.insertMany([
      {
        title: 'Software Engineering & Scrum',
        category: 'SE',
        lesson: 'Scrum uses short sprints, daily stand-ups, sprint reviews, and retrospectives to deliver working increments.',
        quizQuestion: 'What is the typical duration of a Scrum sprint?',
        options: ['1-2 weeks', '6 months', '1 year'],
        correctAnswer: '1-2 weeks'
      },
      {
        title: 'Web Fundamentals',
        category: 'Web',
        lesson: 'HTML structures content, CSS styles the layout, and JavaScript adds interactivity.',
        quizQuestion: 'Which language structures web page content?',
        options: ['CSS', 'HTML', 'SQL'],
        correctAnswer: 'HTML'
      },
      {
        title: 'Java Programming',
        category: 'Programming',
        lesson: 'Java is an object-oriented programming language used to develop desktop, web, and mobile applications.',
        quizQuestion: 'Which keyword is used to create a class in Java?',
        options: ['function', 'class', 'define'],
        correctAnswer: 'class'
      },
      {
        title: 'Python Programming',
        category: 'Programming',
        lesson: 'Python is a high-level programming language known for its simple syntax and readability.',
        quizQuestion: 'Which symbol is used for comments in Python?',
        options: ['//', '#', '/*'],
        correctAnswer: '#'
      },
      {
        title: 'Database Management System',
        category: 'DBMS',
        lesson: 'DBMS is used to store, manage, retrieve, and organize data efficiently.',
        quizQuestion: 'Which language is used to manage relational databases?',
        options: ['HTML', 'SQL', 'CSS'],
        correctAnswer: 'SQL'
      },
      {
        title: 'Computer Networks',
        category: 'Networking',
        lesson: 'Computer networks allow devices to communicate and share information using protocols.',
        quizQuestion: 'What does LAN stand for?',
        options: ['Local Area Network', 'Large Access Network', 'Long Area Node'],
        correctAnswer: 'Local Area Network'
      },
      {
        title: 'Operating Systems',
        category: 'OS',
        lesson: 'An operating system manages computer hardware, software resources, memory, and processes.',
        quizQuestion: 'Which of these is an operating system?',
        options: ['Linux', 'HTML', 'MySQL'],
        correctAnswer: 'Linux'
      },
      {
        title: 'Data Structures',
        category: 'DS',
        lesson: 'Data structures organize and store data efficiently. Common examples include arrays, stacks, queues, and linked lists.',
        quizQuestion: 'Which data structure follows LIFO?',
        options: ['Queue', 'Stack', 'Tree'],
        correctAnswer: 'Stack'
      },
      {
        title: 'Artificial Intelligence',
        category: 'AI',
        lesson: 'Artificial Intelligence enables machines to perform tasks that normally require human intelligence.',
        quizQuestion: 'What does AI stand for?',
        options: ['Automatic Internet', 'Artificial Intelligence', 'Advanced Integration'],
        correctAnswer: 'Artificial Intelligence'
      },
      {
        title: 'Cyber Security',
        category: 'Security',
        lesson: 'Cybersecurity protects computers, networks, and data from unauthorized access and cyber attacks.',
        quizQuestion: 'Which of these helps protect an online account?',
        options: ['Strong password', 'Sharing passwords', 'Using public passwords'],
        correctAnswer: 'Strong password'
      }
    ]);

    console.log('10 sample courses seeded');
  }
}

// Register user
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Name, email, and password are required.'
      });
    }

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(409).json({
        error: 'Email already registered.'
      });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      message: 'Registered successfully',
      user
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to register user.' });
  }
});

// Login user
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required.'
      });
    }

    const user = await User.findOne({ email, password });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials.'
      });
    }

    res.json({
      message: 'Login successful',
      user
    });

  } catch (err) {
    res.status(500).json({ error: 'Login error.' });
  }
});

// Get all courses
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);

  } catch (err) {
    res.status(500).json({
      error: 'Failed to fetch courses.'
    });
  }
});

// Submit quiz and update progress
app.post('/api/quiz-submit', async (req, res) => {
  try {
    const { userId, courseId, selectedOption } = req.body;

    if (!userId || !courseId || !selectedOption) {
      return res.status(400).json({
        error: 'Missing quiz submission details.'
      });
    }

    const course = await Course.findById(courseId);
    const user = await User.findById(userId);

    if (!course || !user) {
      return res.status(404).json({
        error: 'User or course not found.'
      });
    }

    const isCorrect = selectedOption === course.correctAnswer;
    const score = isCorrect ? 100 : 0;

    const existingIdx = user.progress.findIndex(
      (p) => p.courseId.toString() === courseId
    );

    if (existingIdx > -1) {
      user.progress[existingIdx].score = score;
      user.progress[existingIdx].completed = true;
    } else {
      user.progress.push({
        courseId,
        score,
        completed: true
      });
    }

    await user.save();

    res.json({
      isCorrect,
      score,
      correctAnswer: course.correctAnswer,
      user
    });

  } catch (err) {
    res.status(500).json({
      error: 'Error submitting quiz.'
    });
  }
});

// Connect MongoDB and start server
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB Atlas');

    await seedCourses();

    const port = process.env.PORT || 3000;

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });