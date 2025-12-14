const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// ADD THESE 2 LINES ⬇️
const authRoutes = require('./routes/auth');
//const fileRoutes = require('./routes/files'); // Create later
// ⬆️

const app = express();

// Security middleware (OWASP basics)
app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ADD THESE 2 LINES ⬇️
app.use('/api/auth', authRoutes);
//app.use('/api/files', fileRoutes);
// ⬆️

// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Secure File Vault Backend ✅', timestamp: new Date() });
});

console.log('🚀 Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔒 Secure File Vault running on http://localhost:${PORT}`);
});
