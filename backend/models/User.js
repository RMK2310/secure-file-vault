const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String },
  webauthnCredentials: [{
    id: String,
    publicKey: String,
    transports: [String],
    createdAt: { type: Date, default: Date.now }
  }],
  recoveryEmail: { type: String },
  files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
