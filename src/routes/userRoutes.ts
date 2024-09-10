import express, { Router, Request, Response, NextFunction } from 'express';
import UserModel from '../models/userModel.js';
import { sendEmail } from '../utils/mailer.js';
import { generateRandomPassword } from '../utils/passwordGenerator.js';
import { USER_CONST, EMAIL_TYPE } from '../constants/userConst.js';
import { ERROR_MESSAGES } from '../constants/errorConst.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import CustomError from '../errors/customError.js';
import { generateSuccessResponse } from '../responses/successResponse.js';

const router = express.Router();

//SECTION - 타입 정의
interface SignupRequestBody {
  username: string,
  password: string,
  name: string,
  birthdate: string,
  email: string
}

interface LoginRequestBody {
  username: string,
  password: string
}

interface FindIdRequestBody {
  email: string
}

interface GetUserInfoRequestBody {
  username: string // TODO - 추후 JWT 토큰 기반 방식으로 바뀌면 수정 요함
}

interface EditRequestBody{
  username: string,
  password?: string,
  name?: string,
  birthdate?: string,
  email?: string
}

interface FindPwRequestBody {
  username: string,
  email: string
}

interface SignoutRequestBody {
  username: string
}

//SECTION - 유효성 검사 함수
function validateSignupData(data: SignupRequestBody): boolean {

  if (!data || !data.username || !data.password || !data.name || !data.birthdate || !data.email) {
    throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'MISSING_FIELDS', ERROR_MESSAGES.MISSING_FIELDS);
  }
  const { username, password, name, birthdate, email } = data;

  // ANCHOR - 이메일 유효성 검사
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // ANCHOR - 생년월일 유효성 검사
  const birthdateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!birthdateRegex.test(birthdate)) {
    return false;
  }

  // TODO - 비밀번호 Validation

  return true;
}

function validateEditData(data: EditRequestBody): boolean {
  // ANCHOR - 이메일 유효성 검사
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.email && !emailRegex.test(data.email)) {
    return false;
  }

  // ANCHOR - 생년월일 유효성 검사
  const birthdateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (data.birthdate && !birthdateRegex.test(data.birthdate)) {
    return false;
  }

  return true;
}

//SECTION - 핸들러
//ANCHOR - 회원가입
router.post('/api/user/sign', async (req: Request, res: Response, next: NextFunction) => {
  if (!validateSignupData(req.body)) {
    throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'VALIDATION_FAILED', ERROR_MESSAGES.VALIDATION_FAILED);
  }
  const { name, birthdate, username, password, email } = req.body as SignupRequestBody;

  try {
    const isUsernameTaken = await UserModel.isUsernameTaken(username);
    if (isUsernameTaken) {
      throw new CustomError(HTTP_STATUS.CONFLICT, 'USERNAME_TAKEN', ERROR_MESSAGES.USERNAME_TAKEN);
    }
    const isEmailTaken = await UserModel.isEmailTaken(email);
    if (isEmailTaken) {
      throw new CustomError(HTTP_STATUS.CONFLICT, 'EMAIL_TAKEN', ERROR_MESSAGES.EMAIL_TAKEN);
    }

    const result = await UserModel.createUser({ name, birthdate, username, password, email });
    res.status(HTTP_STATUS.CREATED).json(generateSuccessResponse({ id: result }));
  } catch (error: any) {
    next(error);
    // res.status(500).send(error.message);
  }
});

//ANCHOR - 로그인
router.post('/api/user/login', async (req: Request, res: Response, next: NextFunction) => {
  console.log(req.body);
  if (!req.body.username || !req.body.password) {
    throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'MISSING_FIELDS', ERROR_MESSAGES.MISSING_FIELDS);
  }
  const { username, password } = req.body as LoginRequestBody;
  try {
    const result = await UserModel.authenticateUser(username, password);
    const { id } = result;
    res.status(HTTP_STATUS.OK).json(generateSuccessResponse({ id }));
  } catch (error: any) {
    next(error);
  }
});

//ANCHOR - 아이디 찾기
router.post('/api/user/find-id', async (req: Request, res: Response, next: NextFunction) => {
  if (!req.body.email) {
    throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'MISSING_FIELDS', ERROR_MESSAGES.MISSING_FIELDS);
  }
  const { email } = req.body as FindIdRequestBody;

  try {
    const user = await UserModel.findUsernameByEmail(email);

    await sendEmail({
      to: email,
      username: user.username,
      type: EMAIL_TYPE.FIND_ID
    });

    res.status(HTTP_STATUS.OK).json(generateSuccessResponse());
  } catch (error: any) {
    next(error);
  }
});

