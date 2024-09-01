export const ERROR_MESSAGES = {
  USERNAME_TAKEN         : '아이디가 이미 사용중입니다.',
  EMAIL_TAKEN            : '이메일이 이미 사용중입니다.',
  INVALID_CREDENTIALS    : '아이디 또는 비밀번호가 틀렸습니다.',
  USER_NOT_FOUND         : '사용자를 찾을 수 없습니다.',
  MISSING_FIELDS         : '필수 입력 필드가 누락되었습니다.',
  INTERNAL_SERVER_ERROR  : '서버 에러가 발생하였습니다. 다시 시도해주세요.',
  VALIDATION_FAILED      : '유효성 검사에 실패하였습니다. 입력 값을 확인해주세요.',
  PASSWORD_MISMATCH      : '비밀번호가 일치하지 않습니다.',
  EMAIL_SEND_FAILED      : '이메일 전송에 실패하였습니다.',
  FILENAME_TAKEN         : '파일명이 이미 사용중입니다.',
  PORTFOLIO_NOT_FOUND    : '포트폴리오가 존재하지 않습니다.',
};

export const DB_ERROR_TYPE = {
  ER_DUP_ENTRY                 : 'DB_DUPLICATE_ENTRY',             // 중복된 항목 입력 시 발생
  ER_ROW_IS_REFERENCED         : 'DB_FOREIGN_KEY_VIOLATION',       // 외래 키 제약 조건 위반
  ER_DATA_TOO_LONG             : 'DB_DATA_TOO_LONG',               // 데이터가 열의 허용 길이를 초과할 때 발생
  ER_BAD_NULL_ERROR            : 'DB_NULL_VALUE_NOT_ALLOWED',      // NOT NULL 제약 조건 위반
  ER_ROW_IS_REFERENCED_2       : 'DB_ROW_IS_REFERENCED',           // 참조된 행을 삭제하거나 업데이트할 때 발생
  ER_NO_REFERENCED_ROW_2       : 'DB_NO_REFERENCED_ROW',           // 외래 키가 참조하는 행이 존재하지 않을 때 발생
  ER_DUP_UNIQUE                : 'DB_UNIQUE_CONSTRAINT_VIOLATION', // 고유 제약 조건 위반
  ER_CHECK_CONSTRAINT_VIOLATED : 'DB_CHECK_CONSTRAINT_VIOLATION',  // CHECK 제약 조건 위반
  ER_LOCK_DEADLOCK             : 'DB_DEADLOCK_FOUND',              // 데드락이 발견되었을 때 발생
  ER_LOCK_WAIT_TIMEOUT         : 'DB_LOCK_WAIT_TIMEOUT',           // 락 대기 시간이 초과될 때 발생
  ER_PARSE_ERROR               : 'DB_SYNTAX_ERROR',                // SQL 문법 오류
  ER_BAD_FIELD_ERROR           : 'DB_UNKNOWN_COLUMN',              // 존재하지 않는 열을 참조할 때 발생
  ER_ACCESS_DENIED_ERROR       : 'DB_ACCESS_DENIED',               // 접근 권한이 없을 때 발생
  ER_NO_SUCH_TABLE             : 'DB_TABLE_DOES_NOT_EXIST',        // 테이블이 존재하지 않을 때 발생
  ER_UNKNOWN                   : 'DB_UNKNOWN_ERROR'
}