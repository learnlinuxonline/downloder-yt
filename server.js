const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Get video info endpoint
app.get('/api/videoinfo', async (req, res) => {
    try {
        const videoUrl = req.query.url;
        if (!ytdl.validateURL(videoUrl)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }
        
        const info = await ytdl.getInfo(videoUrl);
        res.json({
            title: info.videoDetails.title,
            duration: info.videoDetails.lengthSeconds,
            thumbnail: info.videoDetails.thumbnails[0].url,
            formats: info.formats
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch video information' });
    }
});

// Download endpoint
app.get('/api/download', async (req, res) => {
    try {
        const videoUrl = req.query.url;
        const format = req.query.format || 'mp4';
        
        if (!ytdl.validateURL(videoUrl)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }
        
        const info = await ytdl.getInfo(videoUrl);
        let formatToDownload;
        
        switch (format) {
            case 'mp4':
                formatToDownload = ytdl.chooseFormat(info.formats, { quality: '22' }); // 720p
                break;
            case 'mp4-1080':
                formatToDownload = ytdl.chooseFormat(info.formats, { quality: '137' }); // 1080p
                break;
            case 'webm':
                formatToDownload = ytdl.chooseFormat(info.formats, { quality: '251' }); // WebM audio
                break;
            case 'mp3':
                formatToDownload = ytdl.chooseFormat(info.formats, { quality: '140' }); // MP3 audio
                break;
            default:
                formatToDownload = ytdl.chooseFormat(info.formats, { quality: '22' });
        }
        
        if (!formatToDownload) {
            return res.status(400).json({ error: 'Requested format not available' });
        }
        
        res.header('Content-Disposition', `attachment; filename="video.${formatToDownload.container}"`);
        ytdl(videoUrl, { format: formatToDownload }).pipe(res);
        
    } catch (error) {
        res.status(500).json({ error: 'Download failed' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
