import express, { Router, Request, Response, NextFunction } from 'express';
import PortfolioModel from '../models/portfolioModel';
import { generateSuccessResponse } from '../responses/successResponse';
import CustomError from '../errors/customError';
import { HTTP_STATUS } from '../constants/httpStatus';
import { ERROR_MESSAGES } from '../constants/errorConst';

const router = express.Router();

// SECTION - 타입 정의
interface CreatePortfolioRequestBody {
  user_id: number;
  file_name: string;
  title: string;
  description: string;
  github_link?: string;
  blog_link?: string;
  projects?: {
    name: string;
    image?: string;
    start_date: Date;
    end_date: Date;
    github_link?: string;
    site_link?: string;
    description: string;
    skills?: {
      name: string;
      category: 'frontend' | 'backend' | 'database' | 'devops' | 'infrastructure' | 'version-control' | 'collaboration' | 'others';
    }[];
  }[];
}

interface UpdatePortfolioRequestBody extends Partial<CreatePortfolioRequestBody> {}

// SECTION - 포트폴리오 생성
// SECTION - 포트폴리오 생성
router.post('/api/portfolio', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const portfolioData = req.body as CreatePortfolioRequestBody;

    // Convert date strings to Date objects
    if (portfolioData.projects) {
      portfolioData.projects = portfolioData.projects.map(project => ({
        ...project,
        start_date: new Date(project.start_date),
        end_date: new Date(project.end_date),
      }));
    }

    const newPortfolio = await PortfolioModel.createPortfolio(portfolioData);
    res.status(HTTP_STATUS.CREATED).json(generateSuccessResponse(newPortfolio));
  } catch (error: any) {
    next(error);
  }
});

// SECTION - 포트폴리오 조회 (ID 기준)
router.get('/api/portfolio/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const portfolio = await PortfolioModel.getPortfolioById(parseInt(id, 10));
    res.status(HTTP_STATUS.OK).json(generateSuccessResponse(portfolio));
  } catch (error: any) {
    next(error);
  }
});

// SECTION - 포트폴리오 수정
router.patch('/api/portfolio/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updatedData = req.body as UpdatePortfolioRequestBody;
    const updatedPortfolio = await PortfolioModel.updatePortfolio(parseInt(id, 10), updatedData);
    res.status(HTTP_STATUS.OK).json(generateSuccessResponse(updatedPortfolio));
  } catch (error: any) {
    next(error);
  }
});

// SECTION - 포트폴리오 삭제
router.delete('/api/portfolio/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await PortfolioModel.deletePortfolio(parseInt(id, 10));
    res.status(HTTP_STATUS.OK).json(generateSuccessResponse());
  } catch (error: any) {
    next(error);
  }
});

// SECTION - 특정 유저의 모든 포트폴리오 조회
router.get('/api/portfolios/user/:user_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.params;
    const portfolios = await PortfolioModel.getPortfoliosByUserId(parseInt(user_id, 10));
    res.status(HTTP_STATUS.OK).json(generateSuccessResponse(portfolios));
  } catch (error: any) {
    next(error);
  }
});

export default router;