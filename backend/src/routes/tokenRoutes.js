import express from 'express';
import axios from 'axios';
import User from '../models/userModel.js' 

const tokenRouter = express.Router();

tokenRouter.get('/create-token/:googleId', async (req, res) => {
  const { googleId } = req.params;

  try {
    const user = await User.findOne({ googleId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2️⃣ Retrieve stored OAuth access token (must be stored after Google login)
    const accessToken = user.accessToken; // You should have stored this when user authenticated via Google
  
    console.log("Access token is ", accessToken);   

    if (!googleId) {
      return res.status(400).json({ error: 'No access token found for this user' });
    }

    // 3️⃣ Make request to YouTube Data API v3 to fetch the user's channel
    const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      params: {
        part: 'snippet,statistics',
        mine: true
      }
    });

    console.log("This is the response", response);

    const channelData = response.data.items[0]; // First channel returned
    console.log(channelData);
    if (!channelData) {
      return res.status(404).json({ error: 'No YouTube channel found for this account' });
    }

    // 4️⃣ Send channel info to frontend
    res.json({
      channelId: channelData.id,
      title: channelData.snippet.title,
      description: channelData.snippet.description,
      subscribers: channelData.statistics.subscriberCount,
      views: channelData.statistics.viewCount,
      thumbnails: channelData.snippet.thumbnails
    });
  } catch (err) {
    console.error('Error fetching YouTube channel:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default tokenRouter;
