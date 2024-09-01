import AppDataSource from '../../ormconfig';
import { PortfolioEntity } from '../entities/portfolioEntity';
import { ProjectEntity } from '../entities/projectEntity';
import { SkillEntity } from '../entities/skillEntity';
import CustomError from '../errors/customError';
import { HTTP_STATUS } from '../constants/httpStatus';
import { ERROR_MESSAGES } from '../constants/errorConst';
import DBCustomError from '../errors/dbCustomError';

interface Skill {
  id?: number;
  name: string;
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'infrastructure' | 'version-control' | 'collaboration' | 'others';
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
  skills?: Skill[];
}

interface Portfolio {
  id?: number;
  user_id: number;
  file_name: string;
  title: string;
  description: string;
  github_link?: string;
  blog_link?: string;
  projects?: Project[];
}

export class PortfolioModel {
  // ANCHOR - 포트폴리오 생성
  static async createPortfolio(portfolio: Portfolio): Promise<PortfolioEntity> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const portfolioRepository = queryRunner.manager.getRepository(PortfolioEntity);
      const projectRepository = queryRunner.manager.getRepository(ProjectEntity);
      const skillRepository = queryRunner.manager.getRepository(SkillEntity);

      const newPortfolio = portfolioRepository.create(portfolio);
      await portfolioRepository.save(newPortfolio);

      if (portfolio.projects) {
        for (const project of portfolio.projects) {
          const newProject = projectRepository.create({
            ...project,
            portfolio: newPortfolio,
          });
          await projectRepository.save(newProject);

          if (project.skills) {
            for (const skill of project.skills) {
              let skillEntity = await skillRepository.findOne({ where: { name: skill.name } });

              if (!skillEntity) {
                skillEntity = skillRepository.create(skill);
                await skillRepository.save(skillEntity);
              }

              await queryRunner.manager.createQueryBuilder()
                .relation(ProjectEntity, "skills")
                .of(newProject)
                .add(skillEntity);
            }
          }
        }
      }

      await queryRunner.commitTransaction();
      return newPortfolio;
    } catch (dbError: any) {
      await queryRunner.rollbackTransaction();
      throw new DBCustomError(dbError);
    } finally {
      await queryRunner.release();
    }
  }

  // ANCHOR - 포트폴리오 조회 (ID 기준)
  static async getPortfolioById(id: number): Promise<PortfolioEntity | null> {
    try {
      const portfolioRepository = AppDataSource.getRepository(PortfolioEntity);

      const portfolio = await portfolioRepository.findOne({
        where: { id },
        relations: ["projects", "projects.skills"],
      });

      if (!portfolio) {
        throw new CustomError(
          HTTP_STATUS.BAD_REQUEST,
          'PORTFOLIO_NOT_FOUND',
          ERROR_MESSAGES.PORTFOLIO_NOT_FOUND
        );
      }

      return portfolio;
    } catch (dbError: any) {
      if (dbError instanceof CustomError) {
        throw dbError;
      } else {
        throw new DBCustomError(dbError);
      }
    }
  }

  // ANCHOR - 포트폴리오 업데이트
  static async updatePortfolio(id: number, updatedData: Partial<Portfolio>): Promise<PortfolioEntity> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const portfolioRepository = queryRunner.manager.getRepository(PortfolioEntity);
      const projectRepository = queryRunner.manager.getRepository(ProjectEntity);
      const skillRepository = queryRunner.manager.getRepository(SkillEntity);

      const existingPortfolio = await portfolioRepository.findOne({ where: { id }, relations: ["projects", "projects.skills"] });
      if (!existingPortfolio) {
        throw new CustomError(
          HTTP_STATUS.BAD_REQUEST,
          'PORTFOLIO_NOT_FOUND',
          ERROR_MESSAGES.PORTFOLIO_NOT_FOUND
        );
      }

      // 포트폴리오 업데이트
      await portfolioRepository.update(id, updatedData);

      if (updatedData.projects) {
        for (const project of updatedData.projects) {
          const existingProject = await projectRepository.findOne({ where: { id: project.id }, relations: ["skills"] });

          if (existingProject) {
            // 프로젝트 업데이트
            await projectRepository.update(existingProject.id, project);

            // 스킬 업데이트
            if (project.skills) {
              for (const skill of project.skills) {
                let skillEntity = await skillRepository.findOne({ where: { name: skill.name } });

                if (!skillEntity) {
                  skillEntity = skillRepository.create(skill);
                  await skillRepository.save(skillEntity);
                }

                if (!existingProject.skills.some(s => s.id === skillEntity!.id)) {
                  await queryRunner.manager.createQueryBuilder()
                    .relation(ProjectEntity, "skills")
                    .of(existingProject)
                    .add(skillEntity);
                }
              }
            }
          } else {
            // 새로운 프로젝트 추가
            const newProject = projectRepository.create({
              ...project,
              portfolio: existingPortfolio,
            });
            await projectRepository.save(newProject);
          }
        }
      }

      await queryRunner.commitTransaction();

      return existingPortfolio;
    } catch (dbError: any) {
      await queryRunner.rollbackTransaction();
      throw new DBCustomError(dbError);
    } finally {
      await queryRunner.release();
    }
  }

  // ANCHOR - 포트폴리오 삭제
  static async deletePortfolio(id: number): Promise<boolean> {
    try {
      const portfolioRepository = AppDataSource.getRepository(PortfolioEntity);

      const result = await portfolioRepository.delete(id);
      if (result.affected && result.affected > 0) {
        return true;
      } else {
        throw new CustomError(
          HTTP_STATUS.BAD_REQUEST,
          'PORTFOLIO_NOT_FOUND',
          ERROR_MESSAGES.PORTFOLIO_NOT_FOUND
        );
      }
    } catch (dbError: any) {
      if (dbError instanceof CustomError) {
        throw dbError;
      } else {
        throw new DBCustomError(dbError);
      }
    }
  }

  // ANCHOR - 특정 유저의 모든 포트폴리오 조회
  static async getPortfoliosByUserId(user_id: number): Promise<PortfolioEntity[]> {
    try {
      const portfolioRepository = AppDataSource.getRepository(PortfolioEntity);

      const portfolios = await portfolioRepository.find({
        where: { user: { id: user_id } },
        relations: ["projects", "projects.skills"],
      });
      return portfolios;
    } catch (dbError: any) {
      if (dbError instanceof CustomError) {
        throw dbError;
      } else {
        throw new DBCustomError(dbError);
      }
    }
  }
}

export default PortfolioModel;