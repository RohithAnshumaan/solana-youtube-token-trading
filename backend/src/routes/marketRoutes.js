import express from "express";
import { getAllTokens } from "../controllers/marketController.js";

const marketRouter = express.Router();

marketRouter.get("/", getAllTokens);

export default marketRouter;
