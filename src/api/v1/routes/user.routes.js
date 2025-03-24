import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import pool from "../../../config/database.js";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Configure Passport Local Strategy
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return done(null, false, { message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return done(null, false, { message: 'Incorrect password' });
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Configure JWT Strategy
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET
}, async (jwtPayload, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [jwtPayload.id]);
    const user = result.rows[0];
    
    if (!user) {
      return done(null, false);
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Login endpoint
router.post("/login", (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({ 
        message: 'Error during authentication', 
        error: err.message 
      });
    }

    if (!user) {
      return res.status(401).json({ 
        message: 'Authentication failed', 
        error: info.message 
      });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  })(req, res, next);
});

// Register endpoint
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1', 
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, 'patient']
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({ 
      message: 'Error registering user', 
      error: error.message 
    });
  }
});

// Protected route middleware
const authenticate = passport.authenticate('jwt', { session: false });

// Example protected route
router.get("/profile", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching profile', 
      error: error.message 
    });
  }
});

export default router;