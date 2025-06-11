import User from "../models/userModel.js"

export const getDashboard = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({user});
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Server error" });
  }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
};
