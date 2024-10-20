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
import path from 'path';
import fs from 'fs';

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
  readme_file?: string;
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
  image?: string;
  skills?: PortfolioSkill[];
  projects?: Project[];
}

const deleteFile = (filePath: string) => {
  const fullPath = path.join(process.env.UPLOAD_PATH || '', filePath);
  fs.unlink(fullPath, (err) => {
    if (err) {
      console.error(`Failed to delete file: ${fullPath}`, err);
    } else {
      console.log(`Successfully deleted file: ${fullPath}`);
    }
  });
};

class PortfolioService {
  static portfolioRepository: Repository<PortfolioEntity> = AppDataSource.getRepository(PortfolioEntity);
  static projectRepository: Repository<ProjectEntity> = AppDataSource.getRepository(ProjectEntity);
  static skillRepository: Repository<SkillEntity> = AppDataSource.getRepository(SkillEntity);
  static portfolioSkillRepository: Repository<PortfolioSkillEntity> = AppDataSource.getRepository(PortfolioSkillEntity);
  static projectSkillRepository: Repository<ProjectSkillEntity> = AppDataSource.getRepository(ProjectSkillEntity)
  static userRepository: Repository<UserEntity> = AppDataSource.getRepository(UserEntity);

  // 포트폴리오 생성
  static async createPortfolio(userId: number, portfolioData: Portfolio): Promise<PortfolioEntity> {
    const queryRunner: QueryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (!userId) {
        throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'USER_ID_REQUIRED', 'User ID is required to create a portfolio.');
      }

      const existingPortfolio = await AppDataSource.getRepository(PortfolioEntity).findOne({
        where: { file_name: portfolioData.file_name, user: { id: userId } },
      });

