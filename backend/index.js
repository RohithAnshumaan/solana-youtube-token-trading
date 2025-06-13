import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";
import connectDB from "./utils/db.js";
import authRouter from "./src/routes/authRoutes.js";
import tokenRouter from "./src/routes/tokenRoutes.js";
import walletRouter from "./src/routes/walletRoutes.js";
import { verifyToken } from "./src/middlewares/authMiddleware.js";
import session from "express-session";
import "./src/config/passport.js";
import marketRouter from "./src/routes/marketRoutes.js";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { startWebSocketListeners } from "./services/listener.js";
import { initSocket } from "./services/socket.js";
import profileRouter from "./src/routes/profileRoutes.js";


dotenv.config();

const app = express();
const server = createServer(app); // ✅ Create raw HTTP server
const io = initSocket(server);
app.use(express.json());
app.use(cookieParser());
connectDB();

app.use(cors({
  origin: "http://localhost:5173", // Allow frontend dev server
  credentials: true // Optional, needed if you're using cookies or authentication headers
}));

// Initialize Passport
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
// Routes
app.use("/auth", authRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/token", tokenRouter);
app.use("/api/market", marketRouter);
app.use("/api/profile", profileRouter);

// Example protected route
app.get("/protected", verifyToken, (req, res) => {
  res.json({ message: "🔒 Access granted", user: req.user });
});


// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  startWebSocketListeners(io);
});