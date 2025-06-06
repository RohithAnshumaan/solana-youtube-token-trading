import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const googleCallback = (req, res) => {
    try {
        const token = jwt.sign(
            { userId: req.user._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        // Send JWT as response (alternatively redirect with token)
        res.redirect(`http://localhost:5173/?token=${token}`);
    } catch (err) {
        res.status(500).json({ message: "Error generating token", error: err.message });
    }
};

export const loginFailure = (req, res) => {
    res.status(401).json({ message: "Login failed. Please try again." });
};