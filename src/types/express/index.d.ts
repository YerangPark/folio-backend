// src/types/express/index.d.ts 파일을 생성
import { JwtPayload } from 'jsonwebtoken'; // 필요 시 JwtPayload도 import

declare global {
  namespace Express {
    interface Request {
      user?: string | JwtPayload;  // JWT 검증 후 유저 정보를 저장하는 속성
    }
  }
}