      if (existingPortfolio) {
        throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'FILENAME_TAKEN', ERROR_MESSAGES.FILENAME_TAKEN);
      }

      const user = await queryRunner.manager.findOne(UserEntity, { where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      const portfolio = new PortfolioEntity();
      portfolio.file_name = portfolioData.file_name;
      portfolio.title = portfolioData.title;
      portfolio.description = portfolioData.description;
      portfolio.github_link = portfolioData.github_link as string;
      portfolio.blog_link = portfolioData.blog_link as string;
      portfolio.user = Promise.resolve(user);
      portfolio.image = portfolioData.image as string;
      const newPortfolio = await this.portfolioRepository.save(portfolio);

      // 스킬 연결 처리
      if (portfolioData.skills) {
        const skillsArray = typeof portfolioData.skills === 'string' ? JSON.parse(portfolioData.skills) : portfolioData.skills;
        for (const skill of skillsArray) {
              const skillEntity = await queryRunner.manager.findOne(SkillEntity, { where: { id: skill } });
          if (!skillEntity) {
            throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'SKILL_NOT_FOUND', ERROR_MESSAGES.SKILL_NOT_FOUND);
          }

          const portfolioSkill = new PortfolioSkillEntity();
          portfolioSkill.portfolio = Promise.resolve(newPortfolio);
          portfolioSkill.skill = Promise.resolve(skillEntity);
          await queryRunner.manager.save(portfolioSkill);
        }
      }

      // 프로젝트 처리
      if (portfolioData.projects) {
        for (const project of portfolioData.projects) {
          const tempProject = new ProjectEntity();
          tempProject.name = project.name;
          tempProject.image = project.image as string;
          tempProject.start_date = project.start_date;
          tempProject.end_date = project.end_date;
          tempProject.github_link = project.github_link as string;
          tempProject.site_link = project.site_link as string;
          tempProject.readme_file = project.readme_file as string;
          tempProject.description = project.description;
          tempProject.portfolio = Promise.resolve(newPortfolio);

          const newProject = await queryRunner.manager.save(tempProject);

          if (project.skills) {
            const skillsArray = typeof project.skills === 'string' ? JSON.parse(project.skills) : project.skills;
            for (const skill of skillsArray) {
              const skillEntity = await queryRunner.manager.findOne(SkillEntity, { where: { id: skill } });
              if (!skillEntity) {
                throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'SKILL_NOT_FOUND', ERROR_MESSAGES.SKILL_NOT_FOUND);
              }

              const projectSkill = new ProjectSkillEntity();
              projectSkill.project = Promise.resolve(newProject);
              projectSkill.skill = Promise.resolve(skillEntity);
              await queryRunner.manager.save(projectSkill);
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
      relations: ['projects', 'portfolioSkills', 'projects.projectSkills', 'projects.projectSkills.skill'],
    });

    if (!portfolio) {
      throw new CustomError(HTTP_STATUS.NOT_FOUND, 'PORTFOLIO_NOT_FOUND', 'Portfolio not found.');
    }

    // 이미지 경로에서 파일명만 추출
    if (portfolio.image) {
      portfolio.image = portfolio.image.split('/').pop() || portfolio.image;
    }

    const projects = await Promise.all(
      (await portfolio.projects).map(async project => {
        if (project.image) {
          project.image = project.image.split('/').pop() || project.image;
        }
        if (project.readme_file) {
          project.readme_file = project.readme_file.split('/').pop() || project.readme_file;
        }
        return project;
      })
    );
    portfolio.projects = Promise.resolve(projects);

    return portfolio;
  }

  // 포트폴리오 업데이트
  static async updatePortfolio(id: number, updatedData: Portfolio): Promise<PortfolioEntity> {
    const queryRunner: QueryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const existingPortfolio = await queryRunner.manager.findOne(PortfolioEntity, {
            where: { id },
            relations: ['projects', 'portfolioSkills'],
        });
        if (!existingPortfolio) {
            throw new CustomError(HTTP_STATUS.NOT_FOUND, 'PORTFOLIO_NOT_FOUND', 'Portfolio not found.');
        }

        // 포트폴리오 기본 정보 업데이트
        existingPortfolio.file_name = updatedData.file_name;
        existingPortfolio.title = updatedData.title;
        existingPortfolio.description = updatedData.description;
        existingPortfolio.github_link = updatedData.github_link as string;
        existingPortfolio.blog_link = updatedData.blog_link as string;
        if (updatedData.image) {
            existingPortfolio.image = updatedData.image;  // 이미지 업데이트 처리
        }
        await queryRunner.manager.save(existingPortfolio);

        // 스킬 업데이트
        if (updatedData.skills) {
          const skillsArray = typeof updatedData.skills === 'string' ? JSON.parse(updatedData.skills) : updatedData.skills;

          // 기존 스킬을 모두 삭제하는 대신, 중복되지 않는 새로운 스킬만 추가
          const existingSkills = await queryRunner.manager.find(PortfolioSkillEntity, {
              where: { portfolio: { id } },
              relations: ['skill'],
          });

          for (const skill of skillsArray) {
              const skillEntity = await queryRunner.manager.findOne(SkillEntity, { where: { id: skill } });
              if (!skillEntity) {
                  throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'SKILL_NOT_FOUND', ERROR_MESSAGES.SKILL_NOT_FOUND);
              }

              const isSkillAlreadyAdded = existingSkills.some(existingSkill => existingSkill.skill_id === skill);

              // 중복된 스킬이 아니라면 새롭게 추가
              if (!isSkillAlreadyAdded) {
                  const portfolioSkill = new PortfolioSkillEntity();
                  portfolioSkill.portfolio = Promise.resolve(existingPortfolio);
                  portfolioSkill.skill = Promise.resolve(skillEntity);
                  await queryRunner.manager.save(portfolioSkill);
              }
          }
      }

      // 프로젝트 업데이트
      if (updatedData.projects) {
        const existingProjects = await queryRunner.manager.find(ProjectEntity, {
            where: { portfolio: { id } },
            relations: ['projectSkills'],
        });

        // 기존 프로젝트를 처리
        for (const existingProject of existingProjects) {
            const projectExists = updatedData.projects.some(
                (p) => typeof p.id === 'string' ? parseInt(p.id, 10) === existingProject.id : p.id === existingProject.id
            );

            if (!projectExists) {
                // updatedData.projects에 없는 기존 프로젝트를 삭제
                await queryRunner.manager.delete(ProjectEntity, { id: existingProject.id });
            }
        }

        // 업데이트된 프로젝트를 처리
        for (const project of updatedData.projects) {
          const projectId = typeof project.id === 'string' ? parseInt(project.id, 10) : project.id;
          const existingProject = existingProjects.find(p => p.id === projectId);

          if (existingProject) {
              // 기존 프로젝트가 있으면 업데이트
              existingProject.name = project.name;
              existingProject.start_date = project.start_date;
              existingProject.end_date = project.end_date;
              existingProject.github_link = project.github_link as string;
              existingProject.site_link = project.site_link as string;
              existingProject.description = project.description;

              if (project.image) {
                  existingProject.image = project.image;
              }

              if (project.readme_file) {
                  existingProject.readme_file = project.readme_file;
              }

              // 프로젝트 저장 (업데이트)
              await queryRunner.manager.save(existingProject);

              // 프로젝트에 연결된 스킬 업데이트
              if (project.skills) {
                const projectSkillsArray = typeof project.skills === 'string' ? JSON.parse(project.skills) : project.skills;

                // 기존 스킬을 조회하여 새롭게 추가할 스킬만 필터링
                const existingProjectSkills = await queryRunner.manager.find(ProjectSkillEntity, {
                  where: { project: { id: existingProject.id } },
                  relations: ['skill'],
                });

                // 이미 존재하는 스킬 ID 추출
                const existingSkillIds = existingProjectSkills.map((existingSkill) => existingSkill.skill_id);

                // 새롭게 추가할 스킬 ID만 필터링
                const newSkills = projectSkillsArray.filter((skillId: number) => !existingSkillIds.includes(skillId));

                // 중복되지 않은 새로운 스킬만 추가
                for (const skill of newSkills) {
                  const skillEntity = await queryRunner.manager.findOne(SkillEntity, { where: { id: skill } });
                  if (!skillEntity) {
                    throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'SKILL_NOT_FOUND', ERROR_MESSAGES.SKILL_NOT_FOUND);
                  }

                  const projectSkill = new ProjectSkillEntity();
                  projectSkill.project = Promise.resolve(existingProject);
                  projectSkill.skill = Promise.resolve(skillEntity);
                  await queryRunner.manager.save(projectSkill);
                }
              }
          } else {
              // 새로운 프로젝트 추가
              const newProject = new ProjectEntity();
              newProject.name = project.name;
              newProject.image = project.image as string;
              newProject.start_date = project.start_date;
              newProject.end_date = project.end_date;
              newProject.github_link = project.github_link as string;
              newProject.site_link = project.site_link as string;
              newProject.description = project.description;
              newProject.portfolio = Promise.resolve(existingPortfolio);
              newProject.readme_file = project.readme_file as string;

              await queryRunner.manager.save(newProject);

              // 새로운 프로젝트 스킬 추가
              if (project.skills) {
                  const projectSkillsArray = typeof project.skills === 'string' ? JSON.parse(project.skills) : project.skills;
                  for (const skill of projectSkillsArray) {
                      const skillEntity = await queryRunner.manager.findOne(SkillEntity, { where: { id: skill } });
                      if (!skillEntity) {
                          throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'SKILL_NOT_FOUND', ERROR_MESSAGES.SKILL_NOT_FOUND);
                      }

                      const projectSkill = new ProjectSkillEntity();
                      projectSkill.project = Promise.resolve(newProject);
                      projectSkill.skill = Promise.resolve(skillEntity);
                      await queryRunner.manager.save(projectSkill);
                  }
              }
          }
        }
      }
      await queryRunner.commitTransaction();
      return existingPortfolio;
    } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
    } finally {
        await queryRunner.release();
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
    const portfolios = await this.portfolioRepository.find({
      where: { user: { id: userId } },
      relations: ['projects', 'portfolioSkills'],
    });
    portfolios.forEach((portfolio: PortfolioEntity)=> {
      if (portfolio.image) {
        portfolio.image = portfolio.image.split('/').pop() || portfolio.image;
      }
    })
    return portfolios;
  }

  static async getPublicPortfolioByUsernameAndId(username: string, id: number): Promise<PortfolioEntity | null> {
    // username을 통해 사용자 조회
    const user = await this.userRepository.findOne({
      where: { username },  // username으로 사용자 조회
    });

    if (!user) {
      throw new CustomError(HTTP_STATUS.NOT_FOUND, 'USER_NOT_FOUND', 'User not found.');
    }

    const portfolio = await this.portfolioRepository.findOne({
      where: {
        id,
        user: { id: user.id },  // 사용자 ID로 필터링
      },
      relations: ['projects', 'portfolioSkills', 'projects.projectSkills', 'projects.projectSkills.skill'],
    });

    if (!portfolio) {
      throw new CustomError(HTTP_STATUS.NOT_FOUND, 'PORTFOLIO_NOT_FOUND', 'Portfolio not found.');
    }

    if (portfolio.image) {
      portfolio.image = portfolio.image.split('/').pop() || portfolio.image;
    }

    const projects = await Promise.all(
      (await portfolio.projects).map(async project => {
        if (project.image) {
          project.image = project.image.split('/').pop() || project.image;
        }
        if (project.readme_file) {
          project.readme_file = project.readme_file.split('/').pop() || project.readme_file;
        }
        return project;
      })
    );
    portfolio.projects = Promise.resolve(projects);

    return portfolio;
  }

}

export default PortfolioService;