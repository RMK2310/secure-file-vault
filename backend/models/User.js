const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String },
  // WebAuthn Credentials
  authenticators: [{
    credentialID: { type: String, required: true },
    credentialPublicKey: { type: String, required: true },
    counter: { type: Number, default: 0 },
    transports: [String],
    credentialDeviceType: { type: String, required: true },
    credentialBackedUp: { type: Boolean, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  // Challenge storage for auth flows
  currentChallenge: { type: String },

  files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Pre-save hook to hash password if modified
userSchema.pre('save', async function (next) {
  console.log('[DEBUG] User pre-save hook. isModified(password):', this.isModified('password'));
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(this.password, salt);
    console.log('[DEBUG] Password hashed. Result length:', hash.length);
    this.password = hash;
    next();
  } catch (error) {
    console.error('[DEBUG] Hashing error:', error);
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);
