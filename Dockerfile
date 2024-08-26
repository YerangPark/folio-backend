# Node.js의 경량 버전 이미지 사용
FROM node:20-alpine

# 앱 디렉토리를 생성하고, 작업 디렉토리로 설정합니다.
WORKDIR /app

# package.json 및 package-lock.json을 복사합니다.
COPY package.json package-lock.json ./

# 의존성을 설치합니다.
RUN npm install --legacy-peer-deps

# 소스 코드를 모두 복사합니다.
COPY . .

# 앱 빌드
RUN npm run build

# 애플리케이션 포트를 노출합니다.
EXPOSE 3000

# 애플리케이션을 시작합니다.
CMD ["npm", "start"]