const express = require('express');
const app = express();
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const path = require('path');
const cors = require('cors'); // Import the cors middleware


app.use(cors());

// Connect to the database
sequelize
  .authenticate()
  .then(() => console.log('Database connected'))
  .catch((error) => console.error('Unable to connect to the database:', error));

// Sync models with the database
const User = require('./models/User'); // Import User model
sequelize.sync({ force: false }) // Use { force: true } to drop existing tables and recreate them
  .then(() => {
    console.log('Database synchronized successfully');
  })
  .catch((error) => {
    console.error('Error synchronizing database:', error);
  });

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
