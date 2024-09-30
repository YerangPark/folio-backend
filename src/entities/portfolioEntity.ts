import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany, JoinColumn } from "typeorm";
import { UserEntity } from "./userEntity.js";
import { ProjectEntity } from "./projectEntity.js";
import { PortfolioSkillEntity } from "./portfolioSkillEntity.js"; // PortfolioSkillEntity를 임포트

@Entity({ name: "portfolios" })
export class PortfolioEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  // 외래 키 컬럼을 명시적으로 추가
  @Column()
  user_id!: number; // 외래 키로서 userId를 명시적으로 선언

  @ManyToOne(() => UserEntity, (user) => user.portfolios, { nullable: false, lazy: true })
  @JoinColumn({ name: 'user_id' })
  user!: Promise<UserEntity>;

  @Column({ type: "varchar", length: 255 })
  file_name!: string;

  @Column({ type: "varchar", length: 150 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  image!: string;

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