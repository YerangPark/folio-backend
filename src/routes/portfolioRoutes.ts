// src/routes/portfolioRoute.ts
import express, { Router, Request, Response, NextFunction } from 'express';
import PortfolioService from '../services/portfolioService.js';
import { generateSuccessResponse } from '../responses/successResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import authenticateJWT from '../utils/athenticateJWT.js';

const router = express.Router();

// 포트폴리오 생성
router.post('/api/portfolio', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO : JWT 토큰에서 유저id 정보 가져와서 같이 넘겨줘야 함.
    if (typeof req.user !== 'string' && req.user?.id) {
      const userId = req.user.id;  // user가 JwtPayload 타입일 때만 id에 접근
      const portfolioData = req.body;

      if (portfolioData.user_id !== userId) { // NOTE : 인가되지 않은 유저에 대한 접근 제한
        return res.status(403).json({ message: 'Access denied1' });
      }

      const newPortfolio = await PortfolioService.createPortfolio(portfolioData);
      res.status(HTTP_STATUS.CREATED).json(generateSuccessResponse(newPortfolio));
    } else {
      return res.status(403).json({ message: 'Access denied2' });
    }
  } catch (error: any) {
    next(error);
  }
});

// 포트폴리오 조회 (ID 기준)
router.get('/api/portfolio/:id', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const portfolio = await PortfolioService.getPortfolioById(parseInt(id, 10));
    res.status(HTTP_STATUS.OK).json(generateSuccessResponse(portfolio));
  } catch (error: any) {
    next(error);
  }
});

// 포트폴리오 수정
router.patch('/api/portfolio/:id', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const updatedPortfolio = await PortfolioService.updatePortfolio(parseInt(id, 10), updatedData);
    res.status(HTTP_STATUS.OK).json(generateSuccessResponse(updatedPortfolio));
  } catch (error: any) {
    next(error);
  }
});

// 포트폴리오 삭제
router.delete('/api/portfolio/:id', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await PortfolioService.deletePortfolio(parseInt(id, 10));
    res.status(HTTP_STATUS.OK).json(generateSuccessResponse());
  } catch (error: any) {
    next(error);
  }
});

// 특정 유저의 모든 포트폴리오 조회
router.get('/api/portfolios', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(req.body);
    const { id } = req.body;
    const portfolios = await PortfolioService.getPortfoliosByUserId(parseInt(id, 10));
    res.status(HTTP_STATUS.OK).json(generateSuccessResponse(portfolios));
  } catch (error: any) {
    next(error);
  }
});

// 특정 유저의 모든 포트폴리오 조회
router.get('/api/portfolios/brief', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // JWT 미들웨어에서 req.user에 유저 정보가 저장되었으므로 여기서 사용
    if (typeof req.user !== 'string' && req.user?.id) {
      const userId = req.user.id;  // user가 JwtPayload 타입일 때만 id에 접근
      const portfolios = await PortfolioService.getPortfoliosByUserId(userId);

      // 사진, 마지막 수정일, 포트폴리오 제목
      const briefPortfolios = portfolios.map((portfolio: any) => ({
        id: portfolio.id,
        file_name: portfolio.file_name,
        updated_at: portfolio.updated_at,
        image: portfolio.image
      }))
      res.status(HTTP_STATUS.OK).json(generateSuccessResponse(briefPortfolios));
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
  } catch (error: any) {
    next(error);
  }
});


export default router;