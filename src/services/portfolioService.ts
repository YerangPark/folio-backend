// src/services/portfolioService.ts
import CustomError from '../errors/customError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { PortfolioEntity } from '../entities/portfolioEntity.js';
import { ERROR_MESSAGES } from '../constants/errorConst.js';
import AppDataSource from '../../ormconfig.js';
import { DeepPartial, QueryRunner, Repository, RoleSpecification } from 'typeorm';
import { UserEntity } from '../entities/userEntity.js';
import { SkillEntity } from '../entities/skillEntity.js';
import { ProjectEntity } from '../entities/projectEntity.js';
import { PortfolioSkillEntity } from '../entities/portfolioSkillEntity.js';
import { ProjectSkillEntity } from '../entities/projectSkillEntity.js';

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
  static portfolioRepository: Repository<PortfolioEntity> = AppDataSource.getRepository(PortfolioEntity);
  static projectRepository: Repository<ProjectEntity> = AppDataSource.getRepository(ProjectEntity);
  static skillRepository: Repository<SkillEntity> = AppDataSource.getRepository(SkillEntity);
  static portfolioSkillRepository: Repository<PortfolioSkillEntity> = AppDataSource.getRepository(PortfolioSkillEntity);
  static projectSkillRepository: Repository<ProjectSkillEntity> = AppDataSource.getRepository(ProjectSkillEntity)

  // 포트폴리오 생성
  static async createPortfolio(userId: number, portfolioData: Portfolio): Promise<PortfolioEntity> {
    const queryRunner: QueryRunner = AppDataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 유저 ID가 반드시 있어야 한다는 검증 추가
      if (!userId) {
        throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'USER_ID_REQUIRED', 'User ID is required to create a portfolio.');
      }

      const existingPortfolio = await AppDataSource.getRepository(PortfolioEntity).findOne({where: { file_name: portfolioData.file_name, user: { id: userId } }});
      if (existingPortfolio) {
        throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'FILENAME_TAKEN', ERROR_MESSAGES.FILENAME_TAKEN);
      }

      // const user = await UserModel.findByUserid(userId);
      const user = await queryRunner.manager.findOne(UserEntity, { where: { id: userId } });
      if (!user) {
        throw new Error('@@@@@@@@@@@@@@@@@@ User not found');
      }

      const portfolio = new PortfolioEntity();
      portfolio.file_name = portfolioData.file_name;
      portfolio.title = portfolioData.title;
      portfolio.description = portfolioData.description;
      portfolio.github_link = portfolioData.github_link as string;
      portfolio.blog_link = portfolioData.blog_link as string;
      portfolio.user = Promise.resolve(user);
      const newPortfolio = await this.portfolioRepository.save(portfolio);

      // const newPortfolio = await PortfolioModel.createPortfolio({
      //   user_id: user.id, // 명시적으로 userId 전달
      //   user: Promise.resolve(user), // lazy loading 관계 설정
      //   file_name: portfolioData.file_name,
      //   title: portfolioData.title,
      //   description: portfolioData.description,
      //   github_link: portfolioData.github_link,
      //   blog_link: portfolioData.blog_link,
      // });

      if (portfolioData.skills) {
        for (const skill of portfolioData.skills) {
          const skillEntity = await this.skillRepository.findOne({ where: { id: skill.id } });
          if (!skillEntity) {
            throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'SKILL_NOT_FOUND', ERROR_MESSAGES.SKILL_NOT_FOUND);
          }
          // await PortfolioModel.addSkillToPortfolio(newPortfolio, skillEntity);
          const portfolioSkill = new PortfolioSkillEntity();

          // Lazy-loaded 관계의 Promise를 await으로 풀어서 실제 객체를 할당
          portfolioSkill.portfolio = Promise.resolve(newPortfolio);  // lazy로 인해 Promise로 감싸줌
          portfolioSkill.skill = Promise.resolve(skillEntity);  // lazy로 인해 Promise로 감싸줌

          // 저장
          await this.portfolioSkillRepository.save(portfolioSkill);
        }
      }

      if (portfolioData.projects) {
        for (const project of portfolioData.projects) {
          const tempProject = new ProjectEntity();
          tempProject.name = project.name;
          tempProject.image = project.image as string;
          tempProject.start_date = project.start_date;
          tempProject.end_date = project.end_date;
          tempProject.github_link = project.github_link as string;
          tempProject.site_link = project.site_link as string;
          tempProject.description = project.description;
          tempProject.portfolio = Promise.resolve(newPortfolio);
          const newProject = await this.projectRepository.save(tempProject);
          // const newProject = await PortfolioModel.createProject({
          //   name: project.name,
          //   image: project.image,
          //   start_date: project.start_date,
          //   end_date: project.end_date,
          //   github_link: project.github_link,
          //   site_link: project.site_link,
          //   description: project.description,
          //   portfolio: Promise.resolve(newPortfolio),
          // });

          if (project.skills) {
            for (const skill of project.skills) {
              const skillEntity = await this.skillRepository.findOne({ where: { id: skill.id } });
              if (!skillEntity) {
                throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'SKILL_NOT_FOUND', ERROR_MESSAGES.SKILL_NOT_FOUND);
              }
              // await PortfolioModel.addSkillToProject(newProject, skillEntity);
              const projectSkill = new ProjectSkillEntity();

              // Lazy-loaded 관계의 Promise를 await으로 풀어서 실제 객체를 할당
              projectSkill.project = Promise.resolve(newProject);  // lazy로 인해 Promise로 감싸줌
              projectSkill.skill = Promise.resolve(skillEntity);  // lazy로 인해 Promise로 감싸줌

              // 저장
              await this.projectSkillRepository.save(projectSkill);
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
    const portfolio = await this.portfolioRepository.findOne({
      where: { id },
      relations: ['projects', 'portfolioSkills'],
    });
    if (!portfolio) {
      throw new CustomError(HTTP_STATUS.NOT_FOUND, 'PORTFOLIO_NOT_FOUND', 'Portfolio not found.');
    }
    return portfolio;
  }

  // 포트폴리오 업데이트
  static async updatePortfolio(id: number, updatedData: Portfolio): Promise<void> {
    const existingPortfolio = await this.portfolioRepository.findOne({
      where: { id },
      relations: ['projects', 'portfolioSkills'],
    });
    if (!existingPortfolio) {
      throw new CustomError(HTTP_STATUS.NOT_FOUND, 'PORTFOLIO_NOT_FOUND', 'Portfolio not found.');
    }

    existingPortfolio.title = updatedData.title;
    existingPortfolio.description = updatedData.description;
    existingPortfolio.github_link = updatedData.github_link as string;
    existingPortfolio.blog_link = updatedData.blog_link as string;
    await this.portfolioRepository.update(id, existingPortfolio);

    // 추가된 스킬들 업데이트
    if (updatedData.skills) {
      for (const skill of updatedData.skills) {
        const skillEntity = await this.skillRepository.findOne({ where: { id: skill.id } });
        if (!skillEntity) {
          throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'SKILL_NOT_FOUND', ERROR_MESSAGES.SKILL_NOT_FOUND);
        }
        const portfolioSkill = new PortfolioSkillEntity();

        // Lazy-loaded 관계의 Promise를 await으로 풀어서 실제 객체를 할당
        portfolioSkill.portfolio = Promise.resolve(existingPortfolio);  // lazy로 인해 Promise로 감싸줌
        portfolioSkill.skill = Promise.resolve(skillEntity);  // lazy로 인해 Promise로 감싸줌

        // 저장
        await this.portfolioSkillRepository.save(portfolioSkill);
      }
    }

    // 추가된 프로젝트들 업데이트
    if (updatedData.projects) {
      for (const project of updatedData.projects) {
        const tempProject = new ProjectEntity();
        tempProject.name = project.name;
        tempProject.image = project.image as string;
        tempProject.start_date = project.start_date;
        tempProject.end_date = project.end_date;
        tempProject.github_link = project.github_link as string;
        tempProject.site_link = project.site_link as string;
        tempProject.description = project.description;
        tempProject.portfolio = Promise.resolve(existingPortfolio);
        const newProject = await this.projectRepository.save(tempProject);

        if (project.skills) {
          for (const skill of project.skills) {
            const skillEntity = await this.skillRepository.findOne({ where: { id: skill.id } });
            if (!skillEntity) {
              throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'SKILL_NOT_FOUND', ERROR_MESSAGES.SKILL_NOT_FOUND);
            }
            // await PortfolioModel.addSkillToProject(newProject, skillEntity);
            const projectSkill = new ProjectSkillEntity();

            // Lazy-loaded 관계의 Promise를 await으로 풀어서 실제 객체를 할당
            projectSkill.project = Promise.resolve(newProject);  // lazy로 인해 Promise로 감싸줌
            projectSkill.skill = Promise.resolve(skillEntity);  // lazy로 인해 Promise로 감싸줌

            // 저장
            await this.projectSkillRepository.save(projectSkill);
          }
        }
      }
    }
  }

  // 포트폴리오 삭제
  static async deletePortfolio(id: number): Promise<void> {
    const existingPortfolio = await this.portfolioRepository.findOne({
      where: { id },
      relations: ['projects', 'portfolioSkills'],
    });

    if (!existingPortfolio) {
      throw new CustomError(HTTP_STATUS.NOT_FOUND, 'PORTFOLIO_NOT_FOUND', 'Portfolio not found.');
    }

    await this.portfolioRepository.delete(id);
  }

  // 특정 유저의 모든 포트폴리오 조회
  static async getPortfoliosByUserId(userId: number): Promise<PortfolioEntity[]> {
    return await this.portfolioRepository.find({
      where: { user: { id: userId } },
      relations: ['projects', 'portfolioSkills'],
    });
  }
}

export default PortfolioService;