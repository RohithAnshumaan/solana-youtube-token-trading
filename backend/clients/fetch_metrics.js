import axios from 'axios';

class ChannelMetrics {
    constructor(channel_name, channel_handle, subscribers, total_views, total_videos, avg_recent_views, avg_recent_likes, thumbnail_url) {
        this.channelName = channel_name;
        this.channelHandle = channel_handle;
        this.subscribers = subscribers;
        this.totalViews = total_views;
        this.totalVideos = total_videos;
        this.avgRecentViews = avg_recent_views; // Fixed: was 'avgRecentRiews'
        this.avgRecentLikes = avg_recent_likes;
        this.thumbnailUrl = thumbnail_url;
    }
}

class YouTubeChannelAnalyzer {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    async getChannelMetrics(username) {
        try {
            const handle = `@${username}`;
            const encodedHandle = encodeURIComponent(handle);
            const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${encodedHandle}&key=${this.apiKey}`;

            console.log('Fetching channel data...');
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

            console.log(`Channel found: ${title}`);
            console.log(`Subscribers: ${subs.toLocaleString()}`);

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
            if (error.response) {
                console.error(`YouTube API Error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`);
            } else {
                console.error(`Error fetching channel data: ${error.message}`);
            }
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
            console.error(`Error fetching video metrics: ${error.message}`);
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
            const avgViews = count > 0 ? Math.floor(total_views / count) : 0;
            const avgLikes = count > 0 ? Math.floor(total_likes / count) : 0;

            console.log(`Recent videos analyzed: ${count}`);
            console.log(`Average views: ${avgViews.toLocaleString()}`);
            console.log(`Average likes: ${avgLikes.toLocaleString()}`);

            return [avgViews, avgLikes];
        } catch (error) {
            console.error(`Error getting video statistics: ${error.message}`);
            return [0, 0];
        }
    }
}

// Export classes for use in other modules
export { ChannelMetrics, YouTubeChannelAnalyzer };