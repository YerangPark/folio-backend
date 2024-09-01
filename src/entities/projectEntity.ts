import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable } from "typeorm";
import { PortfolioEntity } from "./portfolioEntity";
import { SkillEntity } from "./skillEntity";

@Entity({ name: "projects" })
export class ProjectEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => PortfolioEntity, portfolio => portfolio.projects)
  portfolio!: PortfolioEntity;

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

  @ManyToMany(() => SkillEntity)
  @JoinTable({
    name: "project_skills",
    joinColumn: {
      name: "project_id",
      referencedColumnName: "id"
    },
    inverseJoinColumn: {
      name: "skill_id",
      referencedColumnName: "id"
    }
  })
  skills!: SkillEntity[];
}