//ANCHOR - 사용자 정보 조회
router.get('/api/user', async (req: Request, res: Response, next: NextFunction) => {
  if (!req.body.username) {
    throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'MISSING_FIELDS', ERROR_MESSAGES.MISSING_FIELDS);
  }
  const { username } = req.body as GetUserInfoRequestBody;
  try {
    const result = await UserModel.getInfoByUsername(username);
    const { email, name, birthdate } = result;
    res.status(HTTP_STATUS.OK).json(generateSuccessResponse({ email, name, birthdate }));
  } catch (error: any) {
    next(error);
  }
});

router.patch('/api/user', async (req: Request, res: Response, next: NextFunction) => {
  if (validateEditData(req.body)) {
    throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'MISSING_FIELDS', ERROR_MESSAGES.MISSING_FIELDS);
  }
  const { username, password, name, birthdate, email } = req.body as EditRequestBody;
  try {
    await UserModel.findByUsername(username);
    const updatedData: Partial<EditRequestBody> = {};

    if (password) updatedData.password = password;
    if (name) updatedData.name = name;
    if (birthdate) updatedData.birthdate = birthdate;
    if (email) updatedData.email = email;

    await UserModel.updateUser(username, updatedData);

    res.status(HTTP_STATUS.OK).json(generateSuccessResponse());
  } catch(error: any) {
    next(error);
    console.error('회원정보 수정 실패: ', error);
    res.status(500).send(error.message);
  }
});

router.post('/api/user/find-pw', async (req: Request, res: Response, next: NextFunction) => {
  //ANCHOR - 유효성 검사
  if (!req.body.email || !req.body.username) {
    throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'MISSING_FIELDS', ERROR_MESSAGES.MISSING_FIELDS);
  }
  const { username, email } = req.body as FindPwRequestBody;
  try {
    const user = await UserModel.findPWByUsernameAndEmail(username, email);
    const updatedData: Partial<EditRequestBody> = {};
    updatedData.password = generateRandomPassword(USER_CONST.TEMP_PW_LENGTH);

    await UserModel.updateUser(username, updatedData);

    await sendEmail({
      to: email,
      password: updatedData.password,
      type: EMAIL_TYPE.FIND_PW
    });

    res.status(HTTP_STATUS.OK).json(generateSuccessResponse());
  } catch (error: any) {
    next(error);
    console.error('이메일 전송 실패: ', error);
    res.status(500).send(error.message);
  }
});

//TODO - 사용자 계정 삭제
router.delete('/api/user/sign', async (req: Request, res: Response, next: NextFunction) => {
  if (!req.body.username) {
    throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'MISSING_FIELDS', ERROR_MESSAGES.MISSING_FIELDS);
  }
  const { username } = req.body as SignoutRequestBody;

  if (!username) {
    return res.status(400).json({ message: 'Invalid data' });
  }

  try {
    await UserModel.deleteUser(username);
    res.status(HTTP_STATUS.OK).json(generateSuccessResponse());
  } catch (error: any) {
    next(error);
  }
});

//ANCHOR - ID 중복 검사 라우트
router.get('/api/user/check-username', async (req: Request, res: Response, next: NextFunction) => {
  if (!req.body.username) {
    throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'MISSING_FIELDS', ERROR_MESSAGES.MISSING_FIELDS);
  }
  const username = req.body.username;
  if (typeof username !== 'string') {
    throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'VALIDATION_FAILED', ERROR_MESSAGES.VALIDATION_FAILED);
  }

  try {
    const isTaken = await UserModel.isUsernameTaken(username);

    if (isTaken) {
      throw new CustomError(HTTP_STATUS.CONFLICT, 'USERNAME_TAKEN', ERROR_MESSAGES.USERNAME_TAKEN);
    }

    res.status(HTTP_STATUS.OK).json(generateSuccessResponse());
  } catch (error: any) {
    next(error);
  }
});

// 이메일 중복 검사 라우트
router.get('/api/user/check-email', async (req: Request, res: Response, next: NextFunction) => {
  if (!req.body.email) {
    throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'MISSING_FIELDS', ERROR_MESSAGES.MISSING_FIELDS);
  }
  const email = req.body.email;
  if (typeof email !== 'string') {
    throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'VALIDATION_FAILED', ERROR_MESSAGES.VALIDATION_FAILED);
  }

  try {
    const isTaken = await UserModel.isEmailTaken(email);

    if (isTaken) {
      throw new CustomError(HTTP_STATUS.CONFLICT, 'EMAIL_TAKEN', ERROR_MESSAGES.EMAIL_TAKEN);
    }

    res.status(HTTP_STATUS.OK).json(generateSuccessResponse());
  } catch (error: any) {
    next(error);
  }
});

export default router;

