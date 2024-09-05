import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn } from "typeorm";
import { PortfolioEntity } from "./portfolioEntity.js";
import { SkillEntity } from "./skillEntity.js";

@Entity({ name: "portfolio_skills" })
export class PortfolioSkillEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  portfolio_id!: number;

  @Column()
  skill_id!: number;

  @ManyToOne(() => PortfolioEntity, (portfolio) => portfolio.portfolioSkills, { onDelete: 'CASCADE', lazy: true })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio!: Promise<PortfolioEntity>;

  @ManyToOne(() => SkillEntity, (skill) => skill.portfolioSkills, { onDelete: 'CASCADE', lazy: true })
  @JoinColumn({ name: 'skill_id' })
  skill!: Promise<SkillEntity>;
}