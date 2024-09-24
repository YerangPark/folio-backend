// src/services/portfolioService.ts
import PortfolioModel from '../models/portfolioModel.js';
import CustomError from '../errors/customError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { PortfolioEntity } from '../entities/portfolioEntity.js';
import { ERROR_MESSAGES } from '../constants/errorConst.js';
import AppDataSource from '../../ormconfig.js';
import { QueryRunner } from 'typeorm';
import { UserEntity } from '../entities/userEntity.js';

interface ProjectSkill {
  id: number;
}

interface Project {
  id?: number;
  name: string;
  image?: string;
  start_date: Date;
  end_date: Date;
  github_link?: string;
  site_link?: string;
  description: string;
  skills?: ProjectSkill[];
}

interface PortfolioSkill {
  id: number;
}

interface Portfolio {
  id?: number;
  user_id: number;
  file_name: string;
  title: string;
  description: string;
  github_link?: string;
  blog_link?: string;
  skills?: PortfolioSkill[];
  projects?: Project[];
}

class PortfolioService {
  // 포트폴리오 생성
  static async createPortfolio(portfolioData: Portfolio): Promise<PortfolioEntity> {
    const queryRunner: QueryRunner = AppDataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingPortfolio = await PortfolioModel.findPortfolioByFileNameAndUserId(portfolioData.file_name, portfolioData.user_id);
      if (existingPortfolio) {
        throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'FILENAME_TAKEN', ERROR_MESSAGES.FILENAME_TAKEN);
      }

      const newPortfolio = await PortfolioModel.createPortfolio({
        user: Promise.resolve({ id: portfolioData.user_id } as UserEntity),
        file_name: portfolioData.file_name,
        title: portfolioData.title,
        description: portfolioData.description,
        github_link: portfolioData.github_link,
        blog_link: portfolioData.blog_link,
      });

      if (portfolioData.skills) {
        for (const skill of portfolioData.skills) {
          const skillEntity = await PortfolioModel.findSkillById(skill.id);
          if (!skillEntity) {
            throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'SKILL_NOT_FOUND', ERROR_MESSAGES.SKILL_NOT_FOUND);
          }
          // await queryRunner.manager.save(PortfolioModel.addSkillToPortfolio(newPortfolio, skillEntity));
          await PortfolioModel.addSkillToPortfolio(newPortfolio, skillEntity);
        }
      }

      if (portfolioData.projects) {
        for (const project of portfolioData.projects) {
          const newProject = await PortfolioModel.createProject({
            name: project.name,
            image: project.image,
            start_date: project.start_date,
            end_date: project.end_date,
            github_link: project.github_link,
            site_link: project.site_link,
            description: project.description,
            portfolio: Promise.resolve(newPortfolio),
          });

          if (project.skills) {
            for (const skill of project.skills) {
              const skillEntity = await PortfolioModel.findSkillById(skill.id);
              if (!skillEntity) {
                throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'SKILL_NOT_FOUND', ERROR_MESSAGES.SKILL_NOT_FOUND);
              }
              await PortfolioModel.addSkillToProject(newProject, skillEntity);
              // await queryRunner.manager.save(PortfolioModel.addSkillToProject(newProject, skillEntity));
            }
          }
        }
      }

      await queryRunner.commitTransaction();
      return newPortfolio;
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 포트폴리오 조회
  static async getPortfolioById(id: number): Promise<PortfolioEntity | null> {
    const portfolio = await PortfolioModel.getPortfolioById(id);
    if (!portfolio) {
      throw new CustomError(HTTP_STATUS.NOT_FOUND, 'PORTFOLIO_NOT_FOUND', 'Portfolio not found.');
    }
    return portfolio;
  }

  // 포트폴리오 업데이트
  static async updatePortfolio(id: number, updatedData: Portfolio): Promise<void> {
    const existingPortfolio = await PortfolioModel.getPortfolioById(id);
    if (!existingPortfolio) {
      throw new CustomError(HTTP_STATUS.NOT_FOUND, 'PORTFOLIO_NOT_FOUND', 'Portfolio not found.');
    }

    await PortfolioModel.updatePortfolio(id, {
      title: updatedData.title,
      description: updatedData.description,
      github_link: updatedData.github_link,
      blog_link: updatedData.blog_link,
    });

    // 추가된 스킬들 업데이트
    if (updatedData.skills) {
      for (const skill of updatedData.skills) {
        const skillEntity = await PortfolioModel.findSkillById(skill.id);
        if (!skillEntity) {
          throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'SKILL_NOT_FOUND', ERROR_MESSAGES.SKILL_NOT_FOUND);
        }
        await PortfolioModel.addSkillToPortfolio(existingPortfolio, skillEntity);
      }
    }

    // 추가된 프로젝트들 업데이트
    if (updatedData.projects) {
      for (const project of updatedData.projects) {
        const newProject = await PortfolioModel.createProject({
          name: project.name,
          image: project.image,
          start_date: project.start_date,
          end_date: project.end_date,
          github_link: project.github_link,
          site_link: project.site_link,
          description: project.description,
          portfolio: Promise.resolve(existingPortfolio),
        });

        if (project.skills) {
          for (const skill of project.skills) {
            const skillEntity = await PortfolioModel.findSkillById(skill.id);
            if (!skillEntity) {
              throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'SKILL_NOT_FOUND', ERROR_MESSAGES.SKILL_NOT_FOUND);
            }
            await PortfolioModel.addSkillToProject(newProject, skillEntity);
          }
        }
      }
    }
  }

  // 포트폴리오 삭제
  static async deletePortfolio(id: number): Promise<void> {
    const existingPortfolio = await PortfolioModel.getPortfolioById(id);
    if (!existingPortfolio) {
      throw new CustomError(HTTP_STATUS.NOT_FOUND, 'PORTFOLIO_NOT_FOUND', 'Portfolio not found.');
    }

    await PortfolioModel.deletePortfolio(id);
  }

  // 특정 유저의 모든 포트폴리오 조회
  static async getPortfoliosByUserId(userId: number): Promise<PortfolioEntity[]> {
    return await PortfolioModel.getPortfoliosByUserId(userId);
  }
}

export default PortfolioService;