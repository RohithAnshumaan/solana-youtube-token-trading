import express from 'express';
import { buyTokenController, createAMMController, createTokenController, fetchYoutubeChannelData, sellTokenController, getTokenDetails, fetchTokenomics } from '../controllers/tokenController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const tokenRouter = express.Router();

tokenRouter.post('/create-token', verifyToken, createTokenController); 
tokenRouter.post('/create-amm', verifyToken, createAMMController)
tokenRouter.post('/buy', verifyToken, buyTokenController)
tokenRouter.post('/sell', verifyToken, sellTokenController)
tokenRouter.get('/fetch', verifyToken, fetchYoutubeChannelData);
tokenRouter.post('/tokenomics', verifyToken, fetchTokenomics);
tokenRouter.get('/:id', getTokenDetails);

export default tokenRouter;
