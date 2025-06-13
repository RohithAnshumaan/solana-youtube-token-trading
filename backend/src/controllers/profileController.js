export const getDashboard = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({user});
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Server error" });
  }
};
