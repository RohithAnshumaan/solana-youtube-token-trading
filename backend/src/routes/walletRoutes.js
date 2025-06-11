import express from "express";
import { createOrDepositWallet, depositHistory, getBalance } from "../controllers/walletController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const walletRouter = express.Router();

walletRouter.get("/getbalance", verifyToken, getBalance);
walletRouter.post("/deposit", verifyToken, createOrDepositWallet);
walletRouter.get("/history", verifyToken, depositHistory);

export default walletRouter;
