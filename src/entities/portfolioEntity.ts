import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { UserEntity } from "./userEntity.js";
import { ProjectEntity } from "./projectEntity.js";
import { PortfolioSkillEntity } from "./portfolioSkillEntity.js";// PortfolioSkillEntity를 임포트

@Entity({ name: "portfolios" })
export class PortfolioEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => UserEntity, (user) => user.portfolios, { lazy: true })
  user!: Promise<UserEntity>;

  @Column({ type: "varchar", length: 255 })
  file_name!: string;

  @Column({ type: "varchar", length: 150 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  github_link!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  blog_link!: string;

  @CreateDateColumn({ type: "timestamp" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updated_at!: Date;

  @OneToMany(() => PortfolioSkillEntity, portfolioSkill => portfolioSkill.portfolio, { cascade: true, onDelete: 'CASCADE' })
  portfolioSkills!: PortfolioSkillEntity[];

  @OneToMany(() => ProjectEntity, project => project.portfolio, { cascade: true, onDelete: 'CASCADE', lazy: true })
  projects!: Promise<ProjectEntity[]>;
}