// src/routes/portfolioRoute.ts
import express, { Router, Request, Response, NextFunction } from 'express';
import PortfolioService from '../services/portfolioService.js';
import { generateSuccessResponse } from '../responses/successResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

const router = express.Router();

// 포트폴리오 생성
router.post('/api/portfolio', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const portfolioData = req.body;
    const newPortfolio = await PortfolioService.createPortfolio(portfolioData);
    res.status(HTTP_STATUS.CREATED).json(generateSuccessResponse(newPortfolio));
  } catch (error: any) {
    next(error);
  }
});

// 포트폴리오 조회 (ID 기준)
router.get('/api/portfolio/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const portfolio = await PortfolioService.getPortfolioById(parseInt(id, 10));
    res.status(HTTP_STATUS.OK).json(generateSuccessResponse(portfolio));
  } catch (error: any) {
    next(error);
  }
});

// 포트폴리오 수정
router.patch('/api/portfolio/:id', async (req: Request, res: Response, next: NextFunction) => {
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
router.delete('/api/portfolio/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await PortfolioService.deletePortfolio(parseInt(id, 10));
    res.status(HTTP_STATUS.OK).json(generateSuccessResponse());
  } catch (error: any) {
    next(error);
  }
});

// 특정 유저의 모든 포트폴리오 조회
router.get('/api/portfolios', async (req: Request, res: Response, next: NextFunction) => {
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
router.get('/api/portfolios/brief', async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('come');
    const { user_id } = req.params;
    const portfolios = await PortfolioService.getPortfoliosByUserId(parseInt(user_id, 10));
    res.status(HTTP_STATUS.OK).json(generateSuccessResponse(portfolios));
  } catch (error: any) {
    next(error);
  }
});


export default router;