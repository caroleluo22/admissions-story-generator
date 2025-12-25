import { Request, Response } from 'express';
import { google } from 'googleapis';
import fs from 'fs';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:5000/auth/youtube/callback';

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

// In-memory mock storage for credentials if we wanted to persist them session-based, 
// but for now we might mock success if env vars are missing.
let isMockMode = !CLIENT_ID || !CLIENT_SECRET;

export const getAuthUrl = (req: Request, res: Response) => {
    if (isMockMode) {
        // If mocking, we just redirect back immediately or signal success
        return res.json({ url: `${REDIRECT_URI}?code=mock_code` });
    }

    const scopes = [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly'
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes
    });

    res.json({ url });
};

export const oauthCallback = async (req: Request, res: Response) => {
    const { code } = req.query;

    if (isMockMode) {
        // Mock success redirect
        return res.redirect('http://localhost:5173/studio?youtube_auth=success');
    }

    try {
        const { tokens } = await oauth2Client.getToken(code as string);
        oauth2Client.setCredentials(tokens);
        // Ideally save tokens to DB associated with user, here we might just redirect for prototype
        res.redirect('http://localhost:5173/studio?youtube_auth=success');
    } catch (error) {
        console.error('Error getting tokens:', error);
        res.redirect('http://localhost:5173/studio?youtube_auth=failed');
    }
};

export const uploadVideo = async (req: Request, res: Response) => {
    try {
        const { videoUrl, title, description } = req.body;

        if (isMockMode) {
            console.log(`[MOCK] Uploading video to YouTube: ${title}`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
            return res.json({
                success: true,
                videoId: 'mock_video_id_' + Date.now(),
                link: 'https://youtube.com/watch?v=mock'
            });
        }

        // For real upload, we would need the video file locally or stream it.
        // Since we are likely receiving a Data URI or a URL that needs fetching:
        // This is a simplified implementation assuming we have 'oauth2Client' set up from a previous auth step.
        // In a stateless REST API, we'd need to retrieve the stored token for this user.

        // Check if we have credentials set (this is simplistic for single-user prototype)
        if (!oauth2Client.credentials || !oauth2Client.credentials.access_token) {
            return res.status(401).json({ error: 'Not authenticated with YouTube' });
        }

        const youtube = google.youtube({
            version: 'v3',
            auth: oauth2Client
        });

        // Fetch and Stream Video from URL
        // Note: fetch is available in Node 18+, otherwise use 'axios' or 'node-fetch'
        const videoResponse = await fetch(videoUrl);
        const videoBuffer = await videoResponse.arrayBuffer();
        const buffer = Buffer.from(videoBuffer);
        const { Readable } = require('stream');
        const videoStream = Readable.from(buffer);

        const response = await youtube.videos.insert({
            part: ['snippet', 'status'],
            requestBody: {
                snippet: {
                    title: title,
                    description: description,
                    tags: ['VisionaryTutor', 'AI Generated'],
                },
                status: {
                    privacyStatus: 'private', // Uploads to the Authenticated User's Channel as Private
                },
            },
            media: {
                body: videoStream,
            },
        });

        res.json({
            success: true,
            videoId: response.data.id,
            link: `https://youtu.be/${response.data.id}`
        });

    } catch (error: any) {
        console.error('YouTube upload error:', error);
        res.status(500).json({ error: error.message });
    }
};
