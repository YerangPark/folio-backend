/**
 * DBCustomError
 * @param {number} status - http 상태 메시지
 * @param {number} code - 통용되는 코드
 * @param {string} message - 개발자를 위한 에러 메세지
 */

import CustomError from './customError'; // 커스텀 에러 클래스
import { HTTP_STATUS } from '../constants/httpStatus'; // HTTP 상태 코드 정의
import { DB_ERROR_TYPE } from '../constants/errorConst';

class DBCustomError extends CustomError {
    constructor(dbError: any) {
      let status: number;
      let code: string;
      let message: string;

      if (dbError.code) {
        code = DB_ERROR_TYPE[dbError.code as keyof typeof DB_ERROR_TYPE] || 'DB_UNKNOWN_ERROR';
        message = dbError.sqlMessage || dbError.message || 'Unknown database error';

        switch (dbError.code) {
          case 'ER_DUP_ENTRY':
          case 'ER_ROW_IS_REFERENCED':
          case 'ER_ROW_IS_REFERENCED_2':
          case 'ER_NO_REFERENCED_ROW_2':
          case 'ER_DUP_UNIQUE':
            status = HTTP_STATUS.CONFLICT;
            break;
          case 'ER_DATA_TOO_LONG':
          case 'ER_BAD_NULL_ERROR':
          case 'ER_PARSE_ERROR':
          case 'ER_BAD_FIELD_ERROR':
          case 'ER_CHECK_CONSTRAINT_VIOLATED':
            status = HTTP_STATUS.BAD_REQUEST;
            break;
          case 'ER_LOCK_DEADLOCK':
          case 'ER_LOCK_WAIT_TIMEOUT':
          case 'ER_NO_SUCH_TABLE':
            status = HTTP_STATUS.INTERNAL;
            break;
          case 'ER_ACCESS_DENIED_ERROR':
            status = HTTP_STATUS.FORBIDEN;
            break;
          default:
            status = HTTP_STATUS.INTERNAL;
            break;
        }
      } else {
        status = HTTP_STATUS.INTERNAL;
        code = 'DB_UNKNOWN_ERROR';
        message = dbError.message || 'Unknown database error';
      }
      super(status, code, message);
    }
  }


export default DBCustomError;