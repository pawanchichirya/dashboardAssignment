import express from 'express';
import cors from 'cors';
import { getDashboardData, getStates, getDateRange } from './controllers/salesController';

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS
app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/dashboard', getDashboardData);
app.get('/api/states', getStates);
app.get('/api/dateRange/:state', getDateRange);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 