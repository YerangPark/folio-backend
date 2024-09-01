import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { PortfolioEntity } from "./portfolioEntity";

@Entity({ name: "skills" })
export class SkillEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "enum", enum: ['frontend', 'backend', 'database', 'devops', 'infrastructure', 'version-control', 'collaboration', 'others'] })
  category!: 'frontend' | 'backend' | 'database' | 'devops' | 'infrastructure' | 'version-control' | 'collaboration' | 'others';

  @ManyToMany(() => PortfolioEntity, portfolio => portfolio.skills)
  portfolios!: PortfolioEntity[];
}