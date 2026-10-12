import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import userRoutes from './routes/userRoutes.js';
import postRoutes from './routes/postRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import likeRoutes from './routes/likeRoutes.js';
import bookmarkRoutes from './routes/bookmarkRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

const app = express();
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.resolve(currentDirectory, '../public');

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use('/uploads', express.static(path.join(publicDirectory, 'uploads')));
app.use(express.static(publicDirectory));

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', name: 'Postaway API' });
});

app.use('/api', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/bookmarks', bookmarkRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;