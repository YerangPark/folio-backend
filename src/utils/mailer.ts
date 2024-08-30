require('dotenv').config();

import nodemailer from 'nodemailer';
import fs from 'fs';
import ejs from 'ejs';
import path from 'path';
import { EMAIL_TYPE } from '../constants/userConst';
import CustomError from '../errors/customError';
import { HTTP_STATUS } from '../constants/httpStatus';
import { ERROR_MESSAGES } from '../constants/errorConst';

interface SendEmailProps {
  type: number,
  to: string,
  username?: string,
  password?: string
}

export interface MailOptions {
  to: string;
  subject: string;
  text: string;
}

const transporter = nodemailer.createTransport({
  service: 'Gmail', // 또는 다른 이메일 서비스 제공자
  auth: {
    user: process.env.EMAIL_USER, // 발신자 이메일 주소
    pass: process.env.EMAIL_PASS,  // 발신자 이메일 비밀번호
  },
});

// 메일 전송 함수
export async function sendEmail({ type, to, username, password }: SendEmailProps) {
  try {
    // 이메일 템플릿 렌더링
    const templatePath = path.join(__dirname, '../templates', 'emailTemplate.html');
    console.log(templatePath);
    const templateContent = await fs.promises.readFile(templatePath, 'utf8');

    let contents;
    switch (type) {
      case EMAIL_TYPE.FIND_ID:
        if (!username) {
          throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'MISSING_FIELDS', ERROR_MESSAGES.MISSING_FIELDS);
        }
        contents = generateFindIdMessage(username);
        break;
      case EMAIL_TYPE.FIND_PW:
        if (!password) {
          throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'MISSING_FIELDS', ERROR_MESSAGES.MISSING_FIELDS);
        }
        contents = generateFindPwMessage(password);
        break;
      default:
        throw new CustomError(HTTP_STATUS.BAD_REQUEST, 'INTERNAL_SERVER_ERROR', ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
    const htmlContent = ejs.render(templateContent, { text: contents.text });

    // 이메일 옵션 설정
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: contents.subject,
      html: htmlContent
    };

    // 이메일 전송
    const info = await transporter.sendMail(mailOptions);
    console.log('이메일 전송 결과: ' + info.response);
  } catch (error: any) {
    if (error instanceof CustomError) {
      throw error;
    } else {
      throw new Error('Fail to send email.');
    }
  }
}

function generateFindIdMessage(username: string) {
  return {
    subject: '[Folio] 아이디 찾기 결과입니다.',
    text: `안녕하세요, 회원님의 아이디는 ${username}입니다.`
  };
}

function generateFindPwMessage(temporaryPw: string) {
  return {
    subject: '[Folio] 임시 비밀번호입니다.',
    text: `안녕하세요, 회원님의 임시 비밀번호는 ${temporaryPw}입니다. 로그인 후 변경해주세요.`
  };
}