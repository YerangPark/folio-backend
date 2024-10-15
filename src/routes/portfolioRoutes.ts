// src/routes/portfolioRoute.ts
import express, { Router, Request, Response, NextFunction } from 'express';
import PortfolioService from '../services/portfolioService.js';
import { generateSuccessResponse } from '../responses/successResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import authenticateJWT from '../utils/athenticateJWT.js';
import upload from '../utils/multer.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// 포트폴리오 생성
router.post('/api/portfolio', authenticateJWT, upload.any(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (typeof req.user !== 'string' && req.user?.id) {
      const userId = req.user.id;  // user가 JwtPayload 타입일 때만 id에 접근
      const portfolioData = req.body;

      // req.files가 Multer로 전달된 파일인지 확인하는 타입 가드
      if (req.files && Array.isArray(req.files)) {
        const files = req.files as Express.Multer.File[];

        // 포트폴리오 대표 이미지
        const portfolioImage = files.find(file => file.fieldname === 'image');
        portfolioData.image = portfolioImage ? `${process.env.UPLOAD_PATH}/${portfolioImage.filename}` : null;

        // 프로젝트별 이미지 및 README 파일 처리
        portfolioData.projects = portfolioData.projects.map((project: any, index: number) => {
          const projectImage = files.find(file => file.fieldname === `projects[${index}][image]`);
          const readmeFile = files.find(file => file.fieldname === `projects[${index}][readme_file]`);

          return {
            ...project,
            image: projectImage ? `${process.env.UPLOAD_PATH}/${projectImage.filename}` : null,
            readme_file: readmeFile ? `${process.env.UPLOAD_PATH}/${readmeFile.filename}` : null
          };
        });
      }

      const newPortfolio = await PortfolioService.createPortfolio(userId, portfolioData);
      res.status(HTTP_STATUS.CREATED).json(generateSuccessResponse(newPortfolio));
    } else {
      return res.status(403).json({ message: 'Access denied' });
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
router.patch('/api/portfolio/:id', authenticateJWT, upload.any(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const portfolioData = req.body;

    // req.files가 Multer로 전달된 파일인지 확인하는 타입 가드
    if (req.files && Array.isArray(req.files)) {
      const files = req.files as Express.Multer.File[];

      // 포트폴리오 대표 이미지
      const portfolioImage = files.find(file => file.fieldname === 'image');
      portfolioData.image = portfolioImage ? `${process.env.UPLOAD_PATH}/${portfolioImage.filename}` : null;

      // 프로젝트별 이미지 및 README 파일 처리
        portfolioData.projects = portfolioData.projects.map((project: any, index: number) => {
        const projectImage = files.find(file => file.fieldname === `projects[${index}][image]`);
        const readmeFile = files.find(file => file.fieldname === `projects[${index}][readme_file]`);

        return {
          ...project,
          image: projectImage ? `${process.env.UPLOAD_PATH}/${projectImage.filename}` : null,
          readme_file: readmeFile ? `${process.env.UPLOAD_PATH}/${readmeFile.filename}` : null
        };
      });
    }

    // 수정된 포트폴리오 데이터를 저장
    const updatedPortfolio = await PortfolioService.updatePortfolio(parseInt(id, 10), portfolioData);

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

// 포트폴리오 public 조회 (username, portfolioId 기준)
router.get('/api/:username/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, id } = req.params;
    const portfolio = await PortfolioService.getPublicPortfolioByUsernameAndId(username, parseInt(id, 10));
    res.status(HTTP_STATUS.OK).json(generateSuccessResponse(portfolio));
  } catch (error: any) {
    next(error);
  }
});

export default router;