import express from "express";
import passport from "passport";
import { googleCallback, loginFailure } from "../controllers/authController.js";

const authRouter = express.Router();

authRouter.get("/google", (req, res, next) => {
    console.log("Initiating Google OAuth");
    next();
}, passport.authenticate("google", {
    scope: ["profile", "email", "https://www.googleapis.com/auth/youtube.readonly"], accessType: 'offline',
    prompt: 'consent'
}));

authRouter.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/auth/login-failure" }),
    googleCallback
);

// Optional: Login failure
authRouter.get("/login-failure", loginFailure);

export default authRouter;