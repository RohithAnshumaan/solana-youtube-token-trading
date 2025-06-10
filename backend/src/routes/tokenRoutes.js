import express from 'express';
import { buyTokenController, createAMMController, createTokenController, sellTokenController } from '../controllers/tokenController.js';

const tokenRouter = express.Router();

tokenRouter.post('/create-token/:googleId', createTokenController); 
tokenRouter.post('/create-amm/:googleId', createAMMController)
tokenRouter.post('/:id/buy', buyTokenController)
tokenRouter.post('/:id/sell/:googleId', sellTokenController)

export default tokenRouter;
