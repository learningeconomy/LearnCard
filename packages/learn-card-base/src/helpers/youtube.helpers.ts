// Function to determine if the URL is from YouTube
export const isYoutubeUrl = (url: string) => {
    try {
        const { hostname } = new URL(url);
        return hostname.includes('youtube.com') || hostname === 'youtu.be';
    } catch (e) {
        console.log('error', e);
        return false;
    }
};

// Function to get the YouTube video ID from the URL
export const getYoutubeVideoId = (url: string) => {
    const match = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/
    );
    return match ? match[1] : '';
};
// Function to get the cover image URL for YouTube videos
export const getCoverImageUrl = (youtubeWatchUrl: string) => {
    if (!isYoutubeUrl(youtubeWatchUrl)) {
        return ''; // Return an empty string if the URL is not a YouTube URL
    }

    const videoId = getYoutubeVideoId(youtubeWatchUrl);
    // Construct and return the URL for the video's cover image
    // This URL fetches the highest resolution image available
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
};

// Function to get the source of the video
export const getVideoSource = (url: string) => {
    try {
        const urlObj = new URL(url);
        let hostname = urlObj.hostname;

        // Special handling for Google Drive links
        if (hostname.includes('drive.google')) {
            return 'Google Drive';
        }

        // Remove 'www' if present
        hostname = hostname.replace(/^www\./, '');

        // Return the adjusted hostname in lowercase, preserving the domain extension
        return hostname.toLowerCase();
    } catch (e) {
        console.error('Invalid URL', e);
        return ''; // Handle the error or return a default value
    }
};
