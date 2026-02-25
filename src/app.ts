import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initRoutes } from './api';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

initRoutes(app);

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, async () => {
  console.log(`✅ KasKita API running at http://localhost:${PORT}`);
  try {
    // await startBot();
  } catch (e) {
    console.error('Bot failed to start', e);
  }
});