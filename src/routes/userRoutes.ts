import express, { Router, Request, Response, NextFunction } from 'express';
import UserModel from '../models/userModels';
import { sendMail } from '../utils/mailer';
import { generateRandomPassword } from '../utils/passwordGenerator';
import { USER_CONST } from '../constants/userConst';
import { ERROR_MESSAGES, DB_ERROR_TYPE } from '../constants/errorConst';
import { HTTP_STATUS } from '../constants/httpStatus';
import CustomError from '../errors/customError';
import { generateSuccessResponse } from '../responses/successResponse';

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
    return false;
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
    throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'MISSING_FIELDS', ERROR_MESSAGES.MISSING_FIELDS);
    // FIXME - 전부 미싱필드 날리면 안됨.
    // NOTE - express-validator라는 것도 있따.
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

    const result = await UserModel.create({ name, birthdate, username, password, email });
    res.status(HTTP_STATUS.CREATED).json(generateSuccessResponse({ id: result }));
  } catch (error: any) {
    next(error);
    // res.status(500).send(error.message);
  }
})

//ANCHOR - 로그인
router.post('/api/user/login', async (req: Request, res: Response, next: NextFunction) => {
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
})

//ANCHOR - 아이디 찾기
router.post('/api/user/find-id', async (req: Request, res: Response, next: NextFunction) => {
  if (!req.body.email) {
    throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'MISSING_FIELDS', ERROR_MESSAGES.MISSING_FIELDS);
  }
  const { email } = req.body as FindIdRequestBody;

  try {
    const username = await UserModel.findUsernameByEmail(email);
    if (!username) {
      return res.status(404).json({ message: 'User not found' });
    }

    await sendMail({
      to: email,
      subject: '아이디 찾기 결과입니다.',
      text: `당신의 아이디는 ${username} 입니다.`,
    });

    res.status(HTTP_STATUS.OK).json(generateSuccessResponse());
  } catch (error: any) {
    next(error);
  }
})

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
})

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
})

router.post('/api/user/find-pw', async (req: Request, res: Response, next: NextFunction) => {
  //ANCHOR - 유효성 검사
  if (!req.body.email) {
    throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'MISSING_FIELDS', ERROR_MESSAGES.MISSING_FIELDS);
  }
  const { username, email } = req.body as FindPwRequestBody;
  try {
    const isValidUser = await UserModel.findPWByUsernameAndEmail(username, email);
    if (!isValidUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedData: Partial<EditRequestBody> = {};
    updatedData.password = generateRandomPassword(USER_CONST.TEMP_PW_LENGTH);

    await UserModel.updateUser(username, updatedData);

    await sendMail({
      to: email,
      subject: '임시 비밀번호입니다.',
      text: `임시 비밀번호는 ${updatedData.password} 입니다. 로그인 후 비밀번호를 수정해주세요.`,
    });

    res.status(HTTP_STATUS.OK).json(generateSuccessResponse());
  } catch (error: any) {
    next(error);
    console.error('이메일 전송 실패: ', error);
    res.status(500).send(error.message);
  }
})

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
    const result = await UserModel.deleteUser(username);
    res.status(HTTP_STATUS.OK).json(generateSuccessResponse());
  } catch (error: any) {
    next(error);
    console.error('로그인 실패: ', error);
    res.status(500).send(error.message);
  }
})

//ANCHOR - ID 중복 검사 라우트
router.get('/api/user/check-username', async (req: Request, res: Response, next: NextFunction) => {
  if (!req.body.username) {
    return res.status(400).json({ message: 'Invalid argument' });
  }
  const { username } = req.query;
  if (typeof username !== 'string') {
    return res.status(400).json({ message: 'Invalid username' });
  }

  try {
    const isTaken = await UserModel.isUsernameTaken(username);

    if (isTaken) {
      return res.status(409).json({ message: 'Username is already taken' });
    }

    res.status(HTTP_STATUS.OK).json(generateSuccessResponse());
  } catch (error: any) {
    next(error);
    console.error('Error checking username: ', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 이메일 중복 검사 라우트
router.get('/api/user/check-email', async (req: Request, res: Response, next: NextFunction) => {
  if (!req.body.email) {
    return res.status(400).json({ message: 'Invalid argument' });
  }
  const { email } = req.query;
  if (typeof email !== 'string') {
    return res.status(400).json({ message: 'Invalid email' });
  }

  try {
    const isTaken = await UserModel.isEmailTaken(email);

    if (isTaken) {
      return res.status(409).json({ message: 'Email is already taken' });
    }

    res.status(HTTP_STATUS.OK).json(generateSuccessResponse());
  } catch (error: any) {
    next(error);
    console.error('Error checking email: ', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

