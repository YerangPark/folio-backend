import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn } from "typeorm";
import { PortfolioEntity } from "./portfolioEntity";
import { SkillEntity } from "./skillEntity";

@Entity({ name: "portfolio_skills" })
export class PortfolioSkillEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  portfolio_id!: number;

  @Column()
  skill_id!: number;

  @ManyToOne(() => PortfolioEntity, portfolio => portfolio.portfolioSkills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio!: PortfolioEntity;

  @ManyToOne(() => SkillEntity, skill => skill.portfolioSkills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skill_id' })
  skill!: SkillEntity;
}