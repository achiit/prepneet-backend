const jwt = require('jsonwebtoken');
const cors = require('cors'); // Import the cors middleware

// Authenticate user using JWT token
exports.authenticate = (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization');

  // Check if token is present
  if (!token) {
    return res.status(401).json({ message: 'Authorization denied, please provide a valid token' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token.split(' ')[1], 'jwtSecret');

    // Add user to request object
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
