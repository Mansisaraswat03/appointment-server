import express from "express";
// import { auth } from 'express-oauth2-jwt-bearer';
import axios from "axios";
import pool from "../../../config/database.js";
import dotenv from "dotenv";
dotenv.config();
const router = express.Router();

// Auth0 configuration
const auth0Config = {
  domain: process.env.AUTH0_DOMAIN,
  client_id: process.env.AUTH0_CLIENT_ID,
  client_secret: process.env.AUTH0_CLIENT_SECRET,
};

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
console.log("1");
    const tokenResponse = await axios.post(
      `${auth0Config.domain}/oauth/token`,
      {
        grant_type: "password",
        username: email,
        password: password,
        client_id: auth0Config.client_id,
        client_secret: auth0Config.client_secret,
        audience: `${auth0Config.domain}/api/v2/`,
        scope: "openid profile email",
        connection: "Username-Password-Authentication",
      }
    );
console.log("2");
    const userInfo = await axios.get(`${auth0Config.domain}/userinfo`, {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
    });

    const userResult = await pool.query(
      "SELECT * FROM users WHERE auth0_id = $1",
      [userInfo.data.sub]
    );

    let user;
    if (userResult.rows.length === 0) {
      const newUserResult = await pool.query(
        "INSERT INTO users (name, email, auth0_id, role) VALUES ($1, $2, $3, $4) RETURNING *",
        [userInfo.data.name, userInfo.data.email, userInfo.data.sub, "patient"]
      );
      user = newUserResult.rows[0];
    } else {
      user = userResult.rows[0];
    }

    res.json({
      message: "Login successful",
      token: tokenResponse.data.access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(401).json({
      message: "Authentication failed",
      error: error.response?.data?.error_description || error.message,
    });
  }
});

// Register endpoint
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const tokenResponse = await axios.post(
      `${auth0Config.domain}/oauth/token`,
      {
        grant_type: "client_credentials",
        client_id: auth0Config.client_id,
        client_secret: auth0Config.client_secret,
        audience: `${auth0Config.domain}/api/v2/`,
        scope: "create:users read:users",
      }
    );
    const auth0User = await axios.post(
      `${auth0Config.domain}/api/v2/users`,
      {
        email,
        password,
        name,
        connection: "Username-Password-Authentication",
        email_verified: false,
        verify_email: false,
      },
      {
        headers: {
          Authorization: `Bearer ${tokenResponse.data.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const result = await pool.query(
      "INSERT INTO users (name, email, auth0_id, role) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, auth0User.data.user_id, "patient"]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        email: result.rows[0].email,
        role: result.rows[0].role,
      },
    });
  } catch (error) {
    res.status(400).json({
      message: "Error registering user",
      error: error.response?.data?.message || error.message,
    });
  }
});

export default router;
