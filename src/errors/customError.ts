/**
 * CustomError
 * @param {number} status - http 상태 메시지
 * @param {number} code - 통용되는 코드
 * @param {string} message - 개발자를 위한 에러 메세지
 */

class CustomError extends Error {
  status: number;
  code: string;
  message: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.message = message;
    Object.setPrototypeOf(this, new.target.prototype); // 타입스크립트에서 상속받은 클래스의 오류 방지
  }
}

export default CustomError;