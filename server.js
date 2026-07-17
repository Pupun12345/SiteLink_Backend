const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const app = express();
// Behind Render/Nginx: trust the first proxy so req.ip is the real client IP
// (needed for rate limiting to work per-user instead of per-proxy).
app.set('trust proxy', 1);
const cors = require('cors');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const communityRoutes = require('./routes/communityRoutes');
const { trackApiRequest } = require('./middleware/apiTracker');
const jobRoutes = require('./routes/jobRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const legalRoutes = require('./routes/legalRoutes');
const amenityRoutes = require('./routes/amenityRoutes');

// API Request Tracking Middleware
app.use(trackApiRequest);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/community', communityRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/legal', legalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/plans', require('./routes/planRoutes'));
app.use('/api/amenities', amenityRoutes);
app.use('/api/payments', require('./routes/paymentRoutes'));



// Test auth page
app.get('/test-auth', (req, res) => {
  res.sendFile(__dirname + '/server.html');
});

//TESTING PURPOSES
// FCM Token page
app.get('/get-fcm-token', (req, res) => {
  res.sendFile(__dirname + '/get-fcm-token.html');
});

// Firebase service worker (must be served from root scope)
app.get('/firebase-messaging-sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(__dirname + '/firebase-messaging-sw.js');
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SiteLink API is running',
    version: '1.0.0',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use(errorHandler);

// Start server only after DB is connected and indexes are fixed
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});


