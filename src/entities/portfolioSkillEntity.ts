import { Entity, PrimaryColumn, ManyToOne } from "typeorm";
import { PortfolioEntity } from "./portfolioEntity";
import { SkillEntity } from "./skillEntity";

@Entity({ name: "portfolio_skills" })
export class PortfolioSkillEntity {
  @PrimaryColumn()
  portfolio_id!: number;

  @PrimaryColumn()
  skill_id!: number;

  @ManyToOne(() => PortfolioEntity, portfolio => portfolio.skills)
  portfolio!: PortfolioEntity;

  @ManyToOne(() => SkillEntity, skill => skill.portfolios)
  skill!: SkillEntity;
}
