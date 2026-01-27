import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import errorHandler from './middleWare/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import { env } from './config/env.js';
// Load environment variables
dotenv.config();
const app = express();
// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
// Test route
app.get('/', (req, res) => {
  res.send('Academic Risk Detection System Backend is running...');
});

// Global error handler
app.use(errorHandler);

// Start the server
// const PORT = process.env.PORT || 5000;
app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);
});
export default app;