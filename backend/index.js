import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";
import connectDB  from "./utils/db.js";
import authRouter from "./src/routes/authRoutes.js";
import tokenRouter from "./src/routes/tokenRoutes.js";
import walletRouter from "./src/routes/walletRoutes.js";
import { verifyToken } from "./src/middlewares/authMiddleware.js";
import "./src/config/passport.js";
import marketRouter from "./src/routes/marketRoutes.js";

dotenv.config();
const app = express();
app.use(express.json());

connectDB();

app.use(cors({
  origin: "http://localhost:5173", // Allow frontend dev server
  credentials: true // Optional, needed if you're using cookies or authentication headers
}));

// Initialize Passport
app.use(passport.initialize());

// Routes
app.use("/auth", authRouter);
app.use("/api/wallet", walletRouter);
app.use("/token", tokenRouter);
app.use("/api/market", marketRouter);

// Example protected route
app.get("/protected", verifyToken, (req, res) => {
    res.json({ message: "🔒 Access granted", user: req.user });
});

// Home route
app.get("/", (req, res) => {
    res.status(200).send("Welcome to the Home Page!");
});

// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});