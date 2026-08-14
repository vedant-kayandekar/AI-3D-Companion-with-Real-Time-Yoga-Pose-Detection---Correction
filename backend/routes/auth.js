import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET || "supersecretjwtkey";

router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username",
      [username, hashedPassword],
    );
    res.status(201).json({ message: "User registered successfully", user: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Username already exists" });
    }
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send("Username and password are required");
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).send("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(400).send("Invalid credentials");
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      jwtSecret,
      { expiresIn: "1h" },
    );

    let chatSessionId;
    const existingSessions = await pool.query(
      "SELECT id FROM chat_sessions WHERE user_id = $1 ORDER BY last_activity_at DESC LIMIT 1",
      [user.id],
    );

    if (existingSessions.rows.length > 0) {
      chatSessionId = existingSessions.rows[0].id;
    } else {
      const newSessionResult = await pool.query(
        "INSERT INTO chat_sessions (user_id) VALUES ($1) RETURNING id",
        [user.id],
      );
      chatSessionId = newSessionResult.rows[0].id;
    }

    res.send({
      message: "Logged in successfully",
      token,
      user: { id: user.id, username: user.username },
      chatSessionId,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send("Server error during login");
  }
});

export default router;
