import express from 'express';
import { getDashboard } from '../controllers/profileController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const profileRouter = express.Router();

profileRouter.get("/", verifyToken, getDashboard); 

export default profileRouter;
