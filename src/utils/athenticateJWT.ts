import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error('SECRET_KEY is not defined');
}
// JWT 검증 미들웨어
const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ message: '토큰이 만료되었습니다.' });
        }
        return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
      }

      // 토큰이 유효하다면 요청 객체에 유저 정보를 저장
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export default authenticateJWT;