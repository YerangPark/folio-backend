import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// 업로드할 이미지 파일의 저장소 설정
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, `${process.env.UPLOAD_PATH}`); // 이미지를 저장할 경로 설정
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // 고유한 파일 이름 생성
    const uniqueSuffix = uuidv4();
    const fileExtension = path.extname(file.originalname).toLowerCase();
    cb(null, uniqueSuffix + fileExtension);
  },
});

// 파일 필터링 설정
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  const allowedDocumentTypes = ['text/markdown']; // .md 파일 MIME 타입 추가

  if (allowedImageTypes.includes(file.mimetype) || allowedDocumentTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images (jpeg, jpg, png) and markdown (.md) files are allowed.'));
  }
};

// multer 설정: 파일 크기 제한 5MB
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB 크기 제한
});

export default upload;