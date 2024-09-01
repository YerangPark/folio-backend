import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, OneToMany } from "typeorm";
import { UserEntity } from "./userEntity";
import { SkillEntity } from "./skillEntity";
import { ProjectEntity } from "./projectEntity";

@Entity({ name: "portfolios" })
export class PortfolioEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => UserEntity, user => user.portfolios)
  user!: UserEntity;

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

  @ManyToMany(() => SkillEntity)
  @JoinTable({
    name: "portfolio_skills",
    joinColumn: {
      name: "portfolio_id",
      referencedColumnName: "id"
    },
    inverseJoinColumn: {
      name: "skill_id",
      referencedColumnName: "id"
    }
  })
  skills!: SkillEntity[];

  @OneToMany(() => ProjectEntity, project => project.portfolio)
  projects!: ProjectEntity[];
}