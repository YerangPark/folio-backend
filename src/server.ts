import dotenv from 'dotenv';
import "reflect-metadata";
import 'express-async-errors'; //NOTE - 비동기 에러 핸들링
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import userRoutes from './routes/userRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import ErrorHandler from './middlewares/errorHandler.js';
import AppDataSource from '../ormconfig.js';
import skillRoutes from './routes/skillRoutes.js';
import path from 'path';

dotenv.config();

const app = express();
const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'UPDATE', 'DELETE', 'PATCH'],
  credentials: true
}));

app.options('*', cors()); // ANCHOR: Preflight 요청 처리

// NOTE: JSON 요청 본문 크기 제한을 10MB로 설정
app.use(express.json({ limit: '10mb' }));
// NOTE: URL-encoded 데이터에 대한 제한 설정
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(`${process.env.UPLOAD_PATH}`));
app.use(express.json());
app.use(userRoutes);
app.use(skillRoutes);
app.use(portfolioRoutes);
app.use(ErrorHandler);

//SECTION
AppDataSource.initialize()
.then(() => {
  console.log('Database initialized');
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})
.catch((error) => {
  console.error('Error during Data Source initialization:', error);
});


// SECTION - 에러 처리 미들웨어
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack); //ANCHOR - 에러 스택 추적 로그를 출력
  res.status(500).json({
      message: err.message,
      // 개발 환경에서는 스택 정보를 함께 전송
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

//SECTION - 테스트용
app.get('/ping', (req: Request, res: Response) => {
  console.log('Ping received');
  res.send('pong');  // 응답을 반환
});
