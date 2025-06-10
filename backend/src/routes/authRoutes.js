import express from "express";
import passport from "passport";
import {loginFailure, loginSuccess, logout } from "../controllers/authController.js";

const authRouter = express.Router();

// authRouter.get("/google", (req, res, next) => {
//     console.log("Initiating Google OAuth");
//     next();
// }, passport.authenticate("google", {
//     scope: ["profile", "email", "https://www.googleapis.com/auth/youtube.readonly"], accessType: 'offline',
//     prompt: 'consent'
// }));
// 

authRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email', "https://www.googleapis.com/auth/youtube.readonly"] }));
authRouter.get(
    '/google/callback',
    passport.authenticate('google', {
        successRedirect: '/auth/success',
        failureRedirect: '/auth/login',
    })
);

authRouter.get('/success', loginSuccess);
authRouter.get('/failure', loginFailure);
authRouter.get('/logout', logout);

// authRouter.get(
//     "/google/callback",
//     passport.authenticate("google", { session: false, failureRedirect: "/auth/login-failure" }),
//     googleCallback
// );

// // Optional: Login failure
// authRouter.get("/login-failure", loginFailure);

export default authRouter;