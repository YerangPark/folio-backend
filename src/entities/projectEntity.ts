import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, OneToMany } from "typeorm";
import { PortfolioEntity } from "./portfolioEntity.js";
import { ProjectSkillEntity } from "./projectSkillEntity.js";

@Entity({ name: "projects" })
export class ProjectEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => PortfolioEntity, portfolio => portfolio.projects, { onDelete: 'CASCADE', lazy: true })
  portfolio!: Promise<PortfolioEntity>;

  @Column({ type: "varchar", length: 150 })
  name!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  image!: string;

  @Column({ type: "date" })
  start_date!: Date;

  @Column({ type: "date" })
  end_date!: Date;

  @Column({ type: "varchar", length: 500, nullable: true })
  github_link!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  site_link!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  readme_file!: string;

  @OneToMany(() => ProjectSkillEntity, projectSkill => projectSkill.project)
  projectSkills!: ProjectSkillEntity[];
}