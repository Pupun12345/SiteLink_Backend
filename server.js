const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const app = express();
const cors = require('cors');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const communityRoutes = require('./routes/communityRoutes');
const { trackApiRequest } = require('./middleware/apiTracker');
const jobRoutes = require('./routes/jobRoutes');
// const skillsRoutes = require('./routes/skillsRoutes');
// const statsRoutes = require('./routes/statsRoutes');
// const searchRoutes = require('./routes/searchRoutes');
// const adminRoutes = require('./routes/adminRoutes');
// const adminUserRoutes = require('./routes/adminUserRoutes');
// const workerHomeRoutes = require('./routes/workerHomePage');
// const systemRoutes = require('./routes/systemRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
// const platformSettingRoutes = require('./routes/platformSettingRoutes');

connectDB();

// API Request Tracking Middleware
app.use(trackApiRequest)
app.use('/api', trackApiRequest);

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
// app.use('/api/help-support', require('./routes/helpSupportRoutes'));
// app.use('/api/legal', require('./routes/legalRoutes'));
// app.use('/api/stats', statsRoutes);
// app.use('/api/admin-users', adminUserRoutes);
// app.use('/api/search', searchRoutes);
// app.use('/api/skills', skillsRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/worker', workerHomeRoutes);
// app.use('/api/system', systemRoutes);
app.use('/api/notifications', notificationRoutes);
// app.use('/api/platform-settings', platformSettingRoutes);

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

app.get('/get-fcm-token', (req, res) => {
  res.sendFile(__dirname + '/get-fcm-token.html');
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

app.get('/test-auth', (req, res) => {
  res.sendFile(__dirname + '/server.html');
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


