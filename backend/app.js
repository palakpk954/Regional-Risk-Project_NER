const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const monitoringRoutes = require('./routes/monitoring');

const app = express();

app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/himalya_watch';
mongoose
  .connect(mongoUri)
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((error) => {
    console.warn(`MongoDB connection failed: ${error.message}`);
  });

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Placement Dashboard API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/monitoring', monitoringRoutes);

module.exports = app;