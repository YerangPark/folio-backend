// src/models/portfolioModel.ts
import AppDataSource from '../../ormconfig';
import { PortfolioEntity } from '../entities/portfolioEntity';
import { ProjectEntity } from '../entities/projectEntity';
import { SkillEntity } from '../entities/skillEntity';
import { PortfolioSkillEntity } from '../entities/portfolioSkillEntity';
import { ProjectSkillEntity } from '../entities/projectSkillEntity';
import { DeepPartial } from 'typeorm';

export class PortfolioModel {
  // 포트폴리오 생성
  static async createPortfolio(portfolioData: DeepPartial<PortfolioEntity>): Promise<PortfolioEntity> {
    console.log(`portfolioData : ${JSON.stringify(portfolioData, null, 2)}`);
    const portfolioRepository = AppDataSource.getRepository(PortfolioEntity);
    const newPortfolio = portfolioRepository.create(portfolioData);
    console.log(`newPortfolio : ${JSON.stringify(newPortfolio, null, 2)}`);
    return await portfolioRepository.save(newPortfolio);
  }

  // 스킬 ID로 스킬 찾기
  static async findSkillById(skillId: number): Promise<SkillEntity | null> {
    const skillRepository = AppDataSource.getRepository(SkillEntity);
    return await skillRepository.findOne({ where: { id: skillId } });
  }

  // 포트폴리오에 스킬 추가
  static async addSkillToPortfolio(portfolio: PortfolioEntity, skill: SkillEntity): Promise<void> {
    const portfolioSkillRepository = AppDataSource.getRepository(PortfolioSkillEntity);
    const portfolioSkill = portfolioSkillRepository.create({ portfolio, skill });
    await portfolioSkillRepository.save(portfolioSkill);
  }

  // 프로젝트 생성
  static async createProject(projectData: DeepPartial<ProjectEntity>): Promise<ProjectEntity> {
    const projectRepository = AppDataSource.getRepository(ProjectEntity);
    const newProject = projectRepository.create(projectData);
    return await projectRepository.save(newProject);
  }

  // 프로젝트에 스킬 추가
  static async addSkillToProject(project: ProjectEntity, skill: SkillEntity): Promise<void> {
    const projectSkillRepository = AppDataSource.getRepository(ProjectSkillEntity);
    const projectSkill = projectSkillRepository.create({ project, skill });
    await projectSkillRepository.save(projectSkill);
  }

  // 포트폴리오 ID로 포트폴리오 조회
  static async getPortfolioById(id: number): Promise<PortfolioEntity | null> {
    const portfolioRepository = AppDataSource.getRepository(PortfolioEntity);
    return await portfolioRepository.findOne({
      where: { id },
      relations: ['projects', 'portfolioSkills'],
    });
  }

  // 포트폴리오 업데이트
  static async updatePortfolio(id: number, updatedData: DeepPartial<PortfolioEntity>): Promise<void> {
    const portfolioRepository = AppDataSource.getRepository(PortfolioEntity);
    await portfolioRepository.update(id, updatedData);
  }

  // 포트폴리오 삭제
  static async deletePortfolio(id: number): Promise<void> {
    const portfolioRepository = AppDataSource.getRepository(PortfolioEntity);
    await portfolioRepository.delete(id);
  }

  // 특정 유저의 모든 포트폴리오 조회
  static async getPortfoliosByUserId(userId: number): Promise<PortfolioEntity[]> {
    const portfolioRepository = AppDataSource.getRepository(PortfolioEntity);
    return await portfolioRepository.find({
      where: { user: { id: userId } },
      relations: ['projects', 'portfolioSkills'],
    });
  }
}

export default PortfolioModel;