import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();


export const loginSuccess = (req, res) => {

    if (req.user) {
        res.cookie('access_token', req.user.accessToken, {
            httpOnly: true,       // Prevents client-side JS from accessing the cookie
        });
        res.redirect("http://localhost:5173/");
    } else {
        res.status(401).json({ success: false, message: 'Not authenticated' });
    }
};

export const logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logout successful' });
    });
};

export const googleCallback = (req, res) => {
    try {
        const token = jwt.sign(
            { userId: req.user._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.redirect(`http://localhost:5173/oauth/callback?token=${token}`);
    } catch (err) {
        res.status(500).json({ message: "Error generating token", error: err.message });
    }
};

export const loginFailure = (req, res) => {
    res.status(401).json({ message: "Login failed. Please try again." });
};

export const isLoggedIn = async (req, res) => {
    try {
        const user = req.user;
        if(!user){
            return res.status(401).json({message: "Unauthorized"});
        }
        // Return a success flag or user data
        return res.json({
            success: true,
            message: "User is authenticated.",
            user,
        });
    } catch (error) {
        console.error("isLoggedIn error:", error);
        res.status(500).json({ message: "Server error." });
    }
};
