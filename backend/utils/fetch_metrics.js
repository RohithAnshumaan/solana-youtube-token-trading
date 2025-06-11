import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const API_KEY = process.env.GOOGLE_API_KEY;

class ChannelMetrics {
    constructor(channel_name, channel_handle, subscribers, total_views, total_videos, avg_recent_views, avg_recent_likes, thumbnail_url) {
        this.channel_name = channel_name;
        this.channel_handle = channel_handle;
        this.subscribers = subscribers;
        this.total_views = total_views;
        this.total_videos = total_videos;
        this.avg_recent_views = avg_recent_views;
        this.avg_recent_likes = avg_recent_likes;
        this.thumbnail_url = thumbnail_url;
    }
}

class YouTubeChannelAnalyzer {
    constructor(apiKey = API_KEY) {
        this.apiKey = apiKey;
    }

    async getChannelMetrics(username) {
        try {
            const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=@${username}&key=${this.apiKey}`;
            const channelResponse = await axios.get(channelUrl);
            const data = channelResponse.data;

            if (!data.items || data.items.length === 0) {
                console.error(`Channel '${username}' not found or API quota exceeded.`);
                return null;
            }

            const channel = data.items[0];
            const title = channel.snippet.title;
            const thumbnail = channel.snippet.thumbnails.medium.url;
            const subs = parseInt(channel.statistics.subscriberCount);
            const total_views = parseInt(channel.statistics.viewCount);
            const total_videos = parseInt(channel.statistics.videoCount);
            const uploads_playlist = channel.contentDetails.relatedPlaylists.uploads;

            const [avg_views, avg_likes] = await this.getRecentVideoMetrics(uploads_playlist);

            return new ChannelMetrics(
                title,
                `@${username}`,
                subs,
                total_views,
                total_videos,
                avg_views,
                avg_likes,
                thumbnail
            );
        } catch (error) {
            console.error(`Error fetching channel data: ${error}`);
            return null;
        }
    }

    async getRecentVideoMetrics(uploads_playlist) {
        try {
            const videosUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploads_playlist}&maxResults=10&key=${this.apiKey}`;
            const videosResponse = await axios.get(videosUrl);
            const data = videosResponse.data;

            if (!data.items) {
                return [0, 0];
            }

            const videoIds = data.items.map(item => item.snippet.resourceId.videoId);
            return await this.getVideoStatistics(videoIds);
        } catch (error) {
            console.error(`Error fetching video metrics: ${error}`);
            return [0, 0];
        }
    }

    async getVideoStatistics(videoIds) {
        try {
            const ids = videoIds.join(',');
            const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids}&key=${this.apiKey}`;
            const response = await axios.get(url);
            const data = response.data;

            let total_views = 0;
            let total_likes = 0;

            if (data.items) {
                data.items.forEach(item => {
                    const stats = item.statistics;
                    total_views += parseInt(stats.viewCount || "0");
                    total_likes += parseInt(stats.likeCount || "0");
                });
            }

            const count = videoIds.length;
            return [
                count > 0 ? Math.floor(total_views / count) : 0,
                count > 0 ? Math.floor(total_likes / count) : 0
            ];
        } catch (error) {
            console.error(`Error getting video statistics: ${error}`);
            return [0, 0];
        }
    }
}

// Export classes for use in other modules
export { ChannelMetrics, YouTubeChannelAnalyzer };
