import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn } from "typeorm";
import { ProjectEntity } from "./projectEntity.js";
import { SkillEntity } from "./skillEntity.js";

@Entity({ name: "project_skills" })
export class ProjectSkillEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  project_id!: number;

  @Column()
  skill_id!: number;

  @ManyToOne(() => ProjectEntity, (project) => project.projectSkills, { onDelete: 'CASCADE', lazy: true })
  @JoinColumn({ name: 'project_id' })
  project!: Promise<ProjectEntity>;

  @ManyToOne(() => SkillEntity, (skill) => skill.projectSkills, { onDelete: 'CASCADE', lazy: true })
  @JoinColumn({ name: 'skill_id' })
  skill!: Promise<SkillEntity>;
}