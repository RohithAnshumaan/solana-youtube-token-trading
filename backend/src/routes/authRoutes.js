import express from "express";
import passport from "passport";
import {isLoggedIn, loginFailure, loginSuccess, logout } from "../controllers/authController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const authRouter = express.Router();

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
authRouter.get('/isLoggedIn', verifyToken, isLoggedIn)

authRouter.get('/session', verifyToken, (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const {
        googleId,
        displayName,
        email,
        solWalletPublicKey,
        solWalletSecretKey,
        solBalance,
    } = user;

    res.json({
        googleId,
        displayName,
        email,
        solWalletPublicKey,
        solWalletSecretKey,
        solBalance,
    });
});

export default authRouter;