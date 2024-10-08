import express, { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UserService from '../services/userService.js';
import { sendEmail } from '../utils/mailer.js';
import { generateRandomPassword } from '../utils/passwordGenerator.js';
import { USER_CONST, EMAIL_TYPE } from '../constants/userConst.js';
import { ERROR_MESSAGES } from '../constants/errorConst.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import CustomError from '../errors/customError.js';
import { generateSuccessResponse } from '../responses/successResponse.js';
import bcrypt from 'bcryptjs';
import authenticateJWT from '../utils/athenticateJWT.js';

const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error('SECRET_KEY is not defined');
}

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
    const isUsernameTaken = await UserService.isUsernameTaken(username);
    if (isUsernameTaken) {
      throw new CustomError(HTTP_STATUS.CONFLICT, 'USERNAME_TAKEN', ERROR_MESSAGES.USERNAME_TAKEN);
    }
    const isEmailTaken = await UserService.isEmailTaken(email);
    if (isEmailTaken) {
      throw new CustomError(HTTP_STATUS.CONFLICT, 'EMAIL_TAKEN', ERROR_MESSAGES.EMAIL_TAKEN);
    }

    const result = await UserService.createUser({ name, birthdate, username, password, email });
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
    const result = await UserService.authenticateUser(username, password);
    const { id } = result;

    const token = jwt.sign({ id: id, username: username }, SECRET_KEY, { expiresIn: '8h' }); // FIXME: 토큰 시간 조절해야 함.
    res.status(HTTP_STATUS.OK).json(generateSuccessResponse({ token }));
  } catch (error: any) {
    next(error);
  }
});

//ANCHOR - 로그아웃
router.post('/api/user/logout', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      res.status(HTTP_STATUS.OK).json({ message: 'Logged out successfully' });
    } else {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'No token provided' });
    }
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
    const user = await UserService.findUsernameByEmail(email);

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
router.get('/api/user', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (typeof req.user !== 'string' && req.user?.id) {
      const userId = req.user.id;
      const result = await UserService.getInfoByUserid(userId);
      const { email, name, birthdate, username } = result;
      res.status(HTTP_STATUS.OK).json(generateSuccessResponse({ email, name, birthdate, username }));
    }
    else {
      return res.status(403).json({ message: 'Access denied' });
    }
  } catch (error: any) {
    next(error);
  }
});

//ANCHOR - 사용자 정보 수정
router.patch('/api/user',authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (typeof req.user !== 'string' && req.user?.id) {
      const userId = req.user.id;

      if (!validateEditData(req.body)) {
        throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'VALIDATION_FAILED', ERROR_MESSAGES.VALIDATION_FAILED);
      }
      const { password, name, birthdate, email } = req.body as EditRequestBody;
      console.log(`비번 수정 출력 : ${password}`)
      if (password) {
        const tmp = await bcrypt.hash(password, 10);
        console.log(`비번 수정 암호화 출력 : ${tmp}`)
      }

      await UserService.findByUserid(userId);
      const updatedData: Partial<EditRequestBody> = {};

      if (password) updatedData.password = await bcrypt.hash(password, 10);
      if (name) updatedData.name = name;
      if (birthdate) updatedData.birthdate = birthdate;
      if (email) updatedData.email = email;

      await UserService.updateUserById(userId, updatedData);

      res.status(HTTP_STATUS.OK).json(generateSuccessResponse());
    }
    else {
      return res.status(403).json({ message: 'Access denied' });
    }
  } catch(error: any) {
    console.error('회원정보 수정 실패: ', error);
    next(error);
  }
});

router.post('/api/user/find-pw', async (req: Request, res: Response, next: NextFunction) => {
  //ANCHOR - 유효성 검사
  if (!req.body.email || !req.body.username) {
    throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'MISSING_FIELDS', ERROR_MESSAGES.MISSING_FIELDS);
  }
  const { username, email } = req.body as FindPwRequestBody;
  try {
    const user = await UserService.findPWByUsernameAndEmail(username, email);
    const updatedData: Partial<EditRequestBody> = {};
    const randomPassword = generateRandomPassword(USER_CONST.TEMP_PW_LENGTH);
    updatedData.password = await bcrypt.hash(randomPassword, 10);

    await UserService.updateUserByUsername(username, updatedData);

    await sendEmail({
      to: email,
      password: randomPassword,
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
    await UserService.deleteUser(username);
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
    const isTaken = await UserService.isUsernameTaken(username);

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
    const isTaken = await UserService.isEmailTaken(email);

    if (isTaken) {
      throw new CustomError(HTTP_STATUS.CONFLICT, 'EMAIL_TAKEN', ERROR_MESSAGES.EMAIL_TAKEN);
    }

    res.status(HTTP_STATUS.OK).json(generateSuccessResponse());
  } catch (error: any) {
    next(error);
  }
});

export default router;

