import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma";

const router = Router();
const SALT_ROUNDS = 12;

// Check if user is authenticated
router.get("/me", (req: Request, res: Response) => {
  if (req.session && req.session.userId) {
    res.json({ authenticated: true, username: req.session.username });
  } else {
    res.json({ authenticated: false });
  }
});

// Login - uses parameterized queries via Prisma (SQL injection safe)
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    // Prisma uses parameterized queries - safe from SQL injection
    const user = await prisma.user.findUnique({
      where: { username: String(username) },
    });

    if (!user) {
      // Use same error message for both cases to prevent user enumeration
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(String(password), user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Set session
    req.session.userId = user.id;
    req.session.username = user.username;

    res.json({ success: true, username: user.username });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout
router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to logout" });
    }
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

// Change credentials (requires authentication)
router.post("/change-credentials", async (req: Request, res: Response) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { currentPassword, newUsername, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ error: "Current password required" });
    }

    if (!newUsername && !newPassword) {
      return res
        .status(400)
        .json({ error: "New username or password required" });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(
      String(currentPassword),
      user.password,
    );

    if (!validPassword) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Build update data
    const updateData: { username?: string; password?: string } = {};

    if (newUsername) {
      // Check if username is already taken (sanitized via Prisma)
      const existing = await prisma.user.findUnique({
        where: { username: String(newUsername) },
      });

      if (existing && existing.id !== user.id) {
        return res.status(400).json({ error: "Username already taken" });
      }

      updateData.username = String(newUsername);
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters" });
      }
      updateData.password = await bcrypt.hash(String(newPassword), SALT_ROUNDS);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Update session with new username if changed
    if (updateData.username) {
      req.session.username = updatedUser.username;
    }

    res.json({ success: true, username: updatedUser.username });
  } catch (error) {
    console.error("Change credentials error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
