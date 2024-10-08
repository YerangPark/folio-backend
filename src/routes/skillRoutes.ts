// src/routes/portfolioRoute.ts
import express, { Router, Request, Response, NextFunction } from 'express';
import { generateSuccessResponse } from '../responses/successResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import authenticateJWT from '../utils/athenticateJWT.js';
import SkillService from '../services/skillService.js'

const router = express.Router();

// 스킬 리스트 읽어오기
router.get('/api/skills', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skills = await SkillService.getSkills();
    res.status(HTTP_STATUS.OK).json(generateSuccessResponse({ skills }));
  } catch (error: any) {
    next(error);
  }
})

export default router;