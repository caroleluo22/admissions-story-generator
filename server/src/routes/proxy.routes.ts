import { Router } from 'express';
import axios from 'axios';

const router = Router();

router.get('/', async (req, res) => {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: 'URL is required' });
    }

    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        res.set('Access-Control-Allow-Origin', '*');
        res.set('Content-Type', response.headers['content-type']);
        response.data.pipe(res);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ message: 'Failed to fetch resource' });
    }
});

export default router;
