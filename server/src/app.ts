import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes';
import brandRoutes from './routes/brand.routes';
import storyRoutes from './routes/story.routes';
import youtubeRoutes from './routes/youtube.routes';
import trendRoutes from './routes/trend.routes';

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.use('/api', youtubeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/brand', brandRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/trends', trendRoutes);
import proxyRoutes from './routes/proxy.routes';
app.use('/api/proxy', proxyRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Admissions Story Generator API' });
});

export default app;
