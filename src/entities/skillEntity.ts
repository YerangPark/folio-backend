import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { PortfolioSkillEntity } from "./portfolioSkillEntity.js";
import { ProjectSkillEntity } from "./projectSkillEntity.js";

@Entity({ name: "skills" })
export class SkillEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({
    type: "enum",
    enum: [
      'frontend',
      'backend',
      'database',
      'devops',
      'infrastructure',
      'version-control',
      'collaboration',
      'others',
    ],
  })
  category!: 'frontend' | 'backend' | 'database' | 'devops' | 'infrastructure' | 'version-control' | 'collaboration' | 'others';

  @OneToMany(() => PortfolioSkillEntity, portfolioSkill => portfolioSkill.skill)
  portfolioSkills!: PortfolioSkillEntity[];

  @OneToMany(() => ProjectSkillEntity, projectSkill => projectSkill.skill)
  projectSkills!: ProjectSkillEntity[];
}