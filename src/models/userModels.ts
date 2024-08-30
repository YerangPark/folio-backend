import { UserEntity } from '../entities/User';
import AppDataSource  from '../../ormconfig';
import CustomError from '../errors/customError';
import { HTTP_STATUS } from '../constants/httpStatus';
import { ERROR_MESSAGES } from '../constants/errorConst';
import DBCustomError from '../errors/dbCustomError'
const { getConnection } = require('../config/db');

interface User {
  id?: number;
  username: string;
  password?: string;
  name: string;
  birthdate: string;
  email: string;
}

class UserModel {
  //ANCHOR - 사용자 생성 (가입)
  static async create(userData: User): Promise<number> {
    try {
      const { username, password, name, birthdate, email } = userData;
      const conn = await getConnection();
      const query = 'INSERT INTO users (username, password, name, birthdate, email) VALUES (?, ?, ?, ?, ?)';
      const result = await conn.query(query, [username, password, name, birthdate, email]);
      conn.end();
      return result.insertId.toString();
    } catch (dbError: any) {
      throw new DBCustomError(dbError);
    }
  }

  //ANCHOR - 사용자 인증
  static async authenticateUser(username: string, password: string): Promise<User> {
    try {
      const conn = await getConnection();
      const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
      const result = await conn.query(query, [username, password]);
      conn.end();

      if (result.length === 0) {
        throw new CustomError(HTTP_STATUS.UNAUTHORIZED, 'INVALID_CREDENTIALS', ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      return result[0] as User;
    } catch (dbError: any) {
      if (dbError instanceof CustomError) {
        throw dbError;
      }
      else {
        throw new DBCustomError(dbError);
      }
    }
  }

  //ANCHOR - 사용자 조회 (email 기준)
  static async findUsernameByEmail(email: string): Promise<string> {
    try {
      const conn = await getConnection();
      const query = 'SELECT username FROM users WHERE email = ?';
      const result = await conn.query(query, [email]);
      conn.end();

      if (result.length === 0) {
        throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'USER_NOT_FOUND', ERROR_MESSAGES.USER_NOT_FOUND);
      }

      return result[0].username; // 사용자 객체 반환
    } catch (dbError: any) {
      if (dbError instanceof CustomError) {
        throw dbError;
      }
      else {
        throw new DBCustomError(dbError);
      }
    }
  }

  //ANCHOR - 사용자 조회 (username 기준)
  static async findByUsername(username: string): Promise<boolean> {
    try {
      const conn = await getConnection();
      const query = 'SELECT COUNT(*) FROM users WHERE username = ?';
      const [row] = await conn.query(query, [username]);
      conn.end();

      const count = Number(row.count);
      if (count === 0) {
        throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'USER_NOT_FOUND', ERROR_MESSAGES.USER_NOT_FOUND);
      }

      return count > 0;
    } catch (dbError: any) {
      if (dbError instanceof CustomError) {
        throw dbError;
      }
      else {
        throw new DBCustomError(dbError);
      }
    }
  }

  //ANCHOR - 사용자 정보 업데이트
  static async updateUser(username: string, updatedData: Partial<User>): Promise<boolean> {
    try {
      const conn = await getConnection();
      const query = 'UPDATE users SET ? WHERE username = ?';
      const result = await conn.query(query, [updatedData, username]);
      conn.end();

      if (result.affectedRows === 0) {
        throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'USER_NOT_FOUND', ERROR_MESSAGES.USER_NOT_FOUND);
      }

      return result.affectedRows > 0;
    } catch (dbError: any) {
      if (dbError instanceof CustomError) {
        throw dbError;
      }
      else {
        throw new DBCustomError(dbError);
      }
    }
  }

  //SECTION - 사용자 삭제
  static async deleteUser(username: string): Promise<boolean> {
    try {
      const conn = await getConnection();
      const query = 'DELETE FROM users WHERE username = ?';
      const result = await conn.query(query, [username]);
      conn.end();

      if (result.affectedRows === 0) {
        throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'USER_NOT_FOUND', ERROR_MESSAGES.USER_NOT_FOUND);
      }

      return result.affectedRows > 0;
    } catch (dbError: any) {
      if (dbError instanceof CustomError) {
        throw dbError;
      }
      else {
        throw new DBCustomError(dbError);
      }
    }
  }

  //ANCHOR - username과 email로 이루어진 사용자 찾기
  static async findPWByUsernameAndEmail(username: string, email: string): Promise<boolean> {
    try {
      const conn = await getConnection();
      const query = 'SELECT COUNT(*) FROM users WHERE username = ? AND email = ?';
      const [row] = await conn.query(query, [username, email]);
      conn.end();

      const count = Number(row.count);

      if (count === 0) {
        throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'USER_NOT_FOUND', ERROR_MESSAGES.USER_NOT_FOUND);
      }

      return count > 0;
    } catch (dbError: any) {
      if (dbError instanceof CustomError) {
        throw dbError;
      }
      else {
        throw new DBCustomError(dbError);
      }
    }
  }

  //ANCHOR - 사용자 정보 조회 (username 기준)
  static async getInfoByUsername(username: string): Promise<User> {
    try {
      const conn = await getConnection();
      const query = 'SELECT name, birthdate, email FROM users WHERE username = ?';
      const result = await conn.query(query, [username]);
      conn.end();

      if (result.length === 0) {
        throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'USER_NOT_FOUND', ERROR_MESSAGES.USER_NOT_FOUND);
      }

      return result[0] as User;
    } catch (dbError: any) {
      if (dbError instanceof CustomError) {
        throw dbError;
      }
      else {
        throw new DBCustomError(dbError);
      }
    }
  }

  //ANCHOR - ID 중복 검사
  static async isUsernameTaken(username: string): Promise<boolean> {
    try {
      const conn = await getConnection();
      const query = 'SELECT COUNT(*) as count FROM users WHERE username = ?';
      const [row] = await conn.query(query, [username]);
      conn.end();

      return Number(row.count) > 0;
    } catch (dbError: any) {
      if (dbError instanceof CustomError) {
        throw dbError;
      }
      else {
        throw new DBCustomError(dbError);
      }
    }
  }

  //ANCHOR - 이메일 중복 검사
  static async isEmailTaken(email: string): Promise<boolean> {
    try {
      const conn = await getConnection();
      const query = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
      const [row] = await conn.query(query, [email]);
      conn.end();

      return Number(row.count) > 0;
    } catch (dbError: any) {
      if (dbError instanceof CustomError) {
        throw dbError;
      }
      else {
        throw new DBCustomError(dbError);
      }
    }
  }
}

export default UserModel;
