import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { PortfolioEntity } from "./portfolioEntity.js";
import { ProjectSkillEntity } from "./projectSkillEntity.js";

@Entity({ name: "projects" })
export class ProjectEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  // 외래 키 컬럼을 명시적으로 추가
  @Column()
  portfolio_id!: number; // 외래 키로서 portfolio_id를 명시적으로 선언

  @ManyToOne(() => PortfolioEntity, portfolio => portfolio.projects, { onDelete: 'CASCADE', lazy: true })
  @JoinColumn({ name: 'portfolio_id' }) // 외래 키를 매핑할 JoinColumn 명시
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