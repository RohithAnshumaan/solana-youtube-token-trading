import express from 'express';
import { getDashboard } from '../controllers/profileController';
import { verifyToken } from '../middlewares/authMiddleware';

const profileRouter = express.Router();

profileRouter.get("/profile", verifyToken, getDashboard); 

export default profileRouter;
