# Node.js의 경량 버전 이미지 사용
FROM node:20-alpine

# 앱 디렉토리를 생성하고, 작업 디렉토리로 설정합니다.
WORKDIR /

# DB 관련 패키지 설치
RUN apk update && apk add --no-cache mysql-client

# package.json 및 package-lock.json을 복사합니다.
COPY package.json package-lock.json ./

# 의존성을 설치합니다.
RUN npm install --legacy-peer-deps

# 소스 코드를 모두 복사합니다.
COPY . .

# 앱 빌드
RUN npm run build

# TypeORM 마이그레이션을 실행
# RUN npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run -d ./ormconfig.ts

# 애플리케이션 포트를 노출합니다.
EXPOSE 3001

# 애플리케이션을 시작합니다.
CMD ["npm", "start"]