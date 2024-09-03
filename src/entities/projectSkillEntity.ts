import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn } from "typeorm";
import { ProjectEntity } from "./projectEntity";
import { SkillEntity } from "./skillEntity";

@Entity({ name: "project_skills" })
export class ProjectSkillEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  project_id!: number;

  @Column()
  skill_id!: number;

  @ManyToOne(() => ProjectEntity, project => project.projectSkills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: ProjectEntity;

  @ManyToOne(() => SkillEntity, skill => skill.portfolioSkills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skill_id' })
  skill!: SkillEntity;
}
