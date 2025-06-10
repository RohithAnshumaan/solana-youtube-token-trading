import express from 'express';
import { getDashboard } from '../controllers/profileController';

const profileRouter = express.Router();

profileRouter.get("/profile", getDashboard); 

export default profileRouter;
