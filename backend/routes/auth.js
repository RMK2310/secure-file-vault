const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

const router = express.Router();

// RP ID should be your domain name. 'localhost' works for local dev.
const rpID = 'localhost';
const origin = `http://${rpID}:3000`;

// REGISTER PASSWORD
router.post('/register', async (req, res) => {
  console.log('[DEBUG] Register request for:', req.body.email);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      console.log('[DEBUG] User already exists:', email);
      return res.status(400).json({ error: 'User already exists' });
    }

    // Password hashing is handled by pre-save hook in User model
    console.log('[DEBUG] Creating user document...');
    const user = await User.create({
      email,
      password: password,
    });
    console.log('[DEBUG] User created successfully:', user._id);

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user._id, email: user.email },
    });
  } catch (error) {
    console.error('[DEBUG] Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// LOGIN PASSWORD
router.post('/login', async (req, res) => {
  console.log('[DEBUG] Login request for:', req.body.email);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('[DEBUG] User not found during login');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('[DEBUG] User found. Verifying password...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('[DEBUG] Password match result:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (error) {
    console.error('[DEBUG] Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- WEBAUTHN (BIOMETRICS) ENDPOINTS ---

// 1. Generate Registration Options
router.post('/webauthn/register/options', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // For this example, we require the user to exist (e.g. registered via password first) 
    // OR you can create a shell user here. Let's assume user must engage password first or we auto-create.
    // Simplifying: Require user to exist OR create temporary user logic would be complex. 
    // Flow: User logs in with password -> "Enable Biometrics" button.

    // BUT user requested "Store files... includes biometrics and passwords".
    // Let's allow Biometric Registration for an existing user (Protected Route ideally, but for initial setup we can do this):

    // Better flow for "Biometric First" isn't standard without prior identity proof inside the app. 
    // Standard: Login -> Enable Passkey.

    // Let's assume the user is ALREADY Authenticated via JWT for this step?
    // If we want "Passwordless Registration", we need to verify email first.
    // For simplicity: This endpoint expects 'userId' from a protected token request? 
    // No, standard WebAuthn flow often is: Enter Email -> if user, prompting for passkey.

    // Let's implement: "Enable Passkey" (Protected)
    // The user must be logged in to attach a passkey.

    // Wait, if I am not logged in, how do I register? 
    // Option: Register with Password -> Then Add Passkey.
    // Option: Register with Passkey Only (Harder to recover).

    // I will stick to: Protected Route for Registration Options. 
    // Means user must be logged in (via password) to set up biometrics.

    // However, to make it seamless, let's try to handle the request.
    // Actually, let's make it a protected route.

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// RE-IMPLEMENTING PROPERLY AS PROTECTED ROUTE or OPEN ID verification.
// Let's use a non-protected route that checks email, but really it should be protected.
// I will go with: PROTECTED route for REGISTERING a passkey.
router.get('/webauthn/register/options', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    const options = await generateRegistrationOptions({
      rpName: 'Secure File Vault',
      rpID,
      userID: user._id.toString(),
      userName: user.email,
      // Don't exclude existing creds for now, or do:
      excludeCredentials: user.authenticators.map(auth => ({
        id: auth.credentialID,
        type: 'public-key',
        transports: auth.transports,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform', // TouchID/WinHello
      },
    });

    // Save challenge to DB
    user.currentChallenge = options.challenge;
    await user.save();

    res.json(options);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate options' });
  }
});

// 2. Verify Registration
router.post('/webauthn/register/verify', authMiddleware, async (req, res) => {
  try {
    const { body } = req;
    const user = await User.findById(req.user.userId);

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;

      // Save new authenticator
      user.authenticators.push({
        credentialID: Buffer.from(credentialID).toString('base64url'),
        credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64url'),
        counter,
        transports: body.response.transports,
        credentialDeviceType: verification.registrationInfo.credentialDeviceType,
        credentialBackedUp: verification.registrationInfo.credentialBackedUp,
      });

      user.currentChallenge = undefined;
      await user.save();

      res.json({ verified: true });
    } else {
      res.status(400).json({ verified: false, error: 'Verification failed' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Generate Login Options (Public)
router.post('/webauthn/login/options', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const options = await generateAuthenticationOptions({
      allowCredentials: user.authenticators.map(auth => ({
        id: Buffer.from(auth.credentialID, 'base64url'), // Convert back if needed by lib, but usually string is fine if base64url encoded. 
        // SimpleWebAuthn expects base64url strings usually.
        type: 'public-key',
        transports: auth.transports,
      })),
      userVerification: 'preferred',
    });

    user.currentChallenge = options.challenge;
    await user.save();

    res.json(options);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 4. Verify Login (Public)
router.post('/webauthn/login/verify', async (req, res) => {
  try {
    const { email, output } = req.body; // output is the response from browser
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the authenticator used
    const authenticator = user.authenticators.find(
      (auth) => auth.credentialID === output.id
    );

    if (!authenticator) {
      return res.status(400).json({ error: 'Authenticator not found' });
    }

    const verification = await verifyAuthenticationResponse({
      response: output,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: Buffer.from(authenticator.credentialID, 'base64url'),
        credentialPublicKey: Buffer.from(authenticator.credentialPublicKey, 'base64url'),
        counter: authenticator.counter,
      },
    });

    if (verification.verified) {
      const { authenticationInfo } = verification;

      // Update counter
      authenticator.counter = authenticationInfo.newCounter;
      user.currentChallenge = undefined;
      await user.save();

      // Generate JWT
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        verified: true,
        token,
        user: { id: user._id, email: user.email },
      });
    } else {
      res.status(400).json({ verified: false, error: 'Verification failed' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PROTECTED: get current user info
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password -authenticators.credentialPublicKey');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'You are authenticated',
      user,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
