import mariadb, { Pool, PoolConnection } from "mariadb";
require('dotenv').config();

const pool: Pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionLimit: 5
});

export async function getConnection(): Promise<PoolConnection> {
  console.log('  연결 정보 출력');
  console.log('   HOST : ' + process.env.DB_HOST);
  console.log('   DB_USER : ' + process.env.DB_USER);
  console.log('   DB_NAME : ' + process.env.DB_NAME);
  let connection: PoolConnection;
  try {
    connection = await pool.getConnection(); // 새로운 데이터베이스 연결을 생성하는 함수 호출
    console.log('Connected to the MariaDB database');
  } catch (err) {
    console.error('Unable to connect to the MariaDB database:', err);
    throw err;
  }
  return connection;
}
