import AppDataSource from '../../ormconfig.js';
import { UserEntity } from '../entities/userEntity.js';
import CustomError from '../errors/customError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { ERROR_MESSAGES } from '../constants/errorConst.js';
import DBCustomError from '../errors/dbCustomError.js';
import bcrypt from 'bcryptjs';
import { SkillEntity } from '../entities/skillEntity.js';

export class SkillModel {
  //ANCHOR - 스킬 리스트
  static async getSkills(): Promise<SkillEntity[]> {
    try {
      const skillRepository = AppDataSource.getRepository(SkillEntity);
      const skills = await skillRepository.find();

      return skills;
    } catch (dbError: any) {
      if (dbError instanceof CustomError) {
        throw dbError;
      } else {
        throw new DBCustomError(dbError);
      }
    }
  }
}

export default SkillModel;