import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import csvRoutes from './routes/csvRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { authenticateToken } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: ['http://localhost:5173',
    'https://jaa2.vercel.app',
    'https://jaa2-jins-projects-b44fc42b.vercel.app',
    'https://*.vercel.app'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/csv', authenticateToken, csvRoutes);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
