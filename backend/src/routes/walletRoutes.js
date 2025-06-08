import express from "express";
import { depositSOL } from "../controllers/walletController.js";

const walletRouter = express.Router();

walletRouter.post("/deposit", depositSOL);

export default walletRouter;
