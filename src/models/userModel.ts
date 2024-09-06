import AppDataSource from '../../ormconfig.js';
import { UserEntity } from '../entities/userEntity.js';
import CustomError from '../errors/customError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { ERROR_MESSAGES } from '../constants/errorConst.js';
import DBCustomError from '../errors/dbCustomError.js';
import bcrypt from 'bcryptjs';

interface User {
  id?: number;
  username: string;
  password: string;
  name: string;
  birthdate: string | Date;
  email: string;
}
type UserWithoutPassword = Omit<User, 'password'>;

export class UserModel {
  //ANCHOR - 사용자 생성 (가입)
  static async createUser(user: User): Promise<UserWithoutPassword> {
    try {
      const userRepository = AppDataSource.getRepository(UserEntity);

      const hashedPassword = await bcrypt.hash(user.password, 10);

      const newUser = userRepository.create({
        username: user.username,
        password: hashedPassword,
        name: user.name,
        birthdate: user.birthdate,
        email: user.email
      });
      await userRepository.save(newUser);

      const { password, ...userWithoutPassword } = newUser;

      return userWithoutPassword;
    } catch (dbError: any) {
      throw new DBCustomError(dbError);
    }
  }

  //ANCHOR - 사용자 인증
  static async authenticateUser(username: string, password: string): Promise<UserEntity> {
    try {
      const userRepository = AppDataSource.getRepository(UserEntity);

      const user = await userRepository.findOneBy({ username, password });
      if (!user) {
        throw new CustomError(
          HTTP_STATUS.UNAUTHORIZED,
          'INVALID_CREDENTIALS',
          ERROR_MESSAGES.INVALID_CREDENTIALS
        );
      }
      const isPWMatch = await bcrypt.compare(password, user.password);
      if (!isPWMatch) {
        throw new CustomError(
          HTTP_STATUS.UNAUTHORIZED,
          'PASSWORD_MISMATCH',
          ERROR_MESSAGES.PASSWORD_MISMATCH
        );
      }

      return user;
    } catch (dbError: any) {
      if (dbError instanceof CustomError) {
        throw dbError;
      } else {
        throw new DBCustomError(dbError);
      }
    }
  }

  //ANCHOR - 사용자 조회 (email 기준)
  static async findUsernameByEmail(email: string): Promise<UserEntity> {
    try {
      const userRepository = AppDataSource.getRepository(UserEntity);

      const user = await userRepository.findOneBy({ email });
      if (!user) {
        throw new CustomError(
          HTTP_STATUS.BAD_REQUEST,
          'USER_NOT_FOUND',
          ERROR_MESSAGES.USER_NOT_FOUND
        );
      }

      return user;
    } catch (dbError: any) {
      if (dbError instanceof CustomError) {
        throw dbError;
      } else {
        throw new DBCustomError(dbError);
      }
    }
  }

  //ANCHOR - 사용자 조회 (username 기준)
  static async findByUsername(username: string): Promise<boolean> {
    try {
      const userRepository = AppDataSource.getRepository(UserEntity);

      const count = await userRepository.count({ where: { username } });
      if (count === 0) {
        throw new CustomError(
          HTTP_STATUS.BAD_REQUEST,
          'USER_NOT_FOUND',
          ERROR_MESSAGES.USER_NOT_FOUND
        );
      }

      return count > 0;
    } catch (dbError: any) {
      if (dbError instanceof CustomError) {
        throw dbError;
      } else {
        throw new DBCustomError(dbError);
      }
    }
  }

  //ANCHOR - 사용자 정보 업데이트
  static async updateUser(username: string, updatedData: Partial<User>): Promise<boolean> {
    try {
      const userRepository = AppDataSource.getRepository(UserEntity);

      const result = await userRepository.update({ username }, updatedData);
      if (result.affected && result.affected > 0) {
        return true;
      } else {
        throw new CustomError(
          HTTP_STATUS.BAD_REQUEST,
          'USER_NOT_FOUND',
          ERROR_MESSAGES.USER_NOT_FOUND
        );
      }
    } catch (dbError: any) {
      if (dbError instanceof CustomError) {
        throw dbError;
      } else {
        throw new DBCustomError(dbError);
      }
    }
  }

  //ANCHOR - 사용자 삭제
  static async deleteUser(username: string): Promise<boolean> {
    try {
      const userRepository = AppDataSource.getRepository(UserEntity);

      const result = await userRepository.delete({ username });
      if (result.affected && result.affected > 0) {
        return true;
      } else {
        throw new CustomError(
          HTTP_STATUS.BAD_REQUEST,
          'USER_NOT_FOUND',
          ERROR_MESSAGES.USER_NOT_FOUND
        );
      }
    } catch (dbError: any) {
      if (dbError instanceof CustomError) {
        throw dbError;
      } else {
        throw new DBCustomError(dbError);
      }
    }
  }

  //ANCHOR - username과 email로 이루어진 사용자 찾기
  static async findPWByUsernameAndEmail(username: string, email: string): Promise<UserEntity> {
    try {
      const userRepository = AppDataSource.getRepository(UserEntity);

      const user = await userRepository.findOneBy({ username, email });
      if (!user) {
        throw new CustomError(
          HTTP_STATUS.BAD_REQUEST,
          'USER_NOT_FOUND',
          ERROR_MESSAGES.USER_NOT_FOUND
        );
      }

      return user;
    } catch (dbError: any) {
      if (dbError instanceof CustomError) {
        throw dbError;
      } else {
        throw new DBCustomError(dbError);
      }
    }
  }

  //ANCHOR - 사용자 정보 조회 (username 기준)
  static async getInfoByUsername(username: string): Promise<UserWithoutPassword> {
    try {
      const userRepository = AppDataSource.getRepository(UserEntity);

      const user = await userRepository.findOne({
        where: { username },
        select: ["name", "birthdate", "email"],
      });
      if (!user) {
        throw new CustomError(
          HTTP_STATUS.BAD_REQUEST,
          'USER_NOT_FOUND',
          ERROR_MESSAGES.USER_NOT_FOUND
        );
      }

      const birthdate = new Date(user.birthdate);

      return {
        name: user.name,
        birthdate: birthdate.toISOString().split('T')[0],
        email: user.email,
        username: user.username,
      };
    } catch (dbError: any) {
      if (dbError instanceof CustomError) {
        throw dbError;
      } else {
        throw new DBCustomError(dbError);
      }
    }
  }

  //ANCHOR - ID 중복 검사
  static async isUsernameTaken(username: string): Promise<boolean> {
    try {
      const userRepository = AppDataSource.getRepository(UserEntity);

      const count = await userRepository.count({ where: { username } });
      return count > 0;
    } catch (dbError: any) {
      if (dbError instanceof CustomError) {
        throw dbError;
      } else {
        throw new DBCustomError(dbError);
      }
    }
  }

  //ANCHOR - 이메일 중복 검사
  static async isEmailTaken(email: string): Promise<boolean> {
    try {
      const userRepository = AppDataSource.getRepository(UserEntity);

      const count = await userRepository.count({ where: { email } });
      return count > 0;
    } catch (dbError: any) {
      if (dbError instanceof CustomError) {
        throw dbError;
      } else {
        throw new DBCustomError(dbError);
      }
    }
  }
}

export default UserModel;