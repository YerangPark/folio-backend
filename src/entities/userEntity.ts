import { Entity, PrimaryGeneratedColumn, Column, Unique, CreateDateColumn, OneToMany } from "typeorm";
import { PortfolioEntity } from "./portfolioEntity.js";

@Entity({ name: "users" })
@Unique(["username"])
@Unique(["email"])
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "date" })
  birthdate!: Date;

  @Column({ type: "varchar", length: 50 })
  username!: string;

  @Column({ type: "varchar", length: 255 })
  password!: string;

  @Column({ type: "varchar", length: 255 })
  email!: string;

  @CreateDateColumn({ type: "timestamp" })
  created_at!: Date;

  @OneToMany(() => PortfolioEntity, (portfolio) => portfolio.user)
  portfolios!: PortfolioEntity[];
}