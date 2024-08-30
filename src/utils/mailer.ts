require('dotenv').config();

import nodemailer from 'nodemailer';

export interface MailOptions {
  to: string;
  subject: string;
  text: string;
}

// 메일 전송 함수
export async function sendMail({ to, subject, text }: MailOptions): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: 'Gmail', // 또는 다른 이메일 서비스 제공자
    auth: {
      user: 'folio.official.manager@gmail.com', // 발신자 이메일 주소
      pass: process.env.EMAIL_PW,  // 발신자 이메일 비밀번호
    },
  });

  const mailOptions = {
    from: 'folio@gmail.com',
    to,
    subject,
    text,
  };

  await transporter.sendMail(mailOptions);
}