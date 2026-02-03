import express from "express";
import cors from "cors";
import session from "express-session";
import path from "path";
import monthlyRoutes from "./routes/monthly";
import savingsRoutes from "./routes/savings";
import yearlyRoutes from "./routes/yearly";
import authRoutes from "./routes/auth";
import { requireAuth } from "./middleware/auth";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

// Middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? false : "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

// Session configuration
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "finance-gpt-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.COOKIE_SECURE === "true", // Only set to true if behind HTTPS proxy
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  }),
);

// Auth routes (public)
app.use("/api/auth", authRoutes);

// Protected API Routes
app.use("/api/monthly", requireAuth, monthlyRoutes);
app.use("/api/savings", requireAuth, savingsRoutes);
app.use("/api/yearly", requireAuth, yearlyRoutes);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../public")));

  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(__dirname, "../public/index.html"));
    }
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
