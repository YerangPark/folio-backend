import { DataSource, DataSourceOptions } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

const options: DataSourceOptions = {
  type: "mariadb",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: true,
  entities: ["src/entities/*.ts"],
  migrations: ["src/migration/*.ts"],
  subscribers: ["src/subscriber/*.ts"]
};

const AppDataSource = new DataSource(options);

export default AppDataSource;