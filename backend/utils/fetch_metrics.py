import requests
import json
import sys
from dataclasses import dataclass
from typing import Optional
import os
from dotenv import load_dotenv
load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY")

@dataclass
class ChannelMetrics:
    channel_name: str
    channel_handle: str
    subscribers: int
    total_views: int
    total_videos: int
    avg_recent_views: int
    avg_recent_likes: int
    thumbnail_url: str

class YouTubeChannelAnalyzer:
    def __init__(self, api_key: str):
        self.api_key = api_key
        
    def get_channel_metrics(self, username: str) -> Optional[ChannelMetrics]:
        try:
            channel_url = (
                f"https://www.googleapis.com/youtube/v3/channels"
                f"?part=snippet,statistics,contentDetails&forHandle=@{username}&key={self.api_key}"
            )
            channel_response = requests.get(channel_url).json()
            
            if "items" not in channel_response or len(channel_response["items"]) == 0:
                print(f"Channel '{username}' not found or API quota exceeded.", file=sys.stderr)
                return None
                
            channel = channel_response["items"][0]
            
            title = channel["snippet"]["title"]
            thumbnail = channel["snippet"]["thumbnails"]["medium"]["url"]
            subs = int(channel["statistics"]["subscriberCount"])
            total_views = int(channel["statistics"]["viewCount"])
            total_videos = int(channel["statistics"]["videoCount"])
            uploads_playlist = channel["contentDetails"]["relatedPlaylists"]["uploads"]
            
            avg_views, avg_likes = self._get_recent_video_metrics(uploads_playlist)
            
            return ChannelMetrics(
                channel_name=title,
                channel_handle=f"@{username}",
                subscribers=subs,
                total_views=total_views,
                total_videos=total_videos,
                avg_recent_views=avg_views,
                avg_recent_likes=avg_likes,
                thumbnail_url=thumbnail
            )
            
        except Exception as e:
            print(f"Error fetching channel data: {e}", file=sys.stderr)
            return None
    
    def _get_recent_video_metrics(self, uploads_playlist: str) -> tuple[int, int]:
        try:
            videos_url = (
                f"https://www.googleapis.com/youtube/v3/playlistItems"
                f"?part=snippet&playlistId={uploads_playlist}&maxResults=10&key={self.api_key}"
            )
            videos_response = requests.get(videos_url).json()
            
            if "items" not in videos_response:
                return 0, 0
                
            video_ids = [
                item["snippet"]["resourceId"]["videoId"] 
                for item in videos_response["items"]
            ]
            
            return self._get_video_statistics(video_ids)
            
        except Exception as e:
            print(f"Error fetching video metrics: {e}", file=sys.stderr)
            return 0, 0
    
    def _get_video_statistics(self, video_ids: list[str]) -> tuple[int, int]:
        try:
            video_ids_str = ",".join(video_ids)
            url = f"https://www.googleapis.com/youtube/v3/videos?part=statistics&id={video_ids_str}&key={self.api_key}"
            
            response = requests.get(url).json()
            total_views = 0
            total_likes = 0
            
            if "items" in response:
                for item in response["items"]:
                    stats = item["statistics"]
                    total_views += int(stats.get("viewCount", "0"))
                    total_likes += int(stats.get("likeCount", "0"))
            
            count = len(video_ids)
            return (
                total_views // count if count > 0 else 0,
                total_likes // count if count > 0 else 0
            )
            
        except Exception as e:
            print(f"Error getting video statistics: {e}", file=sys.stderr)
            return 0, 0

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python fetch_metrics.py <channel_handle>", file=sys.stderr)
        sys.exit(1)
        
    channel_handle = sys.argv[1]
    analyzer = YouTubeChannelAnalyzer(API_KEY)
    metrics = analyzer.get_channel_metrics(channel_handle)
    
    if metrics:
        # Output metrics as JSON for JavaScript to consume
        print(json.dumps({
            'channel_name': metrics.channel_name,
            'channel_handle': metrics.channel_handle,
            'subscribers': metrics.subscribers,
            'total_views': metrics.total_views,
            'total_videos': metrics.total_videos,
            'avg_recent_views': metrics.avg_recent_views,
            'avg_recent_likes': metrics.avg_recent_likes,
            'thumbnail_url': metrics.thumbnail_url
        }))
    else:
        sys.exit(1)