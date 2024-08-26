require('dotenv').config();
import express, { Request, Response } from 'express';
import { getConnection } from './config/db';

const app = express();
const PORT = process.env.PORT || 3000;

// http://localhost:3000/경로 라우팅
app.get('/', async (req: Request, res: Response) => {
  try {
    console.log('Attempting to connect to the database');
    const conn = await getConnection();
    console.log('Database connection successful');

    const rows = await conn.query("SELECT 1 as val");
    console.log('Query result:', rows);
    conn.release();
    res.send('Databases connection successful');
  } catch (err) {
    console.log("Error during databases connection or query:", err)
    res.status(500).send('Database connnection failed');
  }
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
