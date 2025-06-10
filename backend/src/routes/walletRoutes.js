import express from "express";
import { createWallet, depositHistory, depositSOL } from "../controllers/walletController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const walletRouter = express.Router();

walletRouter.post("/create", createWallet)
walletRouter.post("/deposit", verifyToken, depositSOL);
walletRouter.get("/history", depositHistory);

export default walletRouter;
